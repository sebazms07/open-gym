<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { useTimer } from '../stores/timer'
import { lastLogFor, UNIT_LABEL } from '../lib/progression'
import { usePlan } from '../stores/plan'
import { formatDuration } from '../lib/util'
import type { ExerciseLog, SetLog } from '../types'
import Icon from '../components/Icon.vue'

const router = useRouter()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()
const timer = useTimer()
const planStore = usePlan()

const w = computed(() => workouts.active)
const now = ref(Date.now())
let tick: number | undefined
onMounted(() => (tick = window.setInterval(() => (now.value = Date.now()), 1000)))
onUnmounted(() => clearInterval(tick))
const elapsed = computed(() => (w.value ? now.value - new Date(w.value.date).getTime() : 0))

const target = (log: ExerciseLog) => log.target ?? { sets: log.sets.length, repMin: 8, repMax: 12, rest: prefs.settings.defaultRest }
const suggestion = (log: ExerciseLog) => workouts.suggestionFor(log.exerciseId, target(log))
const unit = (log: ExerciseLog) => log.target?.unit ?? 'reps'
const weightLabel = (log: ExerciseLog) => (unit(log) === 'min' ? 'nivel' : prefs.settings.unit)
/** Nota del ejercicio en la rutina (p. ej. indicaciones de cardio). */
const noteFor = (log: ExerciseLog) =>
  planStore.routine(w.value?.routineId)?.exercises.find((e) => e.exerciseId === log.exerciseId)?.notes
const lastTime = (log: ExerciseLog) => {
  const last = lastLogFor(workouts.workouts, log.exerciseId)
  return last ? last.sets.map((s) => `${s.weight ?? 0}×${s.reps}`).join(' · ') : null
}
const doneSets = computed(() => w.value?.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) ?? 0)
const totalSets = computed(() => w.value?.exercises.reduce((a, e) => a + e.sets.length, 0) ?? 0)

const parse = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))

function setWeight(log: ExerciseLog, i: number, value: string) {
  const prev = log.sets[i].weight
  const next = parse(value)
  log.sets[i].weight = next
  // propaga el peso a las series siguientes pendientes que tenían el mismo valor
  for (const s of log.sets.slice(i + 1)) if (!s.done && s.weight === prev) s.weight = next
}

function toggle(log: ExerciseLog, set: SetLog) {
  if (set.done) return void (set.done = false)
  const s = suggestion(log)
  if (set.reps == null) set.reps = s.reps
  if (set.weight == null) set.weight = s.weight ?? 0
  set.done = true
  const rest = target(log).rest
  const isLast = w.value!.exercises.every((e) => e.sets.every((x) => x.done))
  if (rest > 0 && !isLast) timer.start(rest)
  navigator.vibrate?.(30)
}

function addSet(log: ExerciseLog) {
  const last = log.sets[log.sets.length - 1]
  log.sets.push({ weight: last?.weight ?? null, reps: null, done: false })
}

function removeExercise(i: number) {
  if (confirm('¿Quitar este ejercicio del entreno?')) w.value!.exercises.splice(i, 1)
}

function finish() {
  const pending = totalSets.value - doneSets.value
  if (pending && !confirm(`Tienes ${pending} series sin marcar; no se guardarán. ¿Terminar?`)) return
  timer.stop()
  const id = workouts.finish()
  router.replace(id ? { path: '/progreso', query: { w: id } } : '/')
}

function discard() {
  if (!confirm('¿Descartar este entreno? No se guardará nada.')) return
  timer.stop()
  workouts.discard()
  router.replace('/')
}
</script>

<template>
  <main class="page" v-if="w">
    <header class="page-header">
      <div class="grow">
        <h1 class="ellipsis">{{ w.routineName }}</h1>
        <span v-if="w.deload" class="chip" style="color: var(--warn)">Descarga</span>
        <p class="small muted num">{{ formatDuration(elapsed) }} · {{ doneSets }}/{{ totalSets }} series</p>
      </div>
      <button class="btn primary" @click="finish"><Icon name="check" :size="18" />Terminar</button>
    </header>

    <section v-for="(log, ei) in w.exercises" :key="log.uid" class="card stack">
      <div class="row">
        <RouterLink :to="`/ejercicio/${log.exerciseId}`" class="grow">
          <h3 class="cap">{{ catalogue.name(log.exerciseId) }}</h3>
          <p class="small muted">{{ log.sets.length }} × {{ target(log).repMin }}–{{ target(log).repMax }} {{ UNIT_LABEL[unit(log)] }}<template v-if="target(log).rest"> · descanso {{ target(log).rest }}s</template></p>
        </RouterLink>
        <button class="btn icon ghost" aria-label="Quitar ejercicio" @click="removeExercise(ei)"><Icon name="x" :size="18" /></button>
      </div>
      <p class="hint small" :class="suggestion(log).kind">{{ suggestion(log).message }}</p>
      <p v-if="noteFor(log)" class="small muted">ℹ️ {{ noteFor(log) }}</p>
      <p v-if="lastTime(log)" class="small muted">Última vez: <span class="num">{{ lastTime(log) }}</span></p>

      <div class="sets">
        <div class="head small muted"><span>#</span><span>{{ weightLabel(log) }}</span><span>{{ UNIT_LABEL[unit(log)] }}</span><span /></div>
        <div v-for="(s, si) in log.sets" :key="si" class="set" :class="{ done: s.done }">
          <span class="muted num">{{ si + 1 }}</span>
          <input type="text" inputmode="decimal" :value="s.weight ?? ''" :placeholder="String(suggestion(log).weight ?? '—')" @change="setWeight(log, si, ($event.target as HTMLInputElement).value)" />
          <input type="text" inputmode="numeric" :value="s.reps ?? ''" :placeholder="String(suggestion(log).reps)" @change="s.reps = parse(($event.target as HTMLInputElement).value)" />
          <button class="tick" :aria-label="s.done ? 'Desmarcar serie' : 'Marcar serie hecha'" @click="toggle(log, s)"><Icon name="check" :size="20" /></button>
        </div>
      </div>
      <div class="row">
        <button class="btn sm" @click="addSet(log)"><Icon name="plus" :size="16" />Serie</button>
        <button class="btn sm ghost" :disabled="log.sets.length <= 1" @click="log.sets.pop()">Quitar serie</button>
      </div>
    </section>

    <RouterLink :to="{ path: '/guia', query: { pick: 'workout' } }" class="btn block"><Icon name="plus" />Añadir ejercicio</RouterLink>
    <label class="field">Notas del entreno<textarea v-model="w.notes" rows="2" placeholder="Cómo te sentiste, molestias, etc." /></label>
    <button class="btn ghost danger block" @click="discard">Descartar entreno</button>
  </main>

  <main class="page" v-else>
    <h1>Entreno</h1>
    <div class="empty card stack">
      <p>No hay ningún entreno en curso.</p>
      <RouterLink to="/" class="btn primary">Ir a Hoy</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.hint { padding: 8px 10px; border-radius: 10px; background: var(--surface-2); color: var(--muted); }
.hint.up { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); font-weight: 600; }
.sets { display: flex; flex-direction: column; gap: 6px; }
.head, .set { display: grid; grid-template-columns: 24px 1fr 1fr 48px; gap: 8px; align-items: center; }
.head span { text-align: center; }
.set input { text-align: center; font-size: 1.1rem; font-weight: 600; padding: 8px 4px; }
.set > span { text-align: center; }
.tick {
  height: 44px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--surface-2); color: var(--muted); display: grid; place-items: center; cursor: pointer;
}
.set.done .tick { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
.set.done input { border-color: color-mix(in srgb, var(--accent) 50%, var(--border)); }
</style>

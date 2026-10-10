<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { useTimer } from '../stores/timer'
import { usePlan } from '../stores/plan'
import { useProgram } from '../stores/program'
import { bestSet, lastLogFor, UNIT_LABEL } from '../lib/progression'
import { equipmentLabel, muscleLabel } from '../lib/labels'
import { muscleWeights } from '../lib/muscles'
import { formatDate, formatDuration } from '../lib/util'
import type { ExerciseLog, Routine, SetLog } from '../types'
import Icon from '../components/Icon.vue'
import MuscleFigure from '../components/MuscleFigure.vue'

const router = useRouter()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()
const timer = useTimer()
const planStore = usePlan()
const prog = useProgram()

const w = computed(() => workouts.active)
const now = ref(Date.now())
let tick: number | undefined
onMounted(() => (tick = window.setInterval(() => (now.value = Date.now()), 1000)))
onUnmounted(() => clearInterval(tick))
const elapsed = computed(() => (w.value ? now.value - new Date(w.value.date).getTime() : 0))

const target = (log: ExerciseLog) => log.target ?? { sets: log.sets.length, repMin: 8, repMax: 12, rest: prefs.settings.defaultRest }
const unit = (log: ExerciseLog) => log.target?.unit ?? 'reps'
const suggestion = (log: ExerciseLog) => workouts.suggestionFor(log.exerciseId, target(log))
const weightLabel = (log: ExerciseLog) => (unit(log) === 'min' ? 'NIVEL' : `PESO (${prefs.settings.unit.toUpperCase()})`)
const weightStep = (log: ExerciseLog) => (unit(log) === 'min' ? 1 : prefs.settings.unit === 'kg' ? 2.5 : 5)
const repStep = (log: ExerciseLog) => (unit(log) === 's' ? 5 : 1)
const noteFor = (log: ExerciseLog) => planStore.routine(w.value?.routineId)?.exercises.find((e) => e.exerciseId === log.exerciseId)?.notes

/** Mejor marca histórica y la última sesión del ejercicio. */
const history = (log: ExerciseLog) => {
  const best = workouts.logsFor(log.exerciseId).reduce<number | null>((a, { log: l }) => {
    const b = bestSet(l)
    return b && (a == null || b.weight > a) ? b.weight : a
  }, null)
  const lastW = [...workouts.history].find((x) => !x.deload && x.exercises.some((e) => e.exerciseId === log.exerciseId && e.sets.length))
  const last = lastLogFor(workouts.workouts, log.exerciseId)
  return {
    best,
    last: last && lastW ? `${formatDate(lastW.date, { day: 'numeric', month: 'short' })}: ${last.sets.map((s) => `${s.weight ?? 0}×${s.reps}`).join(', ')}` : null,
  }
}

const doneSets = computed(() => w.value?.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) ?? 0)
const totalSets = computed(() => w.value?.exercises.reduce((a, e) => a + e.sets.length, 0) ?? 0)

const parse = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))
const round = (n: number) => Math.round(n * 100) / 100

function setWeight(log: ExerciseLog, i: number, next: number | null) {
  const prev = log.sets[i].weight
  log.sets[i].weight = next == null ? null : Math.max(0, round(next))
  // propaga el peso a las series siguientes pendientes que tenían el mismo valor
  for (const s of log.sets.slice(i + 1)) if (!s.done && s.weight === prev) s.weight = log.sets[i].weight
}
function bumpWeight(log: ExerciseLog, i: number, dir: 1 | -1) {
  const cur = log.sets[i].weight ?? suggestion(log).weight ?? 0
  setWeight(log, i, cur + dir * weightStep(log))
}
function bumpReps(log: ExerciseLog, set: SetLog, dir: 1 | -1) {
  const cur = set.reps ?? suggestion(log).reps
  set.reps = Math.max(0, cur + dir * repStep(log))
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

function startRoutine(r?: Routine) {
  workouts.start(r)
}
</script>

<template>
  <main class="page" v-if="w">
    <header class="whead">
      <button class="btn icon" aria-label="Descartar entreno" @click="discard"><Icon name="x" :size="18" /></button>
      <div class="grow" style="text-align: center">
        <h2 class="ellipsis">{{ w.routineName }}</h2>
        <p class="small muted num">{{ formatDuration(elapsed) }} · {{ doneSets }}/{{ totalSets }} series<span v-if="w.deload" style="color: var(--warn)"> · descarga</span></p>
      </div>
      <button class="btn icon primary" aria-label="Terminar entreno" @click="finish"><Icon name="check" :size="18" /></button>
    </header>
    <div class="wbar"><i :style="{ width: totalSets ? (doneSets / totalSets) * 100 + '%' : '0' }" /></div>

    <section v-for="(log, ei) in w.exercises" :key="log.uid" class="stack exercise">
      <p class="small muted">Ejercicio {{ ei + 1 }} / {{ w.exercises.length }}</p>
      <RouterLink v-if="catalogue.get(log.exerciseId)" :to="`/ejercicio/${log.exerciseId}`" class="figure-panel">
        <MuscleFigure :weights="muscleWeights(catalogue.get(log.exerciseId)!) as Record<string, number>" :sex="prog.figureSex" :height="200" />
      </RouterLink>
      <div class="row">
        <h2 class="grow cap" style="font-size: 1.3rem">{{ catalogue.name(log.exerciseId) }}</h2>
        <button class="btn icon" aria-label="Quitar ejercicio" @click="removeExercise(ei)"><Icon name="trash" :size="16" /></button>
      </div>
      <div class="chips">
        <span class="chip">{{ muscleLabel(catalogue.get(log.exerciseId)?.t) }}</span>
        <span class="chip">{{ equipmentLabel(catalogue.get(log.exerciseId)?.e) }}</span>
        <span v-if="history(log).best" class="chip">Mejor: {{ history(log).best }} {{ prefs.settings.unit }}</span>
        <span class="chip">{{ log.sets.length }} × {{ target(log).repMin }}–{{ target(log).repMax }} {{ UNIT_LABEL[unit(log)] }}</span>
      </div>
      <p v-if="history(log).last" class="small faint">Última vez ({{ history(log).last }})</p>
      <p v-if="noteFor(log)" class="small muted">{{ noteFor(log) }}</p>
      <p class="small" :class="suggestion(log).kind === 'up' ? 'accent-text' : 'muted'">
        <span v-if="suggestion(log).kind === 'up'">↑ </span><b v-if="suggestion(log).kind !== 'new'">Progresión doble · </b>{{ suggestion(log).message }}
      </p>

      <div class="card sets">
        <div class="shead xs faint"><span /><span>{{ weightLabel(log) }}</span><span>{{ UNIT_LABEL[unit(log)].toUpperCase() }}</span><span /></div>
        <div v-for="(s, si) in log.sets" :key="si" class="srow" :class="{ done: s.done }">
          <span class="idx num">{{ si + 1 }}</span>
          <div class="stepper">
            <button aria-label="Menos peso" @click="bumpWeight(log, si, -1)"><Icon name="minus" :size="16" /></button>
            <input type="text" inputmode="decimal" :value="s.weight ?? ''" :placeholder="String(suggestion(log).weight ?? '—')" @change="setWeight(log, si, parse(($event.target as HTMLInputElement).value))" />
            <button aria-label="Más peso" @click="bumpWeight(log, si, 1)"><Icon name="plus" :size="16" /></button>
          </div>
          <div class="stepper">
            <button aria-label="Menos repeticiones" @click="bumpReps(log, s, -1)"><Icon name="minus" :size="16" /></button>
            <input type="text" inputmode="numeric" :value="s.reps ?? ''" :placeholder="String(suggestion(log).reps)" @change="s.reps = parse(($event.target as HTMLInputElement).value)" />
            <button aria-label="Más repeticiones" @click="bumpReps(log, s, 1)"><Icon name="plus" :size="16" /></button>
          </div>
          <button class="tick" :aria-label="s.done ? 'Desmarcar serie' : 'Marcar serie hecha'" @click="toggle(log, s)"><Icon v-if="s.done" name="check" :size="16" /></button>
        </div>
        <div class="row" style="justify-content: center; gap: 4px">
          <button class="btn sm ghost accent-text" @click="addSet(log)"><Icon name="plus" :size="14" />Serie</button>
          <button class="btn sm ghost muted" :disabled="log.sets.length <= 1" @click="log.sets.pop()">Quitar serie</button>
        </div>
      </div>
    </section>

    <RouterLink :to="{ path: '/guia', query: { pick: 'workout' } }" class="btn block"><Icon name="plus" />Añadir ejercicio</RouterLink>
    <label class="field">Notas del entreno<textarea v-model="w.notes" rows="2" placeholder="Cómo te sentiste, molestias, etc." /></label>
    <button class="btn primary block" @click="finish"><Icon name="check" />Terminar entreno</button>
  </main>

  <main class="page" v-else>
    <header><h1>Entrenar</h1><p class="subtitle">¿Qué toca hoy?</p></header>
    <section class="card list" style="padding: 4px 14px">
      <button v-for="r in planStore.plan.routines" :key="r.id" class="plain list-item" @click="startRoutine(r)">
        <span class="app-icon"><Icon name="dumbbell" :size="18" /></span>
        <div class="grow"><div style="font-weight: 500">{{ r.name }}</div><div class="small muted">{{ r.exercises.length }} ejercicios</div></div>
        <Icon name="play" :size="16" class="faint" />
      </button>
      <button class="plain list-item" @click="startRoutine()">
        <span class="app-icon" style="background: var(--surface-2); color: var(--accent)"><Icon name="plus" :size="18" /></span>
        <div class="grow"><div style="font-weight: 500">Entreno libre</div><div class="small muted">Añade ejercicios sobre la marcha</div></div>
      </button>
    </section>
  </main>
</template>

<style scoped>
.whead { display: flex; align-items: center; gap: 10px; }
.wbar { height: 3px; border-radius: 2px; background: var(--surface-2); overflow: hidden; margin-top: -4px; }
.wbar i { display: block; height: 100%; background: var(--accent); transition: width 0.3s var(--ease); }
.exercise { padding-top: 8px; }
.exercise + .exercise { border-top: 0.5px solid var(--border); padding-top: 18px; }
.figure-panel { display: block; background: var(--surface); border-radius: var(--radius); padding: 14px 0; }
.sets { display: flex; flex-direction: column; gap: 8px; padding: 12px 10px; }
.shead, .srow { display: grid; grid-template-columns: 24px 1fr 1fr 34px; gap: 8px; align-items: center; }
.shead span { text-align: center; letter-spacing: 0.04em; }
.idx {
  width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
  background: var(--surface-2); color: var(--muted); font-size: 0.75rem;
}
.stepper { display: flex; align-items: center; background: var(--surface-2); border-radius: 10px; height: 44px; }
.stepper button { flex: none; width: 32px; height: 100%; border: 0; background: none; color: var(--muted); display: grid; place-items: center; cursor: pointer; }
.stepper button:active { color: var(--text); }
.stepper input { min-height: 0; height: 100%; padding: 0; background: none; text-align: center; font-weight: 600; font-size: 1.05rem; border-radius: 0; }
.stepper input:focus { outline: none; }
.tick {
  width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--surface-3);
  background: none; color: var(--accent-ink); display: grid; place-items: center; cursor: pointer; justify-self: center;
}
.srow.done .tick { background: var(--accent); border-color: var(--accent); }
.srow.done .stepper { background: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); }
</style>

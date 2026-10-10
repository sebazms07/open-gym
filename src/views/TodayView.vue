<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlan } from '../stores/plan'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { DAYS, DAYS_SHORT, todayIndex } from '../lib/labels'
import { formatDate, formatNumber, startOfWeek } from '../lib/util'
import { volume } from '../lib/progression'
import type { Routine } from '../types'
import Icon from '../components/Icon.vue'

const router = useRouter()
const planStore = usePlan()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()

const today = todayIndex()
const routine = computed(() => planStore.todayRoutine)

const weekStart = startOfWeek()
const thisWeek = computed(() => workouts.history.filter((w) => new Date(w.date) >= weekStart))
const trainedDays = computed(() => new Set(thisWeek.value.map((w) => todayIndex(new Date(w.date)))))
const weekVolume = computed(() => thisWeek.value.reduce((acc, w) => acc + w.exercises.reduce((a, e) => a + volume(e), 0), 0))
const weekSets = computed(() => thisWeek.value.reduce((acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets.length, 0), 0))
const planned = computed(() => planStore.plan.schedule.filter(Boolean).length)

function start(r?: Routine) {
  if (workouts.active && !confirm('Ya tienes un entreno en curso. ¿Descartarlo y empezar otro?')) return
  workouts.start(r)
  router.push('/entreno')
}
</script>

<template>
  <main class="page">
    <header>
      <p class="muted small cap">{{ formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
      <h1>{{ routine ? routine.name : 'Día de descanso' }}</h1>
    </header>

    <RouterLink v-if="workouts.active" to="/entreno" class="card accent row">
      <Icon name="play" />
      <div class="grow">
        <b>Entreno en curso</b>
        <div class="small muted">{{ workouts.active.routineName }} · desde {{ formatDate(workouts.active.date, { hour: '2-digit', minute: '2-digit' }) }}</div>
      </div>
      <Icon name="next" />
    </RouterLink>

    <section v-if="routine" class="card stack">
      <div class="list">
        <RouterLink v-for="e in routine.exercises" :key="e.uid" :to="`/ejercicio/${e.exerciseId}`" class="list-item">
          <div class="grow">
            <div class="cap" style="font-weight: 600">{{ catalogue.name(e.exerciseId) }}</div>
            <div class="small muted">
              {{ e.sets }} × {{ e.repMin }}–{{ e.repMax }} reps
              <template v-for="s in [workouts.suggestionFor(e.exerciseId, e)]" :key="s.kind">
                <span v-if="s.weight != null"> · {{ s.weight }} {{ prefs.settings.unit }}</span>
                <span v-if="s.kind === 'up'" class="chip accent" style="margin-left: 6px">↑ subir</span>
              </template>
            </div>
          </div>
          <Icon name="next" :size="18" class="muted" />
        </RouterLink>
      </div>
      <p v-if="!routine.exercises.length" class="muted small">Esta rutina no tiene ejercicios todavía.</p>
      <button v-if="!workouts.active" class="btn primary block" @click="start(routine)"><Icon name="play" />Empezar entreno</button>
    </section>
    <section v-else class="card stack">
      <p class="muted">Hoy no hay rutina asignada. Descansa, o entrena otra rutina de tu plan.</p>
    </section>

    <section class="card stack">
      <div class="row between">
        <h2>Esta semana</h2>
        <span class="muted small">{{ thisWeek.length }}/{{ planned }} entrenos</span>
      </div>
      <div class="week">
        <div v-for="(d, i) in DAYS_SHORT" :key="d" class="day" :class="{ today: i === today, done: trainedDays.has(i), rest: !planStore.plan.schedule[i] }" :title="DAYS[i]">
          <span>{{ d }}</span>
          <i />
        </div>
      </div>
      <div class="stats">
        <div class="stat"><b>{{ thisWeek.length }}</b><span>sesiones</span></div>
        <div class="stat"><b>{{ weekSets }}</b><span>series</span></div>
        <div class="stat"><b>{{ formatNumber(weekVolume / 1000) }}t</b><span>volumen</span></div>
      </div>
    </section>

    <section class="stack">
      <h2>Otra sesión</h2>
      <div class="card list">
        <button v-for="r in planStore.plan.routines.filter((x) => x.id !== routine?.id)" :key="r.id" class="list-item plain" @click="start(r)">
          <div class="grow">
            <div style="font-weight: 600">{{ r.name }}</div>
            <div class="small muted">{{ r.exercises.length }} ejercicios</div>
          </div>
          <Icon name="play" :size="18" class="muted" />
        </button>
        <button class="list-item plain" @click="start()">
          <div class="grow"><div style="font-weight: 600">Entreno libre</div><div class="small muted">Añade ejercicios sobre la marcha</div></div>
          <Icon name="plus" :size="18" class="muted" />
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.day { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--muted); font-weight: 600; }
.day i { width: 100%; height: 6px; border-radius: 3px; background: var(--surface-2); }
.day.rest i { opacity: 0.4; }
.day.done i { background: var(--accent); }
.day.today span { color: var(--text); }
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlan } from '../stores/plan'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useProgram } from '../stores/program'
import { useSettings } from '../stores/settings'
import { DAYS, todayIndex } from '../lib/labels'
import { formatDate, formatNumber, startOfWeek } from '../lib/util'
import { UNIT_LABEL } from '../lib/progression'
import { BLOCK_WEEKS, applyWeek, minSessionsFor, toISODate } from '../lib/program'
import { weekStreak } from '../lib/stats'
import type { Routine } from '../types'
import Icon from '../components/Icon.vue'
import ExerciseThumb from '../components/ExerciseThumb.vue'
import WeightSpark from '../components/WeightSpark.vue'

const router = useRouter()
const planStore = usePlan()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prog = useProgram()
const prefs = useSettings()

const today = todayIndex()
const slot = computed(() => planStore.today)
const routine = computed(() => planStore.todayRoutine)

const DAY_ABBR = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']
const monday = startOfWeek()
const weekDates = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i).getDate())

const minPerWeek = computed(() => minSessionsFor(prog.program?.sessions ?? (planStore.plan.schedule.filter(Boolean).length || 1)))
const streak = computed(() => weekStreak(workouts.workouts, minPerWeek.value))
const thisWeekCount = computed(() => planStore.doneThisWeek.length)
const planned = computed(() => planStore.plan.schedule.filter(Boolean).length)

// Peso
const todayISO = toISODate(new Date())
const logging = ref(false)
const weight = ref<number | null>(null)
function saveWeight() {
  if (weight.value && weight.value > 20) prog.logWeight(todayISO, Number(weight.value))
  weight.value = null
  logging.value = false
}
const weekAgo = computed(() => {
  const cutoff = toISODate(new Date(Date.now() - 7 * 864e5))
  const older = prog.sortedWeighIns.filter((w) => w.date <= cutoff)
  return older.length ? older[older.length - 1].weight : null
})
const delta = computed(() => (prog.currentWeight != null && weekAgo.value != null ? prog.currentWeight - weekAgo.value : null))
const lastWeighIn = computed(() => prog.sortedWeighIns[prog.sortedWeighIns.length - 1])

function start(r?: Routine) {
  if (workouts.active) return router.push('/entreno')
  workouts.start(r)
  router.push('/entreno')
}
function advance() {
  if (confirm('¿Pasar a la siguiente fase? Se regenerará tu plan con nuevos rangos y variantes de ejercicios.')) prog.advancePhase()
}
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div class="grow">
        <h1>Open Gym</h1>
        <p class="subtitle cap">{{ formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
      </div>
      <RouterLink to="/ajustes" class="btn icon" aria-label="Ajustes"><Icon name="settings" :size="20" /></RouterLink>
    </header>

    <!-- Semana -->
    <section class="card stack" style="gap: 14px">
      <p class="small muted" style="text-align: center">Esta semana</p>
      <div class="cal">
        <div v-for="(d, i) in DAY_ABBR" :key="d" class="cal-day" :class="[planStore.week[i].status, { today: i === today }]">
          <span class="xs faint">{{ d }}</span>
          <b class="num">{{ weekDates[i] }}</b>
          <i />
        </div>
      </div>

      <RouterLink v-if="workouts.active" to="/entreno" class="card inset row">
        <span class="app-icon" style="background: var(--warn)"><Icon name="dumbbell" :size="18" /></span>
        <div class="grow"><div class="xs muted">EN CURSO</div><b>{{ workouts.active.routineName }}</b></div>
        <span class="chip accent">Continuar</span>
      </RouterLink>
      <div v-else-if="routine" class="card inset row">
        <span class="app-icon"><Icon name="dumbbell" :size="18" /></span>
        <div class="grow">
          <div class="xs muted">HOY</div>
          <b>{{ routine.name }}</b><span v-if="slot.shiftedFrom != null" class="muted"> · Movida del {{ DAYS[slot.shiftedFrom].toLowerCase() }}</span>
        </div>
        <button class="btn sm pill primary" @click="start(routine)">Empezar</button>
      </div>
      <div v-else class="card inset row">
        <span class="app-icon" style="background: var(--surface-3); color: var(--muted)"><Icon :name="slot.status === 'done' ? 'check' : 'calendar'" :size="18" /></span>
        <div class="grow">
          <div class="xs muted">HOY</div>
          <b>{{ slot.status === 'done' ? 'Entreno completado' : 'Descanso' }}</b>
          <div v-if="planStore.nextSlot?.routine" class="small muted">Próxima: {{ planStore.nextSlot.routine.name }} · {{ DAYS[planStore.nextSlot.day].toLowerCase() }}</div>
        </div>
      </div>
      <p v-if="planStore.unplaced" class="small" style="color: var(--warn)">{{ planStore.unplaced }} sesión(es) ya no caben esta semana; la próxima empiezas de nuevo.</p>
    </section>

    <!-- Fase -->
    <RouterLink v-if="prog.program && prog.phase && prog.week" to="/objetivo" class="card row">
      <span class="app-icon" style="background: var(--accent-soft); color: var(--accent)"><Icon name="trophy" :size="18" /></span>
      <div class="grow stack" style="gap: 6px">
        <div class="row between">
          <b>Fase {{ prog.program.phase }} · {{ prog.phase.name }}</b>
          <span class="small muted">Sem. {{ prog.week.week }}/{{ BLOCK_WEEKS }}</span>
        </div>
        <div class="bar"><i :style="{ width: (Math.min(prog.week.completed, BLOCK_WEEKS) / BLOCK_WEEKS) * 100 + '%' }" /></div>
        <span v-if="prog.week.deload" class="small" style="color: var(--warn)">Semana de descarga: menos series y −10 % de peso.</span>
        <span v-else-if="prog.week.extraSet" class="small accent-text">Sobrecarga: +1 serie en los principales.</span>
        <button v-else-if="prog.week.blockDone" class="btn sm primary" style="align-self: flex-start" @click.prevent="advance">Pasar a fase {{ prog.program.phase + 1 }}</button>
        <span v-else class="small muted">{{ prog.phase.focus }}</span>
      </div>
    </RouterLink>

    <!-- Peso -->
    <section class="card stack">
      <div class="row between">
        <span class="small muted">Peso corporal</span>
        <div class="row" style="gap: 14px">
          <span v-if="prog.profile.goalWeight" class="small" style="color: var(--warn)">◎ {{ formatNumber(prog.profile.goalWeight) }}</span>
          <button class="plain small" style="width: auto; color: var(--accent)" @click="logging = !logging">+ Registrar</button>
        </div>
      </div>
      <div v-if="logging" class="row">
        <input v-model.number="weight" type="number" inputmode="decimal" step="0.1" placeholder="kg en ayunas" autofocus @keyup.enter="saveWeight" />
        <button class="btn primary" :disabled="!weight" @click="saveWeight">Guardar</button>
      </div>
      <template v-if="prog.currentWeight != null">
        <div class="row between" style="align-items: flex-end">
          <div>
            <span class="big num">{{ formatNumber(prog.currentWeight) }}</span> <span class="muted">kg</span>
            <span v-if="delta != null" class="small" :style="{ color: delta <= 0 ? 'var(--accent)' : 'var(--warn)' }"> {{ delta <= 0 ? '↓' : '↑' }} {{ formatNumber(Math.abs(delta)) }}</span>
          </div>
          <span class="small muted cap">{{ formatDate(`${lastWeighIn.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' }) }}</span>
        </div>
        <p v-if="prog.profile.goalWeight" class="small" style="color: var(--warn)">
          ◎ Meta {{ formatNumber(prog.profile.goalWeight) }} kg ·
          {{ prog.currentWeight > prog.profile.goalWeight ? `${formatNumber(prog.currentWeight - prog.profile.goalWeight)} kg por bajar` : '¡Meta alcanzada!' }}
        </p>
        <WeightSpark v-if="prog.sortedWeighIns.length > 1" :entries="prog.sortedWeighIns" :goal="prog.profile.goalWeight" />
        <p class="small" :class="prog.advice.status === 'ok' ? 'accent-text' : 'muted'">{{ prog.advice.message }}</p>
      </template>
      <p v-else-if="!logging" class="small muted">Registra tu peso 3–4 mañanas por semana para ver tu tendencia.</p>
    </section>

    <!-- Racha -->
    <RouterLink to="/progreso" class="card row">
      <Icon name="flame" :size="22" style="color: var(--warn)" />
      <div class="grow">
        <b style="font-size: 1.25rem">{{ streak }} {{ streak === 1 ? 'semana seguida' : 'semanas seguidas' }}</b>
        <div class="small muted">{{ thisWeekCount }} / {{ planned }} esta semana · {{ workouts.workouts.length }} entrenos en total</div>
      </div>
      <Icon name="calendar" :size="20" class="muted" />
    </RouterLink>

    <!-- Ejercicios de hoy -->
    <template v-if="routine">
      <p class="section-label">Hoy · {{ routine.name }}</p>
      <section class="card list" style="padding: 4px 14px">
        <RouterLink v-for="e in routine.exercises" :key="e.uid" :to="`/ejercicio/${e.exerciseId}`" class="list-item">
          <ExerciseThumb v-if="catalogue.get(e.exerciseId)" :exercise="catalogue.get(e.exerciseId)!" :size="48" />
          <div class="grow">
            <div class="cap" style="font-weight: 500">{{ catalogue.name(e.exerciseId) }}</div>
            <div class="small muted">
              <template v-for="t in [prog.week ? applyWeek(e, !!e.main, prog.week) : e]" :key="t.sets">{{ t.sets }} × {{ e.repMin }}–{{ e.repMax }} {{ UNIT_LABEL[e.unit ?? 'reps'] }}</template>
              <template v-for="s in [workouts.suggestionFor(e.exerciseId, e)]" :key="s.kind">
                <span v-if="s.weight != null"> · {{ e.unit === 'min' ? `nivel ${s.weight}` : `${s.weight} ${prefs.settings.unit}` }}</span>
                <span v-if="s.kind === 'up'" class="accent-text"> ↑</span>
              </template>
            </div>
          </div>
        </RouterLink>
      </section>
    </template>

    <p class="section-label">Otra sesión</p>
    <section class="card list" style="padding: 4px 14px">
      <button v-for="r in planStore.plan.routines.filter((x) => x.id !== routine?.id)" :key="r.id" class="plain list-item" @click="start(r)">
        <span class="app-icon" style="background: var(--surface-2); color: var(--accent)"><Icon name="dumbbell" :size="18" /></span>
        <div class="grow"><div style="font-weight: 500">{{ r.name }}</div><div class="small muted">{{ r.exercises.length }} ejercicios</div></div>
        <Icon name="play" :size="16" class="faint" />
      </button>
      <button class="plain list-item" @click="start()">
        <span class="app-icon" style="background: var(--surface-2); color: var(--accent)"><Icon name="plus" :size="18" /></span>
        <div class="grow"><div style="font-weight: 500">Entreno libre</div><div class="small muted">Añade ejercicios sobre la marcha</div></div>
      </button>
    </section>
  </main>
</template>

<style scoped>
.cal { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.cal-day { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cal-day b {
  width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
  font-weight: 500; font-size: 1.05rem;
}
.cal-day.today b { background: var(--accent); color: var(--accent-ink); font-weight: 700; }
.cal-day.off b { color: var(--faint); }
.cal-day i { width: 5px; height: 5px; border-radius: 50%; background: transparent; }
.cal-day.done i { background: var(--accent); }
.cal-day.planned i { background: var(--faint); }
.cal-day.missed i { background: var(--warn); }
.bar { height: 5px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
.big { font-size: 2.2rem; font-weight: 700; letter-spacing: -0.03em; }
</style>

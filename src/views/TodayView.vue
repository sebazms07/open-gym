<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlan } from '../stores/plan'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { useProgram } from '../stores/program'
import { DAYS, DAYS_SHORT, todayIndex } from '../lib/labels'
import { formatDate, formatNumber, startOfWeek } from '../lib/util'
import { volume, UNIT_LABEL } from '../lib/progression'
import { BLOCK_WEEKS, applyWeek, toISODate } from '../lib/program'
import type { Routine } from '../types'
import Icon from '../components/Icon.vue'

const router = useRouter()
const planStore = usePlan()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()
const prog = useProgram()

const today = todayIndex()
const slot = computed(() => planStore.today)
const routine = computed(() => planStore.todayRoutine)
const title = computed(() => {
  if (routine.value) return routine.value.name
  if (slot.value.status === 'done') return 'Entreno completado'
  return slot.value.status === 'off' ? 'Día libre' : 'Día de descanso'
})

const weekStart = startOfWeek()
const thisWeek = computed(() => workouts.history.filter((w) => new Date(w.date) >= weekStart))
const weekVolume = computed(() => thisWeek.value.reduce((acc, w) => acc + w.exercises.reduce((a, e) => a + volume(e), 0), 0))
const weekSets = computed(() => thisWeek.value.reduce((acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets.length, 0), 0))
const planned = computed(() => planStore.plan.schedule.filter(Boolean).length)
const shortName = (rid: string | null) => {
  const n = planStore.routine(rid)?.name ?? ''
  return n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Peso rápido
const todayISO = toISODate(new Date())
const weighedToday = computed(() => prog.weighIns.some((w) => w.date === todayISO))
const weight = ref<number | null>(null)
function saveWeight() {
  if (weight.value && weight.value > 20) {
    prog.logWeight(todayISO, Number(weight.value))
    weight.value = null
  }
}

function start(r?: Routine) {
  if (workouts.active && !confirm('Ya tienes un entreno en curso. ¿Descartarlo y empezar otro?')) return
  workouts.start(r)
  router.push('/entreno')
}

function advance() {
  if (confirm('¿Pasar a la siguiente fase? Se regenerará tu plan con nuevos rangos y variantes de ejercicios.')) prog.advancePhase()
}
</script>

<template>
  <main class="page">
    <header>
      <p class="muted small cap">{{ formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
      <h1>{{ title }}</h1>
      <p v-if="slot.shiftedFrom != null" class="small" style="color: var(--warn); margin-top: 4px">Movida del {{ DAYS[slot.shiftedFrom].toLowerCase() }}: no se hizo ese día.</p>
    </header>

    <!-- Programa -->
    <RouterLink v-if="prog.program && prog.phase && prog.week" to="/objetivo" class="card stack" style="gap: 6px">
      <div class="row between">
        <b>Fase {{ prog.program.phase }} · {{ prog.phase.name }}</b>
        <span class="small muted">Semana {{ prog.week.week }}/{{ BLOCK_WEEKS }}</span>
      </div>
      <div class="progress"><i :style="{ width: (Math.min(prog.week.completed, BLOCK_WEEKS) / BLOCK_WEEKS) * 100 + '%' }" /></div>
      <p v-if="prog.week.deload" class="small" style="color: var(--warn)">Semana de descarga: menos series y −10 % de peso. Recupera para volver más fuerte.</p>
      <p v-else-if="prog.week.extraSet" class="small" style="color: var(--accent)">Semana de sobrecarga: +1 serie en los ejercicios principales.</p>
      <p v-else-if="!prog.week.blockDone" class="small muted">{{ prog.phase.focus }}</p>
      <button v-if="prog.week.blockDone" class="btn primary sm" style="align-self: flex-start" @click.prevent="advance">¡Bloque completado! Pasar a fase {{ prog.program.phase + 1 }}</button>
    </RouterLink>
    <RouterLink v-else to="/objetivo" class="card accent row">
      <Icon name="trophy" />
      <div class="grow"><b>Define tu objetivo</b><div class="small muted">Crea un plan a tu medida que evoluciona contigo.</div></div>
      <Icon name="next" />
    </RouterLink>

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
              <template v-for="t in [prog.week ? applyWeek(e, !!e.main, prog.week) : e]" :key="t.sets">
                {{ t.sets }} × {{ e.repMin }}–{{ e.repMax }} {{ UNIT_LABEL[e.unit ?? 'reps'] }}
              </template>
              <template v-for="s in [workouts.suggestionFor(e.exerciseId, e)]" :key="s.kind">
                <span v-if="s.weight != null"> · {{ e.unit === 'min' ? `nivel ${s.weight}` : `${s.weight} ${prefs.settings.unit}` }}</span>
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
      <p class="muted">
        <template v-if="slot.status === 'done'">¡Buen trabajo! </template>
        <template v-if="planStore.nextSlot?.routine">Próxima sesión: <b style="color: var(--text)">{{ planStore.nextSlot.routine.name }}</b> el {{ DAYS[planStore.nextSlot.day].toLowerCase() }}.</template>
        <template v-else-if="slot.status !== 'done'">Hoy no toca entrenar. Puedes hacer cualquier rutina desde abajo.</template>
        <template v-else>Semana completada.</template>
      </p>
      <p v-if="slot.status !== 'done'" class="small muted">Aprovecha para caminar: los pasos cuentan mucho para bajar grasa.</p>
    </section>

    <!-- Semana -->
    <section class="card stack">
      <div class="row between">
        <h2>Esta semana</h2>
        <span class="muted small">{{ thisWeek.length }}/{{ planned }} entrenos</span>
      </div>
      <div class="week">
        <div v-for="(d, i) in DAYS_SHORT" :key="d" class="day" :class="[planStore.week[i].status, { today: i === today }]" :title="DAYS[i]">
          <span>{{ d }}</span>
          <i>{{ planStore.week[i].routineId ? shortName(planStore.week[i].routineId) : '' }}</i>
        </div>
      </div>
      <p v-if="planStore.unplaced" class="small" style="color: var(--warn)">{{ planStore.unplaced }} sesión(es) ya no caben esta semana. No pasa nada: la semana que viene empiezas de nuevo.</p>
      <div class="stats">
        <div class="stat"><b>{{ thisWeek.length }}</b><span>sesiones</span></div>
        <div class="stat"><b>{{ weekSets }}</b><span>series</span></div>
        <div class="stat"><b>{{ formatNumber(weekVolume / 1000) }}t</b><span>volumen</span></div>
      </div>
    </section>

    <!-- Peso y nutrición -->
    <section class="card stack">
      <div class="row between">
        <h2>Peso</h2>
        <RouterLink to="/progreso?tab=peso" class="small muted">Ver evolución →</RouterLink>
      </div>
      <div v-if="!weighedToday" class="row">
        <input v-model.number="weight" type="number" inputmode="decimal" step="0.1" placeholder="Peso de hoy en ayunas (kg)" @keyup.enter="saveWeight" />
        <button class="btn primary" :disabled="!weight" @click="saveWeight">Guardar</button>
      </div>
      <div v-if="prog.trend" class="stats">
        <div class="stat"><b>{{ formatNumber(prog.currentWeight!) }}</b><span>último (kg)</span></div>
        <div class="stat"><b>{{ formatNumber(prog.trend.average) }}</b><span>media 7 días</span></div>
        <div class="stat"><b>{{ prog.trend.perWeek == null ? '—' : (prog.trend.perWeek > 0 ? '+' : '') + formatNumber(prog.trend.perWeek) }}</b><span>kg/semana</span></div>
      </div>
      <p v-if="prog.targets" class="small muted">Objetivo diario: ~{{ prog.targets.kcal.toLocaleString('es') }} kcal · {{ prog.targets.protein }} g de proteína · {{ prog.targets.steps }} pasos.</p>
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
.day i {
  width: 100%; height: 26px; border-radius: 8px; background: var(--surface-2);
  display: grid; place-items: center; font-style: normal; font-size: 0.7rem; color: var(--muted);
}
.day.off i { opacity: 0.35; }
.day.planned i { border: 1.5px solid var(--accent); color: var(--text); }
.day.done i { background: var(--accent); color: var(--accent-ink); }
.day.missed i { background: transparent; border: 1.5px dashed var(--warn); color: var(--warn); }
.day.today span { color: var(--text); }
.progress { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
.progress i { display: block; height: 100%; background: var(--accent); }
</style>

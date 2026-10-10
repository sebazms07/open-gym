<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProgram, defaultProgram } from '../stores/program'
import { GOALS, BLOCK_WEEKS, estimateMinutes, generatePlan, minSessionsFor, toISODate } from '../lib/program'
import { ACTIVITY, RECOMMENDATIONS, bmi, bmiLabel, healthyMaxWeight } from '../lib/body'
import { DAYS, DAYS_SHORT } from '../lib/labels'
import { formatNumber, startOfWeek } from '../lib/util'
import type { Activity, Goal, Program, Sex } from '../types'
import Icon from '../components/Icon.vue'

const router = useRouter()
const store = useProgram()

// ---- perfil (se guarda al instante)
const p = store.profile
const weightInput = ref(store.currentWeight ?? (null as number | null))
function saveWeight() {
  const w = Number(weightInput.value)
  if (w > 20 && w < 400) store.logWeight(toISODate(new Date()), w)
}
const bmiValue = computed(() => (store.currentWeight && p.height ? bmi(store.currentWeight, p.height) : null))

// ---- borrador del programa
const draft = ref<Program>({ ...(store.program ?? defaultProgram()), available: [...(store.program ?? defaultProgram()).available] })
const availableCount = computed(() => draft.value.available.filter(Boolean).length)
const needsRest = computed(() => availableCount.value > draft.value.sessions)
const preview = computed(() => generatePlan({ ...draft.value, sessions: Math.min(draft.value.sessions, availableCount.value) }))
const previewDays = computed(() =>
  preview.value.schedule.map((rid, i) => ({ day: DAYS[i], routine: preview.value.routines.find((r) => r.id === rid) })),
)

function toggleDay(i: number) {
  draft.value.available[i] = !draft.value.available[i]
  if (draft.value.restDay === i && !draft.value.available[i]) draft.value.restDay = null
}

const sameProgram = computed(() => store.program?.goal === draft.value.goal)
function create() {
  if (availableCount.value < draft.value.sessions) return alert('Marca al menos tantos días disponibles como sesiones.')
  const msg = sameProgram.value
    ? 'Se regenerará tu plan semanal con estos días (mantienes tu fase y semana). Los cambios manuales a tus rutinas se perderán. ¿Continuar?'
    : 'Se creará un plan nuevo desde la fase 1 y reemplazará tu plan semanal actual. Tu historial se conserva. ¿Continuar?'
  if (!confirm(msg)) return
  const base = sameProgram.value && store.program ? { phase: store.program.phase, startDate: store.program.startDate } : { phase: 1, startDate: toISODate(startOfWeek()) }
  store.apply({ ...draft.value, available: [...draft.value.available], ...base })
  router.push('/')
}

const SEX: [Sex, string][] = [['male', 'Hombre'], ['female', 'Mujer'], ['na', 'No indicar']]
const goals = Object.entries(GOALS) as [Goal, (typeof GOALS)[Goal]][]
</script>

<template>
  <main class="page">
    <header class="page-header">
      <button class="btn icon ghost" aria-label="Volver" @click="router.back()"><Icon name="back" /></button>
      <h1>Mi objetivo</h1>
    </header>

    <!-- Programa actual -->
    <section v-if="store.program && store.phase && store.week" class="card accent stack">
      <div class="row between">
        <span class="chip accent">{{ GOALS[store.program.goal].name }}</span>
        <span class="small muted">Semana {{ store.week.week }} de {{ BLOCK_WEEKS }}</span>
      </div>
      <h2>Fase {{ store.program.phase }} · {{ store.phase.name }}</h2>
      <p class="small muted">{{ store.phase.focus }}</p>
      <ol class="phases">
        <li v-for="(ph, i) in GOALS[store.program.goal].phases" :key="ph.name" :class="{ on: i + 1 === Math.min(store.program.phase, 3) }">
          <b>{{ ph.name }}</b>
          <span class="small muted">{{ ph.main.sets }}×{{ ph.main.repMin }}–{{ ph.main.repMax }} básicos · {{ ph.acc.sets }}×{{ ph.acc.repMin }}–{{ ph.acc.repMax }} accesorios · cardio {{ ph.cardio.repMin }}–{{ ph.cardio.repMax }} min</span>
        </li>
      </ol>
    </section>

    <!-- Perfil -->
    <section class="card stack">
      <h2>Tu perfil</h2>
      <div class="segmented">
        <button v-for="[k, l] in SEX" :key="k" :class="{ on: p.sex === k }" @click="p.sex = k">{{ l }}</button>
      </div>
      <div class="grid3">
        <label class="field">Edad<input type="number" inputmode="numeric" min="14" max="99" v-model.number="p.age" /></label>
        <label class="field">Altura (cm)<input type="number" inputmode="numeric" min="120" max="230" v-model.number="p.height" /></label>
        <label class="field">Peso (kg)<input type="number" inputmode="decimal" step="0.1" v-model.number="weightInput" @change="saveWeight" /></label>
      </div>
      <label class="field">Actividad
        <select v-model="p.activity">
          <option v-for="(a, k) in ACTIVITY" :key="k" :value="k as Activity">{{ a.label }}</option>
        </select>
      </label>
      <p v-if="bmiValue" class="small muted">
        IMC {{ formatNumber(bmiValue) }} ({{ bmiLabel(bmiValue) }}).
        <template v-if="p.height && bmiValue >= 25"> Referencia de IMC saludable: hasta {{ formatNumber(healthyMaxWeight(p.height)) }} kg. Tómalo como referencia, no como meta obligatoria: la cintura y cómo te ves cuentan más.</template>
      </p>
    </section>

    <!-- Objetivo -->
    <section class="stack">
      <h2>¿Qué quieres conseguir?</h2>
      <button v-for="[k, g] in goals" :key="k" class="card goal plain" :class="{ on: draft.goal === k }" @click="draft.goal = k">
        <div class="row between"><b>{{ g.name }}</b><span v-if="draft.goal === k" class="chip accent">Elegido</span></div>
        <p class="small muted">{{ g.description }}</p>
      </button>
    </section>

    <!-- Semana -->
    <section class="card stack">
      <h2>Tu semana</h2>
      <label class="field">Sesiones por semana
        <div class="segmented">
          <button v-for="n in [3, 4, 5]" :key="n" :class="{ on: draft.sessions === n }" @click="draft.sessions = n">{{ n }}</button>
        </div>
      </label>
      <div class="field">Días en los que puedes entrenar
        <div class="days">
          <button v-for="(d, i) in DAYS_SHORT" :key="d" class="daychip" :class="{ on: draft.available[i] }" :aria-pressed="draft.available[i]" :title="DAYS[i]" @click="toggleDay(i)">{{ d }}</button>
        </div>
      </div>
      <label v-if="needsRest" class="field">Día de descanso entre semana
        <select v-model="draft.restDay">
          <option :value="null">Automático (repartido)</option>
          <option v-for="i in draft.available.map((a, i) => (a ? i : -1)).filter((i) => i >= 0)" :key="i" :value="i">{{ DAYS[i] }}</option>
        </select>
      </label>
      <label class="field">Duración máxima por sesión
        <div class="segmented">
          <button v-for="m in [45, 60, 75, 90]" :key="m" :class="{ on: draft.maxMinutes === m }" @click="draft.maxMinutes = m">{{ m }} min</button>
        </div>
      </label>

      <div class="list">
        <div v-for="x in previewDays" :key="x.day" class="list-item" style="min-height: 40px; padding: 6px 2px">
          <span style="width: 92px" :class="x.routine ? '' : 'muted'">{{ x.day }}</span>
          <span v-if="x.routine" class="grow"><b>{{ x.routine.name }}</b> <span class="small muted">· ~{{ estimateMinutes(x.routine.exercises) }} min</span></span>
          <span v-else class="grow small muted">{{ draft.available[DAYS.indexOf(x.day)] ? 'Descanso (colchón para recuperar)' : 'Libre' }}</span>
        </div>
      </div>
      <p class="small muted">Si faltas a una sesión, pasa al siguiente día disponible. Una semana cuenta para avanzar si haces al menos {{ minSessionsFor(draft.sessions) }} sesiones.</p>
      <button class="btn primary block" @click="create">{{ sameProgram ? 'Actualizar mi plan' : 'Crear mi plan' }}</button>
    </section>

    <!-- Evolución -->
    <section class="card stack small">
      <h2>Cómo evoluciona tu plan</h2>
      <ul class="bullets">
        <li><b>Cada sesión:</b> progresión doble. Cuando completas todas las series en el tope del rango, la app te sugiere subir el peso (o el nivel en cardio).</li>
        <li><b>Bloques de {{ BLOCK_WEEKS }} semanas:</b> semanas 1–2 de carga; la 3.ª suma una serie a los ejercicios principales; la 4.ª es de descarga (≈60 % de las series y −10 % de peso) para recuperarte.</li>
        <li><b>Cada fase:</b> al terminar el bloque pasas a la siguiente fase, con otros rangos de reps y variantes de ejercicios.</li>
        <li><b>Tu peso:</b> con tus pesajes la app calcula tu ritmo semanal y te dice si ajustar calorías o pasos.</li>
      </ul>
    </section>

    <!-- Nutrición -->
    <section class="card stack">
      <h2>Nutrición y hábitos</h2>
      <template v-if="store.targets">
        <div class="stats">
          <div class="stat"><b>{{ store.targets.kcal.toLocaleString('es') }}</b><span>kcal/día</span></div>
          <div class="stat"><b>{{ store.targets.protein }} g</b><span>proteína</span></div>
          <div class="stat"><b>{{ store.targets.steps.split('–')[0] }}+</b><span>pasos/día</span></div>
        </div>
        <p class="small muted">Mantenimiento estimado: {{ store.targets.maintenance.toLocaleString('es') }} kcal. Grasas ~{{ store.targets.fat }} g, carbohidratos ~{{ store.targets.carbs }} g, agua ~{{ formatNumber(store.targets.waterL) }} L.</p>
        <p class="advice small" :class="store.advice.status">{{ store.advice.message }}</p>
      </template>
      <p v-else class="small muted">Completa edad, altura y peso para calcular tus calorías y proteína.</p>
      <ul class="bullets small">
        <li v-for="r in RECOMMENDATIONS[draft.goal]" :key="r">{{ r }}</li>
      </ul>
      <p class="small muted">Cifras orientativas (fórmula Mifflin-St Jeor). No sustituyen el consejo de un médico o nutricionista.</p>
    </section>
  </main>
</template>

<style scoped>
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.goal { display: flex; flex-direction: column; gap: 4px; }
.goal.on { border-color: var(--accent); }
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.daychip {
  height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface-2);
  color: var(--muted); font: inherit; font-weight: 700; cursor: pointer;
}
.daychip.on { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
.phases { margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: 6px; }
.phases li { color: var(--muted); }
.phases li b { display: block; }
.phases li.on, .phases li.on b { color: var(--accent); }
.bullets { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: 6px; }
.advice { padding: 8px 10px; border-radius: 10px; background: var(--surface-2); }
.advice.ok { color: var(--accent); }
.advice.fast, .advice.slow { color: var(--warn); }
</style>

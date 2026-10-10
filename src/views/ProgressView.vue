<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bar, Line } from 'vue-chartjs'
import { Chart, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { bestSet, volume } from '../lib/progression'
import { formatDate, formatNumber, startOfWeek } from '../lib/util'
import type { Workout } from '../types'
import { useProgram } from '../stores/program'
import { toISODate } from '../lib/program'
import Icon from '../components/Icon.vue'
import ProgressChart from '../components/ProgressChart.vue'
import MuscleFigure from '../components/MuscleFigure.vue'
import { minSessionsFor } from '../lib/program'
import { activityGrid, weekStreak } from '../lib/stats'
import { MUSCLES, MUSCLE_NAME_ES, muscleSets } from '../lib/muscles'
import { usePlan } from '../stores/plan'

Chart.register(BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip)

const route = useRoute()
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()

// --- Resumen
const planStore = usePlan()
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const thisMonth = computed(() => workouts.workouts.filter((w) => new Date(w.date) >= monthStart).length)
const streak = computed(() =>
  weekStreak(workouts.workouts, minSessionsFor(prog.program?.sessions ?? (planStore.plan.schedule.filter(Boolean).length || 1))),
)
const weight30 = computed(() => {
  const list = prog.sortedWeighIns
  if (list.length < 2) return null
  const cutoff = toISODate(new Date(Date.now() - 30 * 864e5))
  const base = list.find((e) => e.date >= cutoff) ?? list[0]
  return list[list.length - 1].weight - base.weight
})
const grid = computed(() => activityGrid(workouts.workouts, 17))
const heat = (min: number) => (min <= 0 ? 0 : min < 30 ? 1 : min < 50 ? 2 : min < 70 ? 3 : 4)
const monthLabels = computed(() =>
  grid.value.map((col, i) => {
    const d = col[0].date
    const prev = i ? grid.value[i - 1][0].date : null
    return !prev || prev.getMonth() !== d.getMonth() ? d.toLocaleDateString('es', { month: 'short' }) : ''
  }),
)

const period = ref<7 | 30 | 90 | 0>(7)
const balance = computed(() => {
  const from = period.value ? Date.now() - period.value * 864e5 : 0
  const sets = muscleSets(workouts.workouts.filter((w) => new Date(w.date).getTime() >= from), catalogue.get)
  const max = Math.max(1, ...Object.values(sets).map((v) => v ?? 0))
  return {
    weights: Object.fromEntries(Object.entries(sets).map(([m, v]) => [m, (v ?? 0) / max])) as Record<string, number>,
    rows: MUSCLES.map((m) => ({ m, name: MUSCLE_NAME_ES[m], sets: Math.round((sets[m] ?? 0) * 10) / 10 })).filter((r) => r.sets > 0).sort((a, b) => b.sets - a.sets),
    neglected: MUSCLES.filter((m) => !sets[m] && !['serratus', 'hip-flexors', 'tibialis', 'forearm'].includes(m)).map((m) => MUSCLE_NAME_ES[m]),
  }
})

const tab = ref<'history' | 'charts' | 'weight'>(route.query.tab === 'peso' ? 'weight' : 'history')
const prog = useProgram()

// --- Peso
const wDate = ref(toISODate(new Date()))
const wValue = ref<number | null>(null)
const wWaist = ref<number | null>(null)
function addWeight() {
  if (!wValue.value || wValue.value < 20) return
  prog.logWeight(wDate.value, Number(wValue.value), wWaist.value || null)
  wValue.value = wWaist.value = null
}
const weightData = computed(() => {
  const entries = prog.sortedWeighIns.slice(-60)
  const avg = entries.map((_, i) => {
    const win = entries.slice(Math.max(0, i - 6), i + 1)
    return Math.round((win.reduce((a, e) => a + e.weight, 0) / win.length) * 10) / 10
  })
  return {
    labels: entries.map((e) => formatDate(`${e.date}T12:00:00`, { day: 'numeric', month: 'short' })),
    datasets: [
      { label: 'Peso', data: entries.map((e) => e.weight), borderColor: css('--muted'), pointRadius: 2, borderWidth: 1 },
      { label: 'Media 7 días', data: avg, borderColor: css('--accent'), pointRadius: 0, borderWidth: 3, tension: 0.3 },
    ],
  }
})
const weightOptions = {
  locale: 'es',
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    x: { ticks: { color: css('--muted'), maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
    y: { ticks: { color: css('--muted') }, grid: { color: css('--border') } },
  },
}
const open = ref<string | null>(typeof route.query.w === 'string' ? route.query.w : null)

const wVolume = (w: Workout) => w.exercises.reduce((a, e) => a + volume(e), 0)
const wSets = (w: Workout) => w.exercises.reduce((a, e) => a + e.sets.length, 0)
const wDuration = (w: Workout) => (w.finishedAt ? `${Math.max(1, Math.round((new Date(w.finishedAt).getTime() - new Date(w.date).getTime()) / 6e4))} min` : '')

function remove(w: Workout) {
  if (confirm(`¿Eliminar el entreno del ${formatDate(w.date)}?`)) workouts.remove(w.id)
}

// --- Gráficos
const logged = computed(() => {
  const count = new Map<string, number>()
  for (const w of workouts.workouts) for (const e of w.exercises) count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n, name: catalogue.name(id) }))
})
const selected = ref('')
const exId = computed(() => selected.value || logged.value[0]?.id || '')
const points = computed(() =>
  workouts.logsFor(exId.value).map(({ date, log }) => ({ date, best: bestSet(log) })).filter((p) => p.best),
)

const weeks = computed(() => {
  const out: { label: string; volume: number; sessions: number }[] = []
  const start = startOfWeek()
  for (let i = 7; i >= 0; i--) {
    const from = new Date(start)
    from.setDate(from.getDate() - i * 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    const ws = workouts.workouts.filter((w) => new Date(w.date) >= from && new Date(w.date) < to)
    out.push({ label: formatDate(from.toISOString(), { day: 'numeric', month: 'short' }), volume: ws.reduce((a, w) => a + wVolume(w), 0), sessions: ws.length })
  }
  return out
})
const barData = computed(() => ({
  labels: weeks.value.map((w) => w.label),
  datasets: [{ label: `Volumen (${prefs.settings.unit})`, data: weeks.value.map((w) => Math.round(w.volume)), backgroundColor: css('--accent'), borderRadius: 6 }],
}))
const barOptions = {
  locale: 'es',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { tooltip: { enabled: true } },
  scales: {
    x: { ticks: { color: css('--muted'), maxRotation: 0, autoSkip: true }, grid: { display: false } },
    y: { ticks: { color: css('--muted') }, grid: { color: css('--border') } },
  },
}
</script>

<template>
  <main class="page">
    <header><h1>Estadísticas</h1><p class="subtitle">Progreso e historial</p></header>

    <div class="tiles">
      <div class="tile"><span class="label"><Icon name="dumbbell" :size="14" />Entrenos</span><b>{{ workouts.workouts.length }}</b></div>
      <div class="tile"><span class="label"><Icon name="calendar" :size="14" />Este mes</span><b>{{ thisMonth }}</b></div>
      <div class="tile"><span class="label"><Icon name="flame" :size="14" />Racha semanal</span><b>{{ streak }}</b></div>
      <div class="tile"><span class="label"><Icon name="scale" :size="14" />Peso 30 días</span>
        <b :style="{ color: weight30 == null ? '' : weight30 <= 0 ? 'var(--accent)' : 'var(--warn)' }">{{ weight30 == null ? '—' : `${weight30 > 0 ? '+' : ''}${formatNumber(weight30)} kg` }}</b>
      </div>
    </div>

    <section class="card stack">
      <span class="small muted">Actividad · últimas 17 semanas</span>
      <div class="heat-months xs faint"><span v-for="(m, i) in monthLabels" :key="i">{{ m }}</span></div>
      <div class="heat">
        <div v-for="(col, c) in grid" :key="c" class="heat-col">
          <i v-for="cell in col" :key="cell.date.toDateString()" :class="[`h${heat(cell.minutes)}`, { future: cell.future }]" :title="`${cell.date.toLocaleDateString('es')}: ${Math.round(cell.minutes)} min`" />
        </div>
      </div>
      <div class="row xs faint" style="justify-content: flex-end; gap: 4px">Menos <i class="h1 sq" /><i class="h2 sq" /><i class="h3 sq" /><i class="h4 sq" /> Más</div>
    </section>

    <section class="card stack">
      <div class="row between"><h2>Balance muscular</h2><span class="small muted">por series</span></div>
      <div class="segmented">
        <button v-for="[p, l] in ([[7, 'Semana'], [30, '30d'], [90, '90d'], [0, 'Todo']] as const)" :key="p" :class="{ on: period === p }" @click="period = p">{{ l }}</button>
      </div>
      <MuscleFigure :weights="balance.weights" :sex="prog.figureSex" :height="260" />
      <div v-if="balance.rows.length" class="mrows">
        <div v-for="r in balance.rows.slice(0, 8)" :key="r.m" class="mrow small">
          <span class="grow">{{ r.name }}</span>
          <span class="mbar"><i :style="{ width: (r.sets / balance.rows[0].sets) * 100 + '%' }" /></span>
          <span class="num muted" style="width: 36px; text-align: right">{{ r.sets }}</span>
        </div>
      </div>
      <p v-else class="small muted">Sin series en este periodo.</p>
      <p v-if="balance.rows.length && balance.neglected.length" class="small" style="color: var(--warn)">Sin trabajar: {{ balance.neglected.join(', ') }}.</p>
    </section>

    <div class="segmented">
      <button :class="{ on: tab === 'history' }" @click="tab = 'history'">Historial</button>
      <button :class="{ on: tab === 'charts' }" @click="tab = 'charts'">Gráficos</button>
      <button :class="{ on: tab === 'weight' }" @click="tab = 'weight'">Peso</button>
    </div>

    <template v-if="tab === 'history'">
      <p v-if="!workouts.history.length" class="empty card">Todavía no has guardado entrenos. ¡El primero es el más importante!</p>
      <article v-for="w in workouts.history" :key="w.id" class="card stack">
        <button class="plain row" @click="open = open === w.id ? null : w.id">
          <div class="grow">
            <h3>{{ w.routineName }}</h3>
            <p class="small muted cap">{{ formatDate(w.date, { weekday: 'long', day: 'numeric', month: 'short' }) }} · {{ wDuration(w) }}</p>
          </div>
          <div class="small muted num" style="text-align: right">{{ wSets(w) }} series<br />{{ formatNumber(wVolume(w)) }} {{ prefs.settings.unit }}</div>
          <Icon :name="open === w.id ? 'up' : 'down'" :size="18" class="muted" />
        </button>
        <template v-if="open === w.id">
          <div class="list">
            <RouterLink v-for="e in w.exercises" :key="e.uid" :to="`/ejercicio/${e.exerciseId}`" class="list-item" style="align-items: flex-start; flex-direction: column; gap: 2px">
              <span class="cap" style="font-weight: 600">{{ catalogue.name(e.exerciseId) }}</span>
              <span class="small muted num">{{ e.sets.map((s) => `${s.weight ?? 0}×${s.reps}`).join('  ·  ') }}</span>
            </RouterLink>
          </div>
          <p v-if="w.notes" class="small muted">“{{ w.notes }}”</p>
          <button class="btn sm ghost danger" style="align-self: flex-start" @click="remove(w)"><Icon name="trash" :size="16" />Eliminar</button>
        </template>
      </article>
    </template>

    <template v-else-if="tab === 'weight'">
      <section class="card stack">
        <h2>Registrar</h2>
        <div class="wgrid">
          <label class="field">Fecha<input v-model="wDate" type="date" :max="toISODate(new Date())" /></label>
          <label class="field">Peso (kg)<input v-model.number="wValue" type="number" inputmode="decimal" step="0.1" /></label>
          <label class="field">Cintura (cm)<input v-model.number="wWaist" type="number" inputmode="decimal" step="0.5" placeholder="opcional" /></label>
        </div>
        <button class="btn primary" :disabled="!wValue" @click="addWeight">Guardar pesaje</button>
      </section>
      <section v-if="prog.sortedWeighIns.length" class="card stack">
        <h2>Evolución</h2>
        <div v-if="prog.sortedWeighIns.length > 1" style="height: 200px"><Line :data="weightData" :options="weightOptions" /></div>
        <p class="small" :style="{ color: prog.advice.status === 'ok' ? 'var(--accent)' : prog.advice.status === 'nodata' ? 'var(--muted)' : 'var(--warn)' }">{{ prog.advice.message }}</p>
        <div class="list">
          <div v-for="e in [...prog.sortedWeighIns].reverse().slice(0, 30)" :key="e.date" class="list-item" style="min-height: 44px">
            <span class="small muted cap" style="width: 110px">{{ formatDate(`${e.date}T12:00:00`) }}</span>
            <b class="num grow">{{ formatNumber(e.weight) }} kg<span v-if="e.waist" class="small muted"> · cintura {{ formatNumber(e.waist) }} cm</span></b>
            <button class="btn icon ghost danger" aria-label="Eliminar pesaje" @click="prog.removeWeight(e.date)"><Icon name="trash" :size="16" /></button>
          </div>
        </div>
      </section>
      <p v-else class="empty card">Aún no hay pesajes. Pésate 3–4 mañanas por semana, en ayunas.</p>
    </template>

    <template v-else>
      <section class="card stack">
        <h2>Volumen semanal</h2>
        <div style="height: 180px"><Bar :data="barData" :options="barOptions" /></div>
        <p class="small muted">Sesiones por semana: {{ weeks.map((w) => w.sessions).join(' · ') }}</p>
      </section>
      <section class="card stack">
        <h2>Por ejercicio</h2>
        <template v-if="logged.length">
          <select :value="exId" @change="selected = ($event.target as HTMLSelectElement).value">
            <option v-for="x in logged" :key="x.id" :value="x.id">{{ x.name }} ({{ x.n }})</option>
          </select>
          <ProgressChart v-if="points.length > 1" :key="exId" :points="points" />
          <p v-else class="small muted">Registra este ejercicio en al menos dos sesiones para ver la curva.</p>
          <RouterLink :to="`/ejercicio/${exId}`" class="btn sm" style="align-self: flex-start">Ver detalle</RouterLink>
        </template>
        <p v-else class="small muted">Sin datos todavía.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.heat { display: grid; grid-template-columns: repeat(17, 1fr); gap: 3px; }
.heat-months { display: grid; grid-template-columns: repeat(17, 1fr); gap: 3px; margin-bottom: -6px; white-space: nowrap; }
.heat-col { display: grid; grid-template-rows: repeat(7, 1fr); gap: 3px; }
.heat i, .sq { display: block; aspect-ratio: 1; border-radius: 3px; background: var(--surface-2); }
.sq { width: 10px; }
.h1 { background: color-mix(in srgb, var(--accent) 30%, var(--surface-2)) !important; }
.h2 { background: color-mix(in srgb, var(--accent) 55%, var(--surface-2)) !important; }
.h3 { background: color-mix(in srgb, var(--accent) 80%, var(--surface-2)) !important; }
.h4 { background: var(--accent) !important; }
.heat i.future { opacity: 0.3; }
.mrows { display: flex; flex-direction: column; gap: 6px; }
.mrow { display: flex; align-items: center; gap: 10px; }
.mbar { flex: 1.3; height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
.mbar i { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
.wgrid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 8px; }
.wgrid input { padding: 8px 6px; }
</style>

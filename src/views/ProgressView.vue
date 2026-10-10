<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bar, Line } from 'vue-chartjs'
import { Chart, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { bestSet, volume } from '../lib/progression'
import { formatDate, formatDuration, formatNumber, startOfWeek } from '../lib/util'
import type { Workout } from '../types'
import { useProgram } from '../stores/program'
import { toISODate } from '../lib/program'
import Icon from '../components/Icon.vue'
import ProgressChart from '../components/ProgressChart.vue'

Chart.register(BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip)

const route = useRoute()
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()

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
const wDuration = (w: Workout) => (w.finishedAt ? formatDuration(new Date(w.finishedAt).getTime() - new Date(w.date).getTime()) : '')

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
    <h1>Progreso</h1>
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
.wgrid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 8px; }
.wgrid input { padding: 8px 6px; }
</style>

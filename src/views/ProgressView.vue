<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, LinearScale, CategoryScale, Tooltip } from 'chart.js'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useSettings } from '../stores/settings'
import { bestSet, volume } from '../lib/progression'
import { formatDate, formatDuration, formatNumber, startOfWeek } from '../lib/util'
import type { Workout } from '../types'
import Icon from '../components/Icon.vue'
import ProgressChart from '../components/ProgressChart.vue'

Chart.register(BarElement, LinearScale, CategoryScale, Tooltip)

const route = useRoute()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prefs = useSettings()

const tab = ref<'history' | 'charts'>('history')
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
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
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

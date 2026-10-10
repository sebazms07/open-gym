<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'
import { formatDate } from '../lib/util'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps<{ points: { date: string; best: { e1rm: number; weight: number } | null }[] }>()

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
const accent = css('--accent')
const muted = css('--muted')
const border = css('--border')

const data = computed(() => ({
  labels: props.points.map((p) => formatDate(p.date, { day: 'numeric', month: 'short' })),
  datasets: [
    {
      label: '1RM estimado',
      data: props.points.map((p) => Math.round((p.best?.e1rm ?? 0) * 10) / 10),
      borderColor: accent,
      backgroundColor: accent + '22',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    },
    {
      label: 'Peso máximo',
      data: props.points.map((p) => p.best?.weight ?? 0),
      borderColor: muted,
      borderDash: [4, 4],
      tension: 0.3,
      pointRadius: 2,
    },
  ],
}))

const options = {
  locale: 'es',
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { tooltip: { enabled: true } },
  scales: {
    x: { ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
    y: { ticks: { color: muted }, grid: { color: border } },
  },
}
</script>

<template>
  <div style="height: 200px"><Line :data="data" :options="options" /></div>
</template>

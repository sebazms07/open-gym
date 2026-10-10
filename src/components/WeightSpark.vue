<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler } from 'chart.js'
import type { WeighIn } from '../types'
import { formatDate } from '../lib/util'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler)

const props = defineProps<{ entries: WeighIn[]; goal?: number | null; height?: number }>()
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

const data = computed(() => {
  const e = props.entries.slice(-90)
  const accent = css('--accent')
  return {
    labels: e.map((x) => formatDate(`${x.date}T12:00:00`, { day: 'numeric', month: 'short' })),
    datasets: [
      { data: e.map((x) => x.weight), borderColor: accent, backgroundColor: accent + '26', fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: e.map((_, i) => (i === e.length - 1 ? 4 : 0)), pointBackgroundColor: accent },
      ...(props.goal ? [{ data: e.map(() => props.goal!), borderColor: css('--warn'), borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false }] : []),
    ],
  }
})
const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { ticks: { color: css('--faint'), maxRotation: 0, autoSkip: true, maxTicksLimit: 4, font: { size: 10 } }, grid: { display: false }, border: { display: false } },
    y: { ticks: { color: css('--faint'), maxTicksLimit: 3, font: { size: 10 } }, grid: { display: false }, border: { display: false } },
  },
}))
</script>

<template>
  <div :style="{ height: (height ?? 110) + 'px' }"><Line :data="data" :options="options" /></div>
</template>

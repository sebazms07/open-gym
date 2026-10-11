<script setup lang="ts">
import { computed } from 'vue'
import type { Exercise } from '../types'
import { muscleWeights } from '../lib/muscles'
import { useProgram } from '../stores/program'
import MuscleFigure from './MuscleFigure.vue'
import { frameUrl, mediaFor } from '../lib/media'

const props = withDefaults(defineProps<{ exercise: Exercise; size?: number }>(), { size: 56 })
const prog = useProgram()
const media = computed(() => mediaFor(props.exercise.id))
const BACK = ['upper-back', 'lower-back', 'gluteal', 'hamstring', 'triceps']
const FRONT = ['chest', 'abs', 'obliques', 'quadriceps', 'biceps', 'serratus', 'hip-flexors', 'tibialis', 'adductors']
const weights = computed(() => muscleWeights(props.exercise) as Record<string, number>)
// muestra la cara del cuerpo donde trabaja más el ejercicio
const side = computed(() => {
  const sum = (list: string[]) => list.reduce((a, m) => a + (weights.value[m] ?? 0), 0)
  return sum(BACK) > sum(FRONT) ? 'back' : 'front'
})
</script>

<template>
  <div class="thumb" :class="media?.src" :style="{ width: size + 'px', height: size + 'px' }">
    <img v-if="media" :src="frameUrl(exercise.id, 1)" alt="" loading="lazy" />
    <MuscleFigure v-else :weights="weights" :sex="prog.figureSex" :side="side" :height="size - 6" />
  </div>
</template>

<style scoped>
.thumb { flex: none; display: grid; place-items: center; border-radius: 12px; background: var(--surface-2); overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb.ek { background: #fff; }
.thumb.ek img { object-fit: contain; padding: 3px; }
@media (prefers-color-scheme: dark) {
  .thumb.ek { background: #000; }
  .thumb.ek img { filter: invert(1); }
}
</style>

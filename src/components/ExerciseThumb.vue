<script setup lang="ts">
import { computed } from 'vue'
import type { Exercise } from '../types'
import { muscleWeights } from '../lib/muscles'
import { useProgram } from '../stores/program'
import MuscleFigure from './MuscleFigure.vue'
import Icon from './Icon.vue'
import { mediaFor } from '../lib/media'

const props = withDefaults(defineProps<{ exercise: Exercise; size?: number }>(), { size: 56 })
const prog = useProgram()
/** el ejercicio tiene animación de inicio/fin */
const animated = computed(() => !!mediaFor(props.exercise.id))
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
  <div class="thumb" :style="{ width: size + 'px', height: size + 'px' }">
    <MuscleFigure :weights="weights" :sex="prog.figureSex" :side="side" :height="size - 6" />
    <span v-if="animated" class="play" title="Tiene animación" aria-label="Tiene animación"><Icon name="play" :size="9" /></span>
  </div>
</template>

<style scoped>
.thumb { position: relative; flex: none; display: grid; place-items: center; border-radius: 12px; background: var(--surface-2); overflow: hidden; }
.play {
  position: absolute; right: 4px; bottom: 4px;
  width: 18px; height: 18px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--accent); color: var(--accent-ink);
  box-shadow: 0 1px 4px #0008;
}
.play :deep(svg) { margin-left: 1px; fill: currentColor; }
</style>

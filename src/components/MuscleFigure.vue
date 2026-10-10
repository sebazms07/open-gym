<script setup lang="ts">
import { computed } from 'vue'
import paths from '../data/body-paths.json'
import { INERT } from '../lib/muscles'

type View = { vb: string; p: Record<string, string[]> }
const props = withDefaults(
  defineProps<{
    /** músculo → intensidad 0–1 */
    weights: Record<string, number>
    sex?: 'male' | 'female'
    side?: 'front' | 'back' | 'both'
    /** alto en px */
    height?: number
  }>(),
  { sex: 'male', side: 'both', height: 220 },
)

const views = computed(() => {
  const sexPaths = (paths as Record<string, Record<string, View>>)[props.sex]
  const sides = props.side === 'both' ? ['front', 'back'] : [props.side]
  return sides.map((side) => ({ side, vb: sexPaths[side].vb, parts: Object.keys(sexPaths[side].p) }))
})

const fill = (part: string) => {
  if (INERT.includes(part)) return 'var(--fig-base)'
  const w = props.weights[part] ?? 0
  if (w <= 0) return 'var(--fig-muscle)'
  return `color-mix(in srgb, var(--accent) ${Math.round(30 + 70 * Math.min(1, w))}%, var(--fig-muscle))`
}
</script>

<template>
  <div class="figure" :style="{ height: height + 'px' }">
    <svg v-for="v in views" :key="v.side" :viewBox="v.vb" :style="{ height: height + 'px' }" role="img" :aria-label="v.side === 'front' ? 'Vista frontal' : 'Vista posterior'">
      <use v-for="p in v.parts" :key="p" :href="`#bp-${sex}-${v.side}-${p}`" :fill="fill(p)" stroke="var(--bg)" stroke-width="2" />
    </svg>
  </div>
</template>

<style scoped>
.figure { display: flex; justify-content: center; gap: 4px; }
.figure svg { width: auto; aspect-ratio: auto; }
</style>

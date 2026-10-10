<script setup lang="ts">
import type { Exercise } from '../types'
import { equipmentLabel, muscleLabel } from '../lib/labels'
import Icon from './Icon.vue'
defineProps<{ exercise: Exercise }>()
</script>

<template>
  <div class="list-item">
    <div class="badge">{{ exercise.n.charAt(0).toUpperCase() }}</div>
    <div class="grow">
      <div class="name">{{ exercise.n }}</div>
      <div class="small muted ellipsis">{{ muscleLabel(exercise.t) }} · {{ equipmentLabel(exercise.e) }}</div>
    </div>
    <slot><Icon name="next" :size="18" class="muted" /></slot>
  </div>
</template>

<style scoped>
.badge {
  flex: none; width: 40px; height: 40px; border-radius: 12px;
  display: grid; place-items: center;
  background: var(--surface-2); color: var(--accent); font-weight: 800;
}
.name { font-weight: 600; }
.name::first-letter { text-transform: uppercase; }
</style>

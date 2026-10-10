<script setup lang="ts">
import type { Exercise } from '../types'
import { equipmentLabel, muscleLabel } from '../lib/labels'
import Icon from './Icon.vue'
import ExerciseThumb from './ExerciseThumb.vue'
defineProps<{ exercise: Exercise }>()
</script>

<template>
  <div class="list-item">
    <ExerciseThumb :exercise="exercise" />
    <div class="grow">
      <div class="name cap">{{ exercise.n }}</div>
      <div class="small muted ellipsis">{{ muscleLabel(exercise.t) }} · {{ equipmentLabel(exercise.e) }}</div>
    </div>
    <slot><Icon name="next" :size="18" class="faint" /></slot>
  </div>
</template>

<style scoped>
.name { font-weight: 500; line-height: 1.25; }
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlan } from '../stores/plan'
import { useCatalogue } from '../stores/catalogue'
import { muscleLabel } from '../lib/labels'
import Icon from '../components/Icon.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const planStore = usePlan()
const catalogue = useCatalogue()
const routine = computed(() => planStore.routine(props.id))

function move(i: number, dir: -1 | 1) {
  const list = routine.value!.exercises
  const j = i + dir
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
}

function clampInt(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(Number(v) || min)))
}
</script>

<template>
  <main class="page" v-if="routine">
    <header class="page-header">
      <button class="btn icon ghost" aria-label="Volver" @click="router.back()"><Icon name="back" /></button>
      <h1>Editar rutina</h1>
    </header>

    <label class="field">Nombre<input v-model="routine.name" maxlength="40" /></label>

    <div v-for="(e, i) in routine.exercises" :key="e.uid" class="card stack">
      <div class="row">
        <RouterLink :to="`/ejercicio/${e.exerciseId}`" class="grow">
          <div class="cap" style="font-weight: 600">{{ i + 1 }}. {{ catalogue.name(e.exerciseId) }}</div>
          <div class="small muted">{{ muscleLabel(catalogue.get(e.exerciseId)?.t) }}</div>
        </RouterLink>
        <button class="btn icon ghost" aria-label="Subir" :disabled="i === 0" @click="move(i, -1)"><Icon name="up" :size="18" /></button>
        <button class="btn icon ghost" aria-label="Bajar" :disabled="i === routine.exercises.length - 1" @click="move(i, 1)"><Icon name="down" :size="18" /></button>
        <button class="btn icon ghost danger" aria-label="Quitar" @click="routine.exercises.splice(i, 1)"><Icon name="trash" :size="18" /></button>
      </div>
      <div class="grid">
        <label class="field">Series<input type="number" inputmode="numeric" min="1" max="10" :value="e.sets" @change="e.sets = clampInt(($event.target as HTMLInputElement).valueAsNumber, 1, 10)" /></label>
        <label class="field">Mín<input type="number" inputmode="numeric" min="1" max="100" :value="e.repMin" @change="e.repMin = clampInt(($event.target as HTMLInputElement).valueAsNumber, 1, 100); e.repMax = Math.max(e.repMax, e.repMin)" /></label>
        <label class="field">Máx<input type="number" inputmode="numeric" min="1" max="100" :value="e.repMax" @change="e.repMax = clampInt(($event.target as HTMLInputElement).valueAsNumber, e.repMin, 100)" /></label>
        <label class="field">Descanso (s)<input type="number" inputmode="numeric" min="0" max="600" step="15" :value="e.rest" @change="e.rest = clampInt(($event.target as HTMLInputElement).valueAsNumber, 0, 600)" /></label>
      </div>
      <div class="row small">
        <select v-model="e.unit" style="width: auto; min-height: 36px; padding: 4px 8px">
          <option :value="undefined">Repeticiones</option>
          <option value="s">Segundos</option>
          <option value="min">Minutos (cardio)</option>
        </select>
        <label class="row muted"><input type="checkbox" v-model="e.main" style="width: auto; min-height: 0" /> Principal</label>
      </div>
      <input v-model="e.notes" placeholder="Nota (opcional): agarre, tempo, máquina…" class="small" />
    </div>

    <p v-if="!routine.exercises.length" class="empty card">Sin ejercicios. Añade el primero.</p>
    <RouterLink :to="{ path: '/guia', query: { pick: `routine:${routine.id}` } }" class="btn primary block"><Icon name="plus" />Añadir ejercicio</RouterLink>
  </main>
  <main class="page" v-else><p class="empty">Rutina no encontrada.</p></main>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.grid input { text-align: center; padding: 8px 4px; }
.grid .field { font-size: 0.72rem; }
</style>

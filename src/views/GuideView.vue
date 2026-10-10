<script lang="ts">
import { ref } from 'vue'
// Filtros a nivel de módulo: se conservan al volver desde el detalle de un ejercicio.
const q = ref('')
const bodyPart = ref('')
const equipment = ref('')
const category = ref('')
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogue } from '../stores/catalogue'
import { usePlan } from '../stores/plan'
import { useWorkouts } from '../stores/workouts'
import { BODY_PARTS, CATEGORIES, EQUIPMENT } from '../lib/labels'
import type { Exercise } from '../types'
import ExerciseItem from '../components/ExerciseItem.vue'
import Icon from '../components/Icon.vue'

const PAGE = 50
const route = useRoute()
const router = useRouter()
const catalogue = useCatalogue()
const planStore = usePlan()
const workouts = useWorkouts()

/** Modo selector: ?pick=routine:<id> o ?pick=workout */
const pick = computed(() => (typeof route.query.pick === 'string' ? route.query.pick : ''))
const pickRoutine = computed(() => (pick.value.startsWith('routine:') ? planStore.routine(pick.value.slice(8)) : undefined))

const results = computed(() =>
  catalogue.search({ q: q.value, bodyPart: bodyPart.value, equipment: equipment.value, category: category.value }),
)
const limit = ref(PAGE)
watch([q, bodyPart, equipment, category], () => (limit.value = PAGE))
const shown = computed(() => results.value.slice(0, limit.value))
const hasFilters = computed(() => !!(q.value || bodyPart.value || equipment.value || category.value))

const sortByLabel = (m: Record<string, string>) => Object.entries(m).sort((a, b) => a[1].localeCompare(b[1], 'es'))

function clear() {
  q.value = bodyPart.value = equipment.value = category.value = ''
}

function choose(e: Exercise) {
  if (!pick.value) return router.push(`/ejercicio/${e.id}`)
  if (pickRoutine.value) planStore.addExercise(pickRoutine.value.id, e.id)
  else if (pick.value === 'workout') workouts.addToActive(e.id)
  router.back()
}
</script>

<template>
  <main class="page">
    <header class="page-header">
      <button v-if="pick" class="btn icon ghost" aria-label="Volver" @click="router.back()"><Icon name="back" /></button>
      <h1>{{ pick ? 'Añadir ejercicio' : 'Guía de ejercicios' }}</h1>
    </header>
    <p v-if="pickRoutine" class="muted small">Toca un ejercicio para añadirlo a <b>{{ pickRoutine.name }}</b>.</p>

    <div class="search">
      <Icon name="search" :size="18" />
      <input v-model="q" type="search" placeholder="Buscar (ej. press banca, sentadilla…)" autocomplete="off" />
    </div>
    <div class="filters">
      <select v-model="bodyPart" aria-label="Parte del cuerpo">
        <option value="">Zona: todas</option>
        <option v-for="[k, v] in sortByLabel(BODY_PARTS)" :key="k" :value="k">{{ v }}</option>
      </select>
      <select v-model="equipment" aria-label="Equipamiento">
        <option value="">Equipo: todo</option>
        <option v-for="[k, v] in sortByLabel(EQUIPMENT)" :key="k" :value="k">{{ v }}</option>
      </select>
      <select v-model="category" aria-label="Categoría">
        <option value="">Tipo: todos</option>
        <option v-for="[k, v] in sortByLabel(CATEGORIES)" :key="k" :value="k">{{ v }}</option>
      </select>
    </div>
    <div class="row between small muted">
      <span>{{ results.length.toLocaleString('es') }} ejercicios</span>
      <button v-if="hasFilters" class="btn sm ghost" @click="clear">Limpiar filtros</button>
    </div>

    <div class="card list" v-if="shown.length">
      <button v-for="e in shown" :key="e.id" class="plain" @click="choose(e)">
        <ExerciseItem :exercise="e">
          <Icon v-if="pick" name="plus" :size="20" style="color: var(--accent)" />
        </ExerciseItem>
      </button>
    </div>
    <p v-else class="empty">No hay ejercicios con esos filtros.</p>
    <button v-if="results.length > limit" class="btn block" @click="limit += PAGE">Ver más</button>
    <p class="muted small" style="text-align: center">Catálogo: <a href="https://github.com/DuarteSantos8/openGym" target="_blank" rel="noopener">openGym</a> ({{ catalogue.source }})</p>
  </main>
</template>

<style scoped>
.search { position: relative; display: flex; align-items: center; }
.search svg { position: absolute; left: 12px; color: var(--muted); pointer-events: none; }
.search input { padding-left: 38px; }
.filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.filters select { font-size: 0.85rem; padding: 8px; }
</style>

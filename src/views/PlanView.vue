<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlan } from '../stores/plan'
import { DAYS, todayIndex } from '../lib/labels'
import { TEMPLATES } from '../data/templates'
import Icon from '../components/Icon.vue'

const router = useRouter()
const planStore = usePlan()
const showTemplates = ref(false)
const today = todayIndex()

function newRoutine() {
  const r = planStore.addRoutine()
  router.push(`/plan/rutina/${r.id}`)
}

function applyTemplate(id: string, name: string) {
  if (!confirm(`¿Reemplazar tu plan actual por «${name}»? Tu historial de entrenos se conserva.`)) return
  planStore.loadTemplate(id)
  showTemplates.value = false
}

function remove(id: string, name: string) {
  if (confirm(`¿Eliminar la rutina «${name}»?`)) planStore.removeRoutine(id)
}
</script>

<template>
  <main class="page">
    <header class="page-header">
      <h1>Plan semanal</h1>
      <button class="btn sm" @click="showTemplates = !showTemplates">Plantillas</button>
    </header>

    <section v-if="showTemplates" class="stack">
      <p class="muted small">Carga una plantilla y luego ajústala a tu gusto: cambia ejercicios, series, reps y días.</p>
      <div v-for="t in TEMPLATES" :key="t.id" class="card stack">
        <div>
          <h3>{{ t.name }}</h3>
          <p class="small muted">{{ t.description }}</p>
        </div>
        <p class="small muted">{{ t.routines.map((r) => r.name).join(' · ') }}</p>
        <button class="btn sm primary" style="align-self: flex-start" @click="applyTemplate(t.id, t.name)">Usar esta plantilla</button>
      </div>
    </section>

    <RouterLink to="/objetivo" class="card accent row">
      <Icon name="trophy" />
      <div class="grow"><b>Mi objetivo</b><div class="small muted">Genera un plan según tu meta, días y tiempo disponibles.</div></div>
      <Icon name="next" />
    </RouterLink>

    <section class="card stack">
      <h2>Semana</h2>
      <label class="row small"><input type="checkbox" :checked="planStore.rollover" style="width: auto; min-height: 0" @change="planStore.plan.rollover = ($event.target as HTMLInputElement).checked" /> Si falto a una sesión, moverla al siguiente día disponible</label>
      <div class="list">
        <label v-for="(d, i) in DAYS" :key="d" class="list-item day">
          <span class="dayname" :class="{ today: i === today }">{{ d }}</span>
          <select v-model="planStore.plan.schedule[i]">
            <option :value="null">Descanso</option>
            <option v-for="r in planStore.plan.routines" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </label>
      </div>
    </section>

    <section class="stack">
      <div class="row between">
        <h2>Rutinas</h2>
        <button class="btn sm primary" @click="newRoutine"><Icon name="plus" :size="18" />Nueva</button>
      </div>
      <p v-if="!planStore.plan.routines.length" class="empty card">No tienes rutinas. Crea una o carga una plantilla.</p>
      <div v-for="r in planStore.plan.routines" :key="r.id" class="card row">
        <RouterLink :to="`/plan/rutina/${r.id}`" class="grow">
          <h3>{{ r.name }}</h3>
          <p class="small muted">
            {{ r.exercises.length }} ejercicios · {{ r.exercises.reduce((a, e) => a + e.sets, 0) }} series
            <template v-if="planStore.plan.schedule.some((d) => d === r.id)">
              · {{ DAYS.filter((_, i) => planStore.plan.schedule[i] === r.id).join(', ') }}
            </template>
          </p>
        </RouterLink>
        <button class="btn icon ghost" aria-label="Duplicar" @click="planStore.duplicateRoutine(r.id)"><Icon name="copy" :size="18" /></button>
        <button class="btn icon ghost danger" aria-label="Eliminar" @click="remove(r.id, r.name)"><Icon name="trash" :size="18" /></button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.day { gap: 12px; }
.dayname { width: 92px; font-weight: 600; }
.dayname.today { color: var(--accent); }
.day select { flex: 1; }
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlan } from '../stores/plan'
import { useProgram } from '../stores/program'
import { DAYS, todayIndex } from '../lib/labels'
import { TEMPLATES } from '../data/templates'
import { BLOCK_WEEKS, GOALS, estimateMinutes } from '../lib/program'
import Icon from '../components/Icon.vue'

const router = useRouter()
const planStore = usePlan()
const prog = useProgram()
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
function assign(day: number, ev: Event) {
  const v = (ev.target as HTMLSelectElement).value
  if (v === '__new') {
    const r = planStore.addRoutine()
    planStore.plan.schedule[day] = r.id
    router.push(`/plan/rutina/${r.id}`)
  } else planStore.plan.schedule[day] = v || null
  ;(ev.target as HTMLSelectElement).value = ''
}
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div class="grow"><h1>Plan</h1><p class="subtitle">Tu rutina semanal</p></div>
      <button class="btn icon" aria-label="Plantillas" @click="showTemplates = !showTemplates"><Icon name="copy" :size="18" /></button>
    </header>

    <RouterLink to="/objetivo" class="card accent row">
      <span class="app-icon"><Icon name="sparkle" :size="18" /></span>
      <div class="grow">
        <b>Mi objetivo</b>
        <div class="small muted">
          <template v-if="prog.program && prog.phase && prog.week">{{ GOALS[prog.program.goal].name }} · Fase {{ prog.program.phase }} {{ prog.phase.name }} · Sem. {{ prog.week.week }}/{{ BLOCK_WEEKS }}</template>
          <template v-else>Diseña tu plan según tu meta, días y tiempo</template>
        </div>
      </div>
      <Icon name="next" :size="18" class="muted" />
    </RouterLink>

    <section v-if="showTemplates" class="stack">
      <p class="section-label">Plantillas</p>
      <div v-for="t in TEMPLATES" :key="t.id" class="card stack">
        <div><h3>{{ t.name }}</h3><p class="small muted">{{ t.description }}</p></div>
        <button class="btn sm primary" style="align-self: flex-start" @click="applyTemplate(t.id, t.name)">Usar esta plantilla</button>
      </div>
    </section>

    <p class="section-label">Horario semanal</p>
    <section v-for="(d, i) in DAYS" :key="d" class="card day">
      <div class="row between">
        <b :class="{ 'accent-text': i === today }">{{ d }}</b>
        <span v-if="planStore.plan.schedule[i]" class="xs faint">1 rutina</span>
        <span v-else class="chip">{{ planStore.available[i] ? 'Descanso' : 'Libre' }}</span>
      </div>
      <div v-if="planStore.routine(planStore.plan.schedule[i])" class="row routine">
        <RouterLink :to="`/plan/rutina/${planStore.plan.schedule[i]}`" class="row grow">
          <span class="app-icon"><Icon name="dumbbell" :size="18" /></span>
          <div class="grow">
            <div style="font-weight: 500">{{ planStore.routine(planStore.plan.schedule[i])!.name }}</div>
            <div class="small muted">{{ planStore.routine(planStore.plan.schedule[i])!.exercises.length }} ejercicios · ~{{ estimateMinutes(planStore.routine(planStore.plan.schedule[i])!.exercises) }} min</div>
          </div>
        </RouterLink>
        <button class="btn icon ghost" aria-label="Quitar del día" @click="planStore.plan.schedule[i] = null"><Icon name="x" :size="16" /></button>
      </div>
      <label v-else class="add accent-text small">
        <Icon name="plus" :size="14" /> Añadir rutina
        <select aria-label="Añadir rutina" @change="assign(i, $event)">
          <option value="" />
          <option v-for="r in planStore.plan.routines" :key="r.id" :value="r.id">{{ r.name }}</option>
          <option value="__new">+ Nueva rutina…</option>
        </select>
      </label>
    </section>

    <label class="card row small" style="cursor: pointer">
      <span class="grow">Si falto a una sesión, moverla al siguiente día disponible</span>
      <input type="checkbox" class="switch" :checked="planStore.rollover" @change="planStore.plan.rollover = ($event.target as HTMLInputElement).checked" />
    </label>

    <div class="row between" style="margin-top: 6px">
      <p class="section-label" style="margin: 0 4px">Rutinas</p>
      <button class="btn sm pill" @click="newRoutine"><Icon name="plus" :size="14" />Nueva</button>
    </div>
    <section class="card list" style="padding: 4px 14px">
      <div v-for="r in planStore.plan.routines" :key="r.id" class="list-item">
        <RouterLink :to="`/plan/rutina/${r.id}`" class="grow">
          <div style="font-weight: 500">{{ r.name }}</div>
          <div class="small muted">{{ r.exercises.length }} ejercicios · {{ r.exercises.reduce((a, e) => a + e.sets, 0) }} series</div>
        </RouterLink>
        <button class="btn icon ghost" aria-label="Duplicar" @click="planStore.duplicateRoutine(r.id)"><Icon name="copy" :size="16" /></button>
        <button class="btn icon ghost danger" aria-label="Eliminar" @click="remove(r.id, r.name)"><Icon name="trash" :size="16" /></button>
      </div>
      <p v-if="!planStore.plan.routines.length" class="empty">No tienes rutinas. Crea una o usa Mi objetivo.</p>
    </section>
  </main>
</template>

<style scoped>
.day { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; }
.routine { gap: 4px; }
.add { position: relative; display: flex; align-items: center; gap: 6px; font-weight: 500; padding-left: 4px; }
.add select { position: absolute; inset: 0; opacity: 0; min-height: 0; cursor: pointer; }
</style>

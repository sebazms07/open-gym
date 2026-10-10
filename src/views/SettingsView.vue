<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '../stores/settings'
import { usePlan } from '../stores/plan'
import { useWorkouts } from '../stores/workouts'
import { useCatalogue } from '../stores/catalogue'
import { useProgram } from '../stores/program'
import { createBackup, parseBackup } from '../lib/exportImport'

const prefs = useSettings()
const planStore = usePlan()
const workouts = useWorkouts()
const catalogue = useCatalogue()
const prog = useProgram()
const message = ref('')

function exportData() {
  const backup = createBackup(planStore.plan, workouts.workouts, prefs.settings, { profile: prog.profile, program: prog.program, weighIns: prog.weighIns })
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `open-gym-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  message.value = 'Respaldo descargado.'
}

async function importData(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const b = parseBackup(await file.text())
    if (!confirm(`Se reemplazarán tus datos por el respaldo del ${new Date(b.exportedAt).toLocaleDateString('es')} (${b.workouts.length} entrenos). ¿Continuar?`)) return
    planStore.plan = b.plan
    workouts.workouts = b.workouts
    prefs.settings = { ...prefs.settings, ...b.settings }
    if (b.profile) prog.profile = b.profile
    if (b.program !== undefined) prog.program = b.program
    if (b.weighIns) prog.weighIns = b.weighIns
    message.value = 'Datos importados correctamente.'
  } catch (e) {
    message.value = (e as Error).message
  }
}

function wipe() {
  if (!confirm('¿Borrar TODO tu historial de entrenos? Esta acción no se puede deshacer.')) return
  workouts.workouts = []
  workouts.discard()
  message.value = 'Historial borrado.'
}
</script>

<template>
  <main class="page">
    <h1>Ajustes</h1>

    <section class="card stack">
      <h2>Entrenamiento</h2>
      <label class="field">Unidad de peso
        <div class="segmented">
          <button :class="{ on: prefs.settings.unit === 'kg' }" @click="prefs.settings.unit = 'kg'">kg</button>
          <button :class="{ on: prefs.settings.unit === 'lb' }" @click="prefs.settings.unit = 'lb'">lb</button>
        </div>
      </label>
      <div class="grid2">
        <label class="field">Incremento tren superior<input type="number" inputmode="decimal" step="0.5" min="0" v-model.number="prefs.settings.incUpper" /></label>
        <label class="field">Incremento tren inferior<input type="number" inputmode="decimal" step="0.5" min="0" v-model.number="prefs.settings.incLower" /></label>
      </div>
      <label class="field">Descanso por defecto (s)<input type="number" inputmode="numeric" step="15" min="0" v-model.number="prefs.settings.defaultRest" /></label>
      <label class="row"><input type="checkbox" v-model="prefs.settings.sound" style="width: auto; min-height: 0" /> Sonido al terminar el descanso</label>
      <p class="small muted">Progresión doble: cuando completas todas las series en el tope del rango de reps, la app te sugiere subir el peso con estos incrementos.</p>
    </section>

    <section class="card stack">
      <h2>Tus datos</h2>
      <p class="small muted">Todo se guarda solo en este dispositivo ({{ workouts.workouts.length }} entrenos, {{ planStore.plan.routines.length }} rutinas). Exporta un respaldo de vez en cuando.</p>
      <button class="btn" @click="exportData">Exportar respaldo (JSON)</button>
      <label class="btn">Importar respaldo<input type="file" accept="application/json,.json" hidden @change="importData" /></label>
      <button class="btn danger" @click="wipe">Borrar historial</button>
      <p v-if="message" class="small" role="status">{{ message }}</p>
    </section>

    <section class="card stack small muted">
      <h2 style="color: var(--text)">Acerca de</h2>
      <p>Catálogo de {{ catalogue.list.length.toLocaleString('es') }} ejercicios de <a href="https://github.com/DuarteSantos8/openGym" target="_blank" rel="noopener"><u>openGym</u></a> ({{ catalogue.source }}), AGPL-3.0; textos originales de ExerciseDB (MIT).</p>
      <p>Consejo: en el móvil usa «Añadir a pantalla de inicio» para instalarla como app y usarla sin conexión.</p>
    </section>
  </main>
</template>

<style scoped>
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>

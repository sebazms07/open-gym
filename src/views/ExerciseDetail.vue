<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogue } from '../stores/catalogue'
import { useWorkouts } from '../stores/workouts'
import { useSettings } from '../stores/settings'
import { bodyPartLabel, categoryLabel, equipmentLabel, muscleLabel } from '../lib/labels'
import { bestSet, volume } from '../lib/progression'
import { formatDate, formatNumber } from '../lib/util'
import Icon from '../components/Icon.vue'
import ProgressChart from '../components/ProgressChart.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const catalogue = useCatalogue()
const workouts = useWorkouts()
const prefs = useSettings()

const ex = computed(() => catalogue.get(props.id))
const logs = computed(() => workouts.logsFor(props.id).filter((x) => x.log.sets.length))
const points = computed(() =>
  logs.value.map(({ date, log }) => ({ date, best: bestSet(log), volume: volume(log) })).filter((p) => p.best),
)
const pr = computed(() => points.value.reduce<(typeof points.value)[number] | null>((a, p) => (!a || p.best!.e1rm > a.best!.e1rm ? p : a), null))
const recent = computed(() => [...logs.value].reverse().slice(0, 5))
const videos = computed(() => `https://www.youtube.com/results?search_query=${encodeURIComponent((ex.value?.en ?? '') + ' exercise form')}`)
</script>

<template>
  <main class="page" v-if="ex">
    <header class="page-header">
      <button class="btn icon ghost" aria-label="Volver" @click="router.back()"><Icon name="back" /></button>
      <h1 class="cap">{{ ex.n }}</h1>
    </header>
    <div class="chips">
      <span class="chip accent">{{ muscleLabel(ex.t) }}</span>
      <span class="chip">{{ bodyPartLabel(ex.b) }}</span>
      <span class="chip">{{ equipmentLabel(ex.e) }}</span>
      <span class="chip">{{ categoryLabel(ex.c) }}</span>
    </div>
    <p v-if="ex.d" class="muted">{{ ex.d }}</p>

    <section class="card stack">
      <h2>Cómo hacerlo</h2>
      <p v-if="ex.l === 'en'" class="small muted">Instrucciones disponibles solo en inglés.</p>
      <ol class="steps">
        <li v-for="(s, i) in ex.i" :key="i">{{ s }}</li>
      </ol>
      <div v-if="ex.s.length" class="stack" style="gap: 6px">
        <span class="small muted">Músculos secundarios</span>
        <div class="chips"><span v-for="m in ex.s" :key="m" class="chip">{{ muscleLabel(m) }}</span></div>
      </div>
      <a :href="videos" target="_blank" rel="noopener" class="btn sm" style="align-self: flex-start">Ver vídeos de técnica ↗</a>
      <p class="small muted">Nombre original: {{ ex.en }}</p>
    </section>

    <section class="card stack">
      <h2>Tu historial</h2>
      <template v-if="points.length">
        <div class="stats">
          <div class="stat"><b>{{ pr!.best!.weight }}×{{ pr!.best!.reps }}</b><span>mejor serie</span></div>
          <div class="stat"><b>{{ formatNumber(pr!.best!.e1rm) }}</b><span>1RM est. ({{ prefs.settings.unit }})</span></div>
          <div class="stat"><b>{{ points.length }}</b><span>sesiones</span></div>
        </div>
        <ProgressChart v-if="points.length > 1" :points="points" />
        <div class="list">
          <div v-for="r in recent" :key="r.date" class="list-item">
            <span class="small muted" style="width: 84px">{{ formatDate(r.date) }}</span>
            <span class="small num grow">{{ r.log.sets.map((s) => `${s.weight ?? 0}×${s.reps}`).join('  ·  ') }}</span>
          </div>
        </div>
      </template>
      <p v-else class="muted small">Aún no has registrado este ejercicio.</p>
    </section>
  </main>
  <main class="page" v-else>
    <p class="empty">Ejercicio no encontrado.</p>
  </main>
</template>

<style scoped>
.steps { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 8px; }
.steps li::marker { color: var(--accent); font-weight: 700; }
</style>

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
import MuscleFigure from '../components/MuscleFigure.vue'
import ExerciseAnimation from '../components/ExerciseAnimation.vue'
import { mediaFor, mediaCredit } from '../lib/media'
import { muscleWeights, MUSCLE_NAME_ES, type Muscle } from '../lib/muscles'
import { useProgram } from '../stores/program'

const props = defineProps<{ id: string }>()
const router = useRouter()
const catalogue = useCatalogue()
const workouts = useWorkouts()
const prefs = useSettings()
const prog = useProgram()
const media = computed(() => mediaFor(props.id))
const weights = computed(() => (ex.value ? (muscleWeights(ex.value) as Record<string, number>) : {}))
const worked = computed(() =>
  (Object.entries(weights.value) as [Muscle, number][]).sort((a, b) => b[1] - a[1]).map(([m, w]) => ({ name: MUSCLE_NAME_ES[m], main: w >= 0.75 })),
)

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
      <button class="btn icon" aria-label="Volver" @click="router.back()"><Icon name="back" /></button>
    </header>
    <template v-if="media">
      <ExerciseAnimation :exercise-id="id" :height="280" />
      <a :href="mediaCredit(media).url" target="_blank" rel="noopener" class="xs faint" style="margin-top: -8px; text-align: right">{{ mediaCredit(media).text }}</a>
    </template>
    <div class="card" :style="{ padding: media ? '12px 0' : '18px 0' }">
      <MuscleFigure :weights="weights" :sex="prog.figureSex" :height="media ? 180 : 280" />
    </div>
    <h1 class="cap" style="font-size: 1.6rem">{{ ex.n }}</h1>
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
      <div v-if="worked.length" class="stack" style="gap: 6px">
        <span class="small muted">Músculos trabajados</span>
        <div class="chips"><span v-for="m in worked" :key="m.name" class="chip" :class="{ accent: m.main }">{{ m.name }}</span></div>
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

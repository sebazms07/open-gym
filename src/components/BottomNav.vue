<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon, { type IconName } from './Icon.vue'
import { useWorkouts } from '../stores/workouts'
import { usePlan } from '../stores/plan'

const router = useRouter()
const workouts = useWorkouts()
const planStore = usePlan()

const left: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/plan', label: 'Plan', icon: 'calendar' },
]
const right: { to: string; label: string; icon: IconName }[] = [
  { to: '/progreso', label: 'Estadísticas', icon: 'chart' },
  { to: '/guia', label: 'Ejercicios', icon: 'list' },
]
const active = computed(() => !!workouts.active)

function startOrResume() {
  if (!workouts.active && planStore.todayRoutine) workouts.start(planStore.todayRoutine)
  router.push('/entreno')
}
</script>

<template>
  <nav class="nav">
    <RouterLink v-for="i in left" :key="i.to" :to="i.to" class="nav-item" :class="{ exact: i.to === '/' }">
      <Icon :name="i.icon" /><span>{{ i.label }}</span>
    </RouterLink>
    <button class="nav-item start" :class="{ live: active }" @click="startOrResume">
      <span class="fab"><Icon name="dumbbell" :size="26" /></span>
      <span>{{ active ? 'Entreno' : 'Entrenar' }}</span>
    </button>
    <RouterLink v-for="i in right" :key="i.to" :to="i.to" class="nav-item">
      <Icon :name="i.icon" /><span>{{ i.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  display: flex; align-items: flex-end;
  height: calc(var(--nav-h) + var(--safe-b));
  padding-bottom: calc(var(--safe-b) + 6px);
  background: color-mix(in srgb, var(--bg-el) 88%, transparent);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: inset 0 0.5px 0 var(--border);
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px;
  color: var(--faint); font-size: 0.66rem; font-weight: 500;
  background: none; border: 0; font-family: inherit; cursor: pointer; padding: 0;
}
.nav-item.router-link-active:not(.exact), .nav-item.exact.router-link-exact-active { color: var(--accent); }
.start { color: var(--accent); font-weight: 600; }
.fab {
  width: 58px; height: 58px; margin-top: -26px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--accent); color: var(--accent-ink);
  box-shadow: 0 0 0 5px var(--bg-el), 0 6px 18px color-mix(in srgb, var(--accent) 45%, transparent);
  transition: transform 140ms var(--ease);
}
.start:active .fab { transform: scale(0.94); }
.start.live { color: var(--warn); }
.start.live .fab { background: var(--warn); box-shadow: 0 0 0 5px var(--bg-el), 0 6px 18px color-mix(in srgb, var(--warn) 45%, transparent); }
</style>

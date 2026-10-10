<script setup lang="ts">
import Icon, { type IconName } from './Icon.vue'
const items: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Hoy', icon: 'home' },
  { to: '/plan', label: 'Plan', icon: 'calendar' },
  { to: '/guia', label: 'Guía', icon: 'book' },
  { to: '/progreso', label: 'Progreso', icon: 'chart' },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings' },
]
</script>

<template>
  <nav class="nav">
    <RouterLink v-for="i in items" :key="i.to" :to="i.to" class="nav-item" :class="{ exact: i.to === '/' }">
      <Icon :name="i.icon" />
      <span>{{ i.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  display: flex;
  height: calc(var(--nav-h) + var(--safe-b));
  padding-bottom: var(--safe-b);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  color: var(--muted); font-size: 0.7rem; font-weight: 600;
}
.nav-item.router-link-active:not(.exact), .nav-item.exact.router-link-exact-active { color: var(--accent); }
</style>

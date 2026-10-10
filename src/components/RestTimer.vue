<script setup lang="ts">
import { computed } from 'vue'
import { useTimer } from '../stores/timer'
import { formatDuration } from '../lib/util'
import Icon from './Icon.vue'

const timer = useTimer()
const pct = computed(() => (timer.total ? (timer.remaining / timer.total) * 100 : 0))
</script>

<template>
  <Transition name="slide">
    <div v-if="timer.running" class="rest">
      <div class="bar" :style="{ width: pct + '%' }" />
      <Icon name="timer" />
      <div class="grow">
        <div class="small muted">Descanso</div>
        <b class="num time">{{ formatDuration(timer.remaining * 1000) }}</b>
      </div>
      <button class="btn sm" @click="timer.add(-15)">−15</button>
      <button class="btn sm" @click="timer.add(15)">+15</button>
      <button class="btn sm primary" @click="timer.stop()">Saltar</button>
    </div>
  </Transition>
</template>

<style scoped>
.rest {
  position: fixed; z-index: 19; left: 12px; right: 12px;
  bottom: calc(var(--nav-h) + var(--safe-b) + 10px);
  max-width: 616px; margin: 0 auto;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; overflow: hidden;
  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: 0 8px 24px #0006;
}
.bar { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--accent); transition: width 0.25s linear; }
.time { font-size: 1.3rem; }
.slide-enter-active, .slide-leave-active { transition: transform 0.2s, opacity 0.2s; }
.slide-enter-from, .slide-leave-to { transform: translateY(20px); opacity: 0; }
</style>

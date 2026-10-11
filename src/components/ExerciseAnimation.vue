<script setup lang="ts">
import { computed, ref } from 'vue'
import { frameUrl, mediaFor } from '../lib/media'
import Icon from './Icon.vue'

const props = withDefaults(defineProps<{ exerciseId: string; height?: number; controls?: boolean }>(), { height: 240, controls: true })
const media = computed(() => mediaFor(props.exerciseId))
const paused = ref(false)
</script>

<template>
  <div v-if="media" class="anim" :class="[media.src, { paused }]" :style="{ height: height + 'px' }">
    <img :src="frameUrl(exerciseId, 0)" alt="Posición inicial" draggable="false" />
    <img :src="frameUrl(exerciseId, 1)" alt="Posición final" class="end" draggable="false" />
    <slot />
    <button v-if="controls" class="toggle" :aria-label="paused ? 'Reproducir' : 'Pausar'" @click.prevent.stop="paused = !paused">
      <Icon :name="paused ? 'play' : 'pause'" :size="14" />{{ paused ? 'reproducir' : 'pausar' }}
    </button>
  </div>
</template>

<style scoped>
.anim { position: relative; border-radius: var(--radius); overflow: hidden; background: #fff; }
.anim img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; user-select: none; }
.anim.fedb { background: #0b0b0c; }
.anim .end { animation: swap 2.4s ease-in-out infinite; }
.anim.paused .end { animation-play-state: paused; }
@keyframes swap {
  0%, 38% { opacity: 0; }
  50%, 88% { opacity: 1; }
  100% { opacity: 0; }
}
/* ilustraciones de línea: blancas sobre negro en modo oscuro */
@media (prefers-color-scheme: dark) {
  .anim.ek { background: #000; }
  .anim.ek img { filter: invert(1); }
}
.toggle {
  position: absolute; right: 10px; bottom: 10px; z-index: 2;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 999px; border: 0;
  background: color-mix(in srgb, #000 55%, transparent); color: #fff;
  font: inherit; font-size: 0.72rem; cursor: pointer;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
@media (prefers-reduced-motion: reduce) {
  .anim .end { animation: none; }
}
</style>

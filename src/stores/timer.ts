import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useSettings } from './settings'

/** Temporizador de descanso global (sobrevive a los cambios de pantalla). */
export const useTimer = defineStore('timer', () => {
  const endAt = ref<number | null>(null)
  const total = ref(0)
  const now = ref(Date.now())
  let handle: number | undefined

  const remaining = computed(() => (endAt.value ? Math.max(0, Math.ceil((endAt.value - now.value) / 1000)) : 0))
  const running = computed(() => endAt.value !== null)

  function tick() {
    now.value = Date.now()
    if (endAt.value && now.value >= endAt.value) {
      stop()
      alarm()
    }
  }

  function start(seconds: number) {
    total.value = seconds
    endAt.value = Date.now() + seconds * 1000
    now.value = Date.now()
    clearInterval(handle)
    handle = window.setInterval(tick, 250)
  }

  function add(seconds: number) {
    if (!endAt.value) return
    endAt.value += seconds * 1000
    total.value += seconds
  }

  function stop() {
    endAt.value = null
    clearInterval(handle)
  }

  function alarm() {
    navigator.vibrate?.([250, 120, 250])
    if (!useSettings().settings.sound) return
    try {
      const ctx = new AudioContext()
      ;[0, 0.25].forEach((t) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = 880
        g.gain.setValueAtTime(0.25, ctx.currentTime + t)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
        o.connect(g).connect(ctx.destination)
        o.start(ctx.currentTime + t)
        o.stop(ctx.currentTime + t + 0.2)
      })
    } catch {
      /* sin audio */
    }
  }

  return { remaining, total, running, start, add, stop }
})

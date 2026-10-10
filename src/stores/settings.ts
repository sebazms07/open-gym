import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '../types'
import { persist } from '../lib/db'

export const defaultSettings = (): Settings => ({ unit: 'kg', incUpper: 2.5, incLower: 5, defaultRest: 90, sound: true })

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>(defaultSettings())
  const ready = persist('settings', settings).then(() => {
    settings.value = { ...defaultSettings(), ...settings.value }
  })
  return { settings, ready }
})

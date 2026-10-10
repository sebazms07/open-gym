import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Plan, PlanExercise, Routine } from '../types'
import { persist } from '../lib/db'
import { uid } from '../lib/util'
import { todayIndex } from '../lib/labels'
import { TEMPLATES, planFromTemplate } from '../data/templates'

export const usePlan = defineStore('plan', () => {
  const plan = ref<Plan>(planFromTemplate(TEMPLATES[1]))
  const ready = persist('plan', plan)

  const routine = (id: string | null | undefined) => plan.value.routines.find((r) => r.id === id)
  const todayRoutine = computed(() => routine(plan.value.schedule[todayIndex()]))

  function addRoutine(name = 'Nueva rutina'): Routine {
    const r: Routine = { id: uid(), name, exercises: [] }
    plan.value.routines.push(r)
    return r
  }

  function removeRoutine(id: string) {
    plan.value.routines = plan.value.routines.filter((r) => r.id !== id)
    plan.value.schedule = plan.value.schedule.map((d) => (d === id ? null : d))
  }

  function duplicateRoutine(id: string) {
    const r = routine(id)
    if (!r) return
    const copy: Routine = { id: uid(), name: `${r.name} (copia)`, exercises: r.exercises.map((e) => ({ ...e, uid: uid() })) }
    plan.value.routines.push(copy)
    return copy
  }

  function addExercise(routineId: string, exerciseId: string, defaults: Partial<PlanExercise> = {}) {
    routine(routineId)?.exercises.push({ uid: uid(), exerciseId, sets: 3, repMin: 8, repMax: 12, rest: 90, ...defaults })
  }

  function loadTemplate(templateId: string) {
    const t = TEMPLATES.find((x) => x.id === templateId)
    if (t) plan.value = planFromTemplate(t)
  }

  return { plan, ready, routine, todayRoutine, addRoutine, removeRoutine, duplicateRoutine, addExercise, loadTemplate }
})

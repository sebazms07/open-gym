import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Plan, PlanExercise, Routine } from '../types'
import { persist } from '../lib/db'
import { uid } from '../lib/util'
import { todayIndex } from '../lib/labels'
import { TEMPLATES, planFromTemplate } from '../data/templates'
import { generatePlan } from '../lib/program'
import { DEFAULT_AVAILABLE, projectWeek, unplacedCount } from '../lib/schedule'
import { startOfWeek } from '../lib/util'
import { defaultProgram } from './program'
import { useWorkouts } from './workouts'

export const usePlan = defineStore('plan', () => {
  const plan = ref<Plan>(generatePlan(defaultProgram()))
  const ready = persist('plan', plan)
  const workouts = useWorkouts()

  const routine = (id: string | null | undefined) => plan.value.routines.find((r) => r.id === id)

  const available = computed(() => plan.value.available ?? DEFAULT_AVAILABLE)
  const rollover = computed(() => plan.value.rollover ?? true)

  /** Sesiones registradas esta semana (día 0 = lunes). */
  const doneThisWeek = computed(() => {
    const monday = startOfWeek().getTime()
    return workouts.workouts
      .filter((w) => new Date(w.date).getTime() >= monday)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({ day: todayIndex(new Date(w.date)), routineId: w.routineId }))
  })

  /** La semana con las sesiones perdidas movidas al siguiente día disponible. */
  /** Día desde el que cuenta esta semana (si el plan se creó a mitad de semana). */
  const startDay = computed(() => {
    const since = plan.value.since ? new Date(`${plan.value.since}T00:00:00`) : null
    return since && since >= startOfWeek() ? todayIndex(since) : 0
  })
  const week = computed(() =>
    projectWeek(plan.value.schedule, available.value, rollover.value, doneThisWeek.value, todayIndex(), startDay.value),
  )
  const today = computed(() => week.value[todayIndex()])
  const todayRoutine = computed(() => (today.value.status === 'planned' ? routine(today.value.routineId) : undefined))
  /** Próxima sesión pendiente después de hoy. */
  const nextSlot = computed(() => {
    const i = week.value.findIndex((s, d) => d > todayIndex() && s.status === 'planned')
    return i >= 0 ? { day: i, routine: routine(week.value[i].routineId) } : null
  })
  const unplaced = computed(() => unplacedCount(plan.value.schedule, week.value, doneThisWeek.value, startDay.value))

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
    if (t) plan.value = { ...planFromTemplate(t), rollover: rollover.value, available: [...available.value] }
  }

  return { plan, ready, routine, available, rollover, doneThisWeek, week, today, todayRoutine, nextSlot, unplaced, addRoutine, removeRoutine, duplicateRoutine, addExercise, loadTemplate }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ExerciseLog, Routine, SetLog, Target, Workout } from '../types'
import { persist } from '../lib/db'
import { uid } from '../lib/util'
import { LOWER_BODY } from '../lib/labels'
import { lastLogFor, suggest } from '../lib/progression'
import { applyWeek, deloadWeight } from '../lib/program'
import { useCatalogue } from './catalogue'
import { useSettings } from './settings'
import { useProgram } from './program'

export const useWorkouts = defineStore('workouts', () => {
  const workouts = ref<Workout[]>([])
  /** entreno en curso (se guarda aparte para no perderlo si se recarga la app) */
  const active = ref<Workout | null>(null)
  const ready = Promise.all([persist('workouts', workouts), persist('active', active)])

  const history = computed(() => [...workouts.value].sort((a, b) => b.date.localeCompare(a.date)))

  const catalogue = useCatalogue()
  const prefs = useSettings()

  const incrementFor = (exerciseId: string) =>
    LOWER_BODY.has(catalogue.get(exerciseId)?.b ?? '') ? prefs.settings.incLower : prefs.settings.incUpper

  const suggestionFor = (exerciseId: string, target: Target) =>
    suggest(target, lastLogFor(workouts.value, exerciseId), incrementFor(exerciseId))

  /**
   * Crea el registro de un ejercicio. `target` es el objetivo base del plan (lo usa la
   * progresión); el número de series y el peso inicial se ajustan a la semana del bloque.
   */
  function buildLog(exerciseId: string, target: Target, main = false): ExerciseLog {
    const base: Target = { sets: target.sets, repMin: target.repMin, repMax: target.repMax, rest: target.rest, ...(target.unit ? { unit: target.unit } : {}) }
    const week = useProgram().week
    const adjusted = week ? applyWeek(base, main, week) : base
    const s = suggestionFor(exerciseId, base)
    const weight = week?.deload && s.weight && base.unit !== 'min' ? deloadWeight(s.weight) : s.weight
    const sets: SetLog[] = Array.from({ length: adjusted.sets }, () => ({ weight, reps: null, done: false }))
    return { uid: uid(), exerciseId, target: base, sets }
  }

  function start(routine?: Routine) {
    active.value = {
      id: uid(),
      date: new Date().toISOString(),
      routineId: routine?.id ?? null,
      routineName: routine?.name ?? 'Entreno libre',
      exercises: (routine?.exercises ?? []).map((e) => buildLog(e.exerciseId, e, e.main)),
      ...(useProgram().week?.deload ? { deload: true } : {}),
    }
  }

  function addToActive(exerciseId: string) {
    if (!active.value) return
    const target: Target = { sets: 3, repMin: 8, repMax: 12, rest: prefs.settings.defaultRest }
    active.value.exercises.push(buildLog(exerciseId, target))
  }

  /** Guarda el entreno en curso (solo ejercicios con alguna serie hecha). Devuelve el id guardado. */
  function finish(): string | null {
    const w = active.value
    if (!w) return null
    const exercises = w.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length > 0)
    active.value = null
    if (!exercises.length) return null
    workouts.value.push({ ...w, exercises, finishedAt: new Date().toISOString() })
    return w.id
  }

  const discard = () => (active.value = null)
  const remove = (id: string) => (workouts.value = workouts.value.filter((w) => w.id !== id))

  /** Registros de un ejercicio, del más antiguo al más reciente. */
  const logsFor = (exerciseId: string) =>
    [...workouts.value]
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap((w) => w.exercises.filter((e) => e.exerciseId === exerciseId).map((log) => ({ date: w.date, log })))

  return { workouts, active, ready, history, suggestionFor, start, addToActive, finish, discard, remove, logsFor }
})

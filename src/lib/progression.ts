import type { ExerciseLog, SetLog, Target, Workout } from '../types'

/** 1RM estimado (fórmula de Epley). */
export const estimate1RM = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30))

const completed = (sets: SetLog[]) =>
  sets.filter((s): s is SetLog & { reps: number } => s.done && s.reps != null && s.reps > 0)

/** Volumen (peso × reps) de las series completadas. */
export const volume = (log: ExerciseLog) => completed(log.sets).reduce((acc, s) => acc + (s.weight ?? 0) * s.reps, 0)

/** Mejor serie de un registro según 1RM estimado. */
export const bestSet = (log: ExerciseLog) => {
  let best: { weight: number; reps: number; e1rm: number } | null = null
  for (const s of completed(log.sets)) {
    const w = s.weight ?? 0
    const e1rm = estimate1RM(w, s.reps)
    if (!best || e1rm > best.e1rm) best = { weight: w, reps: s.reps, e1rm }
  }
  return best
}

/** Último registro (con series completadas) de un ejercicio, buscando de más reciente a más antiguo. */
export const lastLogFor = (workouts: Workout[], exerciseId: string): ExerciseLog | null => {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date))
  for (const w of sorted) {
    const log = w.exercises.find((e) => e.exerciseId === exerciseId && completed(e.sets).length > 0)
    if (log) return log
  }
  return null
}

export interface Suggestion {
  weight: number | null
  reps: number
  /** 'up' = subir peso, 'reps' = mismo peso buscando más reps, 'new' = sin historial */
  kind: 'up' | 'reps' | 'new'
  message: string
}

/**
 * Doble progresión: trabaja dentro del rango de reps; cuando todas las series
 * objetivo llegan al tope del rango con el mismo peso, sube el peso y vuelve al mínimo.
 */
export const suggest = (target: Target, last: ExerciseLog | null, increment: number): Suggestion => {
  const done = last ? completed(last.sets) : []
  if (!done.length) {
    return { weight: null, reps: target.repMin, kind: 'new', message: `Elige un peso con el que hagas ${target.repMin}–${target.repMax} reps con buena técnica.` }
  }
  // peso de trabajo = el más alto usado en las series completadas
  const weight = Math.max(...done.map((s) => s.weight ?? 0))
  const working = done.filter((s) => (s.weight ?? 0) === weight)
  const hitTop = working.length >= target.sets && working.slice(0, target.sets).every((s) => s.reps >= target.repMax)
  if (hitTop && weight > 0) {
    const next = Math.round((weight + increment) * 100) / 100
    return { weight: next, reps: target.repMin, kind: 'up', message: `¡Subes! ${next} × ${target.repMin} (la última vez completaste ${target.sets}×${target.repMax}).` }
  }
  if (hitTop) {
    return { weight, reps: target.repMax, kind: 'up', message: `Rango completado: añade lastre o elige una variante más difícil.` }
  }
  const minReps = Math.min(...working.map((s) => s.reps))
  const reps = Math.min(target.repMax, Math.max(target.repMin, minReps + 1))
  return { weight, reps, kind: 'reps', message: `Mantén ${weight || 'el peso'} y busca ${reps} reps en cada serie.` }
}

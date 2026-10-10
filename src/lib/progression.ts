import type { ExerciseLog, SetLog, Target, Unit, Workout } from '../types'

/** 1RM estimado (fórmula de Epley). */
export const estimate1RM = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30))

const completed = (sets: SetLog[]) =>
  sets.filter((s): s is SetLog & { reps: number } => s.done && s.reps != null && s.reps > 0)

/** El registro es por repeticiones (no por tiempo ni cardio). */
export const isRepsLog = (log: ExerciseLog) => (log.target?.unit ?? 'reps') === 'reps'

/** Volumen (peso × reps) de las series completadas. */
export const volume = (log: ExerciseLog) =>
  isRepsLog(log) ? completed(log.sets).reduce((acc, s) => acc + (s.weight ?? 0) * s.reps, 0) : 0

/** Mejor serie de un registro según 1RM estimado. */
export const bestSet = (log: ExerciseLog) => {
  let best: { weight: number; reps: number; e1rm: number } | null = null
  if (!isRepsLog(log)) return best
  for (const s of completed(log.sets)) {
    const w = s.weight ?? 0
    const e1rm = estimate1RM(w, s.reps)
    if (!best || e1rm > best.e1rm) best = { weight: w, reps: s.reps, e1rm }
  }
  return best
}

/** Último registro (con series completadas) de un ejercicio, sin contar semanas de descarga. */
export const lastLogFor = (workouts: Workout[], exerciseId: string): ExerciseLog | null => {
  const sorted = workouts.filter((w) => !w.deload).sort((a, b) => b.date.localeCompare(a.date))
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

export const UNIT_LABEL: Record<Unit, string> = { reps: 'reps', s: 's', min: 'min' }
const STEP: Record<Unit, number> = { reps: 1, s: 5, min: 5 }

/**
 * Doble progresión: trabaja dentro del rango; cuando todas las series objetivo
 * llegan al tope con el mismo peso, sube el peso y vuelve al mínimo.
 * En cardio ("min") el "peso" es el nivel de resistencia de la máquina.
 */
export const suggest = (target: Target, last: ExerciseLog | null, increment: number): Suggestion => {
  const unit = target.unit ?? 'reps'
  const u = UNIT_LABEL[unit]
  const range = `${target.repMin}–${target.repMax} ${u}`
  const done = last ? completed(last.sets) : []
  if (!done.length) {
    const message =
      unit === 'min' ? `Haz ${range} a ritmo cómodo y anota el nivel de resistencia.`
      : unit === 's' ? `Aguanta ${range} con buena postura.`
      : `Elige un peso con el que hagas ${range} con buena técnica.`
    return { weight: null, reps: target.repMin, kind: 'new', message }
  }
  // peso de trabajo = el más alto usado en las series completadas
  const weight = Math.max(...done.map((s) => s.weight ?? 0))
  const working = done.filter((s) => (s.weight ?? 0) === weight)
  const hitTop = working.length >= target.sets && working.slice(0, target.sets).every((s) => s.reps >= target.repMax)
  if (hitTop && unit === 'min') {
    const next = weight + 1
    return { weight: next, reps: target.repMin, kind: 'up', message: `¡Subes! Nivel ${next} durante ${target.repMin} min.` }
  }
  if (hitTop && weight > 0) {
    const next = Math.round((weight + increment) * 100) / 100
    return { weight: next, reps: target.repMin, kind: 'up', message: `¡Subes! ${next} × ${target.repMin} ${u} (la última vez completaste ${target.sets}×${target.repMax}).` }
  }
  if (hitTop) {
    return { weight, reps: target.repMax, kind: 'up', message: `Rango completado: añade lastre o elige una variante más difícil.` }
  }
  const minReps = Math.min(...working.map((s) => s.reps))
  const reps = Math.min(target.repMax, Math.max(target.repMin, minReps + STEP[unit]))
  const message =
    unit === 'min' ? `Busca ${reps} min${weight ? ` a nivel ${weight}` : ''}.`
    : `Mantén ${weight || 'el peso'} y busca ${reps} ${u} en cada serie.`
  return { weight, reps, kind: 'reps', message }
}

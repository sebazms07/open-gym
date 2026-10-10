// Músculos que se pueden pintar en el mapa corporal (siluetas de MuscleMap, vía openGym)
// y conversión de los nombres del catálogo a esos músculos.
import type { Exercise, Workout } from '../types'

export const MUSCLES = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis',
] as const
export type Muscle = (typeof MUSCLES)[number]

/** Partes de la silueta que nunca se colorean. */
export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles']

export const MUSCLE_NAME_ES: Record<Muscle, string> = {
  trapezius: 'Trapecios', deltoids: 'Hombros', chest: 'Pecho', 'upper-back': 'Espalda alta', serratus: 'Serrato',
  biceps: 'Bíceps', triceps: 'Tríceps', forearm: 'Antebrazos', abs: 'Abdominales', obliques: 'Oblicuos',
  'lower-back': 'Zona lumbar', gluteal: 'Glúteos', quadriceps: 'Cuádriceps', hamstring: 'Isquiotibiales',
  adductors: 'Aductores', 'hip-flexors': 'Flexores de cadera', calves: 'Gemelos', tibialis: 'Tibiales',
}

// Todas las grafías del catálogo (objetivo y secundarios). null = no se puede dibujar.
const ALIAS: Record<string, Muscle | null> = {
  abs: 'abs', pectorals: 'chest', biceps: 'biceps', glutes: 'gluteal', delts: 'deltoids',
  triceps: 'triceps', 'upper back': 'upper-back', lats: 'upper-back', calves: 'calves',
  quads: 'quadriceps', forearms: 'forearm', hamstrings: 'hamstring', spine: 'lower-back',
  traps: 'trapezius', adductors: 'adductors', 'serratus anterior': 'serratus',
  abductors: 'gluteal', 'levator scapulae': 'trapezius', 'cardiovascular system': null,
  shoulders: 'deltoids', deltoids: 'deltoids', 'rear deltoids': 'deltoids',
  'rotator cuff': 'deltoids', quadriceps: 'quadriceps', core: 'abs', abdominals: 'abs',
  'lower abs': 'abs', chest: 'chest', 'upper chest': 'chest', 'hip flexors': 'hip-flexors',
  obliques: 'obliques', 'lower back': 'lower-back', rhomboids: 'upper-back',
  trapezius: 'trapezius', back: 'upper-back', 'latissimus dorsi': 'upper-back',
  brachialis: 'biceps', soleus: 'calves', shins: 'tibialis', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  groin: 'adductors', 'inner thighs': 'adductors',
}

// Si no hay músculos dibujables, se reparte según la parte del cuerpo.
const BY_BODYPART: Record<string, Partial<Record<Muscle, number>>> = {
  chest: { chest: 1 },
  back: { 'upper-back': 0.75, 'lower-back': 0.25 },
  shoulders: { deltoids: 1 },
  'upper arms': { biceps: 0.5, triceps: 0.5 },
  'lower arms': { forearm: 1 },
  waist: { abs: 0.7, obliques: 0.3 },
  'upper legs': { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  'lower legs': { calves: 0.8, tibialis: 0.2 },
  neck: { trapezius: 1 },
  'full body': { chest: 0.2, 'upper-back': 0.2, gluteal: 0.2, quadriceps: 0.2, hamstring: 0.1, abs: 0.1 },
  cardio: { quadriceps: 0.4, calves: 0.3, gluteal: 0.3 },
}

const isMuscle = (m: string): m is Muscle => (MUSCLES as readonly string[]).includes(m)

/** Músculos que trabaja un ejercicio, con peso 0–1 (1 = principal). */
export function muscleWeights(ex: Pick<Exercise, 't' | 's' | 'b'> & { m?: Record<string, number> }): Partial<Record<Muscle, number>> {
  if (ex.m) return Object.fromEntries(Object.entries(ex.m).filter(([k]) => isMuscle(k)))
  const out: Partial<Record<Muscle, number>> = {}
  const primary = ALIAS[ex.t]
  if (primary) out[primary] = 1
  for (const s of ex.s) {
    const m = ALIAS[s]
    if (m && !out[m]) out[m] = 0.5
  }
  return Object.keys(out).length ? out : { ...(BY_BODYPART[ex.b] ?? {}) }
}

/** Series efectivas por músculo (series × peso) en un conjunto de entrenos. */
export function muscleSets(workouts: Workout[], get: (id: string) => Exercise | undefined) {
  const out: Partial<Record<Muscle, number>> = {}
  for (const w of workouts)
    for (const log of w.exercises) {
      const ex = get(log.exerciseId)
      if (!ex || (log.target?.unit ?? 'reps') === 'min') continue
      const sets = log.sets.filter((s) => s.done).length
      for (const [m, wt] of Object.entries(muscleWeights(ex)) as [Muscle, number][]) out[m] = (out[m] ?? 0) + sets * wt
    }
  return out
}

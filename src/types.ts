/** Ejercicio del catálogo openGym (formato compacto generado por scripts/fetch-catalogue.mjs). */
export interface Exercise {
  id: string
  /** nombre en español (o inglés si no hay traducción) */
  n: string
  /** nombre original en inglés */
  en: string
  /** parte del cuerpo */
  b: string
  /** equipamiento */
  e: string
  /** músculo objetivo */
  t: string
  /** músculos secundarios */
  s: string[]
  /** categoría */
  c: string
  /** descripción */
  d: string
  /** instrucciones paso a paso */
  i: string[]
  /** idioma de las instrucciones */
  l: 'es' | 'en'
}

export interface Target {
  sets: number
  repMin: number
  repMax: number
  /** descanso en segundos */
  rest: number
}

export interface PlanExercise extends Target {
  uid: string
  exerciseId: string
  notes?: string
}

export interface Routine {
  id: string
  name: string
  exercises: PlanExercise[]
}

export interface Plan {
  routines: Routine[]
  /** índice 0 = lunes … 6 = domingo; null = descanso */
  schedule: (string | null)[]
}

export interface SetLog {
  weight: number | null
  reps: number | null
  done: boolean
}

export interface ExerciseLog {
  uid: string
  exerciseId: string
  target?: Target
  sets: SetLog[]
  notes?: string
}

export interface Workout {
  id: string
  /** ISO de inicio */
  date: string
  finishedAt?: string
  routineId: string | null
  routineName: string
  exercises: ExerciseLog[]
  notes?: string
}

export interface Settings {
  unit: 'kg' | 'lb'
  /** incremento sugerido para tren superior */
  incUpper: number
  /** incremento sugerido para tren inferior */
  incLower: number
  /** descanso por defecto (s) para ejercicios añadidos fuera del plan */
  defaultRest: number
  sound: boolean
}

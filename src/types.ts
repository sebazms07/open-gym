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
  /** mapa muscular corregido por openGym: { músculo: peso 0–1 } */
  m?: Record<string, number>
}

/** reps = repeticiones; s = segundos (planchas); min = minutos (cardio) */
export type Unit = 'reps' | 's' | 'min'

export interface Target {
  sets: number
  repMin: number
  repMax: number
  /** descanso en segundos */
  rest: number
  /** unidad del rango repMin–repMax (por defecto reps) */
  unit?: Unit
}

export interface PlanExercise extends Target {
  uid: string
  exerciseId: string
  notes?: string
  /** ejercicio principal (multiarticular): recibe la serie extra de la semana 3 */
  main?: boolean
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
  /** si faltas a una sesión, se mueve al siguiente día disponible (por defecto true) */
  rollover?: boolean
  /** días en los que puedes entrenar (lunes … domingo); por defecto lunes a viernes */
  available?: boolean[]
  /** fecha (YYYY-MM-DD) en que se creó el plan: los días anteriores de esa semana no cuentan */
  since?: string
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
  /** sesión hecha en semana de descarga (no cuenta para la progresión) */
  deload?: boolean
}

export type Goal = 'fatloss' | 'muscle' | 'strength' | 'health'
export type Sex = 'male' | 'female' | 'na'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active'

export interface Profile {
  sex: Sex
  age: number | null
  /** cm */
  height: number | null
  activity: Activity
  /** peso meta en kg (opcional) */
  goalWeight?: number | null
}

export interface WeighIn {
  /** YYYY-MM-DD */
  date: string
  weight: number
  /** perímetro de cintura en cm */
  waist?: number | null
}

/** Programa por objetivo: fases de 4 semanas (3 de carga + 1 de descarga). */
export interface Program {
  goal: Goal
  /** fase actual (1, 2, 3…) */
  phase: number
  /** lunes (YYYY-MM-DD) en que empezó la fase */
  startDate: string
  sessions: number
  available: boolean[]
  restDay: number | null
  maxMinutes: number
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

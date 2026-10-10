import type { Goal, Plan, PlanExercise, Program, Target, Unit, Workout } from '../types'
import { startOfWeek, uid } from './util'

// ---------------------------------------------------------------------------
// Objetivos y fases
// ---------------------------------------------------------------------------

type Dose = Pick<Target, 'sets' | 'repMin' | 'repMax' | 'rest'>
export interface Phase {
  name: string
  focus: string
  /** multiarticulares principales */
  main: Dose
  /** accesorios / aislamiento */
  acc: Dose
  /** core por repeticiones */
  core: Dose
  /** core por tiempo (segundos) */
  coreTime: Dose
  /** cardio (minutos) */
  cardio: Dose
  cardioNote: string
}

export interface GoalInfo {
  name: string
  short: string
  description: string
  phases: Phase[]
}

const d = (sets: number, repMin: number, repMax: number, rest: number): Dose => ({ sets, repMin, repMax, rest })

export const GOALS: Record<Goal, GoalInfo> = {
  fatloss: {
    name: 'Bajar grasa y tonificar',
    short: 'Definición',
    description: 'Pesas para conservar (y marcar) el músculo mientras bajas grasa, más cardio en bici o elíptica.',
    phases: [
      {
        name: 'Adaptación',
        focus: 'Aprende la técnica y crea el hábito. Termina cada serie con 3 reps en reserva.',
        main: d(3, 10, 12, 90), acc: d(3, 12, 15, 60), core: d(3, 12, 15, 45), coreTime: d(3, 30, 45, 45), cardio: d(1, 15, 20, 0),
        cardioNote: 'Cardio suave (zona 2): puedes hablar con frases cortas.',
      },
      {
        name: 'Tonificación',
        focus: 'Más volumen y menos descanso. Termina con 2 reps en reserva.',
        main: d(4, 8, 10, 90), acc: d(3, 10, 12, 60), core: d(3, 15, 20, 45), coreTime: d(3, 40, 60, 45), cardio: d(1, 20, 25, 0),
        cardioNote: 'Un día de intervalos (30 s fuerte / 90 s suave × 8); el resto en zona 2.',
      },
      {
        name: 'Definición',
        focus: 'Cargas más altas para mantener la fuerza en déficit. 1–2 reps en reserva.',
        main: d(4, 6, 8, 120), acc: d(3, 10, 12, 45), core: d(3, 15, 20, 30), coreTime: d(3, 45, 60, 30), cardio: d(1, 20, 25, 0),
        cardioNote: 'Dos días de intervalos (40 s fuerte / 80 s suave × 8); el resto en zona 2.',
      },
    ],
  },
  muscle: {
    name: 'Ganar músculo',
    short: 'Hipertrofia',
    description: 'Más volumen de entrenamiento y un ligero superávit calórico.',
    phases: [
      { name: 'Base', focus: 'Técnica y volumen moderado. 2–3 reps en reserva.', main: d(3, 8, 10, 120), acc: d(3, 10, 12, 75), core: d(3, 12, 15, 45), coreTime: d(3, 30, 45, 45), cardio: d(1, 10, 10, 0), cardioNote: 'Cardio ligero como calentamiento.' },
      { name: 'Volumen', focus: 'Más series por grupo muscular. 1–2 reps en reserva.', main: d(4, 6, 10, 120), acc: d(4, 10, 12, 75), core: d(3, 15, 20, 45), coreTime: d(3, 40, 60, 45), cardio: d(1, 10, 15, 0), cardioNote: 'Cardio suave, sin pasarte para no robar recuperación.' },
      { name: 'Intensificación', focus: 'Cargas más pesadas en los básicos. 1 rep en reserva.', main: d(4, 5, 8, 150), acc: d(3, 8, 12, 75), core: d(3, 15, 20, 45), coreTime: d(3, 45, 60, 45), cardio: d(1, 10, 15, 0), cardioNote: 'Cardio suave.' },
    ],
  },
  strength: {
    name: 'Ganar fuerza',
    short: 'Fuerza',
    description: 'Pocas repeticiones con cargas altas en los ejercicios básicos.',
    phases: [
      { name: 'Acumulación', focus: 'Volumen con cargas medias. 2–3 reps en reserva.', main: d(4, 6, 8, 150), acc: d(3, 8, 10, 90), core: d(3, 10, 12, 60), coreTime: d(3, 30, 45, 60), cardio: d(1, 10, 10, 0), cardioNote: 'Cardio ligero como calentamiento.' },
      { name: 'Transformación', focus: 'Cargas más altas. 1–2 reps en reserva.', main: d(5, 4, 6, 180), acc: d(3, 8, 10, 90), core: d(3, 10, 12, 60), coreTime: d(3, 40, 60, 60), cardio: d(1, 10, 10, 0), cardioNote: 'Cardio ligero como calentamiento.' },
      { name: 'Realización', focus: 'Series pesadas y técnica impecable. 1 rep en reserva.', main: d(5, 3, 5, 180), acc: d(3, 6, 8, 90), core: d(3, 10, 12, 60), coreTime: d(3, 45, 60, 60), cardio: d(1, 10, 10, 0), cardioNote: 'Cardio ligero como calentamiento.' },
    ],
  },
  health: {
    name: 'Salud y forma general',
    short: 'Salud',
    description: 'Fuerza básica, buena condición cardiovascular y movilidad.',
    phases: [
      { name: 'Inicio', focus: 'Movimientos básicos con buena técnica.', main: d(2, 12, 15, 60), acc: d(2, 12, 15, 60), core: d(2, 12, 15, 45), coreTime: d(2, 30, 40, 45), cardio: d(1, 20, 30, 0), cardioNote: 'Ritmo cómodo y constante.' },
      { name: 'Progreso', focus: 'Un poco más de volumen y carga.', main: d(3, 10, 12, 75), acc: d(3, 10, 15, 60), core: d(3, 12, 15, 45), coreTime: d(3, 30, 45, 45), cardio: d(1, 25, 30, 0), cardioNote: 'Zona 2; añade algún cambio de ritmo si te sientes bien.' },
      { name: 'Consolidación', focus: 'Mantén la constancia con cargas moderadas.', main: d(3, 8, 12, 90), acc: d(3, 10, 12, 60), core: d(3, 15, 20, 45), coreTime: d(3, 40, 60, 45), cardio: d(1, 25, 35, 0), cardioNote: 'Zona 2 con un día de intervalos suaves.' },
    ],
  },
}

export const phaseOf = (goal: Goal, phase: number) => {
  const phases = GOALS[goal].phases
  return phases[Math.min(Math.max(phase, 1), phases.length) - 1]
}

// ---------------------------------------------------------------------------
// Plantillas de sesiones (ids del catálogo openGym). Cada hueco tiene varias
// opciones: la fase elige una distinta para variar el estímulo.
// ---------------------------------------------------------------------------

type Role = 'main' | 'acc' | 'core' | 'cardio'
type Slot = [role: Role, options: string[], unit?: Unit]
interface Blueprint {
  name: string
  slots: Slot[]
}

const ELLIPTICAL = '2141'
const BIKE = '2138'

const TORSO_A: Blueprint = {
  name: 'Torso A',
  slots: [
    ['main', ['0576', '0025', '0025']], // press de pecho en máquina → press de banca
    ['main', ['1350', '0027', '0027']], // remo sentado en máquina → remo con barra
    ['acc', ['0426', '0426', '0091']], // press de hombros
    ['acc', ['0198', '0198', '0652']], // jalón → dominadas
    ['acc', ['0334', '0192', '0334']], // elevaciones laterales
    ['acc', ['0201', '0241', '0201']], // tríceps en polea
    ['cardio', [ELLIPTICAL], 'min'],
  ],
}
const PIERNA_A: Blueprint = {
  name: 'Pierna A',
  slots: [
    ['main', ['1760', '0043', '0043']], // sentadilla goblet → sentadilla con barra
    ['main', ['1459', '0085', '0085']], // peso muerto rumano
    ['acc', ['0739']], // prensa 45°
    ['acc', ['0599']], // curl femoral sentado
    ['acc', ['0605', '0417', '0605']], // gemelos
    ['core', ['0276', '0175', '0175']], // bicho muerto → crunch en polea
    ['cardio', [BIKE], 'min'],
  ],
}
const TORSO_B: Blueprint = {
  name: 'Torso B',
  slots: [
    ['main', ['0314', '0314', '0047']], // press inclinado
    ['main', ['0292', '0292', '0606']], // remo a una mano → remo en T
    ['acc', ['0861', '0218', '0861']], // remo sentado en polea
    ['acc', ['0203']], // deltoide posterior con cuerda
    ['acc', ['0313', '0031', '0313']], // curl
    ['acc', ['0194']], // tríceps sobre la cabeza
    ['cardio', [ELLIPTICAL], 'min'],
  ],
}
const PIERNA_B: Blueprint = {
  name: 'Pierna B',
  slots: [
    ['main', ['2146', '1060', '1060']], // hip thrust
    ['main', ['0431', '2290', '2290']], // subida al cajón → sentadilla búlgara
    ['acc', ['0585']], // extensión de piernas
    ['acc', ['0586']], // curl femoral acostado
    ['acc', ['0597']], // abducción de cadera
    ['core', ['0463', '0715', '2135'], 's'], // planchas
    ['cardio', [BIKE], 'min'],
  ],
}
const FULL_A: Blueprint = {
  name: 'Full body A',
  slots: [
    ['main', ['1760', '0043', '0043']],
    ['main', ['0576', '0025', '0025']],
    ['acc', ['1350', '0027', '0027']],
    ['acc', ['0426']],
    ['acc', ['0599']],
    ['core', ['0276', '0175', '0175']],
    ['cardio', [ELLIPTICAL], 'min'],
  ],
}
const FULL_B: Blueprint = {
  name: 'Full body B',
  slots: [
    ['main', ['1459', '0085', '0085']],
    ['main', ['0198', '0198', '0652']],
    ['acc', ['0314']],
    ['acc', ['0336']],
    ['acc', ['0334']],
    ['core', ['0463', '0715', '2135'], 's'],
    ['cardio', [BIKE], 'min'],
  ],
}
const FULL_C: Blueprint = {
  name: 'Full body C',
  slots: [
    ['main', ['0739']],
    ['main', ['0292', '0292', '0606']],
    ['acc', ['2146', '1060', '1060']],
    ['acc', ['0426', '0091', '0091']],
    ['acc', ['0201']],
    ['acc', ['0031']],
    ['cardio', [ELLIPTICAL], 'min'],
  ],
}
const METABOLIC: Blueprint = {
  name: 'Full body metabólico',
  slots: [
    ['main', ['0549']], // swing con kettlebell
    ['acc', ['1760']],
    ['acc', ['0662']], // flexiones
    ['acc', ['0499']], // remo invertido
    ['acc', ['0431']],
    ['core', ['2133'], 's'], // caminata del granjero
    ['cardio', [BIKE], 'min'],
  ],
}

const BLUEPRINTS: Record<number, Blueprint[]> = {
  3: [FULL_A, FULL_B, FULL_C],
  4: [TORSO_A, PIERNA_A, TORSO_B, PIERNA_B],
  5: [TORSO_A, PIERNA_A, TORSO_B, PIERNA_B, METABOLIC],
}

/** Ids del catálogo usados por el generador (para pruebas). */
export const generatorExerciseIds = () =>
  [...new Set(Object.values(BLUEPRINTS).flat().flatMap((b) => b.slots.flatMap((s) => s[1])))]

// ---------------------------------------------------------------------------
// Generador
// ---------------------------------------------------------------------------

/** Minutos estimados de una sesión (incluye 5 min de calentamiento). */
export const estimateMinutes = (exs: Target[]) => {
  let s = 300
  for (const e of exs) {
    if (e.unit === 'min') s += e.repMax * 60
    else if (e.unit === 's') s += e.sets * (e.repMax + e.rest)
    else s += e.sets * (45 + e.rest)
  }
  return Math.round(s / 60)
}

/** Elige los días de entrenamiento entre los disponibles, repartiendo el descanso. */
export const pickTrainingDays = (available: boolean[], sessions: number, restDay: number | null) => {
  let days = available.map((a, i) => (a ? i : -1)).filter((i) => i >= 0)
  if (days.length > sessions && restDay != null) days = days.filter((d) => d !== restDay)
  const n = Math.min(sessions, days.length)
  // puntuación: racha más larga de días seguidos, luego nº de días consecutivos
  const score = (set: number[]) => {
    let longest = 0
    let run = 0
    let pairs = 0
    for (let i = 0; i < 7; i++) {
      run = set.includes(i) ? run + 1 : 0
      longest = Math.max(longest, run)
      if (run > 1) pairs++
    }
    return longest * 100 + pairs
  }
  let best: number[] = []
  let bestScore = Infinity
  const walk = (from: number, acc: number[]) => {
    if (acc.length === n) {
      const sc = score(acc)
      if (sc < bestScore) [bestScore, best] = [sc, [...acc]]
      return
    }
    for (let i = from; i < days.length; i++) walk(i + 1, [...acc, days[i]])
  }
  walk(0, [])
  return best
}

export interface GenOptions {
  goal: Goal
  sessions: number
  available: boolean[]
  restDay: number | null
  phase: number
  maxMinutes: number
}

export function generatePlan(o: GenOptions): Plan {
  const phase = phaseOf(o.goal, o.phase)
  const days = pickTrainingDays(o.available, o.sessions, o.restDay)
  const blueprints = BLUEPRINTS[Math.min(5, Math.max(3, days.length))]
  const variant = o.phase - 1

  const routines = blueprints.slice(0, days.length).map((b) => {
    const exercises: PlanExercise[] = b.slots.map(([role, options, unit]) => {
      const dose = role === 'core' && unit === 's' ? phase.coreTime : phase[role]
      return {
        uid: uid(),
        exerciseId: options[variant % options.length],
        ...dose,
        ...(unit && unit !== 'reps' ? { unit } : {}),
        ...(role === 'main' ? { main: true } : {}),
        ...(role === 'cardio' ? { notes: phase.cardioNote } : {}),
      }
    })
    fitToTime(exercises, o.maxMinutes)
    return { id: uid(), name: b.name, exercises }
  })

  const schedule: (string | null)[] = Array(7).fill(null)
  days.forEach((day, i) => (schedule[day] = routines[i]?.id ?? null))
  return { routines, schedule, rollover: true, available: [...o.available], since: toISODate(new Date()) }
}

/** Recorta la sesión hasta que quepa en el tiempo, de lo menos a lo más importante. */
function fitToTime(exs: PlanExercise[], maxMinutes: number) {
  const isAcc = (e: PlanExercise) => !e.main && (e.unit ?? 'reps') !== 'min'
  const steps: (() => boolean)[] = [
    // 1. accesorios a 2 series
    () => {
      const e = exs.filter((x) => isAcc(x) && x.sets > 2).sort((a, b) => b.sets - a.sets)[0]
      return !!e && !!e.sets--
    },
    // 2. cardio hasta 10 min
    () => {
      const e = exs.find((x) => x.unit === 'min' && x.repMax > 10)
      if (!e) return false
      e.repMax = Math.max(10, e.repMax - 5)
      e.repMin = Math.min(e.repMin, e.repMax)
      return true
    },
    // 3. descanso de accesorios hasta 45 s
    () => {
      const list = exs.filter((x) => isAcc(x) && x.rest > 45)
      list.forEach((x) => (x.rest = Math.max(45, x.rest - 15)))
      return list.length > 0
    },
    // 4. principales hasta 3 series
    () => {
      const e = exs.filter((x) => x.main && x.sets > 3).sort((a, b) => b.sets - a.sets)[0]
      return !!e && !!e.sets--
    },
    // 5. quitar el último accesorio (deja al menos 2)
    () => {
      const accs = exs.filter((x) => isAcc(x))
      if (accs.length <= 2) return false
      exs.splice(exs.lastIndexOf(accs[accs.length - 1]), 1)
      return true
    },
  ]
  while (estimateMinutes(exs) > maxMinutes) {
    if (!steps.some((step) => step())) break
  }
}

// ---------------------------------------------------------------------------
// Semanas del bloque: 1–2 carga, 3 carga + serie extra, 4 descarga.
// Solo cuentan las semanas en las que entrenaste lo suficiente: si una semana
// fallas, se repite en vez de avanzar.
// ---------------------------------------------------------------------------

export const BLOCK_WEEKS = 4

export interface WeekInfo {
  /** semana del bloque (1–4) */
  week: number
  /** semanas completadas en esta fase */
  completed: number
  extraSet: boolean
  deload: boolean
  /** se completaron las 4 semanas: toca pasar de fase */
  blockDone: boolean
  /** sesiones mínimas para que una semana cuente */
  minSessions: number
}

export const minSessionsFor = (sessions: number) => Math.max(1, Math.ceil(sessions * 0.6))

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function weekInfo(program: Program, workouts: Workout[], now = new Date()): WeekInfo {
  const minSessions = minSessionsFor(program.sessions)
  const start = startOfWeek(new Date(`${program.startDate}T00:00:00`))
  const current = startOfWeek(now)
  const perWeek = new Map<number, number>()
  for (const w of workouts) {
    const wk = startOfWeek(new Date(w.date)).getTime()
    if (wk >= start.getTime() && wk < current.getTime()) perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1)
  }
  const completed = [...perWeek.values()].filter((n) => n >= minSessions).length
  const blockDone = completed >= BLOCK_WEEKS
  const week = blockDone ? BLOCK_WEEKS : completed + 1
  return { week, completed, extraSet: !blockDone && week === 3, deload: !blockDone && week === 4, blockDone, minSessions }
}

/** Ajusta el objetivo de un ejercicio según la semana del bloque. */
export function applyWeek(target: Target, main: boolean, info: Pick<WeekInfo, 'extraSet' | 'deload'>): Target {
  if (target.unit === 'min') return { ...target }
  if (info.deload) return { ...target, sets: Math.max(1, Math.round(target.sets * 0.6)) }
  if (info.extraSet && main) return { ...target, sets: target.sets + 1 }
  return { ...target }
}

/** Peso de descarga: 90 % redondeado a 0,5. */
export const deloadWeight = (w: number) => Math.round(w * 0.9 * 2) / 2

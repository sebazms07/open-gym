import type { Plan, Settings, Workout } from '../types'

export interface Backup {
  app: 'open-gym'
  version: 1
  exportedAt: string
  plan: Plan
  workouts: Workout[]
  settings: Settings
}

export const createBackup = (plan: Plan, workouts: Workout[], settings: Settings): Backup => ({
  app: 'open-gym',
  version: 1,
  exportedAt: new Date().toISOString(),
  plan,
  workouts,
  settings,
})

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Valida un respaldo importado. Lanza un Error con mensaje en español si no es válido. */
export const parseBackup = (text: string): Backup => {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (!isObj(data) || data.app !== 'open-gym') throw new Error('El archivo no es un respaldo de Open Gym.')
  if (data.version !== 1) throw new Error(`Versión de respaldo no soportada: ${String(data.version)}`)
  const { plan, workouts, settings } = data
  if (!isObj(plan) || !Array.isArray(plan.routines) || !Array.isArray(plan.schedule) || plan.schedule.length !== 7)
    throw new Error('El plan del respaldo está dañado.')
  if (!Array.isArray(workouts) || !workouts.every((w) => isObj(w) && typeof w.date === 'string' && Array.isArray(w.exercises)))
    throw new Error('El historial del respaldo está dañado.')
  if (!isObj(settings)) throw new Error('Los ajustes del respaldo están dañados.')
  return data as unknown as Backup
}

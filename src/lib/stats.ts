import type { Workout } from '../types'
import { startOfWeek } from './util'

const WEEK = 7 * 864e5

/**
 * Semanas seguidas cumpliendo el mínimo de sesiones. La semana en curso suma si ya se
 * cumplió, pero no rompe la racha mientras siga abierta.
 */
export function weekStreak(workouts: Workout[], minPerWeek: number, now = new Date()) {
  const counts = new Map<number, number>()
  for (const w of workouts) {
    const k = startOfWeek(new Date(w.date)).getTime()
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const current = startOfWeek(now).getTime()
  let streak = (counts.get(current) ?? 0) >= minPerWeek ? 1 : 0
  for (let k = current - WEEK; (counts.get(k) ?? 0) >= minPerWeek; k -= WEEK) streak++
  return streak
}

export interface HeatCell {
  date: Date
  minutes: number
  future: boolean
}

/** Cuadrícula de actividad: `weeks` columnas (lunes → domingo), minutos entrenados por día. */
export function activityGrid(workouts: Workout[], weeks = 17, now = new Date()): HeatCell[][] {
  const byDay = new Map<string, number>()
  for (const w of workouts) {
    const d = new Date(w.date)
    const key = d.toDateString()
    const mins = w.finishedAt ? Math.max(1, (new Date(w.finishedAt).getTime() - d.getTime()) / 6e4) : 45
    byDay.set(key, (byDay.get(key) ?? 0) + mins)
  }
  const first = startOfWeek(now)
  first.setDate(first.getDate() - (weeks - 1) * 7)
  const cols: HeatCell[][] = []
  for (let c = 0; c < weeks; c++) {
    const col: HeatCell[] = []
    for (let r = 0; r < 7; r++) {
      const date = new Date(first)
      date.setDate(first.getDate() + c * 7 + r)
      col.push({ date, minutes: byDay.get(date.toDateString()) ?? 0, future: date > now })
    }
    cols.push(col)
  }
  return cols
}

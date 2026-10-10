import { describe, expect, it } from 'vitest'
import { activityGrid, weekStreak } from './stats'
import type { Workout } from '../types'

const w = (date: string): Workout => ({ id: date, date: `${date}T18:00:00`, finishedAt: `${date}T19:00:00`, routineId: null, routineName: '', exercises: [] })

describe('weekStreak', () => {
  const now = new Date('2026-10-07T12:00:00') // miércoles
  it('cuenta semanas seguidas y no rompe con la semana en curso', () => {
    const done = [w('2026-09-21'), w('2026-09-23'), w('2026-09-28'), w('2026-09-30')]
    expect(weekStreak(done, 2, now)).toBe(2)
    expect(weekStreak([...done, w('2026-10-05'), w('2026-10-06')], 2, now)).toBe(3)
  })
  it('se rompe si una semana no llega al mínimo', () => {
    expect(weekStreak([w('2026-09-21'), w('2026-09-23'), w('2026-09-28')], 2, now)).toBe(0)
  })
})

describe('activityGrid', () => {
  it('suma minutos por día', () => {
    const grid = activityGrid([w('2026-10-05')], 2, new Date('2026-10-07T12:00:00'))
    expect(grid).toHaveLength(2)
    expect(grid[1][0].minutes).toBe(60)
    expect(grid[1][3].future).toBe(true)
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { applyWeek, estimateMinutes, generatePlan, generatorExerciseIds, pickTrainingDays, weekInfo, GOALS } from './program'
import type { Goal, Program, Workout } from '../types'

const LV = [true, true, true, true, true, false, false]
const catalogue = JSON.parse(readFileSync(new URL('../../public/data/exercises.json', import.meta.url), 'utf8'))
const ids = new Set<string>(catalogue.exercises.filter((e: { x?: 1 }) => !e.x).map((e: { id: string }) => e.id))

describe('pickTrainingDays', () => {
  it('4 sesiones de L a V con descanso el miércoles', () => {
    expect(pickTrainingDays(LV, 4, 2)).toEqual([0, 1, 3, 4])
  })
  it('respeta el día de descanso elegido', () => {
    expect(pickTrainingDays(LV, 4, 4)).toEqual([0, 1, 2, 3])
  })
  it('sin preferencia reparte el descanso', () => {
    expect(pickTrainingDays(LV, 4, null)).toEqual([0, 1, 3, 4])
    expect(pickTrainingDays(LV, 3, null)).toEqual([0, 2, 4])
  })
})

describe('generatePlan', () => {
  it('todos los ejercicios existen en el catálogo', () => {
    for (const id of generatorExerciseIds()) expect(ids, id).toContain(id)
  })

  it.each(Object.keys(GOALS) as Goal[])('%s: 4 días, sesiones de ≤ 60 min en todas las fases', (goal) => {
    for (const phase of [1, 2, 3]) {
      const plan = generatePlan({ goal, sessions: 4, available: LV, restDay: 2, phase, maxMinutes: 60 })
      expect(plan.schedule.map((s) => (s ? 1 : 0))).toEqual([1, 1, 0, 1, 1, 0, 0])
      expect(plan.routines.map((r) => r.name)).toEqual(['Torso A', 'Pierna A', 'Torso B', 'Pierna B'])
      for (const r of plan.routines) expect(estimateMinutes(r.exercises), `${goal} F${phase} ${r.name}`).toBeLessThanOrEqual(60)
    }
  })

  it('cambia ejercicios entre fases', () => {
    const p1 = generatePlan({ goal: 'fatloss', sessions: 4, available: LV, restDay: 2, phase: 1, maxMinutes: 60 })
    const p2 = generatePlan({ goal: 'fatloss', sessions: 4, available: LV, restDay: 2, phase: 2, maxMinutes: 60 })
    expect(p1.routines[0].exercises[0].exerciseId).not.toBe(p2.routines[0].exercises[0].exerciseId)
  })
})

describe('weekInfo', () => {
  const program: Program = { goal: 'fatloss', phase: 1, startDate: '2026-09-07', sessions: 4, available: LV, restDay: 2, maxMinutes: 60 }
  const w = (date: string): Workout => ({ id: date, date: `${date}T18:00:00`, routineId: null, routineName: '', exercises: [] })
  const week = (monday: string, n: number) => Array.from({ length: n }, (_, i) => w(monday.replace(/\d\d$/, (d) => String(+d + i).padStart(2, '0'))))

  it('semana 1 al empezar', () => {
    expect(weekInfo(program, [], new Date('2026-09-08T10:00:00'))).toMatchObject({ week: 1, deload: false })
  })

  it('una semana con pocas sesiones no avanza', () => {
    const info = weekInfo(program, [...week('2026-09-07', 3), ...week('2026-09-14', 1)], new Date('2026-09-22T10:00:00'))
    expect(info).toMatchObject({ week: 2, completed: 1 })
  })

  it('semana 3 suma una serie y semana 4 es descarga', () => {
    const done = [...week('2026-09-07', 3), ...week('2026-09-14', 3)]
    expect(weekInfo(program, done, new Date('2026-09-22T10:00:00'))).toMatchObject({ week: 3, extraSet: true })
    const done4 = [...done, ...week('2026-09-21', 4)]
    expect(weekInfo(program, done4, new Date('2026-09-29T10:00:00'))).toMatchObject({ week: 4, deload: true })
    const done5 = [...done4, ...week('2026-09-28', 3)]
    expect(weekInfo(program, done5, new Date('2026-10-06T10:00:00'))).toMatchObject({ blockDone: true, deload: false })
  })

  it('applyWeek', () => {
    const t = { sets: 4, repMin: 8, repMax: 10, rest: 90 }
    expect(applyWeek(t, true, { extraSet: true, deload: false }).sets).toBe(5)
    expect(applyWeek(t, false, { extraSet: true, deload: false }).sets).toBe(4)
    expect(applyWeek(t, true, { extraSet: false, deload: true }).sets).toBe(2)
    expect(applyWeek({ ...t, unit: 'min' }, true, { extraSet: false, deload: true }).sets).toBe(4)
  })
})

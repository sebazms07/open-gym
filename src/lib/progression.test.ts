import { describe, expect, it } from 'vitest'
import { bestSet, estimate1RM, lastLogFor, suggest, volume } from './progression'
import type { ExerciseLog, Target, Workout } from '../types'

const target: Target = { sets: 3, repMin: 8, repMax: 12, rest: 90 }
const log = (sets: [number | null, number | null, boolean?][]): ExerciseLog => ({
  uid: 'u',
  exerciseId: '0025',
  sets: sets.map(([weight, reps, done = true]) => ({ weight, reps, done })),
})

describe('suggest', () => {
  it('sin historial pide elegir peso', () => {
    expect(suggest(target, null, 2.5)).toMatchObject({ kind: 'new', weight: null, reps: 8 })
  })

  it('sube el peso cuando todas las series llegan al tope', () => {
    const s = suggest(target, log([[60, 12], [60, 12], [60, 13]]), 2.5)
    expect(s).toMatchObject({ kind: 'up', weight: 62.5, reps: 8 })
  })

  it('mantiene el peso y pide +1 rep si no se llegó al tope', () => {
    const s = suggest(target, log([[60, 12], [60, 10], [60, 9]]), 2.5)
    expect(s).toMatchObject({ kind: 'reps', weight: 60, reps: 10 })
  })

  it('ignora series no completadas', () => {
    const s = suggest(target, log([[60, 12], [60, 12], [60, 12, false]]), 2.5)
    expect(s.kind).toBe('reps')
  })

  it('no baja de repMin', () => {
    expect(suggest(target, log([[80, 5], [80, 5], [80, 4]]), 5).reps).toBe(8)
  })
})

describe('métricas', () => {
  it('estimate1RM usa Epley', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(100, 10)).toBeCloseTo(133.33, 1)
  })

  it('volumen y mejor serie', () => {
    const l = log([[60, 12], [70, 5], [80, 3, false]])
    expect(volume(l)).toBe(1070)
    expect(bestSet(l)).toMatchObject({ weight: 60, reps: 12 })
  })

  it('lastLogFor devuelve el registro más reciente', () => {
    const w = (date: string, weight: number): Workout => ({
      id: date, date, routineId: null, routineName: '', exercises: [log([[weight, 8]])],
    })
    expect(lastLogFor([w('2026-01-01', 50), w('2026-02-01', 55)], '0025')?.sets[0].weight).toBe(55)
    expect(lastLogFor([], '0025')).toBeNull()
  })
})

describe('unidades y descarga', () => {
  it('cardio sube de nivel al completar los minutos', () => {
    const t: Target = { sets: 1, repMin: 15, repMax: 20, rest: 0, unit: 'min' }
    const l: ExerciseLog = { ...log([[6, 20]]), target: t }
    expect(suggest(t, l, 2.5)).toMatchObject({ kind: 'up', weight: 7, reps: 15 })
    expect(volume(l)).toBe(0)
    expect(bestSet(l)).toBeNull()
  })

  it('plancha progresa de 5 en 5 segundos', () => {
    const t: Target = { sets: 3, repMin: 30, repMax: 45, rest: 45, unit: 's' }
    expect(suggest(t, log([[0, 30], [0, 30], [0, 35]]), 2.5)).toMatchObject({ kind: 'reps', reps: 35 })
  })

  it('lastLogFor ignora las sesiones de descarga', () => {
    const w = (date: string, weight: number, deload = false): Workout => ({
      id: date, date, routineId: null, routineName: '', exercises: [log([[weight, 8]])], deload,
    })
    expect(lastLogFor([w('2026-01-01', 60), w('2026-01-08', 54, true)], '0025')?.sets[0].weight).toBe(60)
  })
})

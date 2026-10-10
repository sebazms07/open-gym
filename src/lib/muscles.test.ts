import { describe, expect, it } from 'vitest'
import { muscleSets, muscleWeights } from './muscles'
import type { Exercise } from '../types'

const ex = (o: Partial<Exercise>): Exercise => ({ id: '1', n: '', en: '', b: 'chest', e: '', t: 'pectorals', s: [], c: '', d: '', i: [], l: 'es', ...o })

describe('muscleWeights', () => {
  it('usa el mapa corregido si existe', () => {
    expect(muscleWeights(ex({ m: { chest: 1, triceps: 0.4 } }))).toEqual({ chest: 1, triceps: 0.4 })
  })
  it('convierte objetivo y secundarios', () => {
    expect(muscleWeights(ex({ t: 'lats', s: ['biceps', 'rear deltoids', 'feet'] }))).toEqual({ 'upper-back': 1, biceps: 0.5, deltoids: 0.5 })
  })
  it('recurre a la parte del cuerpo', () => {
    expect(muscleWeights(ex({ t: 'cardiovascular system', b: 'cardio', s: [] }))).toEqual({ quadriceps: 0.4, calves: 0.3, gluteal: 0.3 })
  })
  it('cuenta series por músculo', () => {
    const e = ex({ m: { chest: 1, triceps: 0.5 } })
    const w = { id: 'w', date: '', routineId: null, routineName: '', exercises: [{ uid: 'u', exerciseId: '1', sets: [{ weight: 1, reps: 1, done: true }, { weight: 1, reps: 1, done: true }] }] }
    expect(muscleSets([w], () => e)).toEqual({ chest: 2, triceps: 1 })
  })
})

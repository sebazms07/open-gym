import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup } from './exportImport'
import type { Plan, Settings } from '../types'

const plan: Plan = { routines: [{ id: 'r1', name: 'A', exercises: [] }], schedule: ['r1', null, null, null, null, null, null] }
const settings: Settings = { unit: 'kg', incUpper: 2.5, incLower: 5, defaultRest: 90, sound: true }

describe('respaldo', () => {
  it('ida y vuelta', () => {
    const b = createBackup(plan, [{ id: 'w', date: '2026-01-01', routineId: 'r1', routineName: 'A', exercises: [] }], settings)
    expect(parseBackup(JSON.stringify(b))).toEqual(b)
  })

  it('rechaza JSON inválido u otros archivos', () => {
    expect(() => parseBackup('{')).toThrow('JSON válido')
    expect(() => parseBackup('{"app":"otra"}')).toThrow('respaldo de Open Gym')
  })

  it('rechaza un plan dañado', () => {
    const b = { ...createBackup(plan, [], settings), plan: { routines: [], schedule: [] } }
    expect(() => parseBackup(JSON.stringify(b))).toThrow('plan')
  })
})

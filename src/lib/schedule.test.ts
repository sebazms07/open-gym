import { describe, expect, it } from 'vitest'
import { DEFAULT_AVAILABLE, projectWeek, unplacedCount } from './schedule'

// L, M entreno · X descanso · J, V entreno · fin de semana libre
const schedule = ['A', 'B', null, 'C', 'D', null, null]
const ids = (slots: ReturnType<typeof projectWeek>) => slots.map((s) => s.routineId)

describe('projectWeek con rollover', () => {
  it('sin faltas sigue el horario', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [], 0)
    expect(ids(w)).toEqual(['A', 'B', null, 'C', 'D', null, null])
    expect(w[2].status).toBe('rest')
    expect(w[5].status).toBe('off')
  })

  it('si faltas el lunes, todo se corre un día y se ocupa el descanso', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [], 1)
    expect(w[0].status).toBe('missed')
    expect(ids(w).slice(1)).toEqual(['A', 'B', 'C', 'D', null, null])
    expect(w[1].shiftedFrom).toBe(0)
    expect(w[3].shiftedFrom).toBeUndefined()
  })

  it('si cumples lunes y martes, el miércoles es descanso', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [{ day: 0, routineId: 'A' }, { day: 1, routineId: 'B' }], 2)
    expect(w[2]).toEqual({ routineId: null, status: 'rest' })
    expect(ids(w).slice(3, 5)).toEqual(['C', 'D'])
  })

  it('si faltas el martes, el miércoles hace la sesión B', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [{ day: 0, routineId: 'A' }], 2)
    expect(w[1].status).toBe('missed')
    expect(w[2]).toMatchObject({ routineId: 'B', status: 'planned', shiftedFrom: 1 })
  })

  it('las sesiones que no caben quedan fuera y se cuentan', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [], 3)
    expect(ids(w).slice(3)).toEqual(['A', 'B', null, null])
    expect(unplacedCount(schedule, w, [])).toBe(2)
  })

  it('una sesión hecha hoy marca el día como hecho', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [{ day: 0, routineId: 'A' }], 0)
    expect(w[0].status).toBe('done')
    expect(w[1].routineId).toBe('B')
  })
})

describe('projectWeek sin rollover', () => {
  it('respeta el horario fijo', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, false, [], 1)
    expect(ids(w).slice(1)).toEqual(['B', null, 'C', 'D', null, null])
  })
})

describe('plan creado a mitad de semana', () => {
  it('los días anteriores no cuentan como perdidos', () => {
    const w = projectWeek(schedule, DEFAULT_AVAILABLE, true, [], 3, 3)
    expect(w.slice(0, 3).map((s) => s.status)).toEqual(['off', 'off', 'off'])
    expect(ids(w).slice(3)).toEqual(['C', 'D', null, null])
    expect(unplacedCount(schedule, w, [], 3)).toBe(0)
  })
})

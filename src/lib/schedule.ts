// Proyección de la semana con sesiones "corridas": si faltas a una sesión, pasa
// al siguiente día disponible (ocupando un día de descanso si hace falta).

export type DayStatus = 'done' | 'planned' | 'missed' | 'rest' | 'off'

export interface DaySlot {
  /** rutina asignada (o hecha) ese día */
  routineId: string | null
  status: DayStatus
  /** día (0 = lunes) en el que estaba programada originalmente, si se movió */
  shiftedFrom?: number
}

export interface DoneSession {
  /** 0 = lunes … 6 = domingo */
  day: number
  routineId: string | null
}

export const DEFAULT_AVAILABLE = [true, true, true, true, true, false, false]

/**
 * @param schedule rutina programada por día (null = descanso)
 * @param available días en los que se puede entrenar
 * @param rollover mover las sesiones perdidas
 * @param done sesiones registradas esta semana
 * @param today día de hoy (0 = lunes)
 * @param startDay primer día que cuenta (plan creado a mitad de semana)
 */
export function projectWeek(
  schedule: (string | null)[],
  available: boolean[],
  rollover: boolean,
  done: DoneSession[],
  today: number,
  startDay = 0,
): DaySlot[] {
  const slots: DaySlot[] = []
  const doneOn = (d: number) => done.filter((s) => s.day === d)

  // Sesiones pendientes en orden: las programadas (desde startDay) menos las ya hechas.
  const pending = schedule.flatMap((rid, day) => (rid && day >= startDay ? [{ rid, day }] : []))
  for (const s of done) {
    const i = pending.findIndex((p) => p.rid === s.routineId)
    if (i >= 0) pending.splice(i, 1)
  }
  const scheduledAfter = (d: number) => schedule.filter((rid, i) => rid && i > d && i >= startDay).length

  for (let d = 0; d < 7; d++) {
    const finished = doneOn(d)
    if (finished.length) {
      slots.push({ routineId: finished[0].routineId, status: 'done' })
      continue
    }
    const idle: DayStatus = available[d] || schedule[d] ? 'rest' : 'off'
    if (d < startDay) {
      slots.push({ routineId: null, status: 'off' })
      continue
    }
    if (d < today) {
      slots.push(schedule[d] ? { routineId: schedule[d], status: 'missed' } : { routineId: null, status: idle })
      continue
    }
    if (!rollover) {
      slots.push(schedule[d] ? { routineId: schedule[d], status: 'planned' } : { routineId: null, status: idle })
      continue
    }
    const canTrain = available[d] || !!schedule[d]
    if (pending.length && canTrain && (schedule[d] || pending.length > scheduledAfter(d))) {
      const next = pending.shift()!
      slots.push({ routineId: next.rid, status: 'planned', ...(next.day !== d ? { shiftedFrom: next.day } : {}) })
    } else {
      slots.push({ routineId: null, status: idle })
    }
  }
  return slots
}

/** Sesiones programadas que ya no caben esta semana. */
export function unplacedCount(schedule: (string | null)[], slots: DaySlot[], done: DoneSession[], startDay = 0) {
  const planned = schedule.filter((rid, d) => rid && d >= startDay).length
  const placed = slots.filter((s) => s.status === 'planned').length
  const doneInPlan = Math.min(planned, done.filter((s) => s.routineId && schedule.includes(s.routineId)).length)
  return Math.max(0, planned - doneInPlan - placed)
}

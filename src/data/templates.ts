import type { Plan } from '../types'
import { uid } from '../lib/util'

type Row = [exerciseId: string, sets: number, repMin: number, repMax: number, rest?: number]
interface TemplateRoutine {
  key: string
  name: string
  rows: Row[]
}
export interface Template {
  id: string
  name: string
  description: string
  routines: TemplateRoutine[]
  /** lunes … domingo, con la `key` de la rutina o null para descanso */
  schedule: (string | null)[]
}

// Ids del catálogo openGym (catalogue/exercises/<id>.json)
export const TEMPLATES: Template[] = [
  {
    id: 'fullbody3',
    name: 'Full body · 3 días',
    description: 'Cuerpo completo tres veces por semana. Ideal para empezar o con poco tiempo.',
    routines: [
      { key: 'A', name: 'Full body A', rows: [['0043', 3, 6, 10, 150], ['0025', 3, 6, 10, 150], ['0027', 3, 8, 12, 120], ['0426', 2, 8, 12, 90], ['0599', 2, 10, 15, 90], ['0175', 3, 10, 15, 60]] },
      { key: 'B', name: 'Full body B', rows: [['0085', 3, 6, 10, 150], ['0314', 3, 8, 12, 120], ['0198', 3, 8, 12, 120], ['0336', 2, 10, 12, 90], ['0334', 3, 12, 15, 60], ['0031', 2, 10, 12, 60], ['0201', 2, 10, 12, 60]] },
      { key: 'C', name: 'Full body C', rows: [['0739', 3, 8, 12, 120], ['0091', 3, 6, 10, 120], ['0861', 3, 8, 12, 120], ['0251', 2, 8, 12, 90], ['0586', 2, 10, 15, 90], ['0605', 3, 10, 15, 60], ['0472', 3, 10, 15, 60]] },
    ],
    schedule: ['A', null, 'B', null, 'C', null, null],
  },
  {
    id: 'upperlower4',
    name: 'Torso / Pierna · 4 días',
    description: 'Dos días de torso y dos de pierna. Buen equilibrio entre volumen y recuperación.',
    routines: [
      { key: 'UA', name: 'Torso A', rows: [['0025', 4, 6, 8, 180], ['0027', 4, 6, 10, 150], ['0091', 3, 8, 10, 120], ['0198', 3, 8, 12, 90], ['0031', 2, 10, 12, 60], ['0201', 2, 10, 12, 60]] },
      { key: 'LA', name: 'Pierna A', rows: [['0043', 4, 6, 8, 180], ['0085', 3, 8, 10, 150], ['0739', 3, 10, 12, 120], ['0599', 3, 10, 15, 90], ['0605', 4, 10, 15, 60], ['0175', 3, 10, 15, 60]] },
      { key: 'UB', name: 'Torso B', rows: [['0314', 4, 8, 10, 150], ['0292', 3, 8, 12, 90], ['0652', 3, 6, 10, 120], ['0334', 4, 12, 15, 60], ['0313', 3, 10, 12, 60], ['0194', 3, 10, 12, 60]] },
      { key: 'LB', name: 'Pierna B', rows: [['0032', 3, 5, 6, 180], ['2290', 3, 8, 12, 120], ['0585', 3, 12, 15, 90], ['0586', 3, 10, 15, 90], ['1060', 3, 8, 12, 120], ['0417', 3, 12, 15, 60]] },
    ],
    schedule: ['UA', 'LA', null, 'UB', 'LB', null, null],
  },
  {
    id: 'ppl6',
    name: 'Push / Pull / Legs · 6 días',
    description: 'Empuje, tirón y pierna dos veces por semana. Máximo volumen para hipertrofia.',
    routines: [
      { key: 'PA', name: 'Push A', rows: [['0025', 4, 6, 8, 180], ['0091', 3, 8, 10, 120], ['0314', 3, 8, 12, 90], ['0334', 4, 12, 15, 60], ['0201', 3, 10, 12, 60], ['0814', 2, 8, 12, 60]] },
      { key: 'LA', name: 'Pull A', rows: [['0032', 3, 5, 6, 180], ['0652', 3, 6, 10, 120], ['0861', 3, 8, 12, 90], ['0203', 3, 12, 15, 60], ['0031', 3, 8, 12, 60], ['0313', 2, 10, 12, 60]] },
      { key: 'GA', name: 'Legs A', rows: [['0043', 4, 6, 8, 180], ['0085', 3, 8, 10, 150], ['0739', 3, 10, 12, 120], ['0599', 3, 10, 15, 90], ['0605', 4, 10, 15, 60]] },
      { key: 'PB', name: 'Push B', rows: [['0047', 4, 6, 10, 150], ['0426', 3, 8, 12, 120], ['0308', 3, 10, 15, 60], ['0334', 3, 12, 15, 60], ['0060', 3, 8, 12, 90], ['0194', 2, 10, 12, 60]] },
      { key: 'LB', name: 'Pull B', rows: [['0027', 4, 6, 10, 150], ['0198', 3, 8, 12, 90], ['0292', 3, 8, 12, 90], ['0406', 3, 10, 15, 60], ['0318', 3, 10, 12, 60], ['0447', 2, 10, 12, 60]] },
      { key: 'GB', name: 'Legs B', rows: [['0042', 3, 6, 10, 180], ['1060', 3, 8, 12, 120], ['0336', 3, 10, 12, 90], ['0585', 3, 12, 15, 60], ['0586', 3, 10, 15, 60], ['0472', 3, 10, 15, 60]] },
    ],
    schedule: ['PA', 'LA', 'GA', 'PB', 'LB', 'GB', null],
  },
]

/** Crea un plan nuevo (con ids frescos) a partir de una plantilla. */
export const planFromTemplate = (t: Template): Plan => {
  const ids = new Map(t.routines.map((r) => [r.key, uid()]))
  return {
    routines: t.routines.map((r) => ({
      id: ids.get(r.key)!,
      name: r.name,
      exercises: r.rows.map(([exerciseId, sets, repMin, repMax, rest = 90]) => ({ uid: uid(), exerciseId, sets, repMin, repMax, rest })),
    })),
    schedule: t.schedule.map((k) => (k ? ids.get(k)! : null)),
  }
}

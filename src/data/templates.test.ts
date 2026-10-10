import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TEMPLATES, planFromTemplate } from './templates'

const catalogue = JSON.parse(readFileSync(new URL('../../public/data/exercises.json', import.meta.url), 'utf8'))
const ids = new Set<string>(catalogue.exercises.map((e: { id: string }) => e.id))

describe('plantillas', () => {
  it.each(TEMPLATES)('$name usa ejercicios del catálogo y un horario válido', (t) => {
    for (const r of t.routines) for (const [id] of r.rows) expect(ids, `${t.id}/${r.key}`).toContain(id)
    const plan = planFromTemplate(t)
    expect(plan.schedule).toHaveLength(7)
    for (const day of plan.schedule) if (day) expect(plan.routines.map((r) => r.id)).toContain(day)
  })
})

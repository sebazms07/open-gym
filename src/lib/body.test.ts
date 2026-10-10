import { describe, expect, it } from 'vitest'
import { bmi, bmr, dailyTargets, healthyMaxWeight, weightAdvice, weightTrend } from './body'
import type { Profile } from '../types'

const me: Profile = { sex: 'male', age: 33, height: 172, activity: 'moderate' }

describe('cálculos corporales', () => {
  it('IMC y basal (Mifflin-St Jeor)', () => {
    expect(bmi(80.4, 172)).toBeCloseTo(27.2, 1)
    expect(bmr(me, 80.4)).toBeCloseTo(1719, 0)
    expect(healthyMaxWeight(172)).toBe(73.6)
  })

  it('objetivos para bajar grasa', () => {
    const t = dailyTargets('fatloss', me, 80.4)!
    expect(t.maintenance).toBe(2650)
    expect(t.kcal).toBe(2150)
    expect(t.protein).toBe(160)
    expect(t.fat).toBe(65)
  })

  it('sin datos de perfil no calcula', () => {
    expect(dailyTargets('fatloss', { ...me, age: null }, 80)).toBeNull()
  })

  it('tendencia y consejo', () => {
    const now = new Date('2026-10-20T12:00:00')
    const days = ['2026-10-01', '2026-10-05', '2026-10-09', '2026-10-13', '2026-10-17', '2026-10-20']
    const entries = days.map((date, i) => ({ date, weight: 80.4 - i * 0.25 }))
    const trend = weightTrend(entries, now)!
    expect(trend.perWeek!).toBeCloseTo(-0.46, 1)
    expect(weightAdvice('fatloss', trend).status).toBe('ok')
    expect(weightAdvice('fatloss', { average: 80, perWeek: -1.2 }).status).toBe('fast')
    expect(weightAdvice('fatloss', { average: 80, perWeek: 0 }).status).toBe('slow')
    expect(weightAdvice('fatloss', null).status).toBe('nodata')
  })
})

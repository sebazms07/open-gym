import type { Activity, Goal, Profile, WeighIn } from '../types'

export const ACTIVITY: Record<Activity, { label: string; factor: number }> = {
  sedentary: { label: 'Poco o nada de ejercicio', factor: 1.2 },
  light: { label: 'Ejercicio 1–3 días/semana', factor: 1.375 },
  moderate: { label: 'Ejercicio 3–5 días/semana', factor: 1.55 },
  active: { label: 'Ejercicio intenso 6–7 días o trabajo físico', factor: 1.725 },
}

export const bmi = (weight: number, heightCm: number) => weight / (heightCm / 100) ** 2

export const bmiLabel = (v: number) =>
  v < 18.5 ? 'Bajo peso' : v < 25 ? 'Normal' : v < 30 ? 'Sobrepeso' : 'Obesidad'

/** Metabolismo basal (Mifflin-St Jeor). Para 'na' se usa el promedio de ambas fórmulas. */
export const bmr = (p: Profile, weight: number) => {
  const base = 10 * weight + 6.25 * (p.height ?? 0) - 5 * (p.age ?? 0)
  return base + (p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78)
}

export const tdee = (p: Profile, weight: number) => bmr(p, weight) * ACTIVITY[p.activity].factor

const round = (n: number, step: number) => Math.round(n / step) * step

export interface Targets {
  maintenance: number
  kcal: number
  protein: number
  fat: number
  carbs: number
  waterL: number
  steps: string
}

/** Objetivos diarios orientativos según la meta. */
export function dailyTargets(goal: Goal, p: Profile, weight: number): Targets | null {
  if (!p.age || !p.height || !weight) return null
  const maintenance = tdee(p, weight)
  const adjust = { fatloss: -Math.min(500, maintenance * 0.2), muscle: 250, strength: 150, health: 0 }[goal]
  const kcal = round(maintenance + adjust, 50)
  const proteinPerKg = { fatloss: 2, muscle: 1.8, strength: 1.8, health: 1.6 }[goal]
  const protein = round(weight * proteinPerKg, 5)
  const fat = round(weight * 0.8, 5)
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4, 5))
  return {
    maintenance: round(maintenance, 50),
    kcal,
    protein,
    fat,
    carbs,
    waterL: Math.round(weight * 0.035 * 10) / 10,
    steps: goal === 'fatloss' ? '8.000–10.000' : '7.000–9.000',
  }
}

/** Peso máximo con IMC < 25 (referencia, no objetivo obligatorio). */
export const healthyMaxWeight = (heightCm: number) => Math.floor(24.9 * (heightCm / 100) ** 2 * 10) / 10

export interface Trend {
  /** media de los últimos 7 días */
  average: number
  /** kg por semana (negativo = bajando) */
  perWeek: number | null
}

/** Media de 7 días y ritmo semanal (regresión lineal de los últimos 28 días). */
export function weightTrend(entries: WeighIn[], now = new Date()): Trend | null {
  if (!entries.length) return null
  const t = (e: WeighIn) => new Date(`${e.date}T12:00:00`).getTime()
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const last = t(sorted[sorted.length - 1])
  const week = sorted.filter((e) => t(e) > last - 7 * 864e5)
  const average = week.reduce((a, e) => a + e.weight, 0) / week.length

  const recent = sorted.filter((e) => t(e) > now.getTime() - 28 * 864e5)
  let perWeek: number | null = null
  if (recent.length >= 3 && t(recent[recent.length - 1]) - t(recent[0]) >= 7 * 864e5) {
    const xs = recent.map((e) => t(e) / 864e5)
    const ys = recent.map((e) => e.weight)
    const mx = xs.reduce((a, b) => a + b) / xs.length
    const my = ys.reduce((a, b) => a + b) / ys.length
    const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0)
    const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
    perWeek = den ? (num / den) * 7 : 0
  }
  return { average, perWeek }
}

export interface Advice {
  status: 'ok' | 'fast' | 'slow' | 'nodata'
  message: string
}

/** Ajuste recomendado según cómo evoluciona el peso. */
export function weightAdvice(goal: Goal, trend: Trend | null): Advice {
  if (!trend || trend.perWeek == null)
    return { status: 'nodata', message: 'Pésate 3–4 mañanas por semana (en ayunas, tras ir al baño) durante 2 semanas para ver tu ritmo.' }
  const pct = (trend.perWeek / trend.average) * 100
  const fmt = `${trend.perWeek > 0 ? '+' : ''}${trend.perWeek.toFixed(2).replace('.', ',')} kg/semana`
  if (goal === 'fatloss') {
    if (pct < -1) return { status: 'fast', message: `Bajas ${fmt}: demasiado rápido, puedes perder músculo. Suma ~150 kcal al día.` }
    if (pct > -0.25) return { status: 'slow', message: `Ritmo ${fmt}: estancado. Resta ~150 kcal al día o suma 2.000 pasos diarios, y revisa los fines de semana.` }
    return { status: 'ok', message: `Ritmo ${fmt}: ideal (0,25–1 % por semana). Sigue igual.` }
  }
  if (goal === 'muscle') {
    if (pct > 0.5) return { status: 'fast', message: `Subes ${fmt}: más rápido de lo necesario, acumularás grasa. Resta ~150 kcal.` }
    if (pct < 0.1) return { status: 'slow', message: `Ritmo ${fmt}: no estás en superávit. Suma ~150 kcal al día.` }
    return { status: 'ok', message: `Ritmo ${fmt}: ideal para ganar músculo con poca grasa.` }
  }
  if (Math.abs(pct) > 0.5) return { status: 'slow', message: `Tu peso cambia ${fmt}. Ajusta ~150 kcal para estabilizarlo.` }
  return { status: 'ok', message: `Peso estable (${fmt}).` }
}

/** Recomendaciones generales por objetivo. */
export const RECOMMENDATIONS: Record<Goal, string[]> = {
  fatloss: [
    'La proteína es lo más importante: repártela en 3–4 comidas (ayuda a conservar el músculo y quita el hambre).',
    'Camina: los pasos diarios queman más grasa a la semana que el cardio y no afectan la recuperación.',
    'No bajes los pesos por estar en déficit: mantener la fuerza es lo que hace que "tonifiques" en vez de solo adelgazar.',
    'Mide la cintura cada 2 semanas a la altura del ombligo; a veces baja aunque la báscula no se mueva.',
    'Duerme 7–9 h: dormir poco aumenta el hambre y empeora la recuperación.',
    'Cada 4.ª semana es de descarga: menos series y un 10 % menos de peso. No te la saltes.',
    'Calienta 5 min en bici o elíptica y haz 1–2 series ligeras del primer ejercicio.',
  ],
  muscle: [
    'Come en ligero superávit y llega a tu proteína diaria.',
    'Busca progresar en reps o peso cada semana en los ejercicios principales.',
    'Duerme 7–9 h y respeta la semana de descarga.',
    'Calienta 5 min y haz 1–2 series de aproximación.',
  ],
  strength: [
    'Prioriza la técnica en los básicos y descansa lo suficiente entre series (2–3 min).',
    'Registra cada sesión: la progresión de cargas es la clave.',
    'Duerme 7–9 h y respeta la semana de descarga.',
  ],
  health: [
    'La constancia importa más que la intensidad: intenta no saltarte más de una sesión seguida.',
    'Camina a diario y añade movilidad 5–10 min tras entrenar.',
    'Duerme 7–9 h y bebe agua a lo largo del día.',
  ],
}

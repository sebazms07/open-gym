// Curación del catálogo: de ~5.600 ejercicios deja una base de gimnasio y calistenia.
//
// 1. Filtra equipo de gimnasio y categorías de entrenamiento (fuera bandas, fitball,
//    bosu, yoga, pilates, rehabilitación, estiramientos…) y variantes ("v. 2", "(male)").
// 2. Puntúa cada ejercicio: aparece en listas de ejercicios comunes (free-exercise-db,
//    everkinetic), es un clásico de ExerciseDB, nombre corto, equipo habitual.
// 3. Elige los mejores por músculo objetivo con cupos, sin duplicados de nombre.
// 4. Añade siempre los imprescindibles y los ejercicios usados por el plan y las plantillas.
import { readFileSync } from 'node:fs'

const GYM_EQUIPMENT = new Set([
  'barbell', 'dumbbell', 'cable', 'leverage machine', 'smith machine', 'sled machine', 'ez barbell',
  'body weight', 'kettlebell', 'weighted', 'assisted', 'trap bar', 'olympic barbell', 'stationary bike',
  'elliptical machine', 'stepmill machine', 'skierg machine', 'wheel roller', 'weight plate', 'rope',
  'medicine ball', 'landmine',
])
const CATEGORIES = new Set(['strength', 'calisthenics', 'plyometrics', 'cardio', 'isometric', 'olympic'])
const EXCLUDE = /v\. ?\d|\((male|female)\)|\bmale\b|\bfemale\b|version|stability ball|exercise ball|bosu|\bband\b|towel|chair|\bbed\b|sofa|suspen|\bwall\b|\bstep ?box\b|\bfoam\b|\bsheet\b/i

// Ejercicios poco habituales o confusos que la puntuación deja pasar.
const ODD = new Set([
  'quads', 'spell caster', 'cocoons', 'butt-ups', 'otis up', 'bottoms-up', 'cable judo flip', 'elevator', 'kick out sit',
  'single leg platform slide', 'push to run', 'swing 360', 'superman w', 'frankenstein squat', 'dumbbell lying femoral',
  'assisted prone hamstring', 'barbell weightlifting complex', 'isometric wipers', 'body-up', 'side push-up',
  'dumbbell biceps curl squat', 'back and forth step', 'wheel run', 'run (equipment)', 'squat jerk', 'kettlebell figure 8',
  'kettlebell double windmill', 'quadruped leg curl', 'monster walk', 'wind sprints', 'lying scissors cross',
  'side lying feet raise', 'barbell standing leg calf raise', 'scapula dips', 'lever gripless shrug', 'one handed hang',
  'finger curls', 'dumbbell lying pronation', 'dumbbell lying supination', 'barbell front raise and pullover',
  'raise single arm push-up', 'kipping muscle up', 'side-to-side chin', 'cable incline pushdown', 'dumbbell iron cross',
  'standing behind neck press', 'barbell guillotine bench press', 'push-up close-grip off dumbbell', 'short stride run',
  'skater hops', 'ski step', 'cycle cross trainer', 'double leg butt kick', 'single leg butt kick', 'jack burpee',
  'bench pull-ups', 'rear pull-up', 'wide grip rear pull-up', 'l-pull-up', 'single leg push off', 'single leg stride jump',
  'rocket jump', 'sit squat', 'dumbbell supported squat', 'barbell bench front squat', 'barbell bench squat',
  'aquabike', 'frogger', 'l drill', 't drill', 'x drill', 'prancing', 'place jog', 'low jacks', 'shuffle', 'skips',
  'weighted reduction triangle', 'barbell squat (on knees)', 'dumbbell jump box', 'cable twisting pull',
  'barbell standing rocking leg calf raise', 'lever gripper hands', 'dumbbell finger curls', 'swimmer hips',
  'self assisted inverse leg curl', 'cable assisted inverse leg curl', 'lever lying two-one leg curl', 'frog sit up',
  'smith toe raise', 'barbell front bench squat', 'squat to overhead reach', 'backward jump', 'jump split',
])

// Cupos por músculo objetivo (suman ~520).
const QUOTA = {
  pectorals: 42, delts: 42, lats: 26, 'upper back': 30, traps: 10, biceps: 34, triceps: 34, forearms: 8,
  abs: 48, quads: 42, glutes: 36, hamstrings: 26, calves: 16, adductors: 8, abductors: 6, spine: 8,
  'serratus anterior': 4, 'cardiovascular system': 18, 'levator scapulae': 0,
}

// Imprescindibles de gimnasio y calistenia (nombre exacto en el catálogo).
export const ESSENTIALS = [
  // pecho
  'barbell bench press', 'barbell incline bench press', 'barbell decline bench press', 'dumbbell bench press',
  'dumbbell incline bench press', 'dumbbell fly', 'cable cross-over variation', 'lever pec deck fly', 'chest dip',
  'lever chest press', 'push-up', 'diamond push-up', 'incline push-up', 'decline push-up', 'wide hand push up', 'clap push up',
  // pierna
  'barbell full squat', 'barbell front squat', 'dumbbell goblet squat', 'sled 45° leg press', 'sled hack squat',
  'lever leg extension', 'lever lying leg curl', 'lever seated leg curl', 'barbell deadlift', 'barbell romanian deadlift',
  'dumbbell romanian deadlift', 'trap bar deadlift', 'barbell sumo deadlift', 'barbell hip thrust', 'barbell glute bridge',
  'lever hip thrust', 'dumbbell lunge', 'walking lunge', 'dumbbell bulgarian split squat', 'dumbbell step-up',
  'lever standing calf raise', 'lever seated calf raise', 'barbell good morning', 'hyperextension',
  'lever seated hip abduction', 'lever seated hip adduction', 'jump squat', 'single leg squat with support (pistol)',
  // espalda
  'pull-up', 'chin-up', 'wide grip pull-up', 'muscle up', 'inverted row', 'assisted pull-up', 'cable pulldown',
  'cable bar lateral pulldown', 'cable seated row', 'cable seated wide-grip row', 'barbell bent over row',
  'dumbbell one arm bent-over row', 'lever t bar row', 'lever seated row', 'cable straight arm pulldown',
  // hombro y brazos
  'barbell seated overhead press', 'barbell standing military press', 'dumbbell standing overhead press',
  'dumbbell seated shoulder press', 'dumbbell arnold press', 'dumbbell lateral raise', 'cable lateral raise',
  'cable one arm lateral raise', 'dumbbell front raise', 'dumbbell rear fly', 'cable rear delt row (with rope)',
  'cable standing face pull (with rope)', 'barbell upright row', 'dumbbell shrug', 'barbell shrug', 'handstand push-up',
  'barbell curl', 'ez barbell curl', 'dumbbell biceps curl', 'dumbbell hammer curl', 'dumbbell incline curl',
  'dumbbell concentration curl', 'cable curl', 'barbell preacher curl', 'cable pushdown', 'cable triceps pushdown (v-bar)',
  'cable overhead triceps extension (rope attachment)', 'barbell lying triceps extension skull crusher', 'triceps dip',
  'bench dip (knees bent)', 'dumbbell kickback', 'close-grip push-up',
  // core y calistenia
  'front plank', 'side plank', 'weighted front plank', 'hanging leg raise', 'hanging knees to elbows', 'crunch floor',
  'cable kneeling crunch', 'russian twist', 'bicycle crunch', 'mountain climber', 'dead bug', 'wheel rollout with wall support',
  'l-sit on floor', 'leg raise dragon flag', 'v up', 'sit up', 'lying leg raise flat bench', 'superman',
  // cardio y acondicionamiento
  'burpee', 'jumping jack', 'box jump drop 2 foot land', 'kettlebell swing', 'farmers walk', 'stationary bike run v. 3',
  'walk elliptical cross trainer', 'run on treadmill', 'rowing (with rowing machine)', 'jump rope', 'high knee skips',
  'power sled push',
]

const SYN = {
  dumbbells: 'dumbbell', lever: 'machine', leverage: 'machine', pullup: 'pull up', pullups: 'pull up', pushup: 'push up',
  pushups: 'push up', ups: 'up', curls: 'curl', raises: 'raise', rows: 'row', squats: 'squat', lunges: 'lunge',
  presses: 'press', extensions: 'extension', flyes: 'fly', flys: 'fly', flies: 'fly', deadlifts: 'deadlift',
  crunches: 'crunch', dips: 'dip', shrugs: 'shrug', using: '', with: '', the: '', a: '', on: '', of: '', to: '',
}
const tokens = (s) =>
  new Set(
    s.toLowerCase().replace(/-/g, ' ').replace('dead lift', 'deadlift')
      .match(/[a-z0-9]+/g)?.map((t) => SYN[t] ?? t).join(' ').split(' ').filter(Boolean) ?? [],
  )
const jaccard = (a, b) => {
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

/**
 * @param all ejercicios en formato compacto (ver fetch-catalogue.mjs)
 * @param forcedIds ids que deben quedar sí o sí (plan, plantillas)
 * @returns Set de ids curados
 */
export function curate(all, forcedIds, refPath) {
  const refs = JSON.parse(readFileSync(refPath, 'utf8')).names.map(tokens)
  const common = (e) => {
    const t = tokens(e.en)
    let best = 0
    for (const r of refs) best = Math.max(best, jaccard(t, r))
    return best
  }
  const words = (e) => e.en.split(/\s+/).length
  const score = (e) => {
    const c = common(e)
    let s = c >= 0.8 ? 4 : c >= 0.67 ? 2 : 0
    if (e.l === 'es') s += 2
    const w = words(e)
    s += w <= 3 ? 2 : w === 4 ? 1 : w >= 7 ? -2 : w >= 6 ? -1 : 0
    if (['barbell', 'dumbbell', 'cable', 'leverage machine', 'body weight', 'sled machine', 'smith machine', 'ez barbell'].includes(e.e)) s += 1
    if (e.c === 'strength' || e.c === 'calisthenics') s += 1
    return s
  }

  const candidates = all.filter((e) => GYM_EQUIPMENT.has(e.e) && CATEGORIES.has(e.c) && !EXCLUDE.test(e.en) && !EXCLUDE.test(e.n) && !ODD.has(e.en))
  const ranked = candidates.map((e) => ({ e, s: score(e) })).sort((a, b) => b.s - a.s || a.e.en.length - b.e.en.length)

  const byName = new Map()
  for (const e of all) if (!byName.has(e.en)) byName.set(e.en, e) // el primero (id más bajo) gana
  const chosen = new Set(forcedIds)
  const seenNames = new Set()
  const missing = []
  const forcedNames = new Set([...chosen].map((id) => all.find((x) => x.id === id)?.en))
  for (const n of ESSENTIALS) {
    const e = byName.get(n)
    if (!e) missing.push(n)
    else if (!forcedNames.has(n)) chosen.add(e.id)
  }
  // clave para detectar duplicados: nombre en inglés sin plurales ni signos
  const dupKey = (e) => e.en.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').map((w) => w.replace(/s$/, '')).join(' ')
  for (const id of chosen) {
    const e = all.find((x) => x.id === id)
    if (e) seenNames.add(dupKey(e)).add(e.n.toLowerCase())
  }

  const used = {}
  for (const id of chosen) {
    const t = all.find((x) => x.id === id)?.t
    if (t) used[t] = (used[t] ?? 0) + 1
  }
  for (const { e, s } of ranked) {
    if (chosen.has(e.id) || s < 3) continue
    const quota = QUOTA[e.t] ?? 0
    if ((used[e.t] ?? 0) >= quota) continue
    if (seenNames.has(dupKey(e)) || seenNames.has(e.n.toLowerCase())) continue // duplicado
    chosen.add(e.id)
    seenNames.add(dupKey(e)).add(e.n.toLowerCase())
    used[e.t] = (used[e.t] ?? 0) + 1
  }
  return { ids: chosen, missing, used }
}

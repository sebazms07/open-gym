// Descarga el catálogo de ejercicios de openGym (solo texto, sin media) y genera
// public/data/exercises.json en formato compacto para la app.
//
// Uso: npm run catalogue            (clona openGym en un directorio temporal)
//      npm run catalogue -- <ruta>  (usa una copia local del repo openGym)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { curate } from './curate.mjs'

const REPO = 'https://github.com/DuarteSantos8/openGym.git'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let repoDir = process.argv[2]
let tmp
if (!repoDir) {
  tmp = mkdtempSync(join(tmpdir(), 'opengym-'))
  repoDir = join(tmp, 'repo')
  const git = (...args) => execFileSync('git', args, { stdio: 'inherit' })
  git('clone', '--depth', '1', '--filter=blob:none', '--sparse', REPO, repoDir)
  git('-C', repoDir, 'sparse-checkout', 'set', '--no-cone', '/catalogue/exercises/', '/catalogue/i18n/es.json')
}

const exDir = join(repoDir, 'catalogue', 'exercises')
const es = JSON.parse(readFileSync(join(repoDir, 'catalogue', 'i18n', 'es.json'), 'utf8'))
const commit = execFileSync('git', ['-C', repoDir, 'rev-parse', '--short', 'HEAD']).toString().trim()

/** Mapa muscular corregido por openGym → { músculo: peso 0–1 } */
function muscleWeights(mm) {
  if (!mm?.primaries?.length) return null
  if (mm.weights) return Object.fromEntries(Object.entries(mm.weights).filter(([, w]) => w > 0))
  return Object.fromEntries([...mm.primaries.map((m) => [m, 1]), ...(mm.secondaries ?? []).map((m) => [m, 0.5])])
}

const exercises = []
for (const file of readdirSync(exDir).filter((f) => f.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(join(exDir, file), 'utf8'))
  if (d.variantOf || !d.name) continue // variantes (solo cambian la media) y entradas vacías
  const t = es[d.id] ?? {}
  exercises.push({
    id: d.id,
    n: t.name ?? d.name, // nombre en español (fallback inglés)
    en: d.name,
    b: d.bodyPart,
    e: d.equipment,
    t: d.target,
    s: d.secondaryMuscles ?? [],
    c: d.category,
    d: t.description ?? d.description ?? '',
    i: t.instructions ?? d.instructions ?? [],
    l: t.instructions ? 'es' : 'en', // idioma de las instrucciones
    ...(muscleWeights(d.muscleMap) ? { m: muscleWeights(d.muscleMap) } : {}),
  })
}

// Ejercicios que usan el generador de planes y las plantillas: siempre se conservan.
const forcedIds = new Set(
  ['src/lib/program.ts', 'src/data/templates.ts'].flatMap((f) => readFileSync(join(root, f), 'utf8').match(/'(\d{4,5})'/g) ?? []).map((m) => m.slice(1, -1)),
)
const { ids, missing, used } = curate(exercises, forcedIds, join(root, 'scripts', 'reference-names.json'))
if (missing.length) console.warn(`⚠ imprescindibles no encontrados: ${missing.join(', ')}`)
for (const id of forcedIds) if (!exercises.some((e) => e.id === id)) console.warn(`⚠ id del plan inexistente: ${id}`)

// Los no curados se guardan en versión mínima y ocultos (x: 1): no salen en la guía,
// pero el historial puede seguir mostrando su nombre y músculos.
const output = exercises.map((e) => (ids.has(e.id) ? e : { id: e.id, n: e.n, en: e.en, b: e.b, e: e.e, t: e.t, x: 1 }))

const outDir = join(root, 'public', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(
  join(outDir, 'exercises.json'),
  JSON.stringify({ source: `openGym@${commit}`, generated: new Date().toISOString().slice(0, 10), exercises: output }),
)
console.log(`✔ ${ids.size} ejercicios curados (de ${exercises.length}) → public/data/exercises.json (openGym@${commit})`)
console.log('  por músculo:', Object.entries(used).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '))
if (tmp) rmSync(tmp, { recursive: true, force: true })

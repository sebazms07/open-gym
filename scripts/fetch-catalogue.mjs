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
  })
}

const outDir = join(root, 'public', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(
  join(outDir, 'exercises.json'),
  JSON.stringify({ source: `openGym@${commit}`, generated: new Date().toISOString().slice(0, 10), exercises }),
)
console.log(`✔ ${exercises.length} ejercicios → public/data/exercises.json (openGym@${commit})`)
if (tmp) rmSync(tmp, { recursive: true, force: true })

import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { Exercise } from '../types'
import { normalize } from '../lib/util'

export const useCatalogue = defineStore('catalogue', () => {
  const list = shallowRef<Exercise[]>([])
  const byId = shallowRef(new Map<string, Exercise>())
  /** texto normalizado para búsqueda, mismo orden que `list` */
  let haystack: string[] = []
  const source = shallowRef('')

  async function load() {
    const res = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`)
    if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`)
    const data: { source: string; exercises: Exercise[] } = await res.json()
    // los ocultos vienen en versión mínima: se completan para que el resto de la app no falle
    const all = data.exercises.map((e) => (e.x ? Object.assign({ s: [], c: '', d: '', i: [], l: 'en' as const }, e) : e))
    // la guía solo muestra el catálogo curado, en orden alfabético
    const sorted = all.filter((e) => !e.x).sort((a, b) => a.n.localeCompare(b.n, 'es'))
    haystack = sorted.map((e) => normalize(`${e.n} ${e.en}`))
    list.value = sorted
    byId.value = new Map(all.map((e) => [e.id, e]))
    source.value = data.source
  }

  const get = (id: string) => byId.value.get(id)
  const name = (id: string) => byId.value.get(id)?.n ?? `Ejercicio ${id}`

  interface Filters {
    q?: string
    bodyPart?: string
    equipment?: string
    category?: string
  }
  function search({ q = '', bodyPart, equipment, category }: Filters) {
    const terms = normalize(q).split(/\s+/).filter(Boolean)
    const out: Exercise[] = []
    list.value.forEach((e, i) => {
      if (bodyPart && e.b !== bodyPart) return
      if (equipment && e.e !== equipment) return
      if (category && e.c !== category) return
      if (terms.length && !terms.every((t) => haystack[i].includes(t))) return
      out.push(e)
    })
    if (!terms.length) return out
    // relevancia: empieza por la búsqueda > la contiene como frase > resto; luego los clásicos
    // (con instrucciones en español) y los nombres más cortos
    const phrase = terms.join(' ')
    const score = (e: Exercise) => {
      const n = normalize(e.n)
      return (n.startsWith(phrase) ? 0 : n.includes(phrase) ? 1000 : 2000) + n.length - (e.l === 'es' ? 30 : 0)
    }
    return out.map((e) => [score(e), e] as const).sort((a, b) => a[0] - b[0]).map(([, e]) => e)
  }

  return { list, source, load, get, name, search }
})

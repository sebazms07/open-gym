import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import media from '../data/media.json'
import { generatorExerciseIds } from './program'

describe('media de ejercicios', () => {
  it('cada ejercicio del plan generado tiene sus dos imágenes', () => {
    for (const id of generatorExerciseIds()) {
      expect(media, id).toHaveProperty(id)
      for (const f of [0, 1]) expect(existsSync(new URL(`../../public/media/${id}/${f}.jpg`, import.meta.url)), `${id}/${f}`).toBe(true)
    }
  })
})

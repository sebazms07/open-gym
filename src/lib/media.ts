// Imágenes de inicio/fin por ejercicio (public/media/<id>/0.jpg y 1.jpg).
// ek = everkinetic (ilustraciones, CC BY-SA 4.0) · fedb = free-exercise-db (fotos, dominio público)
import media from '../data/media.json'

export interface Media {
  src: 'ek' | 'fedb'
  ref: string
}

const MEDIA = media as Record<string, Media>

export const mediaFor = (id: string): Media | undefined => MEDIA[id]
export const frameUrl = (id: string, i: 0 | 1) => `${import.meta.env.BASE_URL}media/${id}/${i}.jpg`

export const mediaCredit = (m: Media) =>
  m.src === 'ek'
    ? { text: 'Ilustración: everkinetic · CC BY-SA 4.0', url: 'https://github.com/everkinetic/data' }
    : { text: 'Foto: free-exercise-db · dominio público', url: 'https://github.com/yuhonas/free-exercise-db' }

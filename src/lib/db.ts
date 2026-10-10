import { get, set, del } from 'idb-keyval'
import { toRaw, watch, type Ref } from 'vue'

/** Carga `key` desde IndexedDB en `state` y guarda cada cambio posterior. */
export async function persist<T>(key: string, state: Ref<T>) {
  try {
    const saved = await get<T>(key)
    if (saved !== undefined) state.value = saved
  } catch (e) {
    console.error(`No se pudo leer "${key}"`, e)
  }
  watch(
    state,
    (v) => {
      // structuredClone sobre el objeto crudo: IndexedDB no acepta proxies reactivos
      set(key, structuredClone(deepRaw(v))).catch((e) => console.error(`No se pudo guardar "${key}"`, e))
    },
    { deep: true },
  )
}

export const removeKey = (key: string) => del(key)

function deepRaw<T>(v: T): T {
  const raw = toRaw(v)
  if (Array.isArray(raw)) return raw.map(deepRaw) as T
  if (raw && typeof raw === 'object') {
    return Object.fromEntries(Object.entries(raw).map(([k, x]) => [k, deepRaw(x)])) as T
  }
  return raw
}

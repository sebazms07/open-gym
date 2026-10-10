import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { useCatalogue } from './stores/catalogue'
import { useSettings } from './stores/settings'
import { usePlan } from './stores/plan'
import { useWorkouts } from './stores/workouts'

const app = createApp(App).use(createPinia()).use(router)

// Carga datos locales y catálogo antes de montar para evitar parpadeos.
Promise.all([useCatalogue().load(), useSettings().ready, usePlan().ready, useWorkouts().ready])
  .then(() => app.mount('#app'))
  .catch((e: Error) => {
    document.getElementById('app')!.innerHTML =
      `<div class="page"><h1>No se pudo iniciar</h1><p class="muted">${e.message}</p><button class="btn" onclick="location.reload()">Reintentar</button></div>`
  })

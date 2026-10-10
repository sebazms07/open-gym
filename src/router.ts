import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history: funciona en GitHub Pages sin configuración de servidor.
export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: '/', name: 'today', component: () => import('./views/TodayView.vue') },
    { path: '/plan', name: 'plan', component: () => import('./views/PlanView.vue') },
    { path: '/plan/rutina/:id', name: 'routine', component: () => import('./views/RoutineEditor.vue'), props: true },
    { path: '/guia', name: 'guide', component: () => import('./views/GuideView.vue') },
    { path: '/ejercicio/:id', name: 'exercise', component: () => import('./views/ExerciseDetail.vue'), props: true },
    { path: '/entreno', name: 'workout', component: () => import('./views/WorkoutSession.vue') },
    { path: '/progreso', name: 'progress', component: () => import('./views/ProgressView.vue') },
    { path: '/ajustes', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

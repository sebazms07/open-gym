# Open Gym — registro, guía y plan semanal

Web app móvil (PWA) para llevar el registro de tus entrenamientos en el gimnasio, consultar una guía
de más de 5.600 ejercicios en español y seguir un plan semanal personalizable con progresión automática.

- **Inicio**: calendario de la semana, la sesión de hoy (o la que se movió), fase del programa, peso corporal con meta y racha semanal.
- **Mi objetivo**: perfil, meta (bajar grasa, músculo, fuerza o salud), días disponibles y duración → genera el plan, con fases de 4 semanas (carga, sobrecarga y descarga), calorías y proteína orientativas.
- **Sesiones movidas**: si faltas a un día de entreno, la sesión pasa al siguiente día disponible.
- **Mapa muscular**: cada ejercicio muestra los músculos que trabaja; en Estadísticas, el balance muscular por series.
- **Entreno**: series de peso × reps, el peso sugerido de la sesión anterior, temporizador de descanso con vibración y notas.
- **Plan**: rutinas personalizables (ejercicios, series, rango de reps, descanso), asignadas a cada día, con plantillas iniciales (Full body 3 días, Torso/Pierna 4 días, PPL 6 días).
- **Guía**: búsqueda y filtros por zona, equipo y tipo; instrucciones paso a paso y tu historial en cada ejercicio.
- **Estadísticas**: entrenos, racha, mapa de actividad, balance muscular, historial, gráficos y peso.
- **Progresión doble**: cuando completas todas las series en el tope del rango, te sugiere subir el peso.

Los datos se guardan **solo en tu teléfono** (IndexedDB). Exporta un respaldo JSON desde *Ajustes*.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas unitarias (Vitest)
npm run build      # build de producción en dist/
npm run catalogue  # vuelve a descargar el catálogo de openGym
```

Stack: Vue 3 + Vite + TypeScript, Pinia, Vue Router (hash), idb-keyval, Chart.js y vite-plugin-pwa.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (p. ej. `open-gym`) y sube el código:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/open-gym.git
   git push -u origin main
   ```
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada push a `main` ejecuta `.github/workflows/deploy.yml` (pruebas, build y despliegue).
   La app queda en `https://<tu-usuario>.github.io/open-gym/`.
4. En el teléfono abre la URL y usa **Compartir → Añadir a pantalla de inicio** (iPhone) o
   **⋮ → Instalar app** (Android). Funciona sin conexión.

## Licencia

AGPL-3.0. El catálogo de ejercicios proviene de [openGym](https://github.com/DuarteSantos8/openGym); ver [NOTICE.md](NOTICE.md).

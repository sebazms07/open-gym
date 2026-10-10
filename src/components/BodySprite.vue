<script setup lang="ts">
// Siluetas del cuerpo (MuscleMap © Melih Colpan, MIT, vía openGym). Se dibujan una sola vez
// como <defs>; cada figura las reutiliza con <use>, así cien miniaturas siguen siendo ligeras.
import paths from '../data/body-paths.json'

type View = { vb: string; p: Record<string, string[]> }
const defs = Object.entries(paths as Record<string, Record<string, View>>).flatMap(([sex, sides]) =>
  Object.entries(sides).flatMap(([side, view]) =>
    Object.entries(view.p).map(([part, ds]) => ({ id: `bp-${sex}-${side}-${part}`, ds })),
  ),
)
</script>

<template>
  <svg width="0" height="0" style="position: absolute" aria-hidden="true">
    <defs>
      <g v-for="d in defs" :id="d.id" :key="d.id"><path v-for="(p, i) in d.ds" :key="i" :d="p" /></g>
    </defs>
  </svg>
</template>

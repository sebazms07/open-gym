# Avisos de terceros

## Catálogo de ejercicios — openGym

`public/data/exercises.json` se genera con `npm run catalogue` a partir de la carpeta
`catalogue/` de [openGym](https://github.com/DuarteSantos8/openGym) (© Duarte Santos y colaboradores).

- Las descripciones, las traducciones y los ejercicios añadidos por openGym están bajo **AGPL-3.0**;
  por eso este proyecto también se distribuye bajo AGPL-3.0 (ver `LICENSE`).
- Los nombres, músculos e instrucciones de los ejercicios marcados originalmente como
  `textSource: "exercisedb"` provienen de [ExerciseDB v1](https://exercisedb.dev/) (AscendAPI) vía
  [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), bajo licencia **MIT**.

Las imágenes y animaciones de openGym (© Gym visual) **no** se incluyen: su licencia solo permite
usarlas dentro de openGym.

## Siluetas del mapa muscular — MuscleMap

`src/data/body-paths.json` procede de `frontend/src/lib/body-paths.js` de openGym, que las convirtió
de [MuscleMap](https://github.com/melihcolpan/MuscleMap) de Melih Colpan, bajo licencia MIT:

```
MIT License

Copyright (c) 2026 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

El diseño visual (tema oscuro, acento verde, navegación con botón central) está inspirado en openGym.

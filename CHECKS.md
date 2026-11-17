# Mis comprobaciones

Uso Node.js 24. Desde la raíz ejecuto:

```sh
node --test automation-api/api.test.mjs document-fingerprint/hash.test.mjs web-panel/tests/filter.test.mjs integration-lab/test/*.test.mjs
cd web-panel
npm ci
npm run typecheck
npm run build
```

El 8 de noviembre de 2026 verifiqué las 7 pruebas originales, TypeScript y la compilación con resultado aprobado. También probé la CLI desde un directorio diferente.

El 17 de noviembre de 2026 completé la revisión visual e interactiva del panel en escritorio (1200 × 800) y móvil (390 × 844). Verifiqué búsqueda, filtros por estado, estado vacío, restablecimiento repetido y recarga, sin desbordamiento horizontal ni errores de página. Volví a aprobar las 67 pruebas, TypeScript y la compilación de producción.

El 8 de noviembre de 2026 volví a ejecutar la suite conjunta en la Mac: **67 de 67 pruebas aprobadas**. También ejecuté la demostración del laboratorio: CSV con 4 registros válidos y 2 rechazados, firma válida y repetición rechazada, y flujo con reintento hasta éxito.

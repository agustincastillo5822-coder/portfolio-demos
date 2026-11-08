# Mis comprobaciones

Uso Node.js 24. Desde la raíz ejecuto:

```sh
node --test automation-api/api.test.mjs document-fingerprint/hash.test.mjs web-panel/tests/filter.test.mjs
cd web-panel
npm ci
npm run typecheck
npm run build
```

El 8 de noviembre de 2026 verifiqué las 7 pruebas originales, TypeScript y la compilación con resultado aprobado. También probé la CLI desde un directorio diferente.

Mantengo pendiente la validación visual y de interacciones del panel: Chromium encontró una restricción de socket en el entorno de preparación. El alcance verificado hasta aquí es ejecución local, lógica, tipos y compilación.

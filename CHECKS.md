# Verificación reproducible

Requiere Node.js 24.

Desde la raíz:

```sh
node --test automation-api/api.test.mjs document-fingerprint/hash.test.mjs web-panel/tests/filter.test.mjs
cd web-panel
npm ci
npm run typecheck
npm run build
```

Resultado local del 8 de noviembre de 2026: 7 pruebas aprobadas, tipo y compilación aprobados. El verificador CLI se prueba con ruta independiente del directorio actual. La revisión visual y las pruebas de navegador todavía no están completadas. No se realizó despliegue público.

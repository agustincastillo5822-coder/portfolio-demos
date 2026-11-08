# Panel de solicitudes
Demo original React, Next.js y TypeScript. Datos ficticios incluidos; no conecta con la API ni ejecuta tareas. Filtros de texto y estado, contador, vacío y restablecimiento. Sin persistencia: recargar restablece los filtros.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run start -- --port 3058
```
Abrir http://127.0.0.1:3058 . Node.js 24 usado en la verificación.

El test opcional `node tests/browser.mjs` espera servidor en ese puerto y Chromium en /usr/bin/chromium; adaptar executablePath a la instalación local. El navegador no pudo iniciarse en el entorno de preparación por restricciones de socket. Por eso las interacciones y la adaptación visual móvil **no se declaran verificadas** todavía. Build, tipos y filtrado sí se verificaron.

No usa fotos, logos ni assets empresariales. Estilo CSS original inspirado en un concepto generado para esta demo. No requiere servicios pagos ni claves.

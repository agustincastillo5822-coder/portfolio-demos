# Mi panel de solicitudes

Desarrollé esta demo con asistencia de IA usando React, Next.js y TypeScript. Muestro filtros por texto y estado, contador, estado vacío y restablecimiento con datos ficticios. Mantengo el estado en la interfaz durante la sesión.

## Cómo lo ejecuto

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run start -- --port 3058
```

Abro http://127.0.0.1:3058 con Node.js 24.

## Mis comprobaciones

Verifiqué filtrado, tipos, compilación y el recorrido visual e interactivo en escritorio y móvil. Probé búsqueda, estado vacío, filtros combinados, restablecimiento y recarga. Incluyo `tests/browser.mjs` para repetir estas comprobaciones con el servidor en el puerto 3058.

```sh
npx playwright install chromium
node tests/browser.mjs
```

Puedo usar una instalación existente mediante `CHROMIUM_PATH` y otro servidor local mediante `PANEL_BASE_URL`.

Diseñé el CSS para esta demo y uso muestras ficticias. La integración con una API y la persistencia entre sesiones quedan como extensiones posteriores.

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

Verifiqué filtrado, tipos y compilación. Tengo pendiente la validación visual móvil y de interacciones: Chromium encontró una restricción de socket en el entorno de preparación. Incluyo `tests/browser.mjs` para ejecutarlo con el servidor en el puerto 3058 y ajustar `executablePath` a una instalación autorizada de Chromium.

Diseñé el CSS para esta demo y uso muestras ficticias. La integración con una API y la persistencia entre sesiones quedan como extensiones posteriores.

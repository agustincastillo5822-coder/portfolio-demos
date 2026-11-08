# Mi laboratorio de integraciones

Muestro cómo separo validación de datos, autenticidad de eventos y reglas de ejecución en tres módulos pequeños y verificables. Construí estos ejemplos originales con asistencia de IA, módulos nativos de Node.js y datos artificiales para ejecución local.

## Lo ejecuto localmente

Uso Node.js 24 y sus módulos integrados. Desde esta carpeta ejecuto:

```sh
npm test
npm run demo
npm run test:coverage
```

También puedo ejecutar `node --test` y `node examples/run.mjs` directamente. Mi demostración lee únicamente el CSV sintético incluido e imprime resultados en la terminal.

## Valido y resumo archivos CSV

En [`src/csv.mjs`](src/csv.mjs) leo campos entre comillas, comas escapadas mediante comillas, comillas dobles escapadas, saltos de línea y BOM. Exijo el encabezado `id,category,quantity,unit_price`, en ese orden. Rechazo el archivo si su estructura de comillas o su encabezado no cumplen el contrato; separo los errores de cada registro sin descartar los registros válidos.

- Admito identificadores de hasta 40 caracteres alfanuméricos, guiones o guiones bajos. Conservo la primera aparición válida y rechazo las siguientes.
- Normalizo los espacios exteriores de las categorías y admito hasta 80 caracteres sin controles.
- Admito cantidades enteras de 1 a 100.000 y precios de 0 a 999.999,99, escritos con punto decimal y hasta dos decimales, sin separadores de miles.
- Calculo importes en centavos enteros y rechazo una fila si su suma supera el entero seguro de JavaScript. Uso una unidad monetaria abstracta para los datos artificiales.
- Limito la entrada a 1.000.000 de caracteres, 10.000 registros más encabezado y 4.000 caracteres por campo. Reporto números de registro lógico, no números de línea física.

Con mi fixture obtengo **4 registros válidos, 2 rechazados, 8 unidades y 47.175 centavos**. Agrupo los totales por categoría; incluyo un identificador repetido y una cantidad negativa para mostrar rechazos.

## Verifico eventos firmados

En [`src/webhook.mjs`](src/webhook.mjs) firmo `timestamp + "." + bytes originales del cuerpo` con HMAC SHA-256. Valido el formato `sha256=<64 caracteres hexadecimales minúsculos>` y comparo las firmas con `timingSafeEqual`.

- Uso segundos Unix canónicos, una antigüedad máxima de 300 segundos y una tolerancia futura de 30 segundos por defecto. Incluyo los bordes de ambas ventanas.
- Exijo un cuerpo `Buffer` de hasta 64 KiB y una clave `Buffer` de al menos 32 bytes. Para la demo uso una clave artificial y conocida, destinada únicamente a la demostración.
- Rechazo firmas repetidas mientras permanezcan dentro de la ventana válida. Limito el registro en memoria a 1.000 firmas y rechazo nuevos eventos si se llena.
- Inyecto el reloj en las pruebas y rechazo un reloj que retrocede. En el uso normal tomo la hora del proceso como reloj de verificación.

Mantengo el registro de firmas en memoria por instancia, durante la vida del proceso. Identifico repeticiones por firma. Para una integración con un proveedor adaptaría su protocolo e incorporaría almacenamiento atómico compartido, deduplicación por evento de negocio, rotación de secretos, TLS, controles de acceso y observabilidad.

## Modelo ejecuciones con reintentos

En [`src/workflow.mjs`](src/workflow.mjs) devuelvo una instantánea nueva e inmutable en cada transición. Uso seis estados: `pending`, `running`, `waiting_retry`, `succeeded`, `failed` y `cancelled`.

- Inicio desde `pending` o `waiting_retry` y cuento cada intento al comenzar.
- Ante una falla paso a `waiting_retry`; al agotar `maxAttempts` paso a `failed`. Admito de 1 a 10 intentos totales, incluido el primero.
- Completo únicamente desde `running`; permito cancelar desde cualquier estado no terminal.
- Rechazo eventos incompatibles y cualquier transición posterior a éxito, falla definitiva o cancelación.
- Mantengo un contador de revisión y una razón acotada para las fallas. Represento las transiciones mediante una función pura.

Uso este módulo para mostrar reglas deterministas en memoria. Para persistirlo incorporaría transacciones, control de concurrencia por revisión, autorización y planificación de reintentos. Valido la estructura y coherencia de cada instantánea; su autenticidad requiere controles de almacenamiento y acceso.

## Compruebo fallas y límites

Con `node:test` verifico rutas correctas, CSV mal formado, duplicados, valores inválidos, desbordes, alteraciones de firmas, ventanas temporales, repetición, capacidad de memoria, cancelaciones y agotamiento de intentos. Uso únicamente módulos nativos de Node.js.

Mantengo mis archivos separados en `src/`, `test/`, `examples/` y `fixtures/`. Comparto una demostración ejecutable de estas decisiones de diseño con fixtures sintéticos y código original.

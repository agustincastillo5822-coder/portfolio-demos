# API de solicitudes con idempotencia
Demo original con Node.js 24 y SQLite incluido en Node, sin dependencias de terceros.

## Ejecutar
```sh
node --test
node server.mjs
curl http://127.0.0.1:8787/requests -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-001' -d '{"title":"Generar informe de ejemplo","kind":"report"}'
```
Consultar el ID devuelto con `GET /requests/ID`. Repetir la misma clave y contenido devuelve la misma solicitud (200); cambiar contenido con la misma clave devuelve 409. Primera creación: 201. Datos persistidos en requests.sqlite en el directorio de ejecución.

Sólo admite title (1–120 caracteres al recortar) y kind (`report`, `integration`, `review`), claves alfanuméricas/guion/guion bajo de 1–80 caracteres y cuerpos JSON hasta 16 KiB. No modifica la solicitud al repetirla.

## Límites deliberados
Una instancia de Node; no es un sistema distribuido. No tiene autenticación, TLS, cuotas, historial de auditoría, workers ni envío de mensajes. Escucha sólo en loopback. Estado `queued` significa registro de una solicitud ficticia, no ejecución. La clave deduplica solicitudes, no garantiza efectos externos exactamente una vez. No exponer a Internet. SQLite se guarda en texto claro; usar sólo datos ficticios. La base no se incluye en el portfolio.

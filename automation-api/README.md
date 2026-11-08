# API de solicitudes con idempotencia
Desarrollé esta demo con asistencia de IA usando Node.js 24 y su SQLite integrado. Muestro cómo valido, registro y consulto solicitudes con idempotencia.

## Ejecutar
```sh
node --test
node server.mjs
curl http://127.0.0.1:8787/requests -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-001' -d '{"title":"Generar informe de ejemplo","kind":"report"}'
```
Consultar el ID devuelto con `GET /requests/ID`. Repetir la misma clave y contenido devuelve la misma solicitud (200); cambiar contenido con la misma clave devuelve 409. Primera creación: 201. Datos persistidos en requests.sqlite en el directorio de ejecución.

Sólo admite title (1–120 caracteres al recortar) y kind (`report`, `integration`, `review`), claves alfanuméricas/guion/guion bajo de 1–80 caracteres y cuerpos JSON hasta 16 KiB. Conservo la solicitud original al repetirla.

## Alcance técnico
Trabajo con una instancia local de Node y escucha en loopback. Registro solicitudes ficticias con estado `queued`; la clave de idempotencia identifica el registro persistido. Uso una base SQLite local en texto claro para datos de demostración.

Para un despliegue externo tendría que incorporar autenticación, TLS, cuotas, auditoría y gestión de workers, además de diseñar la coordinación entre instancias y efectos externos. Mantengo esta muestra para ejecución local con datos ficticios.

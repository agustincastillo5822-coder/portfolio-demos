# Huella de documentos local
Desarrollé esta utilidad con asistencia de IA para calcular SHA-256 en streaming. Proceso archivos localmente con Node.js 24.
```sh
node --test
node hash.mjs ./documento.pdf
node hash.mjs ./documento.pdf HASH_ESPERADO_DE_64_CARACTERES
```
Salida JSON: `sha256` y `matches` (null si no se pidió comparación). Códigos: 0 cálculo correcto/coincidencia, 1 diferencia, 2 entrada inválida o error de lectura.

Comparo los bytes del archivo con una huella de referencia confiable. El alcance es integridad binaria; las pruebas de autoría, identidad, fecha y validez legal requieren mecanismos adicionales. Leo únicamente el archivo indicado y necesito mantenerlo estable durante el cálculo para obtener un resultado consistente.

# Huella de documentos local
Utilidad original para calcular SHA-256 en streaming sin subir archivos a ningún servicio. Requiere Node.js 24.
```sh
node --test
node hash.mjs ./documento.pdf
node hash.mjs ./documento.pdf HASH_ESPERADO_DE_64_CARACTERES
```
Salida JSON: `sha256` y `matches` (null si no se pidió comparación). Códigos: 0 cálculo correcto/coincidencia, 1 diferencia, 2 entrada inválida o error de lectura.

Una coincidencia permite comparar bytes contra una huella de referencia confiable. **No demuestra autoría, identidad, fecha, origen, validez legal o autenticidad del contenido.** No usa blockchain, firma digital ni sello de tiempo. No modificar el archivo durante el cálculo; no se garantiza una instantánea consistente ante escrituras concurrentes. La CLI lee únicamente el archivo indicado; no escanea carpetas.

# Env Lens

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

Detecta configuraciones ausentes entre entornos sin incluir valores en el informe. Un CLI local convierte un contrato de claves y hasta tres archivos en una comparación sin conexión.

[Probar](https://jeffrog-256k1.github.io/env-lens/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![Env Lens](assets/preview.png)

## Ejecutar localmente

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/env-lens.git
cd env-lens
npm ci
npm run check -- --contract examples/contract.json --env local=examples/local.env.sample --env preview=examples/preview.env.sample --out reports/review
# Static fictional demo:
npm run build
npm run dev
```

El ejemplo devuelve **código 1** intencionalmente: faltan valores obligatorios o están vacíos. Abre reports/review/index.html directamente; report.json contiene los mismos datos sin valores. Sin --out, el JSON va a la salida estándar. Usa una carpeta nueva: nunca se sobrescriben carpetas existentes. Demo: http://127.0.0.1:4319.

## Cómo funciona

Declara claves en required y optional y pasa --env nombre=ruta de una a tres veces. La matriz distingue definida, vacía, ausente, duplicada y no válida, con búsqueda y filtro de problemas. --lang acepta en, ko, zh-CN, ja, es; el informe también permite cambiar el idioma.

Salida **0**: sin problemas bloqueantes. **1**: clave obligatoria vacía/ausente, duplicada o error de sintaxis. **2**: error de argumentos, entrada, contrato o salida. Las claves extra son advertencias; las opcionales vacías/ausentes no bloquean. Nunca se comparan ni validan valores, ni se muestran hashes o fragmentos.

```json
{ "version": 1, "required": ["APP_URL", "SESSION_SECRET"], "optional": ["LOG_LEVEL"] }
```

## Alcance y límites

Solo archivos UTF-8 normales elegidos explícitamente, hasta 64 KiB por archivo, 200 claves únicas entre contrato y entradas, tres entornos. Las claves usan letras ASCII, dígitos y guion bajo, sin empezar por un dígito. Las etiquetas de entorno permiten letras, dígitos, guion bajo y guion, hasta 32 caracteres. El contrato solo admite version, required y optional.

Admite KEY=value, prefijo export, líneas vacías, comentarios #, comillas simples/dobles de **una sola línea** y comentarios al final. Dentro de comillas, # es literal. Procesa escapes en comillas dobles; n/r/t escapados y valores con solo espacios cuentan como vacíos. No interpola ni ejecuta comandos. Los duplicados siempre bloquean. Comillas sin cerrar o valores multilínea generan un error y **detienen el análisis del resto**. No es un cargador dotenv completo.

Los nombres, etiquetas y números de línea permanecen: revísalos antes de compartir. Datos ficticios. Sin servicio de subida, sincronización, comparación de igualdad ni almacén de secretos.

## Desarrollo

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)

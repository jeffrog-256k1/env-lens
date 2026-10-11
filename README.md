# Env Lens

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

Find missing configuration across environments without exposing values. A local CLI turns a small key contract and up to three files into an offline comparison report.

[Try it](https://jeffrog-256k1.github.io/env-lens/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![Env Lens](assets/preview.png)

## Run locally

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

The example intentionally exits **1**: required values are empty or missing. Open reports/review/index.html directly. report.json contains the same value-free data. Without --out, JSON goes to stdout. Choose a new output folder each time; existing folders are never overwritten. The demo runs at http://127.0.0.1:4319.

## How it works

Declare required and optional keys. Pass --env name=path one to three times. The matrix distinguishes set, empty, missing, duplicate, and invalid assignments; search and “Only issues” narrow the review. --lang accepts en, ko, zh-CN, ja, es; the report also has a language selector.

Exit **0**: no blocking checks. **1**: a required key is empty/missing, a duplicate, or a syntax error. **2**: invalid arguments, input, contract, or output. Extra keys are warnings; missing/empty optional keys do not block. Values are never compared, hashed, validated, or partially displayed.

```json
{ "version": 1, "required": ["APP_URL", "SESSION_SECRET"], "optional": ["LOG_LEVEL"] }
```

## Scope and limits

Explicit UTF-8 regular files only, at most 64 KiB each, 200 unique keys across the contract and inputs, three environments. Names use ASCII letters/digits/underscore (not a leading digit); environment labels use letters/digits/underscore/hyphen, up to 32 characters. The contract permits only version, required, and optional.

Supported subset: KEY=value, optional export prefix, blank lines, # comments, single/double quotes on **one line**, and trailing comments. # inside quotes is literal. Double-quoted backslash escapes are consumed; escaped n/r/t and whitespace-only values count as empty. No interpolation or command execution. Duplicate keys always block. Unclosed quotes and multiline values block and **stop parsing the remaining lines**. This is intentionally not a complete dotenv/framework loader.

Key names, labels, and line numbers remain in reports. Review them before sharing. Sample data is fictional. No hosted upload service, cloud synchronization, value-equality check, or secret storage.

## Development

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)

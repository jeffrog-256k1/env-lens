# Security

Report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/jeffrog-256k1/env-lens/security/advisories/new). Please include only fictional reproduction data. Do not put credentials or private data in public issues.

Only explicitly selected local files are read, with a 64 KiB limit per file. Values are processed transiently in memory but are never part of parser results, diagnostics, or exported reports. This is not secure memory erasure. Key names and environment labels may still disclose internal information. HTML uses a hash-based CSP and text-only DOM rendering. No telemetry, secret vault, network client, automatic file discovery, or execution of .env content.

The current 0.1 release line is supported on a best-effort basis. No response-time guarantee is offered.

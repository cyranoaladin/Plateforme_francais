Lot 4: CI/CD + atelier écrit streaming + CSRF/security
1. Update CI workflow: auto-regenerate fr-copy baseline, add post-deploy health check step, use cache for npm, and adjust concurrency for deploy job.
2. Enhance atelier-écrit API: add streaming endpoint + test; ensure Mistral timeout guard; guard OCR quotas with E2E test.
3. Improve CSRF client/token handling with async `getCsrfToken`, ensure `ensurePublicCsrfToken` uses polling/fallback request; cover with unit tests.
4. Harden security: add CSP nonce logic, apply AbortSignal timeout uniformly, ensure PDF generator uses nonce per doc. Embed manual sanity checks as needed.

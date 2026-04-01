import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// NOTE : eslint-config-next est maintenu par Vercel mais fonctionne parfaitement
// en mode standalone (serveur dédié). Il fournit les règles React + TypeScript
// recommandées pour Next.js indépendamment de la plateforme de déploiement.
// Les règles spécifiques à Vercel sont désactivées ci-dessous.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-sync-scripts": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    "docs/**",
    // Build artifacts and worktrees:
    ".worktrees/**",
    "packages/mcp-server/dist/**",
    ".windsurf/**",
    ".superpowers/**",
  ]),
]);

export default eslintConfig;

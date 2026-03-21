# Documentation Nexus Réussite EAF

> Documentation complète et autosuffisante de la plateforme

---

## 📚 Documents principaux

### 🎯 Guide complet (START HERE)
- **[COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)** — Documentation exhaustive couvrant tous les aspects de la plateforme

### 🔧 Documentation technique
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Architecture technique détaillée
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** — Schéma complet de la base de données (40+ tables)
- **[API_REFERENCE.md](./API_REFERENCE.md)** — Référence complète de l'API REST
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Guide de déploiement en production

### 📖 Guides utilisateurs
- **[GUIDE_ELEVE.md](./GUIDE_ELEVE.md)** — Guide pour les élèves
- **[GUIDE_ENSEIGNANT.md](./GUIDE_ENSEIGNANT.md)** — Guide pour les enseignants

### 💼 Documentation métier
- **[PLANS_AND_BILLING.md](./PLANS_AND_BILLING.md)** — Plans tarifaires et quotas
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Guide du contributeur
- **[RUNBOOK_PRODUCTION.md](./RUNBOOK_PRODUCTION.md)** — Runbook opérationnel
- **[RUNBOOK_ORAL_VOICE_V1.md](./RUNBOOK_ORAL_VOICE_V1.md)** — Configuration oral/voix

---

## 🚀 Démarrage rapide

### Développement local
```bash
npm ci
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Déploiement production
```bash
bash scripts/deploy.sh root@88.99.254.59
```

### Tests
```bash
npm run test:unit      # 162 suites, 1128 tests
npm run lint
npm run build
```

---

## 🗺️ Architecture en un coup d'œil

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│   Nginx      │────▶│   Next.js App   │
│  (Browser)  │     │  (Reverse    │     │   (VPS)         │
└─────────────┘     │   Proxy)     │     └─────────────────┘
                    └──────────────┘              │
                                                  ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │   Redis      │◀───▶│   PostgreSQL    │
                    │  (Cache)     │     │   (Data)        │
                    └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │   RAG Service   │
                                         │  (Docker)       │
                                         └─────────────────┘
```

---

## 📊 Vue d'ensemble technique

| Aspect | Détail |
|--------|--------|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Base de données** | PostgreSQL 16, Prisma 6 |
| **Cache** | Redis 7 |
| **Auth** | Sessions server-side, CSRF double-submit |
| **LLM** | Mistral (principal), Gemini/OpenAI fallback |
| **RAG** | Ingesteur Docker + pgvector fallback |
| **Email** | SMTP Hostinger |
| **Déploiement** | PM2, Nginx, VPS Hetzner |

---

## 🔐 Sécurité & RGPD

- Sessions HTTP-only, Secure, SameSite=Lax
- Protection CSRF double-submit
- Rate limiting Redis-based
- CSP dynamique avec nonce
- RGPD: Consentement parental < 15 ans
- Conservation données: 36 mois max

---

## 📞 Support

| Canal | Contact |
|-------|---------|
| Email | support@nexusreussite.academy |
| WhatsApp | +216 99 192 829 |
| DPO | dpo@nexusreussite.academy |

---

<p align="center">
  <strong>Nexus Réussite EAF</strong> — Préparation aux épreuves anticipées de français
</p>

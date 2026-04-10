# Routes API Nexus - Go-Live 100%

Ce dossier contient les routes API manquantes identifiées lors de l'audit du 09/04/2026.

## Installation sur le serveur Nexus (/opt/nexus/)

```bash
# Se connecter au serveur Nexus
ssh root@nexusreussite.academy

# Aller dans le répertoire de l'application
cd /opt/nexus

# Copier les routes (depuis ce repo ou manuellement)
# Les fichiers doivent être placés dans app/api/ sous leur chemin respectif
```

## Routes incluses

### Routes Admin
- `admin/directeur/stats` - Statistiques du directeur
- `admin/users/search` - Recherche d'utilisateurs

### Routes Assistante
- `assistant/coaches/[id]` - Détail d'un coach
- `assistant/students/credits` - Crédits d'un élève

### Routes Coach
- `coach/sessions/[sessionId]` - Détail d'une session coach

### Routes Factures
- `invoices/[id]/pdf` - Génération PDF facture
- `invoices/[id]/receipt` - Génération reçu

### Routes Paiements
- `payments/bank-transfer/confirm` - Confirmation virement bancaire

### Routes Programme
- `programme/maths-1ere/progress` - Progression Maths 1ère
- `programme/maths-terminale/progress` - Progression Maths Terminale

### Routes Étudiants
- `students/[studentId]` - Détail étudiant
- `students/[studentId]/badges` - Badges étudiant

### Pages
- `stages/fevrier-2026/bilan/[reservationId]/page.tsx` - Page bilan stage

## Vérification post-installation

```bash
cd /opt/nexus
npm run typecheck
npm run build
pm2 reload ecosystem.config.js
```

## Notes

- Adapter les noms de modèles Prisma si nécessaire (lire `prisma/schema.prisma`)
- Les fonctions `generateInvoicePDF` et `generateReceiptPDF` doivent être implémentées dans `lib/invoices/`
- Vérifier les imports selon la structure exacte du projet Nexus

# Configuration S3 Hetzner Object Storage

Ce document décrit la configuration du stockage S3 pour la production EAF.

## Prérequis

- Compte Hetzner Cloud (https://console.hetzner.cloud)
- Projet créé dans Hetzner Cloud

## Étape 1 : Créer le bucket

1. Se connecter à https://console.hetzner.cloud
2. Naviguer vers "Object Storage"
3. Cliquer sur "Create Bucket"
4. Configurer :
   - **Name** : `nexus-eaf-uploads`
   - **Region** : `nbg1` (Nuremberg)
   - **Visibility** : **Private** (important pour la sécurité)

## Étape 2 : Générer les credentials

1. Dans Object Storage, aller sur l'onglet "Access Keys"
2. Cliquer sur "Generate credentials"
3. Noter :
   - **Access Key ID**
   - **Secret Access Key** (ne sera affiché qu'une seule fois)

## Étape 3 : Configurer le .env de production

Sur le serveur de production, éditer le fichier `.env` :

```env
# Storage Configuration
STORAGE_PROVIDER=s3
S3_BUCKET_NAME=nexus-eaf-uploads
S3_REGION=eu-central-1
S3_ENDPOINT=https://nbg1.your-objectstorage.com
S3_ACCESS_KEY_ID=<votre_access_key_id>
S3_SECRET_ACCESS_KEY=<votre_secret_access_key>
S3_PUBLIC_URL=
```

⚠️ **Ne jamais commiter ces credentials dans Git !**

## Étape 4 : Tester la connexion

```bash
cd /opt/eaf_platform
node -e "
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const c = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: { 
    accessKeyId: process.env.S3_ACCESS_KEY_ID, 
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY 
  },
  forcePathStyle: true,
});
c.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_NAME }))
  .then(() => console.log('✅ Bucket S3 accessible'))
  .catch(e => console.error('❌', e.message));
"
```

## Étape 5 : Redémarrer les services

```bash
pm2 reload ecosystem.config.cjs --only eaf-nextjs-blue
pm2 restart eaf-worker
```

## Étape 6 : Vérifier le health check

```bash
curl -sf https://eaf.nexusreussite.academy/api/v1/health | python3 -m json.tool
```

Le champ `storage` doit indiquer `provider: s3`.

## Migration des fichiers existants

Si des fichiers existent encore en local :

```bash
# Vérifier s'il reste des fichiers locaux
find /opt/eaf_platform/.data/uploads -type f | wc -l

# Si > 0, exécuter le script de migration
npx tsx scripts/migrate-uploads-to-s3.ts
```

## Sécurité

- Le bucket est en **private** : les fichiers ne sont pas accessibles publiquement
- Les URLs présignées sont utilisées pour l'accès temporaire
- Les credentials sont stockés uniquement dans le `.env` du serveur
- La rotation des credentials est recommandée tous les 90 jours

## Dépannage

### Erreur "Bucket not found"
Vérifier que le endpoint correspond bien à la région du bucket :
- Nuremberg (nbg1) : `https://nbg1.your-objectstorage.com`

### Erreur "Invalid credentials"
Vérifier que les credentials n'ont pas de caractères spéciaux mal échappés dans le `.env`.

### Erreur "Access Denied"
Vérifier que la clé d'accès a les permissions nécessaires sur le bucket.

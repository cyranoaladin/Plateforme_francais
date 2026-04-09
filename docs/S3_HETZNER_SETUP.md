# Guide de configuration S3 Hetzner Object Storage — EAF Production

## Prerequis

Le code `S3StorageProvider` est deja implemente dans `src/lib/storage/provider.ts`.
Il suffit de configurer les credentials dans `.env` production.

## 1. Creer le bucket Hetzner

Dans la console Hetzner Cloud (https://console.hetzner.cloud) :

1. Aller dans "Object Storage" > "Create Bucket"
2. Nom du bucket : `nexus-eaf-uploads`
3. Region : `nbg1` (Nuremberg) — meme region que le VPS
4. Visibilite : **Private** (copies d'eleves confidentielles)
5. Generer des credentials S3 : "Generate credentials" > noter Access Key + Secret Key

## 2. Configurer le .env EAF production

Sur le serveur, dans `/opt/eaf_platform/.env` (NE PAS commiter) :

```env
# Storage S3 Hetzner
STORAGE_PROVIDER=s3
S3_BUCKET=nexus-eaf-uploads
S3_REGION=eu-central-1
S3_ENDPOINT=https://nbg1.your-objectstorage.com
S3_ACCESS_KEY_ID=<votre_access_key_hetzner>
S3_SECRET_ACCESS_KEY=<votre_secret_key_hetzner>
S3_PUBLIC_URL=
```

## 3. Test de connectivite

```bash
cd /opt/eaf_platform
node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
client.send(new ListBucketsCommand({}))
  .then(r => console.log('OK:', r.Buckets?.map(b => b.Name)))
  .catch(e => console.error('ERREUR:', e.message));
"
```

## 4. Redemarrer l'application

```bash
sudo -u nexus env HOME=/opt/nexus PM2_HOME=/opt/nexus/.pm2 pm2 reload eaf-nextjs-blue
sudo -u nexus env HOME=/opt/nexus PM2_HOME=/opt/nexus/.pm2 pm2 logs eaf-nextjs-blue --lines 20
```

Verifier qu'aucune erreur S3 n'apparait au demarrage.

## 5. Migration des fichiers locaux existants (si applicable)

```bash
find /opt/eaf_platform/.data/uploads -type f 2>/dev/null | wc -l
```

Si des fichiers existent, les migrer avec :

```bash
npx tsx scripts/migrate-uploads-to-s3.ts
```

## Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `STORAGE_PROVIDER` | `local` ou `s3` | `s3` |
| `S3_BUCKET` | Nom du bucket | `nexus-eaf-uploads` |
| `S3_REGION` | Region AWS/Hetzner | `eu-central-1` |
| `S3_ENDPOINT` | Endpoint S3-compatible | `https://nbg1.your-objectstorage.com` |
| `S3_ACCESS_KEY_ID` | Cle d'acces | (secret) |
| `S3_SECRET_ACCESS_KEY` | Cle secrete | (secret) |
| `S3_PUBLIC_URL` | URL publique CDN (optionnel) | (vide pour URLs signees) |

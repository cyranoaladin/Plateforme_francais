# Configuration email Nexus Réussite

## Architecture

Les emails transactionnels utilisent **nodemailer** via SMTP (Hostinger ou autre).
Les templates sont créés avec **React Email** (`@react-email/components`).

### Templates disponibles

| Template | Déclencheur | Fichier |
|----------|------------|---------|
| Bienvenue | Inscription (`POST /api/v1/auth/register`) | `emails/WelcomeEmail.tsx` |
| Confirmation d’activation | Activation validée après règlement | `emails/SubscriptionEmail.tsx` |

## Variables d'environnement

```env
# SMTP (Hostinger STARTTLS)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@nexusreussite.academy
SMTP_PASS=xxxxxxxx
EMAIL_FROM=Nexus Réussite <contact@nexusreussite.academy>
EMAIL_REPLY_TO=support@nexusreussite.academy

# Dev uniquement
DEV_TEST_EMAIL=ton-email@gmail.com
```

## Prérequis délivrabilité

Configurer ces enregistrements DNS sur `nexusreussite.academy` :

### SPF (Sender Policy Framework)
```
Type : TXT
Nom  : @
Valeur : "v=spf1 include:_spf.hostinger.com ~all"
```

### DKIM (DomainKeys Identified Mail)
Récupérer les valeurs DKIM dans le panel Hostinger > Email > DNS.

### DMARC (recommandé)
```
Type : TXT
Nom  : _dmarc
Valeur : "v=DMARC1; p=none; rua=mailto:dmarc@nexusreussite.academy"
```

## Développement

### Preview des templates
```bash
npm run email:dev
# Ouvre localhost:3001 avec preview live des templates
```

### Test d'envoi (dev uniquement)
```bash
# Configurer DEV_TEST_EMAIL dans .env
curl http://localhost:3000/api/dev/test-email?type=welcome
curl http://localhost:3000/api/dev/test-email?type=subscription
```

## Comportement en production

- **Vérité runtime actuelle** : la prod utilise `smtp.hostinger.com` sur le port `587` avec STARTTLS (`secure=false`, `requireTLS=true`)

- **Retry** : 3 tentatives avec backoff exponentiel (1s, 2s)
- **Non-bloquant** : l'inscription et l'activation réussissent même si l'email échoue
- **Logging** : chaque envoi/échec est loggé via Pino
- **Pas de SMTP** : si `SMTP_HOST` n'est pas configuré, les emails sont loggés sans être envoyés

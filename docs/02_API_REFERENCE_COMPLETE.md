# Référence API complète — `src/app/api/v1`

Dernière consolidation documentaire : 14 mars 2026

Ce document décrit l’ensemble des routes versionnées présentes dans `src/app/api/v1`. Le dépôt contient actuellement `60` routes API. La référence ci-dessous est organisée par domaines fonctionnels. Elle documente les responsabilités et méthodes réellement exposées.

## 1. Principes transverses

### Versionnement

Toutes les routes métier principales sont exposées sous le préfixe :

- `/api/v1/...`

### Conventions générales

Les routes privées appliquent, selon le cas :

- garde d’authentification
- validation CSRF pour les routes mutantes
- validation des corps de requête via Zod
- rate limiting
- vérification de quota et de billing
- centralisation des messages utilisateur dans `src/lib/copy/fr/api.ts`

### Sorties possibles

Selon les routes, les réponses sont :

- JSON
- CSV
- PDF
- flux ou fichier binaire

## 2. Authentification

### `POST /api/v1/auth/register`

Crée un compte utilisateur, aujourd’hui orienté principalement vers le rôle élève.

### `POST /api/v1/auth/login`

Authentifie l’utilisateur et ouvre une session.

### `POST /api/v1/auth/logout`

Ferme la session courante.

### `GET /api/v1/auth/me`

Retourne l’utilisateur courant authentifié et ses métadonnées utiles côté client.

### `POST /api/v1/auth/forgot-password`

Déclenche le flux de réinitialisation de mot de passe.

### `POST /api/v1/auth/reset-password`

Consomme un token de réinitialisation et met à jour le mot de passe.

## 3. Profil élève, onboarding et progression

### `POST /api/v1/onboarding/complete`

Finalise l’onboarding et crée/met à jour le profil pédagogique initial.

### `GET /api/v1/student/profile`

Retourne le profil élève consolidé.

### `PUT /api/v1/student/profile`

Met à jour certains champs du profil élève.

### `PUT /api/v1/student/oeuvre-choisie`

Met à jour l’œuvre choisie pour l’entretien ou certains flux liés au profil.

### `POST /api/v1/student/recapitulatif`

Route de récapitulatif/descriptif élève, utilisée aussi comme base pour une route alias.

### `POST /api/v1/student/descriptif`

Alias serveur de `student/recapitulatif`. Le fichier réexporte `POST` depuis la route de récapitulatif.

### `POST /api/v1/parcours/generate`

Génère ou régénère le parcours de progression personnalisé.

## 4. Mémoire et événements

### `POST /api/v1/memory/events`

Enregistre un événement mémoire ou interaction utile au moteur de progression.

### `GET /api/v1/memory/timeline`

Retourne une timeline mémoire ou pédagogique agrégée pour l’utilisateur.

## 5. Tuteur, chat et recherche pédagogique

### `POST /api/v1/tuteur/message`

Route principale du tuteur IA. Elle orchestre auth, CSRF, quotas, sanitation, RAG éventuel, LLM et persistance de mémoire.

### `POST /api/v1/chat`

Route de chat/recherche guidée, couplée à des règles de recherche et de limitation.

### `POST /api/v1/rag/search`

Recherche documentaire enrichie ou hybride, utilisée par les surfaces qui nécessitent des résultats de corpus.

### `GET /api/v1/rag/health`

Expose l’état de santé de la couche RAG.

### `GET /api/v1/ressources/file`

Sert un fichier de ressource pédagogique côté serveur avec contrôles d’accès et de chemin.

### `GET /api/v1/media/[id]`

Retourne ou sert un média indexé par identifiant.

## 6. Quiz et langue

### `POST /api/v1/quiz/generate`

Génère un quiz contextualisé, avec contrôles de quotas et éventuellement enrichissement documentaire.

### `POST /api/v1/langue/generate`

Génère un exercice ou un contenu de langue.

### `POST /api/v1/evaluations/langue`

Évalue une réponse de langue et persiste le résultat comme évaluation.

## 7. Atelier écrit et copies

### `POST /api/v1/epreuves/generate`

Génère une épreuve blanche écrite.

### `POST /api/v1/epreuves/[epreuveId]/copie`

Permet le dépôt d’une copie pour une épreuve donnée.

### `GET /api/v1/epreuves/[epreuveId]/copie/[copieId]`

Retourne le statut, les données ou l’état d’avancement d’une copie donnée pour une épreuve.

### `GET /api/v1/epreuves/copies/[copieId]/file`

Retourne le fichier source d’une copie avec protections d’accès.

### `GET /api/v1/epreuves/copies/[copieId]/report`

Retourne le rapport de correction ou sa représentation téléchargeable.

## 8. Atelier oral

### `POST /api/v1/oral/session/start`

Démarre une session orale. La route valide la requête, choisit ou résout l’extrait, vérifie les quotas, crée la session puis retourne l’état initial.

### `POST /api/v1/oral/session/[sessionId]/start-prep`

Place la session en préparation.

### `POST /api/v1/oral/session/[sessionId]/end-prep`

Clôt la préparation.

### `POST /api/v1/oral/session/[sessionId]/start-passage`

Fait passer la session en phase de passage.

### `POST /api/v1/oral/session/[sessionId]/interact`

Reçoit une interaction d’oral pour une phase donnée, l’évalue et l’ajoute à la session.

### `POST /api/v1/oral/session/[sessionId]/end`

Finalise la session orale, calcule les scores, produit le bilan et persiste les résultats.

### `POST /api/v1/oral/jury-respond`

Génère une relance ou réponse de jury virtuel, avec TTS éventuelle si disponible.

### `GET /api/v1/oral/capabilities`

Retourne les capacités disponibles côté oral, notamment autour de l’audio et des providers.

### `POST /api/v1/oral/voice-submit`

Soumet un enregistrement audio pour transcription côté serveur.

## 9. Carnet et descriptif de lecture

### `GET /api/v1/carnet`

Liste les entrées du carnet pour l’utilisateur courant, avec filtrage possible par œuvre.

### `POST /api/v1/carnet`

Crée une entrée de carnet.

### `DELETE /api/v1/carnet/[entryId]`

Supprime une entrée de carnet, avec garde d’appartenance au profil.

### `POST /api/v1/carnet/entry`

Route d’entrée du carnet dédiée à certains flux clients.

### `GET /api/v1/carnet/entry`

Lecture d’entrée(s) de carnet selon le flux concerné.

### `GET /api/v1/carnet/export`

Exporte le carnet dans un format de sortie prévu par l’application.

## 10. Espace enseignant

### `POST /api/v1/enseignant/class-code`

Crée, met à jour ou gère le code de classe enseignant.

### `GET /api/v1/enseignant/dashboard`

Retourne les données agrégées du dashboard enseignant.

### `GET /api/v1/enseignant/export`

Exporte les données utiles au suivi enseignant, notamment au format CSV.

### `POST /api/v1/enseignant/corrections/[copieId]/comment`

Ajoute un commentaire manuel sur une correction de copie, avec contrôles de classe et d’accès.

## 11. Badges, gamification et informations générales

### `POST /api/v1/badges/evaluate`

Évalue les badges ou déclenche leur calcul à partir d’un contexte ou d’un résultat.

### `GET /api/v1/badges/list`

Liste les badges disponibles ou attribués.

### `GET /api/v1/exam-info`

Retourne des informations générales relatives à l’examen, à l’année ou au contexte d’épreuve.

### `GET /api/v1/health`

Retourne l’état de santé global de l’application.

### `POST /api/v1/metrics/vitals`

Reçoit des Web Vitals côté client et les persiste ou les accepte en mode dégradé.

## 12. Billing, abonnements et paiement

### `GET /api/v1/billing/status`

Retourne le statut d’abonnement et des informations de plan/usage utiles au front.

### `GET /api/v1/billing/check-quota`

Vérifie la disponibilité d’un quota ou entitlement donné.

### `POST /api/v1/billing/redeem-code`

Consomme un code d’activation ou de rachat d’abonnement.

### `POST /api/v1/payments/clictopay/init`

Initialise un paiement ClicToPay.

### `POST /api/v1/payments/clictopay/callback`

Traite le callback POST de ClicToPay.

### `GET /api/v1/payments/clictopay/callback`

Gère aussi une variante GET du callback pour certains scénarios de fournisseur.

### `GET /api/v1/payments/clictopay/status`

Retourne le statut côté utilisateur authentifié.

### `GET /api/v1/payments/clictopay/public-status`

Retourne un statut public lisible sans session complète, à partir de paramètres comme `orderRef` ou `orderId`.

## 13. Crons, maintenance et tâches serveur

### `POST /api/v1/cron/revision-reminders`

Déclenche les rappels de révision planifiés.

### `GET /api/v1/cron/session-cleanup`

Nettoie les sessions expirées.

### `POST /api/v1/cron/weekly-reports`

Déclenche la génération des rapports hebdomadaires.

Ces routes sont protégées par secret d’exécution et ne font pas partie de la surface publique normale.

## 14. API non détaillées au niveau des schémas

Ce document référence la surface HTTP réelle et les responsabilités fonctionnelles. Il ne reproduit pas tous les schémas exacts des corps ou réponses. Pour ces détails, la source technique reste le code des routes, les schémas Zod et les tests d’API.

## 15. Cohérence actuelle des messages utilisateur

Les messages utilisateur critiques du backend ont été progressivement centralisés dans `src/lib/copy/fr/api.ts`, notamment pour :

- oral
- tuteur
- quiz
- évaluations langue
- copies
- export enseignant
- metrics
- cron
- billing
- paiements
- carnet

Cette centralisation vise la cohérence française et la réduction des fuites d’erreurs internes.

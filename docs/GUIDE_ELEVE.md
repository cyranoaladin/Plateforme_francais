# Guide élève - EAF Premium

Dernière mise à jour : 25 février 2026

## 1. Première connexion
1. Ouvrir `/login`.
2. Se connecter avec un compte existant ou créer un compte.
3. Utiliser le bouton œil pour afficher/masquer le mot de passe.
4. En cas d'inscription, terminer l'onboarding (`/onboarding`).

Compte démo :
- Email : `jean@eaf.local`
- Mot de passe : `demo1234`

## 2. Onboarding (3 étapes)
## Étape 1 - Qui es-tu ?
- Nom/prénom
- Classe
- Établissement (optionnel)
- Date EAF
- Code classe enseignant (optionnel)

## Étape 2 - Tes œuvres
- Sélection des œuvres étudiées

## Étape 3 - Auto-évaluation
- 6 curseurs de niveau
- Ces scores alimentent les `weakSkills`

## 3. Dashboard (`/`)
Vous y trouvez:
- scores par compétences
- signaux faibles
- activité récente
- streak de travail
- progression hebdomadaire

## 4. Atelier écrit (`/atelier-ecrit`)
## 4.1 Générer un sujet
- choisir type d'épreuve
- options œuvre/thème

## 4.2 Déposer une copie
- formats acceptés: JPEG/PNG/WEBP/PDF
- taille max: `MAX_UPLOAD_SIZE_MB` (20MB par défaut)
- upload avec progression

## 4.3 Correction IA
- traitement asynchrone
- polling auto du statut
- consultation du rapport détaillé
- téléchargement PDF du rapport

## 5. Atelier oral (`/atelier-oral`)
- Démarrer une session (œuvre + extrait)
- 4 étapes: LECTURE, EXPLICATION, GRAMMAIRE, ENTRETIEN
- Feedback IA à chaque étape
- STT (micro navigateur) et TTS (lecture feedback)

## 6. Atelier langue (`/atelier-langue`)
- exercices ciblés
- retour immédiat (score + pistes)

## 7. Quiz (`/quiz`)
- thème + difficulté + nb questions
- correction immédiate
- explication par question
- score < 60%: thème poussé en `weakSkills`

## 8. Parcours (`/mon-parcours`)
- plan hebdomadaire généré
- cases de progression

## 9. Bibliothèque (`/bibliotheque`)
- filtres par type de ressource
- recherche RAG
- fiches méthodes en modale markdown
- vidéos/audio intégrés

## 10. Tuteur IA (`/tuteur`)
- discussion libre sur méthode et œuvres
- citations de sources
- suggestions de questions
- refus pédagogique si demande de copie complète

## 11. Profil (`/profil`)
- Badges débloqués
- XP, niveau et progression
- Streak de travail (jours consécutifs)
- Compétences (skill map)

## 12. Abonnement (`/pricing`)
- Choix du plan (FREE / PRO / MAX)
- Paiement via ClicToPay
- Confirmation sur `/paiement/confirmation`
- En cas d'échec : `/paiement/refus`

## 13. Protection et confidentialité
- Session sécurisée par cookie
- Protection CSRF
- Votre audio micro est traité localement par le navigateur (STT)

## 14. Problèmes fréquents
- Erreur CSRF: rafraîchir la page puis réessayer
- Upload refusé: vérifier type/poids du fichier
- Réponse IA de fallback: réessayer plus tard (provider indisponible)

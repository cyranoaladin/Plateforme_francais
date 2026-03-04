# Guide enseignant - EAF Premium

Dernière mise à jour : 25 février 2026

## 1. Créer un compte enseignant
1. Aller sur `/login`
2. Choisir `Inscription`
3. Sélectionner le rôle `Enseignant`
4. Valider l'inscription (le bouton œil permet d'afficher/masquer le mot de passe)

## 2. Accéder au tableau enseignant
Route: `/enseignant`

Le middleware bloque l'accès si le rôle n'est pas `enseignant`.

## 3. Générer un code de classe
- Bouton `Générer un code classe`
- Le code est enregistré dans votre profil
- Les élèves l'entrent pendant l'onboarding

API associée:
- `POST /api/v1/enseignant/class-code`

## 4. Suivre les élèves
Le dashboard enseignant agrège:
- liste des élèves rattachés
- score moyen par élève
- dernière activité
- prochaine épreuve blanche

API associée:
- `GET /api/v1/enseignant/dashboard`

## 5. Distribution des notes
Graphique de distribution sur les copies corrigées.

## 6. Consulter les copies corrigées
- Section `Copies corrigées`
- Lecture des retours IA
- Affichage note/statut/date

## 7. Ajouter un commentaire manuel
- Saisir le commentaire dans la copie
- Cliquer `Enregistrer le commentaire`

API associée:
- `POST /api/v1/enseignant/corrections/{copieId}/comment`

Note: cette action nécessite PostgreSQL actif (non disponible en fallback JSON seul).

## 8. Export CSV classe
- Bouton `Export CSV`
- Fichier `text/csv` téléchargé

API associée:
- `GET /api/v1/enseignant/export`

## 9. Bonnes pratiques pédagogiques
- suivre les `weakSkills` récurrents
- commenter les copies avec des objectifs actionnables
- comparer progression quiz/oral/écrit sur plusieurs semaines

## 10. Dépannage
- Erreur 403: vérifier que le compte est bien en rôle enseignant
- Dashboard vide: vérifier le code classe et le rattachement onboarding élève
- Export vide: aucune donnée élève liée au code classe

# Guide de l'enseignant - Nexus Réussite EAF

**Dernière mise à jour :** 30 Mars 2026

Bienvenue dans l'espace Enseignant de Nexus Réussite EAF. Ce tableau de bord a été conçu pour vous offrir une vue centralisée, claire et actionnable sur la progression de votre classe, avec une attention particulière portée sur la fluidité d'utilisation, notamment en mobilité sur tablette.

## 1. Démarrage et Accès

1. **Inscription** : Rendez-vous sur `/login` puis accédez à la section `Inscription`.
2. **Choix du rôle** : Sélectionnez impérativement le rôle **Enseignant**.
3. **Accès au Dashboard** : Une fois connecté, rendez-vous sur la route `/enseignant`. L'accès est sécurisé et bloqué systématiquement pour les autres rôles.

## 2. Piloter votre classe (Le Code Classe)

Le tableau de bord est structuré pour vous éviter de fouiller dans la donnée. 

* **Générer un code classe** : Cliquez sur le bouton "Générer un code classe" (icône étincelles) en haut de votre espace. Transmettez ce code à vos élèves pour qu'ils rejoignent votre groupe lors de leur Onboarding. S'il est indiqué "Non défini", c'est qu'il n'a pas encore été généré.

## 3. Lecture Rapide & KPIs

L'espace supérieur remonte immédiatement les signaux cruciaux via des cartes KPI et un encart de "Lecture rapide" automatique :
* **Moyenne globale** de la classe en direct.
* **Élèves à soutenir** : Détecte automatiquement les élèves dont la moyenne chute drastiquement (strictement inférieure à 10/20).
* **Prochaine échéance** : Affiche au format adaptatif la date de la première épreuve blanche à venir (ex: 24 avril). 
* **Copies Ouvertes/Corrigées** : Ratio du volume d'évaluations traitées versus en attente, et les commentaires actuellement en brouillon.

## 4. Roster et Suivi des Performances

Sous les cartes de performance, la section **"Roster classe"** liste vos élèves de manière très visuelle :
* Visualisation par élève avec Email et **Score moyen** (en rouge si l'élève est en difficulté).
* Date et heure exactes de la dernière activité.
* Prochaine échéance propre à l'élève.
* Un bouton **Actualiser** en temps réel permet de rafraîchir le roster instantanément sans recharger la page.

## 5. Distribution des Notes & Exports

* **Distribution graphique** : Ne comptez plus les points un par un. Une jauge progressive affiche la répartition des notes par effectifs pour vous donner en un coup d'œil la dynamique du groupe.
* **Vues Administratives** : Besoin de faire un rapport officiel pour le conseil de classe ou le logiciel interne de l'école ? Un simple clic sur l'action **Export CSV** (via `GET /api/v1/enseignant/export`) télécharge immédiatement le registre des appréciations.

## 6. Retour Pédagogique (Correction de Copies)

Les élèves reçoivent souvent de l'aide par notre IA d'accompagnement, mais l'expertise humaine reste décisive.
* Ouvrez la section **Copies corrigées** au bas du tableau de bord.
* Visualisez par étudiant la date, l'épreuve, sa note de session, et via une étiquette colorée, l'état de la copie (En attente, Terminée, etc.).
* **Commentaire ciblé** : Utilisez le large champ de texte (`textarea`) attitré à la copie pour écrire la synthèse. Ce champ mémorise vos saisies en local pendant votre frappe.
* Cliquez sur **Enregistrer** (l'API `/api/v1/enseignant/corrections/{copieId}/comment` se charge de pousser le retour côté élève).

---

## 📱 7. Expérience Dédiée sur Tablette (iPad & Android)

Les correcteurs et les enseignants opèrent rarement toute leur journée derrière le même bureau. C'est pourquoi le Dashboard Enseignant a été méticuleusement pensé dans une approche **"Tablet-First"** (Optimisé pour Tablettes).

### Interface et Tactile (Touch-Friendly)
* **Zones Focus Multi-Colonnes** : En mode Paysage (Landscape), l'interface divise harmonieusement l'écran (`md:grid-cols-2`, `xl:grid-cols-...`), plaçant la synthèse d'un côté et les détails de l'autre. En mode Portrait, les modules s'empilent intelligemment sans rompre la lisibilité (plus besoin de scroller à l'horizontale).
* **Grandes "Tap Targets"** : Tous les éléments interactifs majeurs (Le bouton *Générer un code classe*, l'exportation *Export CSV*, ou la *soumission des commentaires*) sont munis d'espacements extra-larges (padding et bordures arrondies type `rounded-full`) conçus spécifiquement pour la manipulation au doigt sans risque de faux-clics.
* **Correction Tactile Fluide** : Les blocs de commentaires individuels disposent d'un design `min-h-24` avec contour interactif (`focus:border-success`). Quand le clavier virtuel de la tablette s'ouvre, l'espacement environnant préserve une vision nette sur la note et l'identité de l'élève située juste au-dessus.

## 8. Dépannage Courant

* **Erreur Rouge (Alerte d'accès)** : Vérifiez que vous possédez le privilège "Enseignant".
* **Tableau et Roster vides** : Si 0 élève apparaît, assurez-vous de leur avoir transmis votre *Code Classe* généré.
* **Graphe absent** : Le bloc *Distribution* affichera un message d'absence d'information tant qu'aucune copie de la classe ne sera jugée terminée.

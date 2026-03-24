# PHASE 3 — AUTH, INSCRIPTION, RESET, EMAILS

> Revalidé pendant cette session sur la production réelle.

## 1. Authentification et routage

| Contrôle | Résultat |
| --- | --- |
| Login invalide | `401` avec message générique en français |
| `forgot-password` | réponse générique `ok=true`, pas d'énumération d'email |
| Cookies de session | `Secure`, `HttpOnly` sur `eaf_session` et `eaf_role`, `SameSite=Lax` |
| CSRF | cookie `eaf_csrf` émis, mutation sans header CSRF rejetée en `403` |
| Routage par rôle | vérifié cette session: `admin -> /admin`, `élève -> /dashboard`, `parent -> /parent`, `enseignant -> /enseignant` |

## 2. Liens parent et enseignant

Défaut corrigé: `A08-01` (`262cf29`)

- Cause racine: un parent ou un enseignant renseigné dans le profil élève n'obtenait pas toujours un accès exploitable.
- Correction: provision automatique du compte lié, génération d'un lien de définition de mot de passe, activation d'un vrai dashboard parent, et inclusion des élèves liés par `teacherEmail` dans le dashboard enseignant.

## 3. Emails prouvés

| Flux | Preuve réelle |
| --- | --- |
| Welcome email élève | logs PM2 avec `emailId` sur inscription élève |
| Reset password | `auth.forgot_password.token_created` puis email `Réinitialisation de votre mot de passe Nexus EAF` avec `emailId` |
| Invitation parent | email `Active ton accès parent` envoyé à `audit-parent-proof-1774301372456@test-nexus.dev` avec `emailId` |
| Invitation enseignant | email `Active ton accès enseignant` envoyé à `audit-teacher-proof-1774301372456@test-nexus.dev` avec `emailId` |
| Notification parent/enseignant existants | logs PM2 confirmés avec sujets dédiés et `emailId` |

## 4. Conclusion

Les flux `inscription -> login -> dashboard`, `forgot-password`, `parent linked`, `teacher linked` et les envois email critiques ont été prouvés en production pendant cette session. Aucun placeholder ou lien `localhost` n'a été observé dans les emails contrôlés.

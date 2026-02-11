# Importer les utilisateurs Lovable dans Supabase

Ce guide explique comment importer les utilisateurs exportés depuis Lovable (CSV) vers Supabase, avec profils et forfaits. Les mots de passe ne peuvent pas être copiés ; les utilisateurs recevront un lien pour définir un nouveau mot de passe.

---

## 1. Format du CSV

Exporte tes utilisateurs Lovable en CSV, puis assure-toi que le fichier a **au moins** une colonne **email**.

Colonnes supportées par le script :

| Colonne        | Obligatoire | Description |
|----------------|-------------|-------------|
| **email**      | Oui         | Adresse email (unique) |
| **display_name** | Non       | Nom affiché (ex. "Jean Dupont") |
| **plan**       | Non         | Nom du forfait Supabase : `Gratuit`, `Essentiel`, `Pro` ou `Découverte` (si tu as ce plan). Laisse vide pour aucun forfait. |

Exemple de CSV (avec en-têtes) :

```csv
email,display_name,plan
jean@exemple.ca,Jean Dupont,Essentiel
marie@exemple.ca,Marie Martin,Pro
autre@exemple.ca,,Gratuit
```

- Si ton export Lovable a d’autres noms de colonnes, renomme-les pour avoir au minimum **email**, et optionnellement **display_name** et **plan**.
- Encodage : UTF-8 (pour les accents).
- Séparateur : virgule (`,`). Si un champ contient des virgules, mets-le entre guillemets (ex. `"Martin, Marie"`).

---

## 2. Clé Supabase (service_role)

Le script utilise la clé **secrète** Supabase (service_role) pour créer les utilisateurs. **Ne la partage jamais et ne la committe pas.**

1. Supabase → [ton projet](https://supabase.com/dashboard/project/lqxbwqndxjdxqzftihic) → **Project Settings** → **API**.
2. Copie **Project URL** et **service_role** (secret).
3. Crée un fichier **`.env.import`** à la racine du projet (il est ignoré par git) :

```env
SUPABASE_URL=https://lqxbwqndxjdxqzftihic.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...ta_clé_secrète_ici
```

Ou exporte les variables dans le terminal avant de lancer le script (PowerShell) :

```powershell
$env:SUPABASE_URL="https://lqxbwqndxjdxqzftihic.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="ta_clé_service_role_ici"
```

---

## 3. Lancer l’import

1. Place ton CSV à la racine du projet, par ex. **`lovable-users.csv`**.
2. En ligne de commande, à la racine du projet :

```bash
node scripts/import-lovable-users.mjs lovable-users.csv
```

3. Le script :
   - crée chaque utilisateur dans Supabase Auth (avec un mot de passe temporaire) ;
   - crée la ligne dans **profiles** (display_name si fourni) ;
   - si une colonne **plan** est fournie, crée un abonnement dans **subscriptions** (plan trouvé par nom : Gratuit, Essentiel, Pro, etc.) ;
   - génère un **lien « Réinitialiser le mot de passe »** pour chaque email.
4. En fin d’exécution, un fichier **`import-reset-links.csv`** est créé avec les colonnes **email** et **reset_password_link**. Tu peux envoyer ce lien à chaque utilisateur (email personnalisé ou outil d’envoi) pour qu’il définisse son mot de passe.

---

## 4. Ajouter ton compte admin

Après l’import (ou si ton compte existe déjà dans Supabase) :

1. Récupère ton **user_id** : Supabase → **Authentication** → **Users** → clique sur ton utilisateur → copie l’**User UID**.
2. Supabase → **Table Editor** → **user_roles** → **Insert row** :
   - **user_id** : l’UUID copié
   - **role** : `admin`
3. Sauvegarde. Tu auras les droits admin sur l’app.

---

## 5. Résumé

- **CSV** : colonnes `email` (obligatoire), `display_name`, `plan` (noms de forfaits Supabase).
- **Script** : `node scripts/import-lovable-users.mjs lovable-users.csv`.
- **Variables** : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (fichier `.env.import` ou variables d’environnement).
- **Résultat** : utilisateurs créés + profils + forfaits ; **import-reset-links.csv** pour envoyer les liens de réinitialisation de mot de passe.
- **Admin** : une ligne dans **user_roles** avec `role = admin` pour ton user_id.

Les utilisateurs Lovable sont ainsi intégrés dans Supabase avec accès et forfait ; ils définissent leur nouveau mot de passe via le lien fourni.

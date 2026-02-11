# Import utilisateurs (CSV → Supabase)

Script pour importer des utilisateurs depuis un fichier CSV vers Supabase (Auth + profils + abonnements).

## Où mettre les variables d'environnement

**Fichier à modifier : `.env` à la racine du projet** (au même niveau que `package.json` et le dossier `src/`), pas dans `src/`.

Exemple de structure :
```
mon-projet-maison-5d2b87a7/
  .env          ← ici
  package.json
  src/
  scripts/
```

- Pour l’app (Vite) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (déjà dans `.env`).
- Pour le script d’import : ajoute dans le **même** `.env` la ligne `SUPABASE_SERVICE_ROLE_KEY=eyJ...`. L’URL est lue depuis `VITE_SUPABASE_URL` si `SUPABASE_URL` n’est pas défini.

La **clé service role** se trouve dans Supabase : **Project Settings → API → service_role (secret)**. Ne l’expose jamais côté front.

## Format du CSV

- **Séparateur** : virgule (`,`). Ne pas mettre de virgule à l’intérieur des valeurs (ou entourer d’un champ de guillemets).
- **Colonnes reconnues** :
  - **Email** : `email` ou `courriel`
  - **Nom** (optionnel) : `display_name`, `nom` ou `name`
  - **Forfait** (optionnel) : `plan` ou `forfait` (nom du plan tel que dans la table `plans`)

Exemple :

```csv
email,display_name,plan
jean@exemple.com,Jean Dupont,Pro
marie@exemple.com,Marie Martin,Starter
```

## Lancer l’import

Depuis le dossier **src** du projet :

```powershell
cd "c:\Users\Utilisateur\Desktop\mon-projet-maison-main (2)\mon-projet-maison-5d2b87a7\src"

# Définir les variables (remplace par tes vraies valeurs)
$env:SUPABASE_URL="https://ton-projet.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Lancer l’import (remplace par le chemin vers ton CSV)
node scripts/import-lovable-users.mjs "chemin/vers/ton-fichier.csv"
```

Si ton CSV est sur le Bureau :

```powershell
node scripts/import-lovable-users.mjs "C:\Users\Utilisateur\Desktop\utilisateurs.csv"
```

Ou si le CSV est dans le dossier `src` :

```powershell
node scripts/import-lovable-users.mjs "utilisateurs.csv"
```

## Comportement

- Crée un utilisateur **Auth** (email confirmé).
- Crée ou met à jour le **profil** (`profiles`) avec le nom.
- Crée ou met à jour l’**abonnement** (`subscriptions`) en associant le plan par nom.
- Pour chaque nouvel utilisateur, génère un **lien de réinitialisation de mot de passe** et l’affiche en fin d’exécution.
- Si l’email existe déjà dans Auth, la ligne est ignorée (avertissement dans la console).

## Après l’import

Envoie à chaque utilisateur le lien de réinitialisation affiché par le script pour qu’il définisse son mot de passe (8 caractères minimum recommandé).

# Vercel : s’assurer de déployer la version Supabase (pas Lovable Cloud)

Ce guide explique comment vérifier que Vercel déploie bien **ce projet** (version Supabase) et non une version qui utilise le cloud Lovable.

---

## 1. Quelle est la « version Supabase » ?

**Version Supabase (celle qu’il faut déployer) :**
- Ce dossier : `mon-projet-maison-5d2b87a7` (ou dans le repo GitHub : `latest-version/mon-projet-maison-main`)
- Contient : dossier `supabase/` (functions, migrations), `src/integrations/supabase/`, auth via Supabase (`useAuth` avec `VITE_SUPABASE_*`)

**Version à ne pas déployer :**
- Un projet qui n’a **pas** de dossier `supabase/` ou qui utilise l’API/hébergement Lovable au lieu de Supabase.

---

## 2. Vérifier la configuration Vercel

1. Va sur [vercel.com](https://vercel.com) et connecte-toi.
2. Ouvre le **projet** qui correspond à ton site (ex. `mon-projet-maison-prod` ou le nom qui donne l’URL `mon-projet-maison-prod-esegk2yfv-mon-projet-maison-2.vercel.app`).
3. Onglet **Settings** (Paramètres).

### 2.1 Repository (Git)

- **Settings → Git**
- Vérifie :
  - **Production Branch** : en général `main` (ou la branche que tu utilises).
  - **Root Directory** : **doit** pointer vers le dossier qui contient la version Supabase :
  - Si le dépôt est **mon-projet-maison-prod** : mets **`latest-version/mon-projet-maison-main`** (et coche « Override » si demandé).
  - Si le dépôt est **mon-projet-maison-5d2b87a7** (repo séparé) : laisse **vide** pour prendre la racine du repo.

En résumé : **Root Directory** doit être le dossier où se trouvent `package.json`, `src/`, **et** le dossier **`supabase/`**.

### 2.2 Vérifier que le bon code est sur GitHub

- Dans **Settings → Git**, note le **Repository** (ex. `jomo333/mon-projet-maison-prod`).
- Ouvre ce repo sur GitHub.
- Si Root Directory = `latest-version/mon-projet-maison-main` :
  - Va dans le repo → branche `main` → dossier `latest-version/mon-projet-maison-main`.
  - Vérifie la présence de :
    - `package.json`
    - `src/`
    - **`supabase/`** (avec au moins `config.toml`, `functions/`, `migrations/`).

Si `supabase/` n’est pas là, Vercel ne build pas la version Supabase.

---

## 3. Envoyer la version Supabase (ce projet) vers GitHub

Pour que Vercel reçoive **ce** dossier (version Supabase) :

### Option A : Le dépôt Vercel est `mon-projet-maison-prod` et Root = `latest-version/mon-projet-maison-main`

1. Ouvre un terminal dans **ce** projet :  
   `c:\Users\Utilisateur\Desktop\mon-projet-maison-main (2)\mon-projet-maison-5d2b87a7`
2. Vérifie le remote **prod** :
   ```bash
   git remote -v
   ```
   Tu dois voir `prod` → `https://github.com/jomo333/mon-projet-maison-prod.git`
3. Mets à jour la branche distante :
   ```bash
   git fetch prod main
   ```
4. Copie tout le contenu **de ce dossier** (version Supabase) dans le chemin attendu par le repo. Deux façons possibles :

   **Méthode 1 – Tu travailles dans un clone de mon-projet-maison-prod :**
   - Clone `mon-projet-maison-prod`, va dans `latest-version/mon-projet-maison-main`.
   - Copie tout le contenu de `mon-projet-maison-5d2b87a7` (fichiers à la racine + `src/`, `supabase/`, etc.) **dans** `latest-version/mon-projet-maison-main` (en écrasant les fichiers existants).
   - Puis :
     ```bash
     git add .
     git commit -m "Sync version Supabase (hero, layout, tout le projet)"
     git push origin main
     ```

   **Méthode 2 – Push depuis ce projet vers prod (si tu as un script ou une branche dédiée) :**
   - Certains font une branche `main` dont le contenu reflète `latest-version/mon-projet-maison-main`. Dans ce cas, après avoir synchronisé le contenu (comme en méthode 1), tu push cette branche vers `prod` :
     ```bash
     git push prod main
     ```
   (À adapter si ton flux utilise une autre branche ou un sous-dossier.)

En résumé : **le code qui est dans `latest-version/mon-projet-maison-main` sur la branche `main` doit être exactement la version Supabase (ce projet).**

### Option B : Le dépôt Vercel est directement `mon-projet-maison-5d2b87a7`

1. Dans ce dossier :
   ```bash
   git add .
   git commit -m "Version Supabase - hero et config Vercel"
   git push origin main
   ```
2. Dans Vercel :
   - **Root Directory** : laisser **vide** (racine du repo).
   - Vercel buildera automatiquement à chaque push sur `main`.

---

## 4. Variables d’environnement sur Vercel (Supabase)

Pour que la version Supabase fonctionne en production :

1. Vercel → ton projet → **Settings → Environment Variables**.
2. Ajoute (pour **Production**, et si besoin Preview) :
   - `VITE_SUPABASE_URL` = l’URL de ton projet Supabase (ex. `https://xxxxx.supabase.co`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = la clé publique (anon) du projet Supabase

Sans ces variables, l’app ne pourra pas se connecter à Supabase sur le site Vercel.

---

## 5. Checklist rapide

- [ ] Vercel → **Settings → Git** : **Root Directory** = dossier qui contient `package.json` **et** `supabase/` (ex. `latest-version/mon-projet-maison-main` pour mon-projet-maison-prod).
- [ ] Sur GitHub, dans ce dossier : présence de **`supabase/`** (config, functions, migrations).
- [ ] Le code déployé est bien la **copie** de ce projet (mon-projet-maison-5d2b87a7), pas une ancienne version sans Supabase.
- [ ] **Environment Variables** Vercel : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` renseignés.
- [ ] Après un push sur la branche de production, un nouveau déploiement se lance et le site (ex. `mon-projet-maison-prod-esegk2yfv-mon-projet-maison-2.vercel.app`) affiche la version Supabase avec le bon titre et le bon positionnement.

---

## 6. Résumé

- **Version à déployer** = projet avec **Supabase** (dossier `supabase/`, `VITE_SUPABASE_*`).
- **Vercel** doit avoir le **Root Directory** qui pointe vers ce dossier (ex. `latest-version/mon-projet-maison-main` dans mon-projet-maison-prod).
- **Envoyer le bon code** : copier ce projet dans le bon dossier du repo, puis `git add` / `commit` / `push` sur la branche utilisée par Vercel.
- **Variables** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans Vercel.

Ainsi, Vercel reçoit bien le **bon dossier** et la **version Supabase**, pas celle qui utilise le cloud Lovable.

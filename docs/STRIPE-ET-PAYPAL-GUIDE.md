# Configuration Stripe et PayPal – MonProjetMaison

Ce guide décrit les étapes pour activer les paiements **Stripe** et **PayPal** sur ton site. Proposer les deux rassure les utilisateurs et augmente les conversions.

---

## Vue d’ensemble

| Étape | Stripe | PayPal |
|-------|--------|--------|
| 1. Compte | Créer un compte Stripe | Créer un compte Business PayPal |
| 2. Clés / IDs | Clés API (publishable + secret) | Client ID + Secret |
| 3. Produits | Créer des Produits/Prix pour tes forfaits | Pas de catalogue obligatoire (on envoie montant à chaque paiement) |
| 4. Backend | Edge Function qui crée une Checkout Session | Edge Function qui crée une commande PayPal |
| 5. Webhooks | Événements `checkout.session.completed`, etc. | Événements `PAYMENT.CAPTURE.COMPLETED` |
| 6. Frontend | Redirection vers Stripe Checkout + bouton PayPal | Bouton « Payer avec PayPal » |

---

## Partie 1 – Stripe

### 1.1 Créer un compte Stripe

1. Va sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Inscris-toi (email, mot de passe).
3. En mode **test**, tu peux utiliser les cartes de test Stripe (ex. `4242 4242 4242 4242`).

### 1.2 Récupérer les clés API

1. Dans le **Dashboard Stripe** → **Developers** → **API keys**.
2. Tu verras :
   - **Publishable key** (ex. `pk_test_...`) → à mettre côté **frontend** (variable d’environnement Vite).
   - **Secret key** (ex. `sk_test_...`) → **jamais** dans le frontend, uniquement dans le **backend** (Supabase Secrets pour une Edge Function).

### 1.3 Créer des Produits et Prix (pour tes forfaits)

1. **Dashboard** → **Products** → **Add product**.
2. Pour chaque forfait (ex. Gratuit, Pro, Premium) :
   - **Name** : ex. « Forfait Pro »
   - **Description** : optionnel
   - **Pricing** : récurrent (mensuel/annuel) ou one-time selon ton modèle.
3. Après création, note l’**ID du Prix** (ex. `price_1ABC...`). Tu en auras besoin dans l’Edge Function pour créer une Checkout Session.

### 1.4 Variables d’environnement (Stripe)

- **Frontend (Vercel / .env)**  
  - `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` (ou `pk_live_...` en production)

- **Backend (Supabase Edge Functions – Secrets)**  
  - `STRIPE_SECRET_KEY=sk_test_...` (ou `sk_live_...` en production)  
  - Optionnel : `STRIPE_WEBHOOK_SECRET=whsec_...` (pour vérifier les webhooks)

---

## Partie 2 – PayPal

### 2.1 Créer un compte Business PayPal

1. Va sur [https://www.paypal.com/ca/business](https://www.paypal.com/ca/business).
2. Crée un compte **Business** (pas personnel) pour accepter les paiements.

### 2.2 Récupérer Client ID et Secret

1. Connecte-toi à [PayPal Developer](https://developer.paypal.com/dashboard/).
2. **My Apps & Credentials** → **Create App** (ou utilise l’app par défaut).
3. Tu obtiens :
   - **Client ID** → peut aller côté frontend (pour le SDK) ou rester côté backend selon l’implémentation.
   - **Secret** → uniquement côté **backend** (Supabase Secrets).
4. En **Sandbox**, utilise les identifiants **Sandbox** ; en production, bascule sur **Live** et utilise les identifiants **Live**.

### 2.3 Variables d’environnement (PayPal)

- **Backend (Supabase Secrets)**  
  - `PAYPAL_CLIENT_ID=...`  
  - `PAYPAL_CLIENT_SECRET=...`  
  - En production : utiliser les clés **Live**.

- **Frontend (optionnel, si tu utilises le SDK PayPal)**  
  - `VITE_PAYPAL_CLIENT_ID=...` (souvent le même Client ID, en mode Sandbox ou Live selon l’env).

---

## Partie 3 – Supabase (backend)

### 3.1 Ajouter les secrets

1. **Supabase** → ton projet → **Project Settings** → **Edge Functions** → **Secrets**.
2. Ajoute :
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (après avoir créé le webhook)
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`

### 3.2 Edge Functions Stripe (déjà en place)

Les fonctions `create-checkout-session` et `stripe-webhook` sont créées dans `supabase/functions/`. Déploiement : `supabase functions deploy create-checkout-session` puis `supabase functions deploy stripe-webhook`. Secrets : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

Edge Functions à créer (ou déjà en place) dans `supabase/functions/` :

| Fonction | Rôle |
|----------|------|
| `create-checkout-session` | Reçoit `plan_id` (ou `price_id`), `user_id`, crée une [Stripe Checkout Session](https://stripe.com/docs/api/checkout/sessions/create) et renvoie `url` pour rediriger l’utilisateur. |
| `create-paypal-order` | Reçoit montant, devise, `plan_id`, crée une [commande PayPal](https://developer.paypal.com/docs/api/orders/v2/#orders_create) et renvoie `orderId` pour le frontend. |
| `stripe-webhook` | Reçoit les événements Stripe (ex. `checkout.session.completed`), vérifie la signature avec `STRIPE_WEBHOOK_SECRET`, puis insère dans `payments` et met à jour `subscriptions` si besoin. |
| `paypal-webhook` ou capture côté backend | Pour PayPal, soit tu utilises un webhook pour `PAYMENT.CAPTURE.COMPLETED`, soit tu confirmes la capture après retour utilisateur et tu enregistres le paiement dans `payments`. |

### 3.3 Webhook Stripe

1. **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL** : `https://<ton-projet>.supabase.co/functions/v1/stripe-webhook`.
3. Événements à écouter : `checkout.session.completed`, éventuellement `invoice.paid` si abonnements.
4. Récupère le **Signing secret** (`whsec_...`) et ajoute-le dans Supabase comme `STRIPE_WEBHOOK_SECRET`.

### 3.4 Webhook PayPal (optionnel mais recommandé)

1. **PayPal Developer** → ton app → **Webhooks** → **Add Webhook**.
2. **URL** : `https://<ton-projet>.supabase.co/functions/v1/paypal-webhook`.
3. Événements : ex. `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED` selon ton flux.

---

## Partie 4 – Frontend (Vercel / React)

### 4.1 Page / forfaits (Plans)

- Pour **Stripe** : au clic sur « Choisir » / « S’abonner » :
  1. Appel à ton Edge Function `create-checkout-session` (avec `plan_id` ou `price_id`).
  2. Redirection vers `session.url` (Stripe Hosted Checkout).
  3. Après paiement, Stripe redirige vers ta page de succès (paramètres `success_url` / `cancel_url` dans la Session).

- Pour **PayPal** :
  1. Option A : bouton « Payer avec PayPal » qui appelle `create-paypal-order`, récupère `orderId`, ouvre le flux PayPal (popup ou redirection) avec le SDK [@paypal/react-paypal-js](https://www.npmjs.com/package/@paypal/react-paypal-js).
  2. Option B : même principe sans SDK, en redirigeant vers l’URL PayPal avec l’`orderId`.

### 4.2 Variables Vercel

Dans **Vercel** → projet → **Settings** → **Environment Variables** :

- `VITE_STRIPE_PUBLISHABLE_KEY` (pour afficher Stripe ou construire l’URL de checkout si besoin).
- `VITE_PAYPAL_CLIENT_ID` (si tu utilises le SDK PayPal côté client).

Redéploie après toute modification des variables.

---

## Partie 5 – Table `payments` (déjà présente)

Ta table `payments` peut stocker les deux sources :

- **Stripe** : `payment_method = 'stripe'`, `provider_id` = ID de la Session ou du PaymentIntent.
- **PayPal** : `payment_method = 'paypal'`, `provider_id` = ID de la capture ou de la commande PayPal.

Renseigner aussi `user_id`, `amount`, `currency`, `status`, `invoice_url` (Stripe fournit un lien facture), et `subscription_id` si lié à un abonnement.

---

## Résumé des étapes à faire dans l’ordre

1. **Stripe** : créer le compte → récupérer Publishable + Secret key → créer Produits/Prix → noter les `price_id`.
2. **PayPal** : créer compte Business → Developer Dashboard → créer une App → noter Client ID + Secret (Sandbox puis Live).
3. **Supabase** : ajouter les 4 secrets (Stripe + PayPal).
4. **Supabase** : créer les Edge Functions `create-checkout-session`, `create-paypal-order`, `stripe-webhook`, (optionnel) `paypal-webhook`.
5. **Stripe** : configurer le webhook vers `stripe-webhook`, récupérer le signing secret, l’ajouter en secret.
6. **PayPal** : configurer le webhook si tu l’utilises.
7. **Frontend** : sur la page Forfaits, brancher « Payer avec Stripe » (redirection Checkout) et « Payer avec PayPal » (bouton + appel `create-paypal-order`).
8. **Vercel** : ajouter `VITE_STRIPE_PUBLISHABLE_KEY` et éventuellement `VITE_PAYPAL_CLIENT_ID`, redéployer.

Une fois ces étapes en place, Stripe et PayPal seront opérationnels et les paiements pourront être enregistrés dans `payments` et affichés dans l’admin Paiements.

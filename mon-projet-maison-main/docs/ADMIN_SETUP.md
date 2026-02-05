# Configuration du premier administrateur

Ce guide explique comment créer le premier compte administrateur pour accéder au tableau de bord admin de l'application.

## Prérequis

1. Avoir un compte utilisateur créé via la page d'inscription (`/auth`)
2. Avoir accès aux secrets/variables d'environnement du backend

## Étapes de configuration

### 1. Configurer le secret de bootstrap

Le secret `BOOTSTRAP_ADMIN_SECRET` doit être configuré dans les secrets du backend. Ce secret est utilisé pour authentifier la demande de création d'admin.

**Via Lovable Cloud :**
1. Allez dans les paramètres du projet
2. Accédez à la section "Secrets" ou "Variables d'environnement"
3. Ajoutez une nouvelle variable :
   - Nom : `BOOTSTRAP_ADMIN_SECRET`
   - Valeur : Un mot de passe unique et sécurisé (ex: une chaîne aléatoire de 32+ caractères)

### 2. Créer le premier admin

1. Assurez-vous d'avoir créé un compte utilisateur via `/auth` avec l'email que vous souhaitez promouvoir en admin
2. Allez sur `/bootstrap-admin`
3. Remplissez le formulaire :
   - **Email** : L'email du compte à promouvoir
   - **Secret** : Le `BOOTSTRAP_ADMIN_SECRET` que vous avez configuré
4. Cliquez sur "Créer le compte admin"

### 3. Accéder au tableau de bord admin

1. Si vous êtes connecté avec un autre compte, déconnectez-vous
2. Connectez-vous avec le compte que vous venez de promouvoir
3. Accédez à `/admin`

Vous devriez maintenant avoir accès au tableau de bord administrateur.

## Sécurité

- La page `/bootstrap-admin` est accessible publiquement, mais la création d'admin nécessite le secret
- Une fois le premier admin créé, vous pouvez supprimer le secret `BOOTSTRAP_ADMIN_SECRET` pour désactiver cette fonctionnalité
- Les admins existants peuvent gérer les rôles des autres utilisateurs via le tableau de bord admin

## Dépannage

### "Aucun utilisateur trouvé avec cet email"
- Assurez-vous que le compte existe et que l'email est correctement orthographié
- Le compte doit avoir été créé via la page d'inscription (`/auth`)

### "Secret invalide"
- Vérifiez que le secret entré correspond exactement à `BOOTSTRAP_ADMIN_SECRET`
- Vérifiez que le secret est bien configuré dans les variables d'environnement du backend

### "BOOTSTRAP_ADMIN_SECRET non configuré"
- Le secret n'a pas été ajouté aux variables d'environnement
- Suivez l'étape 1 pour configurer le secret

## Alternative : SQL direct

Si vous avez accès à la base de données, vous pouvez aussi exécuter cette requête SQL :

```sql
-- Remplacez 'votre-email@example.com' par l'email de l'utilisateur à promouvoir
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'votre-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

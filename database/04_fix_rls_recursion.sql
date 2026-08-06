-- Correction de la boucle infinie (infinite recursion) sur la table profiles

-- Cette politique créait une boucle car elle demandait à Supabase de lire la table "profiles" 
-- pour vérifier si l'utilisateur avait le droit de lire la table "profiles".
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Note : L'autre politique ("Users can view their own profile") reste active 
-- et est suffisante pour que l'application fonctionne correctement.

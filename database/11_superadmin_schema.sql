-- =================================================================================
-- SPRINT 11 : SUPER ADMIN (GOD MODE) - CORRECTIF
-- =================================================================================

-- 1. Ajouter le champ is_super_admin (si pas déjà fait)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Créer une fonction SECURITY DEFINER pour vérifier le super admin
-- Cette fonction contourne le RLS pour éviter la récursion infinie
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 3. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- 4. Recréer la politique pour les organisations (utilise la fonction, pas de récursion)
CREATE POLICY "Super admins can view all organizations"
    ON public.organizations
    FOR SELECT
    USING (
        public.is_super_admin() = true
    );

-- 5. Recréer la politique pour les profils (utilise la fonction, pas de récursion)
CREATE POLICY "Super admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        public.is_super_admin() = true
    );

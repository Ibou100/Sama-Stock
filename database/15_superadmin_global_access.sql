-- =================================================================================
-- SAMA STOCK - SPRINT 15 : SUPER ADMIN GLOBAL PLATFORM ACCESS & PLANS
-- =================================================================================

-- 1. Permettre aux super admins de lire l'ensemble des produits et factures pour les métriques globales (GMV)
DROP POLICY IF EXISTS "Super admins can view all products" ON public.products;
CREATE POLICY "Super admins can view all products"
    ON public.products FOR SELECT
    USING (public.is_super_admin() = true);

DROP POLICY IF EXISTS "Super admins can view all invoices" ON public.invoices;
CREATE POLICY "Super admins can view all invoices"
    ON public.invoices FOR SELECT
    USING (public.is_super_admin() = true);

-- 2. Ajouter les attributs de statut et plan SaaS sur organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Essai Pro',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial'));

-- 3. Fonction pour promouvoir ou rétrograder un super admin en toute sécurité
CREATE OR REPLACE FUNCTION public.toggle_super_admin(target_user_id UUID, new_status BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seul un super admin actif a le droit d'appeler cette fonction
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Action non autorisée. Réservée aux Super Admins.';
  END IF;

  UPDATE public.profiles
  SET is_super_admin = new_status
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_super_admin(UUID, BOOLEAN) TO authenticated;

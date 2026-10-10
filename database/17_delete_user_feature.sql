-- =================================================================================
-- SAMA STOCK - SPRINT 17 : SUPPRESSION D'UTILISATEURS PAR LES ADMINISTRATEURS
-- =================================================================================

-- 1. Politique RLS pour permettre aux Super Admins et Propriétaires de supprimer un profil
DROP POLICY IF EXISTS "Super admins and owners can delete profiles" ON public.profiles;
CREATE POLICY "Super admins and owners can delete profiles"
    ON public.profiles FOR DELETE
    USING (
        public.is_super_admin() = true
        OR (
            organization_id = public.get_auth_user_organization_id()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
            AND id != auth.uid()
        )
    );

-- 2. Fonction SECURITY DEFINER pour supprimer de profiles ET de auth.users (libération de l'email)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Vérifier les droits : soit Super Admin, soit Propriétaire/Admin du même établissement
  IF NOT (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles executor
      JOIN public.profiles target ON target.id = target_user_id
      WHERE executor.id = auth.uid()
        AND executor.role IN ('owner', 'admin')
        AND executor.organization_id = target.organization_id
        AND target.id != auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Action non autorisée. Seul un administrateur peut supprimer un compte.';
  END IF;

  -- Supprimer le profil et la session auth
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;

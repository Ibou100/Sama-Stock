-- =================================================================================
-- SPRINT 12 : LOGIN LOGS & ANALYTICS
-- =================================================================================

-- 1. Table de logs des connexions
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Index pour les requêtes par date
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_in_at ON public.login_logs (logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_organization_id ON public.login_logs (organization_id);

-- 3. Activer RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- 4. Politique : seuls les super admins peuvent lire les logs
CREATE POLICY "Super admins can view all login logs"
    ON public.login_logs
    FOR SELECT
    USING (
        public.is_super_admin() = true
    );

-- 5. Fonction SECURITY DEFINER pour logger une connexion
-- Callable par n'importe quel utilisateur authentifié via rpc('log_user_login')
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_org_id UUID;
BEGIN
  -- Récupérer les infos du profil de l'utilisateur connecté
  SELECT email, organization_id INTO v_email, v_org_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- Insérer le log de connexion
  INSERT INTO public.login_logs (user_id, email, organization_id)
  VALUES (auth.uid(), COALESCE(v_email, ''), v_org_id);
END;
$$;

-- 6. Politique INSERT : la fonction SECURITY DEFINER gère l'insertion,
--    mais on ajoute une politique pour permettre à tout utilisateur authentifié
--    d'insérer via la fonction RPC
CREATE POLICY "Authenticated users can insert their own login log"
    ON public.login_logs
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =================================================================================
-- SAMA STOCK - SPRINT 16 : SECTEURS D'ACTIVITÉ & MODULARITÉ DYNAMIQUE DES MÉTIERS
-- =================================================================================

-- 1. Ajouter les colonnes de type d'activité et modules fonctionnels sur organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS enable_expiry_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_extended_units BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_serial_numbers BOOLEAN DEFAULT false;

-- Contrainte de vérification sur business_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_organization_business_type'
  ) THEN
    ALTER TABLE public.organizations
    ADD CONSTRAINT check_organization_business_type
    CHECK (business_type IN ('general', 'pharmacy', 'quincaillerie', 'supermarket'));
  END IF;
END $$;

-- 2. Mettre à jour la fonction handle_new_user pour enregistrer le secteur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  b_type TEXT;
  has_expiry BOOLEAN := false;
  has_units BOOLEAN := false;
  has_serial BOOLEAN := false;
BEGIN
  org_name := NEW.raw_user_meta_data->>'organization_name';
  b_type := COALESCE(NEW.raw_user_meta_data->>'business_type', 'general');

  -- Déterminer les drapeaux par défaut selon le secteur
  IF b_type = 'pharmacy' THEN
    has_expiry := true;
  ELSIF b_type = 'quincaillerie' THEN
    has_units := true;
  ELSIF b_type = 'supermarket' THEN
    has_expiry := true;
  END IF;

  IF org_name IS NOT NULL THEN
    INSERT INTO public.organizations (
      name, 
      business_type, 
      enable_expiry_tracking, 
      enable_extended_units, 
      enable_serial_numbers
    )
    VALUES (
      org_name, 
      b_type, 
      has_expiry, 
      has_units, 
      has_serial
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, organization_id, email, full_name, role)
    VALUES (
      NEW.id,
      new_org_id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      'owner'::public.user_role
    );
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      'employee'::public.user_role
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

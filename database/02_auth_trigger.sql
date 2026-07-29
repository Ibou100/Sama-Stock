-- =================================================================================
-- SAMA STOCK - SPRINT 1 : AUTHENTICATION TRIGGER
-- =================================================================================

-- Fix: Added "SET search_path = public" to prevent type resolution errors for user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Extract organization_name from the user metadata sent during sign up
  org_name := NEW.raw_user_meta_data->>'organization_name';

  -- If an organization name was provided (meaning it's a new client registering)
  IF org_name IS NOT NULL THEN
    -- Create the new organization
    INSERT INTO public.organizations (name)
    VALUES (org_name)
    RETURNING id INTO new_org_id;

    -- Create the owner profile linked to this new organization
    INSERT INTO public.profiles (id, organization_id, email, full_name, role)
    VALUES (
      NEW.id,
      new_org_id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      'owner'::public.user_role
    );
  ELSE
    -- If no organization name is provided, it might be an invited employee.
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

-- Create the trigger that calls the function after a user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

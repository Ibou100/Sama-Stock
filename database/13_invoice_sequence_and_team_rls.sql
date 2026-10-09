-- =================================================================================
-- SAMA STOCK - SPRINT 13 : INVOICE SEQUENCE FUNCTION & TEAM RLS RESTORATION
-- =================================================================================

-- 1. Secure helper to get the next sequence value (used by invoices & purchase orders)
CREATE OR REPLACE FUNCTION public.get_next_sequence_value(seq_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  -- Whitelist allowed sequences to prevent arbitrary sequence consumption
  IF seq_name NOT IN ('invoice_seq', 'purchase_order_seq') THEN
    RAISE EXCEPTION 'Sequence not authorized: %', seq_name;
  END IF;

  EXECUTE format('SELECT nextval(%I)', seq_name) INTO next_val;
  RETURN next_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_sequence_value(TEXT) TO authenticated;

-- 2. SECURITY DEFINER helper to retrieve user's organization without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_user_organization_id() TO authenticated;

-- 3. Restore the policy allowing members of the same organization to see each other
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR (
      organization_id IS NOT NULL 
      AND organization_id = public.get_auth_user_organization_id()
    )
  );

-- 4. Allow owners and admins to update members in their organization (e.g. change role)
DROP POLICY IF EXISTS "Admins can update organization members" ON public.profiles;
CREATE POLICY "Admins can update organization members"
  ON public.profiles
  FOR UPDATE
  USING (
    organization_id = public.get_auth_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

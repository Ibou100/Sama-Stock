-- =================================================================================
-- SAMA STOCK - SPRINT 4 : INVENTORY MOVEMENTS
-- =================================================================================

-- 1. Create the inventory movements table
CREATE TABLE public.inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    movement_type TEXT CHECK (movement_type IN ('IN', 'OUT')) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the trigger function to update product stock
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'IN' THEN
        UPDATE public.products 
        SET current_stock = current_stock + NEW.quantity 
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'OUT' THEN
        UPDATE public.products 
        SET current_stock = current_stock - NEW.quantity 
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Attach the trigger to the table
CREATE TRIGGER on_inventory_movement
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

-- 4. Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can view movements of their organization
CREATE POLICY "Users can view inventory movements of their organization"
    ON public.inventory_movements FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can insert movements for their organization
CREATE POLICY "Users can insert inventory movements for their organization"
    ON public.inventory_movements FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users CANNOT update or delete movements (immutable audit trail)
-- (No policies created for UPDATE or DELETE, so they are implicitly forbidden)

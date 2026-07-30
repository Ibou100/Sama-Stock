-- =================================================================================
-- SAMA STOCK - SPRINT 3 : PRODUCTS & CATEGORIES
-- =================================================================================

-- 1. Categories Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products Table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    name TEXT NOT NULL,
    sku TEXT NOT NULL, -- SKU (Stock Keeping Unit)
    barcode TEXT,
    description TEXT,
    
    price INTEGER NOT NULL DEFAULT 0, -- Selling price (in FCFA)
    cost INTEGER NOT NULL DEFAULT 0,  -- Purchase cost (in FCFA)
    
    min_stock INTEGER NOT NULL DEFAULT 10,
    current_stock INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure SKU is unique per organization
    UNIQUE(organization_id, sku)
);

-- 3. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Categories
-- Users can view categories belonging to their organization
CREATE POLICY "Users can view categories of their organization"
    ON public.categories FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can insert categories for their organization
CREATE POLICY "Users can insert categories for their organization"
    ON public.categories FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can update categories of their organization
CREATE POLICY "Users can update categories of their organization"
    ON public.categories FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can delete categories of their organization
CREATE POLICY "Users can delete categories of their organization"
    ON public.categories FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 5. RLS Policies for Products
-- Users can view products belonging to their organization
CREATE POLICY "Users can view products of their organization"
    ON public.products FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can insert products for their organization
CREATE POLICY "Users can insert products for their organization"
    ON public.products FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can update products of their organization
CREATE POLICY "Users can update products of their organization"
    ON public.products FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Users can delete products of their organization
CREATE POLICY "Users can delete products of their organization"
    ON public.products FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 6. Add Triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

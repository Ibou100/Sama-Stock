-- =================================================================================
-- SPRINT 10 : ROLE-BASED ACCESS CONTROL (RBAC) - RESTRICT DELETE
-- =================================================================================

-- 1. Categories
DROP POLICY IF EXISTS "delete categories" ON public.categories;
CREATE POLICY "delete categories" ON public.categories
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 2. Products
DROP POLICY IF EXISTS "delete products" ON public.products;
CREATE POLICY "delete products" ON public.products
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 3. Suppliers
DROP POLICY IF EXISTS "delete suppliers" ON public.suppliers;
CREATE POLICY "delete suppliers" ON public.suppliers
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 4. Customers
DROP POLICY IF EXISTS "delete customers" ON public.customers;
CREATE POLICY "delete customers" ON public.customers
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 5. Purchase Orders
DROP POLICY IF EXISTS "delete orders" ON public.purchase_orders;
CREATE POLICY "delete orders" ON public.purchase_orders
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "delete order items" ON public.purchase_order_items;
CREATE POLICY "delete order items" ON public.purchase_order_items
    FOR DELETE
    USING (
        order_id IN (
            SELECT id FROM public.purchase_orders WHERE organization_id IN (
                SELECT organization_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- 6. Invoices
DROP POLICY IF EXISTS "delete invoices" ON public.invoices;
CREATE POLICY "delete invoices" ON public.invoices
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "delete invoice items" ON public.invoice_items;
CREATE POLICY "delete invoice items" ON public.invoice_items
    FOR DELETE
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE organization_id IN (
                SELECT organization_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- Factures clients (Ventes)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'paid', 'cancelled')),
    notes TEXT,
    total_amount NUMERIC(12,2) DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lignes de facture
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view invoices" ON public.invoices FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "insert invoices" ON public.invoices FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "update invoices" ON public.invoices FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "delete invoices" ON public.invoices FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- RLS invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view invoice items" ON public.invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "insert invoice items" ON public.invoice_items FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "delete invoice items" ON public.invoice_items FOR DELETE USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Auto-numéro facture
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- =================================================================================
-- SAMA STOCK - SPRINT 14 : BUSINESS SPECIFICS (PHARMACIE, QUINCAILLERIE, CAISSE/POS)
-- =================================================================================

-- 1. Enrichir la table products avec les unités (quincaillerie) et péremption/lots (pharmacie)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pièce',
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Index pour optimiser les requêtes sur les dates de péremption
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products (expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_batch_number ON public.products (batch_number);

-- 2. Enrichir la table invoices pour le mode Caisse / POS
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS amount_received NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS change_returned NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_name_snapshot TEXT DEFAULT 'Client Comptoir';

-- 3. Vue pratique pour détecter les alertes péremption (Pharmacie)
CREATE OR REPLACE VIEW public.v_expiring_products AS
SELECT 
    p.*,
    (p.expiry_date - CURRENT_DATE) AS days_until_expiry,
    CASE 
        WHEN p.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN p.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'critical'
        WHEN p.expiry_date <= (CURRENT_DATE + INTERVAL '90 days') THEN 'warning'
        ELSE 'good'
    END AS expiry_status
FROM public.products p
WHERE p.expiry_date IS NOT NULL;

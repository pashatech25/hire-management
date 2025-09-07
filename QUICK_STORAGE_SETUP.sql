-- Quick storage setup for signatures
-- Run this to create the storage buckets

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Check if buckets were created
SELECT id, name, public FROM storage.buckets WHERE id IN ('signatures', 'company-assets');

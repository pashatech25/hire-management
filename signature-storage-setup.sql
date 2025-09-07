-- Signature storage setup for Supabase
-- This file sets up storage buckets for signature images
-- Note: Storage policies need to be created through the Supabase Dashboard

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for company assets (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies need to be created through the Supabase Dashboard:
-- 1. Go to Storage > Policies in your Supabase dashboard
-- 2. For 'signatures' bucket:
--    - Create policy "Public can view signature images" (SELECT, public access)
--    - Create policy "Authenticated users can upload signatures" (INSERT, authenticated users)
--    - Create policy "Authenticated users can update signatures" (UPDATE, authenticated users)
--    - Create policy "Authenticated users can delete signatures" (DELETE, authenticated users)
-- 3. For 'company-assets' bucket:
--    - Create policy "Authenticated users can manage company assets" (ALL, authenticated users)

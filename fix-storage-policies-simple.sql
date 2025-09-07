-- Simple storage policy fix that should work without owner permissions
-- This creates the policies through the dashboard approach

-- Note: Storage policies need to be created through the Supabase Dashboard
-- Go to Storage > Policies and create these policies manually:

-- For 'signatures' bucket:
-- Policy 1: "Public can view signature images" (SELECT, public access)
-- Policy 2: "Public can upload signature images" (INSERT, public access)  
-- Policy 3: "Public can update signature images" (UPDATE, public access)
-- Policy 4: "Public can delete signature images" (DELETE, public access)

-- For 'company-assets' bucket:
-- Policy 1: "Authenticated users can view company assets" (SELECT, authenticated users)
-- Policy 2: "Authenticated users can upload company assets" (INSERT, authenticated users)
-- Policy 3: "Authenticated users can update company assets" (UPDATE, authenticated users)
-- Policy 4: "Authenticated users can delete company assets" (DELETE, authenticated users)

-- Check if buckets exist
SELECT id, name, public FROM storage.buckets WHERE id IN ('signatures', 'company-assets');

-- Fix storage policies to allow public uploads for signatures
-- This allows hirees to upload signatures without authentication

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view signature images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete signatures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create new policies for signatures bucket (public access)
CREATE POLICY "Public can view signature images" ON storage.objects
    FOR SELECT USING (bucket_id = 'signatures');

CREATE POLICY "Public can upload signature images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Public can update signature images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'signatures');

CREATE POLICY "Public can delete signature images" ON storage.objects
    FOR DELETE USING (bucket_id = 'signatures');

-- Create policies for company-assets bucket (authenticated only)
CREATE POLICY "Authenticated users can view company assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload company assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update company assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete company assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%signature%'
ORDER BY policyname;

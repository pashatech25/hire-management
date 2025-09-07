-- Test RLS status and policies
-- Run this to check current RLS configuration

-- Check if RLS is enabled on signatures table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'signatures';

-- Check existing policies on signatures table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'signatures'
ORDER BY policyname;

-- Check if signatures table has the required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'signatures' 
AND column_name IN ('profile_id', 'company_id', 'signature_token', 'document_type')
ORDER BY column_name;

-- Check if profiles table exists and has owner_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'owner_id';

-- Test if we can query signatures (this will show RLS errors if any)
SELECT COUNT(*) as signature_count FROM signatures;

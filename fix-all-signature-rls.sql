-- Comprehensive RLS fix for signature system
-- This file fixes all RLS policies for the signature system

-- First, ensure the signatures table has RLS enabled
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can create signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can update signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can delete signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can view signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Public can view signatures by token" ON signatures;
DROP POLICY IF EXISTS "Public can update signatures by token" ON signatures;

-- Create comprehensive RLS policies for signatures table

-- Policy 1: Users can create signatures for their own profiles
CREATE POLICY "Users can create signatures for their profiles" ON signatures
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Policy 2: Users can view signatures for their own profiles
CREATE POLICY "Users can view signatures for their profiles" ON signatures
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Policy 3: Users can update signatures for their own profiles
CREATE POLICY "Users can update signatures for their profiles" ON signatures
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Policy 4: Users can delete signatures for their own profiles
CREATE POLICY "Users can delete signatures for their profiles" ON signatures
    FOR DELETE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Policy 5: Public can view signatures by token (for hiree signing)
CREATE POLICY "Public can view signatures by token" ON signatures
    FOR SELECT USING (signature_token IS NOT NULL);

-- Policy 6: Public can update signatures by token (for hiree signing)
CREATE POLICY "Public can update signatures by token" ON signatures
    FOR UPDATE USING (signature_token IS NOT NULL);

-- Ensure signature_reset_logs has proper RLS policies
ALTER TABLE signature_reset_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reset logs" ON signature_reset_logs;
DROP POLICY IF EXISTS "Users can insert their own reset logs" ON signature_reset_logs;

-- Create RLS policies for signature_reset_logs
CREATE POLICY "Users can view their own reset logs" ON signature_reset_logs
    FOR SELECT USING (
        reset_by = auth.uid()
    );

CREATE POLICY "Users can insert their own reset logs" ON signature_reset_logs
    FOR INSERT WITH CHECK (
        reset_by = auth.uid()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signatures_profile_id ON signatures(profile_id);
CREATE INDEX IF NOT EXISTS idx_signatures_company_id ON signatures(company_id);
CREATE INDEX IF NOT EXISTS idx_signatures_token ON signatures(signature_token);
CREATE INDEX IF NOT EXISTS idx_signatures_document_type ON signatures(document_type);
CREATE INDEX IF NOT EXISTS idx_signatures_is_signed ON signatures(is_signed);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('signatures', 'signature_reset_logs')
ORDER BY tablename, policyname;

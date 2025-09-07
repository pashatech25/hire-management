-- Fix signatures table schema
-- Add missing owner_id column and fix the table structure

-- Add owner_id column to signatures table
ALTER TABLE signatures 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add signature_name column if it doesn't exist
ALTER TABLE signatures 
ADD COLUMN IF NOT EXISTS signature_name TEXT;

-- Create index for owner_id for better performance
CREATE INDEX IF NOT EXISTS idx_signatures_owner_id ON signatures(owner_id);

-- Update RLS policies to include owner_id
DROP POLICY IF EXISTS "Users can create signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can view signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can update signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can delete signatures for their profiles" ON signatures;

-- Create new policies that include owner_id
CREATE POLICY "Users can create signatures for their profiles" ON signatures
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() OR
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view signatures for their profiles" ON signatures
    FOR SELECT USING (
        owner_id = auth.uid() OR
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update signatures for their profiles" ON signatures
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete signatures for their profiles" ON signatures
    FOR DELETE USING (
        owner_id = auth.uid() OR
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'signatures' 
AND column_name IN ('owner_id', 'signature_name')
ORDER BY column_name;

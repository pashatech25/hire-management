-- Fix RLS policies for signature creation and updates
-- This file adds missing RLS policies for the signatures table

-- Add RLS policy for signature creation (INSERT)
CREATE POLICY "Users can create signatures for their profiles" ON signatures
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Add RLS policy for signature updates by profile owners
CREATE POLICY "Users can update signatures for their profiles" ON signatures
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Add RLS policy for signature deletion by profile owners
CREATE POLICY "Users can delete signatures for their profiles" ON signatures
    FOR DELETE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

-- Add RLS policy for signature selection by profile owners
CREATE POLICY "Users can view signatures for their profiles" ON signatures
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE owner_id = auth.uid()
        )
    );

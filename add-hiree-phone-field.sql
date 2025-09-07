-- Add hiree_phone field to profiles table
-- Run this in the Supabase SQL Editor

-- Add the hiree_phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hiree_phone TEXT;

-- Update the updated_at trigger to include the new column
-- (The existing trigger will handle this automatically)

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_hiree_phone ON profiles(hiree_phone);

-- Add missing fields to offer_details table that OfferTab is trying to use
-- Run this in Supabase SQL Editor

-- Add missing columns that OfferTab is trying to save
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS work_schedule TEXT;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2);
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS commission DECIMAL(5,2);
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS flat_services JSONB;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS tiered_services JSONB;
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add company_id for multi-tenancy
ALTER TABLE offer_details ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Update existing records to set company_id based on profile's company
UPDATE offer_details 
SET company_id = profiles.company_id 
FROM profiles 
WHERE offer_details.profile_id = profiles.id;

-- Make company_id NOT NULL
ALTER TABLE offer_details ALTER COLUMN company_id SET NOT NULL;

-- Create index for company_id
CREATE INDEX IF NOT EXISTS idx_offer_details_company_id ON offer_details(company_id);
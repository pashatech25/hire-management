-- Fix offer_details table to include all fields from OfferDetails interface
-- Add missing columns to offer_details table

ALTER TABLE offer_details 
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS work_schedule TEXT,
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS responsibilities TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS flat_services JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tiered_services JSONB DEFAULT '[]';

-- Update existing columns to be nullable where appropriate
ALTER TABLE offer_details 
ALTER COLUMN position DROP NOT NULL,
ALTER COLUMN probation_months DROP NOT NULL,
ALTER COLUMN manager_name DROP NOT NULL,
ALTER COLUMN manager_email DROP NOT NULL,
ALTER COLUMN manager_phone DROP NOT NULL,
ALTER COLUMN manager_ext DROP NOT NULL,
ALTER COLUMN contact_ext DROP NOT NULL,
ALTER COLUMN ceo_name DROP NOT NULL;

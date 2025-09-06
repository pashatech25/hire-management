-- Migration to fix schema: Make services tenant-owned instead of profile-owned

-- Add company_id columns to all service tables
ALTER TABLE flat_services ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE tiers ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE tiered_rates ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE gear_items ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE templates ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE signatures ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Update existing data: Set company_id based on profile's company
UPDATE flat_services 
SET company_id = profiles.company_id 
FROM profiles 
WHERE flat_services.profile_id = profiles.id;

UPDATE tiers 
SET company_id = profiles.company_id 
FROM profiles 
WHERE tiers.profile_id = profiles.id;

UPDATE tiered_rates 
SET company_id = profiles.company_id 
FROM profiles 
WHERE tiered_rates.profile_id = profiles.id;

UPDATE gear_items 
SET company_id = profiles.company_id 
FROM profiles 
WHERE gear_items.profile_id = profiles.id;

UPDATE templates 
SET company_id = profiles.company_id 
FROM profiles 
WHERE templates.profile_id = profiles.id;

UPDATE signatures 
SET company_id = profiles.company_id 
FROM profiles 
WHERE signatures.profile_id = profiles.id;

-- Make company_id NOT NULL
ALTER TABLE flat_services ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE tiers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE tiered_rates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE gear_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE signatures ALTER COLUMN company_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX idx_flat_services_company_id ON flat_services(company_id);
CREATE INDEX idx_tiers_company_id ON tiers(company_id);
CREATE INDEX idx_tiered_rates_company_id ON tiered_rates(company_id);
CREATE INDEX idx_gear_items_company_id ON gear_items(company_id);
CREATE INDEX idx_templates_company_id ON templates(company_id);
CREATE INDEX idx_signatures_company_id ON signatures(company_id);

-- Update RLS policies to use company_id instead of profile_id
DROP POLICY IF EXISTS "Users can view flat services for their profiles" ON flat_services;
DROP POLICY IF EXISTS "Users can insert flat services for their profiles" ON flat_services;
DROP POLICY IF EXISTS "Users can update flat services for their profiles" ON flat_services;
DROP POLICY IF EXISTS "Users can delete flat services for their profiles" ON flat_services;

-- Create new RLS policies for company-owned services
CREATE POLICY "Users can view their company's flat services" ON flat_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = flat_services.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flat services for their company" ON flat_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = flat_services.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's flat services" ON flat_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = flat_services.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's flat services" ON flat_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = flat_services.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Similar updates for other tables...
-- (I'll create separate policies for each table)

-- Update tiers policies
DROP POLICY IF EXISTS "Users can view tiers for their profiles" ON tiers;
DROP POLICY IF EXISTS "Users can insert tiers for their profiles" ON tiers;
DROP POLICY IF EXISTS "Users can update tiers for their profiles" ON tiers;
DROP POLICY IF EXISTS "Users can delete tiers for their profiles" ON tiers;

CREATE POLICY "Users can view their company's tiers" ON tiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiers.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tiers for their company" ON tiers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiers.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's tiers" ON tiers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiers.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's tiers" ON tiers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiers.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Update tiered_rates policies
DROP POLICY IF EXISTS "Users can view tiered rates for their profiles" ON tiered_rates;
DROP POLICY IF EXISTS "Users can insert tiered rates for their profiles" ON tiered_rates;
DROP POLICY IF EXISTS "Users can update tiered rates for their profiles" ON tiered_rates;
DROP POLICY IF EXISTS "Users can delete tiered rates for their profiles" ON tiered_rates;

CREATE POLICY "Users can view their company's tiered rates" ON tiered_rates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiered_rates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tiered rates for their company" ON tiered_rates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiered_rates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's tiered rates" ON tiered_rates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiered_rates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's tiered rates" ON tiered_rates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = tiered_rates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Update gear_items policies
DROP POLICY IF EXISTS "Users can view gear items for their profiles" ON gear_items;
DROP POLICY IF EXISTS "Users can insert gear items for their profiles" ON gear_items;
DROP POLICY IF EXISTS "Users can update gear items for their profiles" ON gear_items;
DROP POLICY IF EXISTS "Users can delete gear items for their profiles" ON gear_items;

CREATE POLICY "Users can view their company's gear items" ON gear_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = gear_items.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gear items for their company" ON gear_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = gear_items.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's gear items" ON gear_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = gear_items.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's gear items" ON gear_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = gear_items.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Update templates policies
DROP POLICY IF EXISTS "Users can view templates for their profiles" ON templates;
DROP POLICY IF EXISTS "Users can insert templates for their profiles" ON templates;
DROP POLICY IF EXISTS "Users can update templates for their profiles" ON templates;
DROP POLICY IF EXISTS "Users can delete templates for their profiles" ON templates;

CREATE POLICY "Users can view their company's templates" ON templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates for their company" ON templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's templates" ON templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's templates" ON templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Update signatures policies
DROP POLICY IF EXISTS "Users can view signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can insert signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can update signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can delete signatures for their profiles" ON signatures;

CREATE POLICY "Users can view their company's signatures" ON signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = signatures.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert signatures for their company" ON signatures
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = signatures.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's signatures" ON signatures
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = signatures.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's signatures" ON signatures
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = signatures.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

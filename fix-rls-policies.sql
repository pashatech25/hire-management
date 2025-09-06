-- Quick fix for RLS policies to allow service insertion
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS for testing
ALTER TABLE flat_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tiered_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE signatures DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create more permissive policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view flat services for their profiles" ON flat_services;
DROP POLICY IF EXISTS "Users can insert flat services for their profiles" ON flat_services;
DROP POLICY IF EXISTS "Users can update flat services for their profiles" ON flat_services;
DROP POLICY IF EXISTS "Users can delete flat services for their profiles" ON flat_services;

-- Create new permissive policies
CREATE POLICY "Users can view all flat services" ON flat_services
  FOR SELECT USING (true);

CREATE POLICY "Users can insert flat services" ON flat_services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update flat services" ON flat_services
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete flat services" ON flat_services
  FOR DELETE USING (true);

-- Similar for other tables
DROP POLICY IF EXISTS "Users can view tiers for their profiles" ON tiers;
DROP POLICY IF EXISTS "Users can insert tiers for their profiles" ON tiers;
DROP POLICY IF EXISTS "Users can update tiers for their profiles" ON tiers;
DROP POLICY IF EXISTS "Users can delete tiers for their profiles" ON tiers;

CREATE POLICY "Users can view all tiers" ON tiers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert tiers" ON tiers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update tiers" ON tiers
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete tiers" ON tiers
  FOR DELETE USING (true);

-- Tiered rates
DROP POLICY IF EXISTS "Users can view tiered rates for their profiles" ON tiered_rates;
DROP POLICY IF EXISTS "Users can insert tiered rates for their profiles" ON tiered_rates;
DROP POLICY IF EXISTS "Users can update tiered rates for their profiles" ON tiered_rates;
DROP POLICY IF EXISTS "Users can delete tiered rates for their profiles" ON tiered_rates;

CREATE POLICY "Users can view all tiered rates" ON tiered_rates
  FOR SELECT USING (true);

CREATE POLICY "Users can insert tiered rates" ON tiered_rates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update tiered rates" ON tiered_rates
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete tiered rates" ON tiered_rates
  FOR DELETE USING (true);

-- Gear items
DROP POLICY IF EXISTS "Users can view gear items for their profiles" ON gear_items;
DROP POLICY IF EXISTS "Users can insert gear items for their profiles" ON gear_items;
DROP POLICY IF EXISTS "Users can update gear items for their profiles" ON gear_items;
DROP POLICY IF EXISTS "Users can delete gear items for their profiles" ON gear_items;

CREATE POLICY "Users can view all gear items" ON gear_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert gear items" ON gear_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update gear items" ON gear_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete gear items" ON gear_items
  FOR DELETE USING (true);

-- Templates
DROP POLICY IF EXISTS "Users can view templates for their profiles" ON templates;
DROP POLICY IF EXISTS "Users can insert templates for their profiles" ON templates;
DROP POLICY IF EXISTS "Users can update templates for their profiles" ON templates;
DROP POLICY IF EXISTS "Users can delete templates for their profiles" ON templates;

CREATE POLICY "Users can view all templates" ON templates
  FOR SELECT USING (true);

CREATE POLICY "Users can insert templates" ON templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update templates" ON templates
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete templates" ON templates
  FOR DELETE USING (true);

-- Signatures
DROP POLICY IF EXISTS "Users can view signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can insert signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can update signatures for their profiles" ON signatures;
DROP POLICY IF EXISTS "Users can delete signatures for their profiles" ON signatures;

CREATE POLICY "Users can view all signatures" ON signatures
  FOR SELECT USING (true);

CREATE POLICY "Users can insert signatures" ON signatures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update signatures" ON signatures
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete signatures" ON signatures
  FOR DELETE USING (true);

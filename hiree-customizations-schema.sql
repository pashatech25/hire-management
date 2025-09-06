-- Hiree Customizations Schema
-- This allows each hiree to customize company services/gear without affecting the core templates

-- Hiree Flat Services Customizations
CREATE TABLE hiree_flat_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flat_service_id UUID REFERENCES flat_services(id) ON DELETE CASCADE,
  custom_rate TEXT, -- Override price, NULL = use company default
  is_enabled BOOLEAN DEFAULT true, -- Check/uncheck for this hiree
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, flat_service_id)
);

-- Hiree Tiered Services Customizations  
CREATE TABLE hiree_tiered_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tiered_rate_id UUID REFERENCES tiered_rates(id) ON DELETE CASCADE,
  custom_rate TEXT, -- Override price, NULL = use company default
  is_enabled BOOLEAN DEFAULT true, -- Check/uncheck for this hiree
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, tiered_rate_id)
);

-- Hiree Gear Customizations
CREATE TABLE hiree_gear_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gear_item_id UUID REFERENCES gear_items(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true, -- Check/uncheck for this hiree
  custom_notes TEXT, -- Hiree-specific notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, gear_item_id)
);

-- Hiree-specific gear items (not from company template)
CREATE TABLE hiree_custom_gear_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hiree-specific flat services (not from company template)
CREATE TABLE hiree_custom_flat_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_hiree_flat_services_profile_id ON hiree_flat_services(profile_id);
CREATE INDEX idx_hiree_flat_services_flat_service_id ON hiree_flat_services(flat_service_id);
CREATE INDEX idx_hiree_tiered_rates_profile_id ON hiree_tiered_rates(profile_id);
CREATE INDEX idx_hiree_tiered_rates_tiered_rate_id ON hiree_tiered_rates(tiered_rate_id);
CREATE INDEX idx_hiree_gear_items_profile_id ON hiree_gear_items(profile_id);
CREATE INDEX idx_hiree_gear_items_gear_item_id ON hiree_gear_items(gear_item_id);
CREATE INDEX idx_hiree_custom_gear_items_profile_id ON hiree_custom_gear_items(profile_id);
CREATE INDEX idx_hiree_custom_flat_services_profile_id ON hiree_custom_flat_services(profile_id);

-- RLS Policies for hiree customizations
CREATE POLICY "Users can view their company's hiree customizations" ON hiree_flat_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hiree customizations for their company" ON hiree_flat_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's hiree customizations" ON hiree_flat_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's hiree customizations" ON hiree_flat_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Similar policies for other hiree customization tables
CREATE POLICY "Users can view their company's hiree tiered customizations" ON hiree_tiered_rates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_tiered_rates.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hiree tiered customizations for their company" ON hiree_tiered_rates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_tiered_rates.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's hiree tiered customizations" ON hiree_tiered_rates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_tiered_rates.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's hiree tiered customizations" ON hiree_tiered_rates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_tiered_rates.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Gear customizations policies
CREATE POLICY "Users can view their company's hiree gear customizations" ON hiree_gear_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hiree gear customizations for their company" ON hiree_gear_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's hiree gear customizations" ON hiree_gear_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's hiree gear customizations" ON hiree_gear_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Custom gear items policies
CREATE POLICY "Users can view their company's custom gear items" ON hiree_custom_gear_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom gear items for their company" ON hiree_custom_gear_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's custom gear items" ON hiree_custom_gear_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's custom gear items" ON hiree_custom_gear_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_gear_items.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Custom flat services policies
CREATE POLICY "Users can view their company's custom flat services" ON hiree_custom_flat_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom flat services for their company" ON hiree_custom_flat_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's custom flat services" ON hiree_custom_flat_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's custom flat services" ON hiree_custom_flat_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN companies ON profiles.company_id = companies.id
      WHERE profiles.id = hiree_custom_flat_services.profile_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hiree_flat_services_updated_at BEFORE UPDATE ON hiree_flat_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hiree_tiered_rates_updated_at BEFORE UPDATE ON hiree_tiered_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hiree_gear_items_updated_at BEFORE UPDATE ON hiree_gear_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hiree_custom_gear_items_updated_at BEFORE UPDATE ON hiree_custom_gear_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hiree_custom_flat_services_updated_at BEFORE UPDATE ON hiree_custom_flat_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

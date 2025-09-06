-- Create Hiree Override Tables
-- These tables store hiree-specific customizations for company services and gear

-- Hiree Flat Services Overrides
CREATE TABLE hiree_flat_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES flat_services(id) ON DELETE CASCADE,
  custom_rate DECIMAL(10,2), -- Override price, NULL = use company default
  enabled BOOLEAN DEFAULT true, -- Check/uncheck for this hiree
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, service_id)
);

-- Hiree Tiered Rates Overrides
CREATE TABLE hiree_tiered_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'photo', 'video', 'iguide', 'matterport'
  custom_rate DECIMAL(10,2), -- Override price, NULL = use company default
  enabled BOOLEAN DEFAULT true, -- Check/uncheck for this hiree
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, tier_id, service_type)
);

-- Hiree Gear Items Overrides
CREATE TABLE hiree_gear_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gear_id UUID REFERENCES gear_items(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT true, -- Check/uncheck for this hiree
  custom_notes TEXT, -- Hiree-specific notes
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, gear_id)
);

-- Enable Row Level Security
ALTER TABLE hiree_flat_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiree_tiered_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiree_gear_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hiree_flat_services
CREATE POLICY "Users can view their own hiree flat service overrides" ON hiree_flat_services
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own hiree flat service overrides" ON hiree_flat_services
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own hiree flat service overrides" ON hiree_flat_services
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own hiree flat service overrides" ON hiree_flat_services
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for hiree_tiered_rates
CREATE POLICY "Users can view their own hiree tiered rate overrides" ON hiree_tiered_rates
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own hiree tiered rate overrides" ON hiree_tiered_rates
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own hiree tiered rate overrides" ON hiree_tiered_rates
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own hiree tiered rate overrides" ON hiree_tiered_rates
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for hiree_gear_items
CREATE POLICY "Users can view their own hiree gear item overrides" ON hiree_gear_items
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own hiree gear item overrides" ON hiree_gear_items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own hiree gear item overrides" ON hiree_gear_items
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own hiree gear item overrides" ON hiree_gear_items
  FOR DELETE USING (auth.uid() = owner_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hiree_flat_services_updated_at 
  BEFORE UPDATE ON hiree_flat_services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hiree_tiered_rates_updated_at 
  BEFORE UPDATE ON hiree_tiered_rates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hiree_gear_items_updated_at 
  BEFORE UPDATE ON hiree_gear_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

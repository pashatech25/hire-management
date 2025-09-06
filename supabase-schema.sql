-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  hiree_name TEXT NOT NULL,
  hiree_dob DATE,
  hiree_address TEXT NOT NULL,
  hiree_email TEXT NOT NULL,
  hiree_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create flat_services table
CREATE TABLE flat_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tiers table
CREATE TABLE tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  min_sqft INTEGER NOT NULL,
  max_sqft INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tiered_rates table
CREATE TABLE tiered_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('photo', 'video', 'iguide', 'matterport')),
  rate TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gear_items table
CREATE TABLE gear_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offer_details table
CREATE TABLE offer_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  start_date DATE,
  probation_months TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  manager_ext TEXT NOT NULL,
  contact_ext TEXT NOT NULL,
  return_by DATE,
  ceo_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('waiver', 'noncompete', 'gear', 'pay', 'offer')),
  clauses TEXT[] NOT NULL DEFAULT '{}',
  addendum TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signatures table
CREATE TABLE signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('hiree', 'company')),
  signature_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hiree_access table for sharing documents
CREATE TABLE hiree_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- Set up Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiered_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiree_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own companies" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own companies" ON companies
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profiles" ON profiles
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own profiles" ON profiles
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for flat_services
CREATE POLICY "Users can view flat services for their profiles" ON flat_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = flat_services.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flat services for their profiles" ON flat_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = flat_services.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flat services for their profiles" ON flat_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = flat_services.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flat services for their profiles" ON flat_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = flat_services.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for tiers
CREATE POLICY "Users can view tiers for their profiles" ON tiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiers.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tiers for their profiles" ON tiers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiers.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tiers for their profiles" ON tiers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiers.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tiers for their profiles" ON tiers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiers.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for tiered_rates
CREATE POLICY "Users can view tiered rates for their profiles" ON tiered_rates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiered_rates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tiered rates for their profiles" ON tiered_rates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiered_rates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tiered rates for their profiles" ON tiered_rates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiered_rates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tiered rates for their profiles" ON tiered_rates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = tiered_rates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for gear_items
CREATE POLICY "Users can view gear items for their profiles" ON gear_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear_items.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gear items for their profiles" ON gear_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear_items.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update gear items for their profiles" ON gear_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear_items.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete gear items for their profiles" ON gear_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear_items.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for offer_details
CREATE POLICY "Users can view offer details for their profiles" ON offer_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = offer_details.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert offer details for their profiles" ON offer_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = offer_details.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update offer details for their profiles" ON offer_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = offer_details.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete offer details for their profiles" ON offer_details
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = offer_details.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for templates
CREATE POLICY "Users can view templates for their profiles" ON templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = templates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates for their profiles" ON templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = templates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates for their profiles" ON templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = templates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates for their profiles" ON templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = templates.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for signatures
CREATE POLICY "Users can view signatures for their profiles" ON signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = signatures.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert signatures for their profiles" ON signatures
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = signatures.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update signatures for their profiles" ON signatures
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = signatures.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete signatures for their profiles" ON signatures
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = signatures.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create RLS policies for hiree_access
CREATE POLICY "Users can view hiree access for their profiles" ON hiree_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = hiree_access.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hiree access for their profiles" ON hiree_access
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = hiree_access.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offer_details_updated_at BEFORE UPDATE ON offer_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signatures_updated_at BEFORE UPDATE ON signatures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_profiles_owner_id ON profiles(owner_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_flat_services_profile_id ON flat_services(profile_id);
CREATE INDEX idx_tiers_profile_id ON tiers(profile_id);
CREATE INDEX idx_tiered_rates_profile_id ON tiered_rates(profile_id);
CREATE INDEX idx_tiered_rates_tier_id ON tiered_rates(tier_id);
CREATE INDEX idx_gear_items_profile_id ON gear_items(profile_id);
CREATE INDEX idx_offer_details_profile_id ON offer_details(profile_id);
CREATE INDEX idx_templates_profile_id ON templates(profile_id);
CREATE INDEX idx_templates_document_type ON templates(document_type);
CREATE INDEX idx_signatures_profile_id ON signatures(profile_id);
CREATE INDEX idx_signatures_type ON signatures(signature_type);
CREATE INDEX idx_hiree_access_token ON hiree_access(access_token);
CREATE INDEX idx_hiree_access_expires ON hiree_access(expires_at);

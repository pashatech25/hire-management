-- Add gear pricing schema
-- This adds estimated pricing fields to gear items for OpenAI cost estimation

-- Add pricing fields to gear_items table
ALTER TABLE gear_items ADD COLUMN estimated_price_cad DECIMAL(10,2);
ALTER TABLE gear_items ADD COLUMN price_source TEXT DEFAULT 'manual'; -- 'manual', 'openai', 'user_override'
ALTER TABLE gear_items ADD COLUMN last_estimated_at TIMESTAMP WITH TIME ZONE;

-- Add pricing fields to hiree_custom_gear_items table
ALTER TABLE hiree_custom_gear_items ADD COLUMN estimated_price_cad DECIMAL(10,2);
ALTER TABLE hiree_custom_gear_items ADD COLUMN price_source TEXT DEFAULT 'manual'; -- 'manual', 'openai', 'user_override'
ALTER TABLE hiree_custom_gear_items ADD COLUMN last_estimated_at TIMESTAMP WITH TIME ZONE;

-- Add pricing fields to hiree_gear_items table (for overrides)
ALTER TABLE hiree_gear_items ADD COLUMN custom_price_cad DECIMAL(10,2); -- Override price for this hiree
ALTER TABLE hiree_gear_items ADD COLUMN price_override_source TEXT DEFAULT 'manual'; -- 'manual', 'openai', 'user_override'

-- Create gear_estimation_logs table to track OpenAI estimation requests
CREATE TABLE gear_estimation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  estimation_type TEXT NOT NULL CHECK (estimation_type IN ('company_gear', 'hiree_custom_gear', 'all_gear')),
  items_estimated INTEGER NOT NULL DEFAULT 0,
  total_estimated_cost_cad DECIMAL(10,2),
  openai_tokens_used INTEGER,
  openai_cost_usd DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_gear_items_estimated_price ON gear_items(estimated_price_cad);
CREATE INDEX idx_gear_items_price_source ON gear_items(price_source);
CREATE INDEX idx_hiree_custom_gear_items_estimated_price ON hiree_custom_gear_items(estimated_price_cad);
CREATE INDEX idx_hiree_custom_gear_items_price_source ON hiree_custom_gear_items(price_source);
CREATE INDEX idx_hiree_gear_items_custom_price ON hiree_gear_items(custom_price_cad);
CREATE INDEX idx_gear_estimation_logs_profile_id ON gear_estimation_logs(profile_id);
CREATE INDEX idx_gear_estimation_logs_company_id ON gear_estimation_logs(company_id);
CREATE INDEX idx_gear_estimation_logs_created_at ON gear_estimation_logs(created_at);

-- Enable RLS for gear_estimation_logs
ALTER TABLE gear_estimation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gear_estimation_logs
CREATE POLICY "Users can view their own gear estimation logs" ON gear_estimation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear_estimation_logs.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own gear estimation logs" ON gear_estimation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = gear_estimation_logs.profile_id 
      AND profiles.owner_id = auth.uid()
    )
  );

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hiree_custom_gear_items_updated_at') THEN
        CREATE TRIGGER update_hiree_custom_gear_items_updated_at BEFORE UPDATE ON hiree_custom_gear_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hiree_gear_items_updated_at') THEN
        CREATE TRIGGER update_hiree_gear_items_updated_at BEFORE UPDATE ON hiree_gear_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

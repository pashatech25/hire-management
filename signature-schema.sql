-- Signature system schema
-- This file extends the existing signatures table for online document signing

-- Add new columns to existing signatures table for document signature links
ALTER TABLE signatures 
ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (document_type IN ('compensation', 'acceptance', 'gear_obligations', 'payment_schedule')),
ADD COLUMN IF NOT EXISTS document_data JSONB,
ADD COLUMN IF NOT EXISTS signature_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_by TEXT CHECK (signed_by IN ('tenant', 'hiree')),
ADD COLUMN IF NOT EXISTS tenant_signature_data TEXT,
ADD COLUMN IF NOT EXISTS hiree_signature_data TEXT,
ADD COLUMN IF NOT EXISTS tenant_initial_data TEXT,
ADD COLUMN IF NOT EXISTS hiree_initial_data TEXT,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Table to store signature reset logs
CREATE TABLE signature_reset_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    signature_id UUID REFERENCES signatures(id) ON DELETE CASCADE,
    reset_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reset_reason TEXT,
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new table
ALTER TABLE signature_reset_logs ENABLE ROW LEVEL SECURITY;

-- Add new RLS policies for extended signatures table
-- Public policy for signature links (no authentication required)
CREATE POLICY "Public can view signatures by token" ON signatures
    FOR SELECT USING (signature_token IS NOT NULL);

CREATE POLICY "Public can update signatures by token" ON signatures
    FOR UPDATE USING (signature_token IS NOT NULL);

-- RLS Policies for signature_reset_logs
CREATE POLICY "Users can view their own reset logs" ON signature_reset_logs
    FOR SELECT USING (
        reset_by = auth.uid()
    );

CREATE POLICY "Users can insert their own reset logs" ON signature_reset_logs
    FOR INSERT WITH CHECK (
        reset_by = auth.uid()
    );

-- Create function to generate signature tokens
CREATE OR REPLACE FUNCTION generate_signature_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_signature_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (signatures table already has this trigger)
-- No need to create a new trigger as it already exists

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signatures_token ON signatures(signature_token);
CREATE INDEX IF NOT EXISTS idx_signatures_document_type ON signatures(document_type);
CREATE INDEX IF NOT EXISTS idx_signatures_is_signed ON signatures(is_signed);
CREATE INDEX IF NOT EXISTS idx_signatures_company_id ON signatures(company_id);

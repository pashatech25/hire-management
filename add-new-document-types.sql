-- Add new document types to signatures table
-- This script adds 'waiver' and 'noncompete' as valid document types

-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
    -- Drop the existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'signatures_document_type_check'
    ) THEN
        ALTER TABLE signatures DROP CONSTRAINT signatures_document_type_check;
    END IF;
END $$;

-- Add the new check constraint with all document types
ALTER TABLE signatures 
ADD CONSTRAINT signatures_document_type_check 
CHECK (document_type IN ('compensation', 'acceptance', 'gear_obligations', 'payment_schedule', 'waiver', 'noncompete'));

-- Update any existing signatures that might have been mapped incorrectly
-- This is optional - only run if you have existing data that needs to be updated
-- UPDATE signatures SET document_type = 'waiver' WHERE document_type = 'compensation' AND document_data->>'type' = 'waiver';
-- UPDATE signatures SET document_type = 'noncompete' WHERE document_type = 'acceptance' AND document_data->>'type' = 'noncompete';

-- Verify the constraint was added
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'signatures_document_type_check';

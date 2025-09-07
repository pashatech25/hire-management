# Supabase Storage Setup Guide

## Step 1: Create Storage Buckets

Run the `signature-storage-setup.sql` file in your Supabase SQL editor. This will create the necessary storage buckets.

## Step 2: Set Up Storage Policies via Dashboard

Since storage policies require owner permissions, you need to create them through the Supabase Dashboard:

### 1. Go to Storage > Policies in your Supabase Dashboard

### 2. For 'signatures' bucket, create these policies:

#### Policy 1: Public can view signature images
- **Policy Name**: `Public can view signature images`
- **Operation**: `SELECT`
- **Target Roles**: `public`
- **Policy Definition**:
```sql
bucket_id = 'signatures'
```

#### Policy 2: Authenticated users can upload signatures
- **Policy Name**: `Authenticated users can upload signatures`
- **Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'signatures' AND auth.role() = 'authenticated'
```

#### Policy 3: Authenticated users can update signatures
- **Policy Name**: `Authenticated users can update signatures`
- **Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'signatures' AND auth.role() = 'authenticated'
```

#### Policy 4: Authenticated users can delete signatures
- **Policy Name**: `Authenticated users can delete signatures`
- **Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'signatures' AND auth.role() = 'authenticated'
```

### 3. For 'company-assets' bucket, create this policy:

#### Policy: Authenticated users can manage company assets
- **Policy Name**: `Authenticated users can manage company assets`
- **Operation**: `ALL`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'company-assets' AND auth.role() = 'authenticated'
```

## Step 3: Verify Setup

After creating the policies, test the signature functionality:

1. Create a signature link in the Documents tab
2. Sign the document (both tenant and hiree)
3. Check that signature images appear in the Storage > signatures bucket
4. Verify that signature images display correctly in the UI

## Troubleshooting

If you encounter permission errors:
1. Make sure you're the owner of the Supabase project
2. Check that RLS is enabled on storage.objects
3. Verify that the buckets were created successfully
4. Ensure all policies are created with the exact names and definitions above

## File Structure

After setup, your storage will be organized as:

```
signatures/
├── {profileId}/
│   ├── tenant_signature_1234567890.png
│   ├── tenant_initial_1234567890.png
│   ├── hiree_signature_1234567891.png
│   └── hiree_initial_1234567891.png

company-assets/
└── logos/
    └── {companyId}_1234567890.png
```

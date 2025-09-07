# Manual Storage Policies Setup

Since we can't create storage policies via SQL (permission issue), you need to create them manually through the Supabase Dashboard.

## Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Storage** > **Policies**

## Step 2: Create Policies for 'signatures' Bucket

### Policy 1: Public can view signature images
- **Policy Name**: `Public can view signature images`
- **Operation**: `SELECT`
- **Target Roles**: `public`
- **Policy Definition**:
```sql
bucket_id = 'signatures'
```

### Policy 2: Public can upload signature images
- **Policy Name**: `Public can upload signature images`
- **Operation**: `INSERT`
- **Target Roles**: `public`
- **Policy Definition**:
```sql
bucket_id = 'signatures'
```

### Policy 3: Public can update signature images
- **Policy Name**: `Public can update signature images`
- **Operation**: `UPDATE`
- **Target Roles**: `public`
- **Policy Definition**:
```sql
bucket_id = 'signatures'
```

### Policy 4: Public can delete signature images
- **Policy Name**: `Public can delete signature images`
- **Operation**: `DELETE`
- **Target Roles**: `public`
- **Policy Definition**:
```sql
bucket_id = 'signatures'
```

## Step 3: Create Policies for 'company-assets' Bucket

### Policy 1: Authenticated users can view company assets
- **Policy Name**: `Authenticated users can view company assets`
- **Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'company-assets' AND auth.role() = 'authenticated'
```

### Policy 2: Authenticated users can upload company assets
- **Policy Name**: `Authenticated users can upload company assets`
- **Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'company-assets' AND auth.role() = 'authenticated'
```

### Policy 3: Authenticated users can update company assets
- **Policy Name**: `Authenticated users can update company assets`
- **Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'company-assets' AND auth.role() = 'authenticated'
```

### Policy 4: Authenticated users can delete company assets
- **Policy Name**: `Authenticated users can delete company assets`
- **Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'company-assets' AND auth.role() = 'authenticated'
```

## Step 4: Verify Setup

After creating all policies, test the signature upload:

1. Go to the Signatures tab in your app
2. Draw a signature and enter a name
3. Click "Save Signature"
4. Should work without storage errors

## Troubleshooting

If you still get storage errors:
1. Make sure both buckets exist (`signatures` and `company-assets`)
2. Verify all 8 policies are created correctly
3. Check that the policy definitions match exactly
4. Try refreshing the app after creating policies

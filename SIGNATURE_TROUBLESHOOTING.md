# Signature System Troubleshooting Guide

## Current Error: "Failed to upload signature: new row violates row-level security policy"

This error occurs because the RLS (Row Level Security) policies for the signatures table are not properly configured.

## Step-by-Step Fix

### 1. First, Check Current Status
Run this SQL in your Supabase SQL editor to see the current state:
```sql
-- Check RLS status and policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'signatures'
ORDER BY policyname;
```

### 2. Apply the RLS Fix
Run the comprehensive RLS fix:
```sql
-- Run the entire fix-all-signature-rls.sql file
```

### 3. Verify the Fix
After running the fix, verify it worked:
```sql
-- This should show 6 policies for signatures table
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'signatures'
ORDER BY policyname;
```

### 4. Test Signature Creation
Try creating a signature link in the app. If it still fails, check the browser console for the exact error.

## Expected Policies After Fix

The signatures table should have these 6 policies:

1. **Users can create signatures for their profiles** (INSERT)
2. **Users can view signatures for their profiles** (SELECT) 
3. **Users can update signatures for their profiles** (UPDATE)
4. **Users can delete signatures for their profiles** (DELETE)
5. **Public can view signatures by token** (SELECT)
6. **Public can update signatures by token** (UPDATE)

## Common Issues

### Issue 1: "relation 'profiles' does not exist"
- **Solution**: Make sure you've run the main schema files first
- **Check**: `SELECT * FROM profiles LIMIT 1;`

### Issue 2: "column 'owner_id' does not exist"
- **Solution**: The profiles table needs the owner_id column
- **Fix**: Run the main schema files that create the profiles table

### Issue 3: "policy already exists"
- **Solution**: The fix script drops existing policies first, so this should not happen
- **Manual Fix**: Drop the policy manually: `DROP POLICY "policy_name" ON signatures;`

### Issue 4: Still getting RLS errors after fix
- **Check**: Make sure you're logged in as the correct user
- **Check**: Verify the profile belongs to the current user
- **Debug**: Run `SELECT auth.uid();` to see current user ID

## Testing the Fix

1. **Login to the app**
2. **Load a profile** (not a temporary one)
3. **Go to Documents tab**
4. **Click "Share Link" on any document**
5. **Should work without RLS errors**

## Storage Setup (Separate Issue)

The signature system also needs storage buckets. If you get storage errors:

1. **Run**: `signature-storage-setup.sql`
2. **Create storage policies** via Supabase Dashboard (see STORAGE_SETUP_GUIDE.md)

## Still Having Issues?

If the RLS fix doesn't work:

1. **Check the exact error** in browser console
2. **Verify user authentication** - make sure you're logged in
3. **Check profile ownership** - make sure the profile belongs to the current user
4. **Run the test queries** to see what's missing

The most common issue is that the RLS policies haven't been applied yet. Make sure to run the `fix-all-signature-rls.sql` file completely.

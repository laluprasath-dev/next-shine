# Vendor Logo Upload Fix

## Problem

The vendor logo upload was failing with "Image size must be less than 5MB" error even for 2MB files, and the logo wasn't being updated in the vendor registration.

## Root Cause

The main issue was that the **vendor storage bucket was not created** in Supabase. The application was trying to upload to a non-existent bucket, which caused the upload to fail.

## Solution

### 1. Create Vendor Storage Bucket

Run the following SQL in your Supabase SQL editor:

```sql
-- Add vendor storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor', 'vendor', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the vendor bucket
CREATE POLICY "Anyone can view vendor images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor');

CREATE POLICY "Authenticated users can upload vendor images"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'vendor'
);

CREATE POLICY "Users can update their own vendor images"
ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'vendor' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

CREATE POLICY "Users can delete their own vendor images"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'vendor' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);
```

### 2. Alternative: Use Migration File

You can also run the migration file:

```bash
# Apply the migration
supabase db push
```

### 3. Code Improvements Made

#### Enhanced File Validation

- Added better file size validation with precise calculations
- Added debugging logs to track file size issues
- Added validation for cropped images

#### Better Error Handling

- Added specific error messages for missing storage bucket
- Added debugging tools for development
- Improved error messages for file size issues

#### Storage Bucket Configuration

- Created vendor storage bucket with proper policies
- Added migration file for easy deployment
- Added test functions to verify storage accessibility

## Files Modified

1. **`supabase/bucket.sql`** - Added vendor bucket configuration
2. **`supabase/migrations/20250120000002_add_vendor_storage_bucket.sql`** - Migration file
3. **`apply_vendor_bucket_migration.sql`** - Standalone migration script
4. **`src/hooks/use-vendor-logo-upload.ts`** - Enhanced error handling
5. **`src/components/vendor/BusinessLogoUploader.tsx`** - Added debugging and validation
6. **`src/utils/testStorage.ts`** - Added storage testing utilities

## Testing

### 1. Test Storage Bucket

Use the debug tools in the BusinessLogoUploader component (only visible in development mode):

- Click "Test Storage" to verify the vendor bucket is accessible
- Click "Test File" to test file upload functionality

### 2. Test File Upload

1. Select a file (2MB or less)
2. Crop if needed
3. Click "Save Logo"
4. Check browser console for debugging logs
5. Verify the logo appears in the vendor profile

## Debugging

### Console Logs

The application now logs detailed information:

- File validation details (size, type, name)
- Upload process steps
- Storage bucket accessibility
- Error details with specific messages

### Common Issues

1. **"Vendor storage bucket not found"** - Run the SQL migration above
2. **File size errors** - Check console logs for actual file size
3. **Upload failures** - Check network tab for API errors

## Next Steps

1. **Apply the migration** to create the vendor storage bucket
2. **Test the upload functionality** with a small image file
3. **Verify the logo appears** in the vendor profile
4. **Remove debug tools** in production (they're only visible in development mode)

## Production Deployment

1. Run the migration in your production Supabase instance
2. Verify the vendor bucket exists in the Supabase dashboard
3. Test the upload functionality
4. Remove or disable debug tools for production

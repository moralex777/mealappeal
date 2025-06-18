# Fix for Image Truncation Issue

## Problem Summary

Users are seeing grey placeholder images instead of their food photos because the database column `image_url` has a `VARCHAR(50000)` limit that truncates base64-encoded images larger than 50,000 characters.

### Affected Users
- **alex@propertytalents.com**: 9 out of 35 meals affected (25.7%)
- This explains why alex can see some images (26 normal ones) but not others (9 truncated ones)

## Root Cause

The `meals` table's `image_url` column is defined as `VARCHAR(50000)`, which truncates any base64 image data exceeding 50,000 characters. When images are truncated:
- The base64 string is cut off at exactly 50,000 characters
- The incomplete base64 data cannot be decoded into a valid image
- The app shows a grey placeholder with a food emoji instead

## Solution Steps

### 1. Apply Database Migration (IMMEDIATE)

Run this SQL in your Supabase SQL Editor:

```sql
-- Change the column type from VARCHAR(50000) to TEXT
ALTER TABLE public.meals 
ALTER COLUMN image_url TYPE TEXT;

-- Add documentation
COMMENT ON COLUMN public.meals.image_url IS 'Base64-encoded image data or URL. Changed from VARCHAR(50000) to TEXT to support full image storage.';
```

### 2. Verify the Migration

After running the migration, verify it worked:

```sql
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'meals'
    AND column_name = 'image_url';
```

The `data_type` should now show `text` and `character_maximum_length` should be `NULL`.

### 3. Check Affected Meals

To see which meals are affected:

```sql
SELECT 
    m.id,
    m.title,
    m.created_at,
    p.email as user_email,
    LENGTH(m.image_url) as image_length
FROM meals m
JOIN auth.users u ON m.user_id = u.id
JOIN profiles p ON p.id = u.id
WHERE LENGTH(m.image_url) = 50000
ORDER BY m.created_at DESC;
```

### 4. User Communication

After applying the migration:
- New meal analyses will save images properly
- Existing truncated images cannot be recovered (the data is permanently cut off)
- Users will need to re-analyze affected meals

## Prevention

The migration has already been created in `/supabase/migrations/20250616_fix_image_url_column.sql` but needs to be applied to the production database.

## Long-term Recommendation

Consider migrating from storing base64 images in the database to using Supabase Storage:
- Better performance (no large base64 strings in queries)
- Proper image CDN with caching
- Ability to generate thumbnails
- More efficient storage

## Scripts Available

- **Check truncation status**: `node scripts/db/check-all-user-images.js`
- **Identify affected meals**: `node scripts/db/fix-truncated-images.js`
- **Migration SQL**: `/scripts/db/apply-image-url-migration.sql`

## Timeline

1. The issue started when the `meals` table was created with `VARCHAR(50000)`
2. Some images fit within the limit (< 50KB after base64 encoding)
3. Larger images get truncated at exactly 50,000 characters
4. The app correctly detects this (line 105 in `/src/app/meals/page.tsx`) and shows a placeholder
# Image URL Truncation Fix

## Problem
Meal images are showing as food emoji placeholders (🍽️) instead of the actual images. Investigation revealed that the `image_url` column in the `meals` table is defined as `VARCHAR(50000)`, which truncates base64 image data at exactly 50,000 characters.

## Root Cause
- Base64-encoded images are typically much larger than 50,000 characters
- The database column type `VARCHAR(50000)` enforces a hard limit
- When images are truncated, they become invalid base64 and fail to render
- The LazyImage component correctly shows a placeholder when images fail to load

## Evidence
Running the check-image-urls.js script shows all images are exactly 50,000 characters:
```
Meal 1: Noodle Bowl with Seaweed
  Image URL Length: 50000 characters
  Is base64: true
  Has base64 marker: true
```

## Solution

### 1. Database Migration (Permanent Fix)
Run the following SQL migration in your Supabase dashboard:

```sql
-- Fix image_url column to use TEXT instead of VARCHAR to store full base64 images
BEGIN;

ALTER TABLE meals 
ALTER COLUMN image_url TYPE TEXT;

COMMENT ON COLUMN meals.image_url IS 'Full base64 data URL of the meal image. Using TEXT type to accommodate large base64 strings.';

COMMIT;
```

### 2. Application Updates (Temporary Mitigation)
- Added detection for 50,000 character images in LazyImage component
- Improved error messages to indicate truncation issue
- Added console warnings to help diagnose the problem

### 3. Long-term Recommendation
Consider migrating to Supabase Storage instead of storing base64 in the database:
- Upload images to Supabase Storage buckets
- Store only the public URL in the database
- Benefits: Better performance, no size limits, CDN delivery

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Paste and run the migration SQL above
4. All new images will be stored without truncation

### Option 2: Supabase CLI
1. Ensure the migration file exists: `supabase/migrations/20250616_fix_image_url_column.sql`
2. Run: `supabase db push`

## After Migration
- New meal photos will display correctly
- Existing truncated images will still show placeholders
- Users will need to re-upload affected meals

## Verification
After applying the migration, run:
```bash
node scripts/test/check-image-urls.js
```

New meals should show image URLs longer than 50,000 characters.
-- Create storage buckets for meal images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('meal-images', 'meal-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('meal-thumbnails', 'meal-thumbnails', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for meal-images bucket
CREATE POLICY "Users can upload their own meal images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own meal images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'meal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own meal images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'meal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for meal images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'meal-images');

-- Storage policies for meal-thumbnails bucket
CREATE POLICY "Users can upload their own thumbnails" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own thumbnails" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'meal-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'meal-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for thumbnails" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'meal-thumbnails');

-- Storage policies for user-avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'user-avatars');

-- Add new columns to meals table for storage integration
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
ADD COLUMN IF NOT EXISTS cdn_url TEXT,
ADD COLUMN IF NOT EXISTS image_size INTEGER,
ADD COLUMN IF NOT EXISTS image_dimensions JSONB;

-- Create index for faster storage queries
CREATE INDEX IF NOT EXISTS idx_meals_storage_path ON public.meals(storage_path);
CREATE INDEX IF NOT EXISTS idx_meals_user_created ON public.meals(user_id, created_at DESC);

-- Function to clean up old images for free tier users
CREATE OR REPLACE FUNCTION cleanup_old_free_tier_images()
RETURNS void AS $$
DECLARE
  meal_record RECORD;
  retention_days INTEGER := 14;
BEGIN
  -- Find meals older than retention period for free users
  FOR meal_record IN
    SELECT m.id, m.storage_path, m.thumbnail_path
    FROM meals m
    JOIN profiles p ON m.user_id = p.user_id
    WHERE p.subscription_tier = 'free'
    AND m.created_at < CURRENT_TIMESTAMP - INTERVAL '14 days'
    AND m.storage_path IS NOT NULL
  LOOP
    -- Delete from storage (this requires using Supabase client in application code)
    -- Mark for deletion in the database
    UPDATE meals 
    SET storage_path = NULL, 
        thumbnail_path = NULL, 
        cdn_url = NULL,
        image_url = NULL
    WHERE id = meal_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup job (requires pg_cron extension)
-- This should be configured in Supabase dashboard or via API
-- SELECT cron.schedule('cleanup-free-tier-images', '0 2 * * *', 'SELECT cleanup_old_free_tier_images();');
-- Fix image_url column to support full base64 images
-- The VARCHAR(50000) limit was truncating images, causing display issues

-- Change the column type from VARCHAR(50000) to TEXT
ALTER TABLE public.meals 
ALTER COLUMN image_url TYPE TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN public.meals.image_url IS 'Base64-encoded image data. Changed from VARCHAR(50000) to TEXT to support full image storage.';
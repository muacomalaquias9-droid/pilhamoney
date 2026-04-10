
-- Add identity verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS bi_number text,
ADD COLUMN IF NOT EXISTS bi_image_url text,
ADD COLUMN IF NOT EXISTS bi_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bi_verification_status text NOT NULL DEFAULT 'none';

-- Create storage bucket for identity documents
INSERT INTO storage.buckets (id, name, public) VALUES ('identity-docs', 'identity-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Only the user can upload their own BI
CREATE POLICY "Users can upload own identity docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own docs
CREATE POLICY "Users can view own identity docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can view all docs (via service role, no policy needed)

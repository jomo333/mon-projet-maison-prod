-- Create storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos to their projects
CREATE POLICY "Users can upload project photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-photos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own project photos
CREATE POLICY "Users can view their project photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-photos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view project photos
CREATE POLICY "Public can view project photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-photos');

-- Allow users to delete their own project photos
CREATE POLICY "Users can delete their project photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-photos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create table for project photos metadata
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_photos
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_photos
CREATE POLICY "Users can view their project photos"
ON public.project_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their project photos"
ON public.project_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project photos"
ON public.project_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.user_id = auth.uid()
  )
);
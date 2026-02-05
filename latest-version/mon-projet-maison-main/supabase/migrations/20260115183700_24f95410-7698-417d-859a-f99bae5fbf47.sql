-- Create table for task attachments
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (will add auth later)
CREATE POLICY "Allow public read access" 
ON public.task_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.task_attachments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access" 
ON public.task_attachments 
FOR DELETE 
USING (true);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', true);

-- Storage policies
CREATE POLICY "Public can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Public can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Public can delete attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments');
-- Fix RLS policies for task_attachments to require authentication and project ownership

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their project attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can upload to their projects" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can view their project attachments" ON public.task_attachments;

-- Create stricter RLS policies that require authentication
CREATE POLICY "Authenticated users can view their project attachments"
ON public.task_attachments
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = task_attachments.project_id 
      AND projects.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authenticated users can upload attachments"
ON public.task_attachments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = task_attachments.project_id 
      AND projects.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authenticated users can delete their attachments"
ON public.task_attachments
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = task_attachments.project_id 
      AND projects.user_id = auth.uid()
    )
  )
);
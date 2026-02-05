-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create projects table to save user projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  square_footage INTEGER,
  number_of_floors INTEGER DEFAULT 1,
  has_garage BOOLEAN DEFAULT false,
  total_budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'en_cours',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies - users can only access their own projects
CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
USING (auth.uid() = user_id);

-- Create project_budgets table to save budget categories per project
CREATE TABLE public.project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  category_name TEXT NOT NULL,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  color TEXT,
  description TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_budgets
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

-- Project budgets policies via project ownership
CREATE POLICY "Users can view their project budgets"
ON public.project_budgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_budgets.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create budgets for their projects"
ON public.project_budgets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_budgets.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their project budgets"
ON public.project_budgets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_budgets.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project budgets"
ON public.project_budgets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_budgets.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fix task_attachments RLS - link to user via project
ALTER TABLE public.task_attachments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Drop existing permissive policies and create proper ones
DROP POLICY IF EXISTS "Allow public read access" ON public.task_attachments;
DROP POLICY IF EXISTS "Allow public insert access" ON public.task_attachments;
DROP POLICY IF EXISTS "Allow public delete access" ON public.task_attachments;

CREATE POLICY "Users can view their project attachments"
ON public.task_attachments FOR SELECT
USING (
  project_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = task_attachments.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload to their projects"
ON public.task_attachments FOR INSERT
WITH CHECK (
  project_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = task_attachments.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project attachments"
ON public.task_attachments FOR DELETE
USING (
  project_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = task_attachments.project_id 
    AND projects.user_id = auth.uid()
  )
);
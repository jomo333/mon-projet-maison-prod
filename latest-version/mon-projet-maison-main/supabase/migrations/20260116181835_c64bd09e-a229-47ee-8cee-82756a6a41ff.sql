-- Create table for task dates (dates for each sub-task within a step)
CREATE TABLE public.task_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  step_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, step_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE public.task_dates ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their project task dates" 
ON public.task_dates 
FOR SELECT 
USING (EXISTS ( SELECT 1 FROM projects WHERE projects.id = task_dates.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create task dates for their projects" 
ON public.task_dates 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1 FROM projects WHERE projects.id = task_dates.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update their project task dates" 
ON public.task_dates 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM projects WHERE projects.id = task_dates.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete their project task dates" 
ON public.task_dates 
FOR DELETE 
USING (EXISTS ( SELECT 1 FROM projects WHERE projects.id = task_dates.project_id AND projects.user_id = auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_dates_updated_at
BEFORE UPDATE ON public.task_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
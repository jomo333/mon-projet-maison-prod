-- Table pour l'échéancier du projet
CREATE TABLE public.project_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  trade_type TEXT NOT NULL, -- plombier, électricien, menuisier, etc.
  trade_color TEXT NOT NULL DEFAULT '#3B82F6', -- couleur pour le calendrier
  
  -- Durées
  estimated_days INTEGER NOT NULL DEFAULT 1, -- durée estimée en jours ouvrables
  actual_days INTEGER, -- durée réelle (modifiable par fournisseur)
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Fournisseur
  supplier_name TEXT,
  supplier_phone TEXT,
  supplier_schedule_lead_days INTEGER DEFAULT 21, -- jours avant pour appeler (ex: 3 semaines = 21 jours)
  
  -- Fabrication
  fabrication_lead_days INTEGER DEFAULT 0, -- délai de fabrication en jours
  fabrication_start_date DATE, -- date calculée pour lancer la fabrication
  
  -- Mesures
  measurement_required BOOLEAN DEFAULT false,
  measurement_after_step_id TEXT, -- après quelle étape prendre les mesures
  measurement_notes TEXT,
  
  -- Statut et notes
  status TEXT DEFAULT 'pending', -- pending, scheduled, in_progress, completed
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les alertes/rappels
CREATE TABLE public.schedule_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.project_schedules(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'supplier_call', 'fabrication_start', 'measurement'
  alert_date DATE NOT NULL,
  message TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for project_schedules
CREATE POLICY "Users can view their project schedules" 
ON public.project_schedules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_schedules.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create schedules for their projects" 
ON public.project_schedules 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_schedules.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update their project schedules" 
ON public.project_schedules 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_schedules.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete their project schedules" 
ON public.project_schedules 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_schedules.project_id 
  AND projects.user_id = auth.uid()
));

-- Policies for schedule_alerts
CREATE POLICY "Users can view their schedule alerts" 
ON public.schedule_alerts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = schedule_alerts.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create alerts for their projects" 
ON public.schedule_alerts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = schedule_alerts.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update their schedule alerts" 
ON public.schedule_alerts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = schedule_alerts.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete their schedule alerts" 
ON public.schedule_alerts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = schedule_alerts.project_id 
  AND projects.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_project_schedules_updated_at
BEFORE UPDATE ON public.project_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
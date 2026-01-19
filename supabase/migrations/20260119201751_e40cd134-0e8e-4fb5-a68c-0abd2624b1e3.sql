-- Ajouter une colonne pour identifier les dates entrées manuellement
ALTER TABLE public.project_schedules 
ADD COLUMN is_manual_date boolean NOT NULL DEFAULT false;

-- Commentaire explicatif
COMMENT ON COLUMN public.project_schedules.is_manual_date IS 'Indique si la date a été entrée manuellement par l''utilisateur (engagement sous-traitant) et ne doit pas être modifiée automatiquement';
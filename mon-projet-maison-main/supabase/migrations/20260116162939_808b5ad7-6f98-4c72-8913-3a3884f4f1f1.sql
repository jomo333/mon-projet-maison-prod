-- Ajouter une colonne pour la date visée de début des travaux
ALTER TABLE public.projects 
ADD COLUMN target_start_date date DEFAULT NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.projects.target_start_date IS 'Date visée pour le début des travaux de construction';
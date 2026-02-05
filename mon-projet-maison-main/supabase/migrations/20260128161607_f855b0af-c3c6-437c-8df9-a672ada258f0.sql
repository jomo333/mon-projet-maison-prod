-- Create user_consents table to track legal acceptance
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  terms_accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  privacy_accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent
CREATE POLICY "Users can view their own consent"
ON public.user_consents
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own consent
CREATE POLICY "Users can insert their own consent"
ON public.user_consents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own consent
CREATE POLICY "Users can update their own consent"
ON public.user_consents
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
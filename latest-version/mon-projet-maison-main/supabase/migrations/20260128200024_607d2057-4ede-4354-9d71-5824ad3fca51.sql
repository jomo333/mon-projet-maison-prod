
-- Create ai_usage table to track monthly AI analysis usage
CREATE TABLE public.ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage"
  ON public.ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment AI usage (callable from edge functions)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
  new_count INTEGER;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  INSERT INTO public.ai_usage (user_id, month, count)
  VALUES (p_user_id, current_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = ai_usage.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- Function to get current AI usage for a user
CREATE OR REPLACE FUNCTION public.get_ai_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
  usage_count INTEGER;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  SELECT count INTO usage_count
  FROM public.ai_usage
  WHERE user_id = p_user_id AND month = current_month;
  
  RETURN COALESCE(usage_count, 0);
END;
$$;

-- Create user_storage_usage table to track storage usage
CREATE TABLE public.user_storage_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bytes_used BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own storage usage"
  ON public.user_storage_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage usage"
  ON public.user_storage_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storage usage"
  ON public.user_storage_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update storage usage
CREATE OR REPLACE FUNCTION public.update_storage_usage(p_user_id UUID, p_bytes_delta BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_bytes BIGINT;
BEGIN
  INSERT INTO public.user_storage_usage (user_id, bytes_used)
  VALUES (p_user_id, GREATEST(0, p_bytes_delta))
  ON CONFLICT (user_id)
  DO UPDATE SET 
    bytes_used = GREATEST(0, user_storage_usage.bytes_used + p_bytes_delta),
    updated_at = now()
  RETURNING bytes_used INTO new_bytes;
  
  RETURN new_bytes;
END;
$$;

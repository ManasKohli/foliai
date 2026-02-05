-- Folio AI Database Schema
-- Tables: portfolios, holdings, ai_insights

-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create holdings table
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  quantity DECIMAL(18, 8),
  allocation_percent DECIMAL(5, 2),
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_insights table (placeholder for AI-generated insights)
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "portfolios_select_own" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "portfolios_insert_own" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolios_update_own" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "portfolios_delete_own" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for holdings
CREATE POLICY "holdings_select_own" ON public.holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "holdings_insert_own" ON public.holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "holdings_update_own" ON public.holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "holdings_delete_own" ON public.holdings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "ai_insights_select_own" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_insert_own" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_insights_update_own" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_delete_own" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_portfolio_id ON public.ai_insights(portfolio_id);

-- Auto-create default portfolio on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.portfolios (user_id, name)
  VALUES (NEW.id, 'My Portfolio')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create calls table for voice/video calling
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call signals table for WebRTC signaling
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view their own calls" ON public.calls FOR SELECT USING (
  caller_id = auth.uid() OR callee_id = auth.uid()
);
CREATE POLICY "Users can create calls" ON public.calls FOR INSERT WITH CHECK (
  caller_id = auth.uid()
);
CREATE POLICY "Users can update their own calls" ON public.calls FOR UPDATE USING (
  caller_id = auth.uid() OR callee_id = auth.uid()
);

-- RLS Policies for call signals
CREATE POLICY "Users can view signals for their calls" ON public.call_signals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.calls 
    WHERE id = call_signals.call_id AND (caller_id = auth.uid() OR callee_id = auth.uid())
  )
);
CREATE POLICY "Users can create signals for their calls" ON public.call_signals FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.calls 
    WHERE id = call_signals.call_id AND (caller_id = auth.uid() OR callee_id = auth.uid())
  )
);

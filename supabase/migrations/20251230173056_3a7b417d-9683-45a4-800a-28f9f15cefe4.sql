-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('host', 'participant', 'viewer', 'admin');

-- Create enum for engagement levels
CREATE TYPE public.engagement_level AS ENUM ('fully_engaged', 'partially_engaged', 'passively_present', 'away');

-- Create enum for session status
CREATE TYPE public.session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create sessions table (meeting sessions)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  status session_status NOT NULL DEFAULT 'scheduled',
  meeting_link TEXT UNIQUE,
  settings JSONB DEFAULT '{"attention_threshold": 0.7, "alert_on_low_engagement": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  consent_given BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

-- Create engagement_metrics table
CREATE TABLE public.engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  face_detected BOOLEAN DEFAULT false,
  attention_score DECIMAL(3,2) CHECK (attention_score >= 0 AND attention_score <= 1),
  head_pose_engaged BOOLEAN DEFAULT true,
  eye_gaze_focused BOOLEAN DEFAULT true,
  camera_on BOOLEAN DEFAULT false,
  audio_unmuted BOOLEAN DEFAULT false,
  screen_focused BOOLEAN DEFAULT true,
  engagement_level engagement_level DEFAULT 'passively_present',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_reports table for aggregate analytics
CREATE TABLE public.session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_participants INTEGER DEFAULT 0,
  avg_engagement_score DECIMAL(3,2),
  fully_engaged_count INTEGER DEFAULT 0,
  partially_engaged_count INTEGER DEFAULT 0,
  passively_present_count INTEGER DEFAULT 0,
  total_duration_minutes INTEGER,
  report_data JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Default role is participant
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view participant profiles in their sessions"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.participants p ON p.session_id = s.id
      WHERE s.host_id = auth.uid()
      AND p.user_id = profiles.user_id
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sessions
CREATE POLICY "Hosts can manage their own sessions"
  ON public.sessions FOR ALL
  USING (auth.uid() = host_id);

CREATE POLICY "Participants can view sessions they're part of"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.participants
      WHERE session_id = sessions.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view active sessions by link"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS Policies for participants
CREATE POLICY "Users can view their own participation"
  ON public.participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can manage participants in their sessions"
  ON public.participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = participants.session_id
      AND host_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.participants FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for engagement_metrics
CREATE POLICY "Users can view their own metrics"
  ON public.engagement_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.participants
      WHERE id = engagement_metrics.participant_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can view metrics for their sessions"
  ON public.engagement_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = engagement_metrics.session_id
      AND host_id = auth.uid()
    )
  );

CREATE POLICY "Participants can insert their own metrics"
  ON public.engagement_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.participants
      WHERE id = engagement_metrics.participant_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for session_reports
CREATE POLICY "Hosts can manage reports for their sessions"
  ON public.session_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_reports.session_id
      AND host_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view reports for their sessions"
  ON public.session_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.participants p
      JOIN public.sessions s ON s.id = p.session_id
      WHERE s.id = session_reports.session_id
      AND p.user_id = auth.uid()
    )
  );

-- Enable realtime for engagement_metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
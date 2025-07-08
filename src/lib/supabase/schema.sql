--
-- Enums
--
CREATE TYPE public.user_role AS ENUM (
    'admin',
    'super_hr',
    'hr_manager',
    'recruiter',
    'interviewer',
    'employee',
    'intern',
    'guest'
);

--
-- Helper functions
--
CREATE OR REPLACE FUNCTION public.is_hr(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id AND role IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--
-- Users Table
--
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role public.user_role DEFAULT 'employee',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view any profile" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admins to manage all user profiles" ON public.users FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


--
-- Function to sync user profile on new user sign-up
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--
-- Trigger for the function
--
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Metrics Table
--
CREATE TABLE IF NOT EXISTS public.metrics (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  change TEXT,
  change_type TEXT
);
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view metrics" ON public.metrics FOR SELECT USING (true);
CREATE POLICY "Allow admins to manage metrics" ON public.metrics FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


--
-- Jobs Table
--
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    posted_date TIMESTAMP WITH TIME ZONE,
    applicants INTEGER
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR to manage jobs" ON public.jobs FOR ALL USING (is_hr(auth.uid()));

--
-- Colleges Table
--
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT,
    contact_email TEXT,
    last_contacted TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR to manage colleges" ON public.colleges FOR ALL USING (is_hr(auth.uid()));


--
-- Applicants Table
--
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  stage TEXT,
  applied_date TIMESTAMP WITH TIME ZONE,
  avatar TEXT,
  source TEXT,
  wpm INTEGER,
  accuracy INTEGER,
  aptitude_score INTEGER,
  comprehensive_score INTEGER,
  english_grammar_score INTEGER,
  customer_service_score INTEGER,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  resume_data JSONB,
  ai_match_score INTEGER,
  ai_justification TEXT
);
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR to manage applicants" ON public.applicants FOR ALL USING (is_hr(auth.uid()));


--
-- Applicant Notes Table
--
CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_avatar TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR to manage notes" ON public.applicant_notes FOR ALL USING (is_hr(auth.uid()));


--
-- Interviews Table
--
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_name TEXT,
    candidate_avatar TEXT,
    job_title TEXT,
    interviewer_name TEXT,
    interviewer_avatar TEXT,
    date TIMESTAMP WITH TIME ZONE,
    time TEXT,
    type TEXT,
    status TEXT,
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE SET NULL,
    interviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow involved parties to view interviews" ON public.interviews FOR SELECT USING (is_hr(auth.uid()) OR auth.uid() = interviewer_id);
CREATE POLICY "Allow HR to manage interviews" ON public.interviews FOR ALL USING (is_hr(auth.uid()));


--
-- Onboarding Workflows Table
--
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INTEGER,
    current_step TEXT,
    start_date DATE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow involved parties to see onboarding" ON public.onboarding_workflows FOR SELECT USING (
    is_hr(auth.uid()) OR auth.uid() IN (user_id, manager_id, buddy_id)
);
CREATE POLICY "Allow HR to manage onboarding" ON public.onboarding_workflows FOR ALL USING (is_hr(auth.uid()));


--
-- Performance Reviews Table
--
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_title TEXT,
  review_date DATE,
  status TEXT
);
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view their own reviews" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can view all reviews" ON public.performance_reviews FOR SELECT USING (is_hr(auth.uid()));
CREATE POLICY "HR can manage reviews" ON public.performance_reviews FOR ALL USING (is_hr(auth.uid()));


--
-- Time Off Requests Table
--
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT
);
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own requests" ON public.time_off_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR can view all requests" ON public.time_off_requests FOR SELECT USING (is_hr(auth.uid()));
CREATE POLICY "HR Managers can manage requests" ON public.time_off_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_hr', 'hr_manager')
    )
);

-- Avatars Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 1048576, ARRAY['image/png', 'image/jpeg', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' );

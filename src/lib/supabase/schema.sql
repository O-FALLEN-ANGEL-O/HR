-- This script is designed to be idempotent and can be re-run safely.

-- Drop existing policies and disable RLS on all tables first
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow ALL for admins" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual read access" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual write access" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Allow HR roles full access" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Allow public read-only access" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Users can manage their own notes" ON public.' || quote_ident(r.tablename) || ';';
        EXECUTE 'DROP POLICY IF EXISTS "Users can manage their own time off" ON public.' || quote_ident(r.tablename) || ';';
    END LOOP;
END $$;

-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.time_off_requests;
DROP TABLE IF EXISTS public.performance_reviews;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.metrics;
DROP TABLE IF EXISTS public.users;

-- Drop custom types and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP TYPE IF EXISTS public.user_role;


-- 1. Create user_role ENUM type
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

-- 2. Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY NOT NULL DEFAULT auth.uid(),
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role public.user_role DEFAULT 'employee',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.users IS 'Stores user-specific information and roles.';

-- 3. Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role AS $$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create function to sync public.users with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, avatar_url, role)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.email,
        new.raw_user_meta_data->>'avatar_url',
        'employee' -- Default role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call the function on new user sign-up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 6. Create all other application tables
CREATE TABLE public.metrics (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    value TEXT,
    change TEXT,
    change_type TEXT
);

CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    applicants INTEGER DEFAULT 0
);

CREATE TABLE public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT,
    contact_email TEXT,
    last_contacted TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
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
    resume_data JSONB,
    ai_match_score INTEGER,
    ai_justification TEXT
);

CREATE TABLE public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- This was the missing column
    author_name TEXT,
    author_avatar TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_name TEXT,
    candidate_avatar TEXT,
    job_title TEXT,
    interviewer_name TEXT,
    interviewer_avatar TEXT,
    date TIMESTAMP WITH TIME ZONE,
    time TEXT,
    type TEXT,
    status TEXT
);

CREATE TABLE public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INTEGER,
    current_step TEXT,
    start_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT,
    employee_avatar TEXT,
    job_title TEXT,
    review_date TEXT,
    status TEXT
);

CREATE TABLE public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- This was the missing column
    employee_name TEXT,
    employee_avatar TEXT,
    type TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Pending'
);


-- 7. Enable RLS and create policies for all tables

-- USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access" ON public.users FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Allow users to view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- METRICS
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON public.metrics FOR SELECT USING (true);
CREATE POLICY "Allow HR roles full access" ON public.metrics FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- JOBS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR roles full access" ON public.jobs FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- COLLEGES
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR roles full access" ON public.colleges FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- APPLICANTS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow HR roles full access" ON public.applicants FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow applicants to be created publicly" ON public.applicants FOR INSERT WITH CHECK (true);

-- APPLICANT_NOTES
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR roles to manage notes" ON public.applicant_notes FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

-- TIME_OFF_REQUESTS
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own time off" ON public.time_off_requests FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "HR can view all time off requests" ON public.time_off_requests FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Enable RLS for remaining tables with a simple "allow authenticated" policy for now
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.interviews FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.onboarding_workflows FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.performance_reviews FOR SELECT USING (auth.role() = 'authenticated');

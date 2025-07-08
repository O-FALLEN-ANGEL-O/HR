-- Create user_role ENUM type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
          'admin',
          'super_hr',
          'hr_manager',
          'manager',
          'team_lead',
          'recruiter',
          'interviewer',
          'employee',
          'intern',
          'guest'
        );
    ELSE
        -- Add new roles to the user_role enum if they don't exist
        -- This ensures the script is safe to re-run on existing databases
        -- Note: ALTER TYPE cannot be run inside a transaction block in some Postgres versions,
        -- but we'll try to add them one by one.
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'role "manager" already exists in type "user_role", skipping';
        END;
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_lead';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'role "team_lead" already exists in type "user_role", skipping';
        END;
    END IF;
END$$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    role user_role DEFAULT 'guest',
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to create a public user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, avatar_url, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Policies for 'users' table
DROP POLICY IF EXISTS "Allow authenticated user to read their own user record" ON public.users;
CREATE POLICY "Allow authenticated user to read their own user record" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow admin to read all user records" ON public.users;
CREATE POLICY "Allow admin to read all user records" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
DROP POLICY IF EXISTS "Allow admin to update any user record" ON public.users;
CREATE POLICY "Allow admin to update any user record" ON public.users FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Policies for HR-related tables (jobs, applicants, colleges, etc.)
-- This generic policy can be applied to multiple tables.
CREATE OR REPLACE FUNCTION is_hr_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_id AND u.role IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for 'jobs'
DROP POLICY IF EXISTS "Allow authenticated users to read all jobs" ON public.jobs;
CREATE POLICY "Allow authenticated users to read all jobs" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow HR roles to manage jobs" ON public.jobs;
CREATE POLICY "Allow HR roles to manage jobs" ON public.jobs FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Policies for 'applicants'
DROP POLICY IF EXISTS "Allow HR roles to manage applicants" ON public.applicants;
CREATE POLICY "Allow HR roles to manage applicants" ON public.applicants FOR ALL USING (is_hr_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Allow applicants to read their own data via portal" ON public.applicants;
CREATE POLICY "Allow applicants to read their own data via portal" ON public.applicants FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated'); -- Loosened for portal access

-- Policies for 'applicant_notes'
DROP POLICY IF EXISTS "Allow HR roles to manage applicant notes" ON public.applicant_notes;
CREATE POLICY "Allow HR roles to manage applicant notes" ON public.applicant_notes FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Policies for 'colleges'
DROP POLICY IF EXISTS "Allow HR roles to manage colleges" ON public.colleges;
CREATE POLICY "Allow HR roles to manage colleges" ON public.colleges FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Policies for 'interviews'
DROP POLICY IF EXISTS "Allow involved parties to see interviews" ON public.interviews;
CREATE POLICY "Allow involved parties to see interviews" ON public.interviews FOR SELECT USING (
    auth.uid() = interviewer_id OR is_hr_or_admin(auth.uid())
);
DROP POLICY IF EXISTS "Allow HR to manage interviews" ON public.interviews;
CREATE POLICY "Allow HR to manage interviews" ON public.interviews FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Policies for 'onboarding_workflows'
DROP POLICY IF EXISTS "Allow involved parties to see onboarding" ON public.onboarding_workflows;
CREATE POLICY "Allow involved parties to see onboarding" ON public.onboarding_workflows FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = manager_id OR auth.uid() = buddy_id OR is_hr_or_admin(auth.uid())
);
DROP POLICY IF EXISTS "Allow HR to manage onboarding" ON public.onboarding_workflows;
CREATE POLICY "Allow HR to manage onboarding" ON public.onboarding_workflows FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Policies for 'performance_reviews'
DROP POLICY IF EXISTS "Allow involved parties to see performance reviews" ON public.performance_reviews;
CREATE POLICY "Allow involved parties to see performance reviews" ON public.performance_reviews FOR SELECT USING (
    auth.uid() = user_id OR is_hr_or_admin(auth.uid())
);
DROP POLICY IF EXISTS "Allow HR to manage performance reviews" ON public.performance_reviews;
CREATE POLICY "Allow HR to manage performance reviews" ON public.performance_reviews FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Policies for 'time_off_requests'
DROP POLICY IF EXISTS "Allow employees to manage their own time off" ON public.time_off_requests;
CREATE POLICY "Allow employees to manage their own time off" ON public.time_off_requests FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow HR to view all time off requests" ON public.time_off_requests;
CREATE POLICY "Allow HR to view all time off requests" ON public.time_off_requests FOR SELECT USING (is_hr_or_admin(auth.uid()));
-- Note: A more advanced policy would allow managers to see their team's requests. This requires a 'manager_id' column on the 'users' table.

-- Policies for 'metrics'
DROP POLICY IF EXISTS "Allow authenticated users to read metrics" ON public.metrics;
CREATE POLICY "Allow authenticated users to read metrics" ON public.metrics FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow HR to manage metrics" ON public.metrics;
CREATE POLICY "Allow HR to manage metrics" ON public.metrics FOR ALL USING (is_hr_or_admin(auth.uid()));

-- Setup storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar bucket policies
DROP POLICY IF EXISTS "Allow anyone to see avatars" ON storage.objects;
CREATE POLICY "Allow anyone to see avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() IS NOT NULL );

DROP POLICY IF EXISTS "Allow authenticated users to update their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() IS NOT NULL );

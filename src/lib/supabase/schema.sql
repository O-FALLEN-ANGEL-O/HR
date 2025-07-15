-- Wipe all existing objects, handling dependencies correctly

-- 1. Drop dependent objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- 3. Drop types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.performance_review_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.helpdesk_category;
DROP TYPE IF EXISTS public.helpdesk_status;
DROP TYPE IF EXISTS public.helpdesk_priority;


-- Create ENUM types first
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 
    'manager', 'team_lead', 'employee', 'intern', 'guest', 
    'finance', 'it_admin', 'support', 'auditor'
);

CREATE TYPE public.applicant_stage AS ENUM (
    'Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'
);

CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.performance_review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.helpdesk_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.helpdesk_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.helpdesk_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- Create Tables in dependency order

-- users table to store public user data
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role user_role DEFAULT 'guest'::user_role,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    profile_setup_complete BOOLEAN DEFAULT FALSE
);

-- jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    status job_status NOT NULL,
    posted_date DATE NOT NULL,
    applicants INT DEFAULT 0
);

-- colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INT DEFAULT 0,
    contact_email TEXT,
    last_contacted DATE
);

-- applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage applicant_stage NOT NULL,
    applied_date DATE NOT NULL,
    avatar TEXT,
    source TEXT,
    resume_data JSONB,
    ai_match_score INT,
    ai_justification TEXT,
    wpm INT,
    accuracy INT,
    aptitude_score INT,
    comprehensive_score INT,
    english_grammar_score INT,
    customer_service_score INT,
    rejection_reason TEXT,
    rejection_notes TEXT
);

-- applicant_notes table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type interview_type NOT NULL,
    status interview_status NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_avatar TEXT,
    interviewer_name TEXT NOT NULL,
    interviewer_avatar TEXT,
    job_title TEXT
);

-- company_posts table
CREATE TABLE IF NOT EXISTS public.company_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- leave_balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave INT DEFAULT 0,
    casual_leave INT DEFAULT 0,
    earned_leave INT DEFAULT 0,
    unpaid_leave INT DEFAULT 0
);

-- leaves table
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status NOT NULL,
    approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    total_days INT NOT NULL
);

-- onboarding_workflows table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buddy_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT NOT NULL,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT,
    start_date DATE NOT NULL
);

-- performance_reviews table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    status performance_review_status NOT NULL,
    job_title TEXT
);

-- kudos table
CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- weekly_awards table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL
);

-- payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary NUMERIC NOT NULL,
    net_salary NUMERIC NOT NULL,
    download_url TEXT
);

-- company_documents table
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    last_updated DATE NOT NULL,
    download_url TEXT
);

-- objectives table
CREATE TABLE IF NOT EXISTS public.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);

-- key_results table
CREATE TABLE IF NOT EXISTS public.key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT DEFAULT 0,
    status key_result_status NOT NULL
);

-- expense_reports table
CREATE TABLE IF NOT EXISTS public.expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status expense_status NOT NULL,
    submitted_at DATE NOT NULL
);

-- expense_items table
CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT
);

-- helpdesk_tickets table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    category helpdesk_category NOT NULL,
    status helpdesk_status NOT NULL,
    priority helpdesk_priority NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolver_id UUID REFERENCES public.users(id)
);

-- ticket_comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Function to sync public.users with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, email, role, department)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get job funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.stage, COALESCE(a.count, 0) as count
    FROM (
        SELECT unnest(enum_range(NULL::applicant_stage)) as stage
    ) s
    LEFT JOIN (
        SELECT applicants.stage, COUNT(*) as count
        FROM applicants
        GROUP BY applicants.stage
    ) a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated user to update their own profile" ON public.users;
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated user to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/recruiter/admin to manage" ON public.jobs;
CREATE POLICY "Allow public read access" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/recruiter/admin to manage" ON public.jobs FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Applicants
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow HR/recruiter/admin to manage" ON public.applicants;
DROP POLICY IF EXISTS "Allow applicant to view their own profile" ON public.applicants;
CREATE POLICY "Allow HR/recruiter/admin to manage" ON public.applicants FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "Allow applicant to view their own profile" ON public.applicants FOR SELECT USING (id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'applicant_id')::uuid);

-- Applicant Notes
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow HR/recruiter/admin to manage" ON public.applicant_notes;
CREATE POLICY "Allow HR/recruiter/admin to manage" ON public.applicant_notes FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));

-- Company Posts & Comments
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all authenticated to read" ON public.company_posts;
DROP POLICY IF EXISTS "Allow HR/admin to manage" ON public.company_posts;
CREATE POLICY "Allow all authenticated to read" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/admin to manage" ON public.company_posts FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all authenticated to read" ON public.post_comments;
DROP POLICY IF EXISTS "Allow owner to manage" ON public.post_comments;
CREATE POLICY "Allow all authenticated to read" ON public.post_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow owner to manage" ON public.post_comments FOR ALL USING (auth.uid() = user_id);

-- Leaves and Balances
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow owner to manage their leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow manager to view team leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow HR/admin to view all leaves" ON public.leaves;
CREATE POLICY "Allow owner to manage their leaves" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow manager to view team leaves" ON public.leaves FOR SELECT USING ((SELECT department FROM public.users WHERE id = auth.uid()) = (SELECT department FROM public.users WHERE id = user_id));
CREATE POLICY "Allow HR/admin to view all leaves" ON public.leaves FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow owner to read" ON public.leave_balances;
CREATE POLICY "Allow owner to read" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

-- Storage Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow authenticated users to upload avatars." ON storage.objects;
CREATE POLICY "Allow authenticated users to upload avatars." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to upload post images." ON storage.objects;
CREATE POLICY "Allow authenticated users to upload post images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post_images' AND auth.role() = 'authenticated');

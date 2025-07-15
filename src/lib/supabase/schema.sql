
-- This script sets up the database schema for the HR+ application.
-- It is designed to be idempotent, meaning it can be run multiple times
-- without causing errors or creating duplicate objects.

-- 1. Drop existing objects in reverse order of dependency
--    to ensure a clean slate.

-- Drop Triggers before the functions they use
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Functions before the types they use
DROP FUNCTION IF EXISTS get_job_funnel_stats;
DROP FUNCTION IF EXISTS handle_new_user;

-- Drop Views
-- (No views to drop yet)

-- Drop Policies (from all tables that have them)
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow admins to manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow employees to insert their own records" ON public.leaves;
DROP POLICY IF EXISTS "Allow employees to view their own records" ON public.leaves;
DROP POLICY IF EXISTS "Allow managers to view their team's leave records" ON public.leaves;
DROP POLICY IF EXISTS "Allow HR/Admins to manage all leave records" ON public.leaves;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all users to view company posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow HR/Admins to manage posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Allow all users to read comments" ON public.post_comments;
DROP POLICY IF EXISTS "Allow authenticated users to give kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow all users to read kudos" ON public.kudos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_documents;
DROP POLICY IF EXISTS "Allow users to view their own objectives" ON public.objectives;
DROP POLICY IF EXISTS "Allow HR/Admins to see all objectives" ON public.objectives;
DROP POLICY IF EXISTS "Allow users to view key results for their objectives" ON public.key_results;
DROP POLICY IF EXISTS "Allow HR/Admins to see all key results" ON public.key_results;
DROP POLICY IF EXISTS "Users can manage their own expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Finance and admins can manage all expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can manage items on their own expense reports" ON public.expense_items;
DROP POLICY IF EXISTS "Finance and admins can manage all expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Allow user to manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow support staff to manage all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow user to manage their own comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow support staff to manage all comments" ON public.ticket_comments;

-- Drop Tables (in reverse order of dependency)
DROP TABLE IF EXISTS public.post_comments;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.performance_reviews;
-- The 'users' table is not dropped as it's managed by the trigger.

-- Drop Types (custom enum types)
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.kr_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_category;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;


-- 2. Create schema from scratch

-- Create custom enum types
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 
    'manager', 'team_lead', 'employee', 'intern', 'guest', 
    'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.kr_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- Create users table
-- This table is populated by the handle_new_user trigger.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    role user_role DEFAULT 'guest'::user_role,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    phone TEXT,
    profile_setup_complete BOOLEAN DEFAULT FALSE
);

-- Create other tables
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    status job_status NOT NULL,
    posted_date DATE NOT NULL,
    applicants INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INT DEFAULT 0,
    contact_email TEXT,
    last_contacted DATE
);

CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    stage applicant_stage NOT NULL,
    applied_date DATE NOT NULL,
    avatar TEXT,
    source TEXT,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave INT DEFAULT 0,
    casual_leave INT DEFAULT 0,
    earned_leave INT DEFAULT 0,
    unpaid_leave INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status,
    approver_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    total_days INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id),
    buddy_id UUID REFERENCES public.users(id),
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT DEFAULT 'Welcome Email Sent',
    start_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title TEXT,
    review_date DATE NOT NULL,
    status review_status
);

CREATE TABLE IF NOT EXISTS public.company_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary NUMERIC(10, 2) NOT NULL,
    net_salary NUMERIC(10, 2) NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    last_updated TIMESTAMPTZ NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT DEFAULT 0,
    status kr_status
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status expense_status NOT NULL,
    submitted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    category ticket_category,
    status ticket_status DEFAULT 'Open',
    priority ticket_priority DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolver_id UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Functions and Triggers

-- Function to create a public user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, avatar_url, role, department, profile_setup_complete)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department',
    (new.raw_user_meta_data->>'profile_setup_complete')::boolean
  );
  -- Also create an initial leave balance for the new user
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (new.id, 12, 12, 0, 0); -- Default balances
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
        SELECT stage, count(*) as count
        FROM applicants
        GROUP BY stage
    ) a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;

-- 4. Set up Row Level Security (RLS)

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies for 'users' table
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admins to manage all users" ON public.users FOR ALL USING (auth.role() = 'service_role' OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Policies for 'leaves' table
CREATE POLICY "Allow employees to insert their own records" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow employees to view their own records" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers to view their team's leave records" ON public.leaves FOR SELECT USING ((SELECT department FROM public.users WHERE id = auth.uid()) = (SELECT department FROM public.users WHERE id = leaves.user_id));
CREATE POLICY "Allow HR/Admins to manage all leave records" ON public.leaves FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));

-- Policies for 'company_posts'
CREATE POLICY "Allow all users to view company posts" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Allow HR/Admins to manage posts" ON public.company_posts FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));

-- Policies for 'post_comments'
CREATE POLICY "Allow authenticated users to manage their own comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow all users to read comments" ON public.post_comments FOR SELECT USING (true);

-- Policies for 'kudos'
CREATE POLICY "Allow authenticated users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all users to read kudos" ON public.kudos FOR SELECT USING (true);

-- Policies for 'company_documents'
CREATE POLICY "Enable read access for all users" ON public.company_documents FOR SELECT USING (true);

-- Policies for 'objectives' & 'key_results'
CREATE POLICY "Allow users to view their own objectives" ON public.objectives FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Allow HR/Admins to see all objectives" ON public.objectives FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));
CREATE POLICY "Allow users to view key results for their objectives" ON public.key_results FOR SELECT USING (auth.uid() = (SELECT owner_id FROM objectives WHERE id = key_results.objective_id));
CREATE POLICY "Allow HR/Admins to see all key results" ON public.key_results FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));

-- Policies for 'expense_reports' & 'expense_items'
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Finance and admins can manage all expense reports" ON public.expense_reports FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance'));
CREATE POLICY "Users can manage items on their own expense reports" ON public.expense_items FOR ALL USING (auth.uid() = (SELECT user_id FROM expense_reports WHERE id = expense_items.expense_report_id));
CREATE POLICY "Finance and admins can manage all expense items" ON public.expense_items FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance'));

-- Policies for 'helpdesk_tickets' & 'ticket_comments'
CREATE POLICY "Allow user to manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow support staff to manage all tickets" ON public.helpdesk_tickets FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'support', 'it_admin'));
CREATE POLICY "Allow user to manage their own comments" ON public.ticket_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow support staff to manage all comments" ON public.ticket_comments FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'support', 'it_admin'));


-- 5. Set up Storage Policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "HR can upload post images." ON storage.objects;

-- Create policies for 'avatars' bucket
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Create policies for 'post_images' bucket
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'post_images');
CREATE POLICY "HR can upload post images." ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post_images' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'hr_manager', 'super_hr')
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

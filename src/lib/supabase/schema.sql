-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------
-- ---- MASTER SCHEMA FOR HR+ APPLICATION ----
-- This file is intended to be the single source of truth for the database schema.
-- It is designed to be idempotent and can be run on a new or existing database.
-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------


-- ------------------------------------------------------------------------------------------------
-- ---- 1. CLEANUP (DROP EXISTING OBJECTS) ----
-- Drop objects in reverse order of dependency to avoid errors.
-- ------------------------------------------------------------------------------------------------
-- Drop triggers before the functions they use
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- Drop policies (on tables that will be dropped)
-- Note: Dropping a table also drops its policies, but being explicit can avoid some issues.
-- This part is mostly for clarity; the CASCADE on table drops handles this.

-- Drop tables
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.objectives CASCADE;
DROP TABLE IF EXISTS public.company_documents CASCADE;
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.weekly_awards CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;


-- Drop custom types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.performance_review_status;


-- ------------------------------------------------------------------------------------------------
-- ---- 2. CREATE CUSTOM TYPES (ENUMS) ----
-- ------------------------------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');
CREATE TYPE public.performance_review_status AS ENUM ('Pending', 'In Progress', 'Completed');


-- ------------------------------------------------------------------------------------------------
-- ---- 3. CREATE TABLES ----
-- Tables are created in an order that respects foreign key dependencies.
-- `users` table must be first as many other tables reference it.
-- ------------------------------------------------------------------------------------------------

-- Table: public.users
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    email text UNIQUE,
    phone text,
    role public.user_role DEFAULT 'guest'::public.user_role,
    department text,
    created_at timestamp with time zone DEFAULT now(),
    profile_setup_complete boolean DEFAULT false
);
COMMENT ON TABLE public.users IS 'Public user profiles, extending auth.users.';

-- Table: public.leave_balances
CREATE TABLE public.leave_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 0,
    casual_leave integer DEFAULT 0,
    earned_leave integer DEFAULT 0,
    unpaid_leave integer DEFAULT 0,
    UNIQUE(user_id)
);
COMMENT ON TABLE public.leave_balances IS 'Tracks available leave days for each user.';

-- Table: public.leaves
CREATE TABLE public.leaves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL,
    reason text NOT NULL,
    status public.leave_status DEFAULT 'pending'::public.leave_status,
    approver_id uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.leaves IS 'Stores all leave requests made by users.';

-- Table: public.jobs
CREATE TABLE public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status DEFAULT 'Open'::public.job_status,
    posted_date timestamp with time zone DEFAULT now(),
    applicants integer DEFAULT 0
);
COMMENT ON TABLE public.jobs IS 'Job postings for recruitment.';

-- Table: public.colleges
CREATE TABLE public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status public.college_status DEFAULT 'Invited'::public.college_status,
    resumes_received integer DEFAULT 0,
    contact_email text,
    last_contacted timestamp with time zone
);
COMMENT ON TABLE public.colleges IS 'Colleges and universities for campus drives.';

-- Table: public.applicants
CREATE TABLE public.applicants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage public.applicant_stage DEFAULT 'Applied'::public.applicant_stage,
    applied_date timestamp with time zone DEFAULT now(),
    avatar text,
    source public.applicant_source,
    resume_data jsonb,
    ai_match_score integer,
    ai_justification text,
    wpm integer,
    accuracy integer,
    aptitude_score integer,
    comprehensive_score integer,
    english_grammar_score integer,
    customer_service_score integer,
    rejection_reason text,
    rejection_notes text
);
COMMENT ON TABLE public.applicants IS 'Stores information about job applicants.';

-- Table: public.applicant_notes
CREATE TABLE public.applicant_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.applicant_notes IS 'Internal notes for hiring teams about applicants.';

-- Table: public.interviews
CREATE TABLE public.interviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    time time without time zone NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status DEFAULT 'Scheduled'::public.interview_status,
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);
COMMENT ON TABLE public.interviews IS 'Scheduled interviews for applicants.';

-- Table: public.onboarding_workflows
CREATE TABLE public.onboarding_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    manager_id uuid NOT NULL REFERENCES public.users(id),
    buddy_id uuid REFERENCES public.users(id),
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text,
    start_date date NOT NULL
);
COMMENT ON TABLE public.onboarding_workflows IS 'Tracks onboarding progress for new hires.';

-- Table: public.performance_reviews
CREATE TABLE public.performance_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date date NOT NULL,
    status public.performance_review_status DEFAULT 'Pending'::public.performance_review_status,
    job_title text
);
COMMENT ON TABLE public.performance_reviews IS 'Stores performance review records.';

-- Table: public.kudos
CREATE TABLE public.kudos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.kudos IS 'Peer-to-peer recognition messages.';

-- Table: public.weekly_awards
CREATE TABLE public.weekly_awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL
);
COMMENT ON TABLE public.weekly_awards IS 'Employee of the Week awards.';

-- Table: public.payslips
CREATE TABLE public.payslips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric NOT NULL,
    net_salary numeric NOT NULL,
    download_url text
);
COMMENT ON TABLE public.payslips IS 'Stores employee payslip information.';

-- Table: public.company_documents
CREATE TABLE public.company_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text,
    last_updated timestamp with time zone DEFAULT now(),
    download_url text
);
COMMENT ON TABLE public.company_documents IS 'Repository for company-wide documents and policies.';

-- Table: public.objectives
CREATE TABLE public.objectives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL
);
COMMENT ON TABLE public.objectives IS 'High-level objectives for OKRs.';

-- Table: public.key_results
CREATE TABLE public.key_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0,
    status public.key_result_status DEFAULT 'on_track'::public.key_result_status
);
COMMENT ON TABLE public.key_results IS 'Measurable results for objectives in OKRs.';

-- Table: public.expense_reports
CREATE TABLE public.expense_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric NOT NULL,
    status public.expense_status DEFAULT 'submitted'::public.expense_status,
    submitted_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.expense_reports IS 'Header table for expense reimbursement reports.';

-- Table: public.expense_items
CREATE TABLE public.expense_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text,
    amount numeric NOT NULL,
    description text
);
COMMENT ON TABLE public.expense_items IS 'Line items for individual expense reports.';

-- Table: public.helpdesk_tickets
CREATE TABLE public.helpdesk_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text,
    category public.ticket_category,
    status public.ticket_status DEFAULT 'Open'::public.ticket_status,
    priority public.ticket_priority DEFAULT 'Medium'::public.ticket_priority,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid REFERENCES public.users(id)
);
COMMENT ON TABLE public.helpdesk_tickets IS 'Support tickets for IT, HR, etc.';

-- Table: public.ticket_comments
CREATE TABLE public.ticket_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.ticket_comments IS 'Comments on helpdesk tickets.';

-- Table: public.company_posts
CREATE TABLE public.company_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.company_posts IS 'Posts for the internal company feed.';

-- Table: public.post_comments
CREATE TABLE public.post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.post_comments IS 'Comments on company feed posts.';


-- ------------------------------------------------------------------------------------------------
-- ---- 4. CREATE FUNCTIONS AND TRIGGERS ----
-- ------------------------------------------------------------------------------------------------

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, department, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Copies new user data from auth.users to public.users.';

-- Trigger to call the function on new user sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to get job funnel statistics
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage public.applicant_stage, count bigint)
LANGUAGE sql
AS $$
  SELECT stage, count(*)
  FROM public.applicants
  GROUP BY stage
  ORDER BY
    CASE stage
      WHEN 'Sourced' THEN 1
      WHEN 'Applied' THEN 2
      WHEN 'Phone Screen' THEN 3
      WHEN 'Interview' THEN 4
      WHEN 'Offer' THEN 5
      WHEN 'Hired' THEN 6
      WHEN 'Rejected' THEN 7
    END;
$$;
COMMENT ON FUNCTION public.get_job_funnel_stats() IS 'Returns a count of applicants in each recruitment stage.';


-- ------------------------------------------------------------------------------------------------
-- ---- 5. ENABLE ROW-LEVEL SECURITY (RLS) & CREATE POLICIES ----
-- ------------------------------------------------------------------------------------------------

-- Helper function to get a user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ---- RLS POLICIES ----

-- USERS Table
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Any authenticated user can view other user profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all user profiles" ON public.users FOR ALL USING (public.get_my_role() IN ('admin', 'super_hr')) WITH CHECK (public.get_my_role() IN ('admin', 'super_hr'));

-- LEAVE_BALANCES Table
CREATE POLICY "Users can view their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admins can view all leave balances" ON public.leave_balances FOR SELECT USING (public.get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

-- LEAVES Table
CREATE POLICY "Users can view their own leave requests" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leave requests" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can view leave requests from their department" ON public.leaves FOR SELECT USING (
  (public.get_my_role() IN ('manager', 'team_lead')) AND (department = (SELECT department FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "HR/Admins can manage all leaves" ON public.leaves FOR ALL USING (public.get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

-- APPLICANTS Table
CREATE POLICY "HR/Recruiters/Interviewers can view applicants" ON public.applicants FOR SELECT USING (public.get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "HR/Recruiters can manage applicants" ON public.applicants FOR ALL USING (public.get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- All other tables (General "allow all authenticated" or "allow HR/Admin" for now)
CREATE POLICY "Allow all authenticated users" ON public.jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.colleges FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.applicant_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.interviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.onboarding_workflows FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.performance_reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.kudos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.weekly_awards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admins can manage payslips" ON public.payslips FOR ALL USING (public.get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Allow all authenticated users" ON public.company_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.objectives FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.key_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR/Admins/Finance can manage all expense reports" ON public.expense_reports FOR ALL USING (public.get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can manage their own helpdesk tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support/Admins can manage all tickets" ON public.helpdesk_tickets FOR ALL USING (public.get_my_role() IN ('admin', 'super_hr', 'it_admin', 'support', 'hr_manager'));
CREATE POLICY "Allow all authenticated users" ON public.company_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON public.post_comments FOR ALL USING (auth.role() = 'authenticated');


-- ------------------------------------------------------------------------------------------------
-- ---- 6. SETUP STORAGE ----
-- ------------------------------------------------------------------------------------------------
-- Create buckets for avatars and post images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post_images', 'post_images', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Drop existing policies first to be idempotent
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post images." ON storage.objects;

-- Avatar Policies
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Post Image Policies
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'post_images');
CREATE POLICY "Authenticated users can upload post images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post_images' AND auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------------------------
-- ---- SCHEMA SETUP COMPLETE ----
-- ------------------------------------------------------------------------------------------------

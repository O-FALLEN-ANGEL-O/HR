-- =================================================================
-- 🧼 STEP 1: DROP ALL EXISTING OBJECTS
-- =================================================================
-- Drop functions first, as they can depend on types.
DROP FUNCTION IF EXISTS public.get_user_department(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS auth.get_user_role() CASCADE;

-- Drop tables, using CASCADE to handle foreign keys and other dependencies.
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
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop ENUM types. With functions and tables gone, this will succeed.
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.applicant_stage CASCADE;
DROP TYPE IF EXISTS public.applicant_source CASCADE;
DROP TYPE IF EXISTS public.interview_type CASCADE;
DROP TYPE IF EXISTS public.interview_status CASCADE;
DROP TYPE IF EXISTS public.onboarding_status CASCADE;
DROP TYPE IF EXISTS public.leave_type CASCADE;
DROP TYPE IF EXISTS public.leave_status CASCADE;
DROP TYPE IF EXISTS public.college_status CASCADE;
DROP TYPE IF EXISTS public.key_result_status CASCADE;
DROP TYPE IF EXISTS public.expense_status CASCADE;
DROP TYPE IF EXISTS public.ticket_status CASCADE;
DROP TYPE IF EXISTS public.ticket_priority CASCADE;
DROP TYPE IF EXISTS public.ticket_category CASCADE;


-- =================================================================
-- 🌈 STEP 2: CREATE ENUM TYPES
-- =================================================================
CREATE TYPE public.user_role AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual', 'referral');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.onboarding_status AS ENUM ('Not Started', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');

-- =================================================================
-- 📜 STEP 3: CREATE TABLES
-- =================================================================
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    role public.user_role NOT NULL DEFAULT 'guest',
    department text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leave_balances (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer NOT NULL DEFAULT 12,
    casual_leave integer NOT NULL DEFAULT 12,
    earned_leave integer NOT NULL DEFAULT 12,
    unpaid_leave integer NOT NULL DEFAULT 0,
    CONSTRAINT leave_balances_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.leaves (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL,
    reason text NOT NULL,
    status public.leave_status NOT NULL DEFAULT 'pending',
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status NOT NULL DEFAULT 'Open',
    posted_date timestamptz NOT NULL DEFAULT now(),
    applicants integer NOT NULL DEFAULT 0
);

CREATE TABLE public.colleges (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    contact_email text,
    status public.college_status NOT NULL DEFAULT 'Invited',
    resumes_received integer NOT NULL DEFAULT 0,
    last_contacted timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.applicants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage public.applicant_stage NOT NULL DEFAULT 'Applied',
    source public.applicant_source NOT NULL DEFAULT 'manual',
    applied_date timestamptz NOT NULL DEFAULT now(),
    avatar text,
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

CREATE TABLE public.interviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title text,
    candidate_name text,
    candidate_avatar text,
    interviewer_name text,
    interviewer_avatar text,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status NOT NULL DEFAULT 'Scheduled'
);

CREATE TABLE public.applicant_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_posts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kudos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.weekly_awards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL DEFAULT now()
);

CREATE TABLE public.payslips (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10,2) NOT NULL,
    net_salary numeric(10,2) NOT NULL,
    download_url text NOT NULL
);

CREATE TABLE public.company_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated date NOT NULL,
    download_url text NOT NULL
);

CREATE TABLE public.objectives (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL
);

CREATE TABLE public.key_results (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer NOT NULL DEFAULT 0,
    status public.key_result_status NOT NULL DEFAULT 'on_track'
);

CREATE TABLE public.expense_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.expense_status NOT NULL DEFAULT 'draft',
    submitted_at timestamptz
);

CREATE TABLE public.expense_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text
);

CREATE TABLE public.helpdesk_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL DEFAULT 'General',
    status public.ticket_status NOT NULL DEFAULT 'Open',
    priority public.ticket_priority NOT NULL DEFAULT 'Medium',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.ticket_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text,
  employee_avatar text,
  job_title text,
  manager_name text,
  buddy_name text,
  progress integer NOT NULL DEFAULT 0,
  current_step text NOT NULL DEFAULT 'Paperwork',
  start_date date NOT NULL DEFAULT now()
);


-- =================================================================
-- ⚡ STEP 4: CREATE FUNCTIONS AND POLICIES
-- =================================================================
-- Create a function to get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
$$;

-- Create a function to get the department of a given user
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;

-- Create a function to get the role of a given user
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;


-- Enable RLS for all tables and set up policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see their own leave balances" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see their own leave requests" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers to see leave requests from their department" ON public.leaves FOR SELECT USING (
  (SELECT public.get_user_role(auth.uid())) IN ('manager', 'team_lead') AND
  (SELECT public.get_user_department(auth.uid())) = (SELECT public.get_user_department(user_id))
);
CREATE POLICY "Allow HR and admins to see all leave requests" ON public.leaves FOR SELECT USING ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow users to create their own leave requests" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow managers/HR/admins to update leave status" ON public.leaves FOR UPDATE USING ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/admins to manage jobs" ON public.jobs FOR ALL USING ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR/admins to manage colleges" ON public.colleges FOR ALL USING ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to applicants" ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow HR/admins to manage applicants" ON public.applicants FOR ALL USING ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow involved parties to see interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id OR (SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR/admins/interviewers to see notes" ON public.applicant_notes FOR SELECT USING ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));
CREATE POLICY "Allow HR/admins/interviewers to add notes" ON public.applicant_notes FOR INSERT WITH CHECK ((SELECT auth.get_user_role()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

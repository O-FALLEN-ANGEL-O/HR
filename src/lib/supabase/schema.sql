
-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS auth.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_job_funnel_stats() CASCADE;


-- 🧹 Drop tables in reverse dependency order
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


-- ❌ Drop ENUM types safely
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;

-- ✅ Recreate ENUM types
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


---------------------------------------
--          TABLE CREATION
---------------------------------------

-- Create public.users table to store public user profiles
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'guest'::user_role,
  department text,
  created_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Public user profiles, linked to auth.users.';

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  description text,
  status job_status DEFAULT 'Open'::job_status,
  posted_date timestamptz DEFAULT now(),
  applicants integer DEFAULT 0
);

-- Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status college_status DEFAULT 'Invited'::college_status,
  resumes_received integer DEFAULT 0,
  contact_email text,
  last_contacted timestamptz DEFAULT now()
);

-- Create applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
  stage applicant_stage DEFAULT 'Applied'::applicant_stage,
  applied_date timestamptz DEFAULT now(),
  avatar text,
  source applicant_source,
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

-- Create applicant_notes table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  author_name text,
  author_avatar text,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  date date NOT NULL,
  time time NOT NULL,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'Scheduled'::interview_status,
  candidate_name text,
  candidate_avatar text,
  interviewer_name text,
  interviewer_avatar text,
  job_title text
);

-- Create company_posts table
CREATE TABLE IF NOT EXISTS public.company_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create kudos table
CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create weekly_awards table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  awarded_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  week_of date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  gross_salary numeric(10, 2) NOT NULL,
  net_salary numeric(10, 2) NOT NULL,
  download_url text
);

-- Create company_documents table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text,
  last_updated timestamptz DEFAULT now(),
  download_url text
);

-- Create objectives table
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  quarter text NOT NULL -- e.g., 'Q3 2024'
);

-- Create key_results table
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description text NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status key_result_status DEFAULT 'on_track'::key_result_status
);

-- Create expense_reports table
CREATE TABLE IF NOT EXISTS public.expense_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  status expense_status DEFAULT 'submitted'::expense_status,
  submitted_at timestamptz DEFAULT now()
);

-- Create expense_items table
CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text,
  amount numeric(10, 2) NOT NULL,
  description text
);

-- Create helpdesk_tickets table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  category ticket_category,
  status ticket_status DEFAULT 'Open'::ticket_status,
  priority ticket_priority DEFAULT 'Medium'::ticket_priority,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  sick_leave integer DEFAULT 12,
  casual_leave integer DEFAULT 12,
  earned_leave integer DEFAULT 12,
  unpaid_leave integer DEFAULT 0
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  reason text NOT NULL,
  status leave_status DEFAULT 'pending'::leave_status,
  approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create onboarding_workflows table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  progress integer DEFAULT 0,
  current_step text DEFAULT 'Initial Setup',
  employee_name text,
  employee_avatar text,
  job_title text,
  manager_name text,
  buddy_name text
);

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date date,
  job_title text,
  status text DEFAULT 'Pending'
);


---------------------------------------
--          HELPER FUNCTIONS
---------------------------------------

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION auth.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

-- Create helper function to get user department
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;


CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage text, count bigint)
LANGUAGE sql
AS $$
  SELECT
    s.stage,
    COALESCE(a.count, 0) as count
  FROM (
    VALUES
      ('Sourced'),
      ('Applied'),
      ('Phone Screen'),
      ('Interview'),
      ('Offer'),
      ('Hired')
  ) AS s(stage)
  LEFT JOIN (
    SELECT stage, count(*) as count
    FROM public.applicants
    GROUP BY stage
  ) AS a ON s.stage = a.stage
  ORDER BY
    CASE s.stage
      WHEN 'Sourced' THEN 1
      WHEN 'Applied' THEN 2
      WHEN 'Phone Screen' THEN 3
      WHEN 'Interview' THEN 4
      WHEN 'Offer' THEN 5
      WHEN 'Hired' THEN 6
    END;
$$;


---------------------------------------
--     ROW LEVEL SECURITY (RLS)
---------------------------------------

-- Policies for public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to see their own profile" ON public.users;
CREATE POLICY "Allow users to see their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow HR/Admins to view all profiles" ON public.users;
CREATE POLICY "Allow HR/Admins to view all profiles" ON public.users FOR SELECT USING (auth.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to jobs" ON public.jobs;
CREATE POLICY "Allow public read access to jobs" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow HR/Admins to manage jobs" ON public.jobs;
CREATE POLICY "Allow HR/Admins to manage jobs" ON public.jobs FOR ALL USING (auth.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for applicants table
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for now" ON public.applicants;
CREATE POLICY "Allow public read access for now" ON public.applicants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow HR/Admins to manage applicants" ON public.applicants;
CREATE POLICY "Allow HR/Admins to manage applicants" ON public.applicants FOR ALL USING (auth.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for leaves table
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON public.leaves;
CREATE POLICY "Users can view their own leave requests" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own leave requests" ON public.leaves;
CREATE POLICY "Users can create their own leave requests" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Managers can view leave requests from their department" ON public.leaves;
CREATE POLICY "Managers can view leave requests from their department" ON public.leaves FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.leaves.user_id AND u.department = public.get_user_department(auth.uid())
  ) AND
  auth.get_user_role(auth.uid()) IN ('manager', 'team_lead')
);
DROP POLICY IF EXISTS "HR and Admins can manage all leave requests" ON public.leaves;
CREATE POLICY "HR and Admins can manage all leave requests" ON public.leaves FOR ALL USING (
  auth.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

-- Policies for leave_balances table
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own leave balances" ON public.leave_balances;
CREATE POLICY "Users can view their own leave balances" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "HR and Admins can manage all leave balances" ON public.leave_balances;
CREATE POLICY "HR and Admins can manage all leave balances" ON public.leave_balances FOR ALL USING (
  auth.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

-- Policies for interviews table
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Interviewers can see their assigned interviews" ON public.interviews;
CREATE POLICY "Interviewers can see their assigned interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);
DROP POLICY IF EXISTS "HR and Recruiters can manage all interviews" ON public.interviews;
CREATE POLICY "HR and Recruiters can manage all interviews" ON public.interviews FOR ALL USING (
  auth.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

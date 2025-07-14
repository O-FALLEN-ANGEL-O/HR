-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS auth.get_user_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department CASCADE;

-- 🧹 Drop tables in reverse dependency order to be safe
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
DROP TABLE IF EXISTS public.users CASCADE; -- Drop the public users table

-- ❌ Drop ENUM types safely 
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
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
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');


-- =============================================
-- 1. Tables
-- =============================================

-- Users Table (Public Profile)
-- This table stores public information about users.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  department text,
  role user_role NOT NULL DEFAULT 'guest'::user_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text GENERATED ALWAYS AS (auth.email(id)) STORED
);
COMMENT ON TABLE public.users IS 'Public user profiles, linked to auth.users for core authentication.';

-- Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  description text,
  status job_status NOT NULL DEFAULT 'Open'::job_status,
  posted_date timestamptz NOT NULL DEFAULT now(),
  applicants integer NOT NULL DEFAULT 0
);
COMMENT ON TABLE public.jobs IS 'Stores job postings.';

-- Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status college_status NOT NULL DEFAULT 'Invited'::college_status,
  resumes_received integer NOT NULL DEFAULT 0,
  contact_email text NOT NULL,
  last_contacted timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.colleges IS 'Manages relationships with colleges for recruitment drives.';

-- Applicants Table
CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  stage applicant_stage NOT NULL DEFAULT 'Applied'::applicant_stage,
  applied_date timestamptz NOT NULL DEFAULT now(),
  avatar text,
  source applicant_source,
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
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

-- Applicant Notes Table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.applicant_notes IS 'Internal notes for hiring team on applicants.';

-- Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  "time" text NOT NULL,
  type interview_type NOT NULL,
  status interview_status NOT NULL DEFAULT 'Scheduled'::interview_status,
  candidate_name text NOT NULL,
  candidate_avatar text,
  interviewer_name text NOT NULL,
  interviewer_avatar text,
  job_title text NOT NULL
);
COMMENT ON TABLE public.interviews IS 'Schedules and tracks interviews.';

-- Onboarding Workflows Table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  employee_avatar text,
  job_title text NOT NULL,
  manager_name text NOT NULL,
  buddy_name text,
  progress integer NOT NULL DEFAULT 0,
  current_step text NOT NULL DEFAULT 'Welcome Email Sent'::text,
  start_date timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.onboarding_workflows IS 'Tracks new hire onboarding progress.';

-- Leave Balances Table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave integer NOT NULL DEFAULT 12,
  casual_leave integer NOT NULL DEFAULT 12,
  earned_leave integer NOT NULL DEFAULT 12,
  unpaid_leave integer NOT NULL DEFAULT 0
);
COMMENT ON TABLE public.leave_balances IS 'Stores available leave days for each employee.';

-- Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending'::leave_status,
  approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  total_days integer NOT NULL
);
COMMENT ON TABLE public.leaves IS 'Stores all leave requests.';

-- Company Posts Table
CREATE TABLE IF NOT EXISTS public.company_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.company_posts IS 'Internal company announcements and feed posts.';

-- Kudos Table
CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.kudos IS 'Peer-to-peer recognition messages.';

-- Weekly Awards Table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  week_of date NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.weekly_awards IS 'Employee of the week awards.';

-- Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  gross_salary numeric(10, 2) NOT NULL,
  net_salary numeric(10, 2) NOT NULL,
  download_url text NOT NULL
);
COMMENT ON TABLE public.payslips IS 'Stores employee payslip information.';

-- Company Documents Table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  last_updated timestamptz NOT NULL DEFAULT now(),
  download_url text NOT NULL
);
COMMENT ON TABLE public.company_documents IS 'Repository for company-wide documents like policies.';

-- Objectives Table
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  quarter text NOT NULL
);
COMMENT ON TABLE public.objectives IS 'High-level objectives for OKR tracking.';

-- Key Results Table
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  status key_result_status NOT NULL DEFAULT 'on_track'::key_result_status
);
COMMENT ON TABLE public.key_results IS 'Measurable results to track objectives.';

-- Expense Reports Table
CREATE TABLE IF NOT EXISTS public.expense_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  status expense_status NOT NULL DEFAULT 'draft'::expense_status,
  submitted_at timestamptz
);
COMMENT ON TABLE public.expense_reports IS 'Header table for employee expense reports.';

-- Expense Items Table
CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text
);
COMMENT ON TABLE public.expense_items IS 'Individual line items for an expense report.';

-- Helpdesk Tickets Table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  category ticket_category NOT NULL,
  status ticket_status NOT NULL DEFAULT 'Open'::ticket_status,
  priority ticket_priority NOT NULL DEFAULT 'Medium'::ticket_priority,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.helpdesk_tickets IS 'Tracks support tickets from employees.';

-- Ticket Comments Table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ticket_comments IS 'Comments on helpdesk tickets.';

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  status text NOT NULL,
  job_title text
);
COMMENT ON TABLE public.performance_reviews IS 'Stores records of employee performance reviews.';


-- =============================================
-- 2. Functions
-- =============================================

-- ✅ Recreate the functions now that tables exist
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
$$;
COMMENT ON FUNCTION auth.get_user_role() IS 'Custom function to get user role from JWT claims.';

CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;
COMMENT ON FUNCTION public.get_user_department(user_id uuid) IS 'Retrieves the department for a given user ID.';


-- =============================================
-- 3. Row Level Security (RLS) Policies
-- =============================================

-- Users Table Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all user profiles" ON public.users;
CREATE POLICY "Admins can manage all user profiles" ON public.users FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr')) WITH CHECK (auth.get_user_role() IN ('admin', 'super_hr'));
DROP POLICY IF EXISTS "HR and Managers can view user profiles" ON public.users;
CREATE POLICY "HR and Managers can view user profiles" ON public.users FOR SELECT USING (auth.get_user_role() IN ('hr_manager', 'recruiter', 'manager', 'team_lead'));

-- Jobs Table Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view jobs" ON public.jobs;
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "HR/Recruiter/Admin can create/update jobs" ON public.jobs;
CREATE POLICY "HR/Recruiter/Admin can create/update jobs" ON public.jobs FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter')) WITH CHECK (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Applicants Table Policies
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HR roles can manage applicants" ON public.applicants;
CREATE POLICY "HR roles can manage applicants" ON public.applicants FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')) WITH CHECK (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
DROP POLICY IF EXISTS "Anyone can create an applicant profile" ON public.applicants;
CREATE POLICY "Anyone can create an applicant profile" ON public.applicants FOR INSERT WITH CHECK (true);

-- Interviews Table Policies
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HR and interviewers can manage interviews" ON public.interviews;
CREATE POLICY "HR and interviewers can manage interviews" ON public.interviews FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer') OR auth.uid() = interviewer_id) WITH CHECK (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Leave System Policies
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own leave" ON public.leaves;
CREATE POLICY "Users can manage their own leave" ON public.leaves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own balance" ON public.leave_balances;
CREATE POLICY "Users can view their own balance" ON public.leave_balances FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins/HR can manage all leave" ON public.leaves;
CREATE POLICY "Admins/HR can manage all leave" ON public.leaves FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager')) WITH CHECK (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager'));
DROP POLICY IF EXISTS "Admins/HR can manage all balances" ON public.leave_balances;
CREATE POLICY "Admins/HR can manage all balances" ON public.leave_balances FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager')) WITH CHECK (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager'));
DROP POLICY IF EXISTS "Managers can see their team's leave" ON public.leaves;
CREATE POLICY "Managers can see their team's leave" ON public.leaves FOR SELECT USING (
  auth.get_user_role() IN ('manager', 'team_lead') AND
  get_user_department(user_id) = get_user_department(auth.uid())
);
DROP POLICY IF EXISTS "Managers can approve/reject team leave" ON public.leaves;
CREATE POLICY "Managers can approve/reject team leave" ON public.leaves FOR UPDATE USING (
  auth.get_user_role() IN ('manager', 'team_lead') AND
  get_user_department(user_id) = get_user_department(auth.uid())
) WITH CHECK (status IN ('approved', 'rejected'));

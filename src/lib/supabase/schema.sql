-- supabase/schema.sql

-- 🚀 This script is designed to be idempotent and can be run multiple times.
-- It will completely reset the public schema, dropping all tables, types,
-- functions, and policies before recreating them.

-- 🧹 Clean up old objects first, in the correct dependency order.

-- 1. Drop Triggers first, as they depend on functions.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop Functions, as tables/policies might depend on them.
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid);
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid);

-- 3. Drop Policies.
DROP POLICY IF EXISTS "Public access for all" ON public.metrics;
DROP POLICY IF EXISTS "Allow public read access" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Recruiter write access" ON public.jobs;
DROP POLICY IF EXISTS "Allow public read access" ON public.applicants;
DROP POLICY IF EXISTS "Allow authenticated users to create" ON public.applicants;
DROP POLICY IF EXISTS "Allow HR/Recruiter full access" ON public.applicants;
DROP POLICY IF EXISTS "Allow user to see their own profile" ON public.applicants;
DROP POLICY IF EXISTS "Allow public read access" ON public.colleges;
DROP POLICY IF EXISTS "Allow HR/Recruiter write access" ON public.colleges;
DROP POLICY IF EXISTS "Allow authenticated users to read all" ON public.company_posts;
DROP POLICY IF EXISTS "Allow HR/Admin to create posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow authenticated users to read all" ON public.kudos;
DROP POLICY IF EXISTS "Allow authenticated users to give kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow authenticated users to read all" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow managers/admins to give awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow authenticated users to read all" ON public.company_documents;
DROP POLICY IF EXISTS "Allow HR/Admin to manage documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can view their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "HR can manage all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow HR/Admin to manage all workflows" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow employees to view their own workflow" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow managers to view their team's workflows" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow authenticated users read access" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow admin/hr full access" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow employee to see their own review" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow manager to see their team's reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to read all" ON public.objectives;
DROP POLICY IF EXISTS "Allow users to manage their own OKRs" ON public.objectives;
DROP POLICY IF EXISTS "Allow authenticated users to read all" ON public.key_results;
DROP POLICY IF EXISTS "Allow users to manage their own key results" ON public.key_results;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expense_reports;
DROP POLICY IF EXISTS "Finance/Admin can manage all expenses" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can manage their own expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Finance/Admin can manage all expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Support/Admin can manage all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Support/Admin can manage all comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow authenticated users read access" ON public.interviews;
DROP POLICY IF EXISTS "Allow HR/Recruiters full access" ON public.interviews;
DROP POLICY IF EXISTS "Allow interviewers to see their assigned interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow users to see own notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow HR/Recruiters/Interviewers to manage notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Users can see their own leave balance" ON public.leave_balances;
DROP POLICY IF EXISTS "HR/Admins can see all balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can see their own leave requests" ON public.leaves;
DROP POLICY IF EXISTS "HR/Admins can see all leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;

-- 4. Drop Tables in reverse dependency order.
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.metrics;
DROP TABLE IF EXISTS public.users; -- Drop the public users table

-- 5. Drop ENUM types last.
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

-- ✅ Recreate everything from a clean slate.

-- 1. Create ENUM types first.
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

-- 2. Create Tables.

-- Users Table (Public Profile)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  email text UNIQUE,
  role user_role DEFAULT 'guest'::user_role,
  department text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Public user profiles, extending auth.users.';

-- Metrics Table
CREATE TABLE IF NOT EXISTS public.metrics (
  id int8 GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title text,
  value text,
  change text,
  change_type text
);
COMMENT ON TABLE public.metrics IS 'Stores dashboard metrics.';

-- Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  description text,
  status job_status DEFAULT 'Open'::job_status,
  posted_date timestamptz DEFAULT now(),
  applicants integer DEFAULT 0
);
COMMENT ON TABLE public.jobs IS 'Job postings and their status.';

-- Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status college_status DEFAULT 'Invited'::college_status,
  resumes_received integer DEFAULT 0,
  contact_email text,
  last_contacted timestamptz DEFAULT now()
);
COMMENT ON TABLE public.colleges IS 'Colleges for campus recruitment drives.';

-- Applicants Table
CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  stage applicant_stage DEFAULT 'Applied'::applicant_stage,
  applied_date timestamptz DEFAULT now(),
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
COMMENT ON TABLE public.applicants IS 'Stores job applicant information.';

-- Applicant Notes Table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name text,
  author_avatar text,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.applicant_notes IS 'Internal notes for applicants from the hiring team.';

-- Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  time text NOT NULL,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'Scheduled'::interview_status,
  candidate_name text,
  candidate_avatar text,
  interviewer_name text,
  interviewer_avatar text,
  job_title text
);
COMMENT ON TABLE public.interviews IS 'Scheduled interviews for applicants.';

-- Company Posts Table
CREATE TABLE IF NOT EXISTS public.company_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.company_posts IS 'Company-wide announcements and feed posts.';

-- Kudos Table
CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.kudos IS 'Peer-to-peer recognition.';

-- Weekly Awards Table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  week_of date NOT NULL
);
COMMENT ON TABLE public.weekly_awards IS 'Employee of the Week awards.';

-- Company Documents Table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text,
  last_updated timestamptz DEFAULT now(),
  download_url text NOT NULL
);
COMMENT ON TABLE public.company_documents IS 'Repository for company policies and documents.';

-- Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  gross_salary numeric(10, 2) NOT NULL,
  net_salary numeric(10, 2) NOT NULL,
  download_url text NOT NULL
);
COMMENT ON TABLE public.payslips IS 'Stores employee payslip information.';

-- Onboarding Workflows Table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name text,
  employee_avatar text,
  job_title text,
  manager_name text,
  buddy_name text,
  progress integer DEFAULT 0,
  current_step text DEFAULT 'Initial Setup',
  start_date timestamptz DEFAULT now()
);
COMMENT ON TABLE public.onboarding_workflows IS 'Tracks new hire onboarding progress.';

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date timestamptz,
  status text,
  job_title text
);
COMMENT ON TABLE public.performance_reviews IS 'Stores employee performance review records.';

-- Objectives Table (OKRs)
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  quarter text NOT NULL
);
COMMENT ON TABLE public.objectives IS 'High-level objectives for OKR tracking.';

-- Key Results Table (OKRs)
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description text NOT NULL,
  progress integer DEFAULT 0,
  status key_result_status DEFAULT 'on_track'::key_result_status
);
COMMENT ON TABLE public.key_results IS 'Measurable key results for objectives.';

-- Expense Reports Table
CREATE TABLE IF NOT EXISTS public.expense_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  status expense_status DEFAULT 'draft'::expense_status,
  submitted_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.expense_reports IS 'Header table for employee expense reports.';

-- Expense Items Table
CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text,
  amount numeric(10, 2) NOT NULL,
  description text
);
COMMENT ON TABLE public.expense_items IS 'Line items for individual expense reports.';

-- Helpdesk Tickets Table
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
COMMENT ON TABLE public.helpdesk_tickets IS 'Support tickets for HR, IT, etc.';

-- Ticket Comments Table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.ticket_comments IS 'Comments on helpdesk tickets.';

-- Leave Balances Table
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 18,
    unpaid_leave integer DEFAULT 0
);
COMMENT ON TABLE public.leave_balances IS 'Tracks available leave days for each user.';

-- Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status DEFAULT 'pending'::leave_status,
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    total_days integer NOT NULL
);
COMMENT ON TABLE public.leaves IS 'Stores all leave requests.';

-- 3. Create Functions and Triggers last.

-- Function to get a user's role from their JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Fetches a user role from the public users table based on user ID.';

-- Function to get a user's department
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;
COMMENT ON FUNCTION public.get_user_department(uuid) IS 'Fetches a user department from the public users table based on user ID.';

-- Function to create a public user profile and leave balance when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a public profile
  INSERT INTO public.users (id, full_name, avatar_url, email, role, department)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department'
  );

  -- Create a leave balance entry
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (new.id, 12, 12, 18, 0);

  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to automatically create a public user profile and leave balance upon new user registration in auth.users.';

-- Trigger to execute the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'When a new user is created in auth, this trigger populates their public profile.';


-- 4. Set up Row Level Security (RLS) policies.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to user profiles" ON public.users FOR ALL USING ('admin' = public.get_user_role(auth.uid())) WITH CHECK ('admin' = public.get_user_role(auth.uid()));
CREATE POLICY "Authenticated users can view all profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for all" ON public.metrics FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter write access" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create" ON public.applicants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiter full access" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow user to see their own profile" ON public.applicants FOR SELECT USING (id::text = auth.uid()::text);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter write access" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to create posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow managers/admins to give awards" ON public.weekly_awards FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to manage documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can manage all payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));

ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR/Admin to manage all workflows" ON public.onboarding_workflows FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow employees to view their own workflow" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers to view their team's workflows" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = manager_id);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users read access" ON public.performance_reviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/hr full access" ON public.performance_reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow employee to see their own review" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow manager to see their team's reviews" ON public.performance_reviews FOR SELECT USING (public.get_user_department(auth.uid()) IN (SELECT department FROM public.users WHERE id = user_id));

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all" ON public.objectives FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to manage their own OKRs" ON public.objectives FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all" ON public.key_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to manage their own key results" ON public.key_results FOR ALL USING (auth.uid() IN (SELECT owner_id FROM objectives WHERE id = objective_id));

ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expenses" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Finance/Admin can manage all expenses" ON public.expense_reports FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'finance'));

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expense items" ON public.expense_items FOR ALL USING (auth.uid() IN (SELECT user_id FROM expense_reports WHERE id = expense_report_id));
CREATE POLICY "Finance/Admin can manage all expense items" ON public.expense_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'finance'));

ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support/Admin can manage all tickets" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin'));

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own comments" ON public.ticket_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support/Admin can manage all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin'));

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users read access" ON public.interviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiters full access" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow interviewers to see their assigned interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);

ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see own notes" ON public.applicant_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Recruiters/Interviewers to manage notes" ON public.applicant_notes FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admins can see all balances" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own leave requests" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "HR/Admins can see all leave requests" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR ALL USING (public.get_user_department(auth.uid()) IN (SELECT department FROM public.users WHERE id = leaves.user_id));

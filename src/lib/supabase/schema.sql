-- 🧹 Clean up existing objects to ensure a fresh start.

-- 🔽 Drop dependent objects first
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid) CASCADE;

-- 🔽 Drop all tables with CASCADE to handle dependencies
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
DROP TABLE IF EXISTS public.metrics CASCADE;

-- 🔽 Drop all ENUM types after tables are gone
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


-- ✅ Recreate everything from scratch.

-- 🔼 Create ENUM types first
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

-- 🔼 Create tables
-- Note: The 'users' table stores public profile information.
-- It is linked to the 'auth.users' table via the user's ID.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,
  role user_role DEFAULT 'guest',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- metrics
CREATE TABLE IF NOT EXISTS public.metrics (
  id SERIAL PRIMARY KEY, 
  title TEXT, 
  value TEXT, 
  change TEXT, 
  change_type TEXT
);

-- jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  department TEXT,
  description TEXT,
  status job_status DEFAULT 'Open',
  applicants INT DEFAULT 0,
  posted_date TIMESTAMPTZ DEFAULT now()
);

-- colleges
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status college_status DEFAULT 'Invited',
  resumes_received INT DEFAULT 0,
  contact_email TEXT UNIQUE NOT NULL,
  last_contacted TIMESTAMPTZ DEFAULT now()
);

-- applicants
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  stage applicant_stage DEFAULT 'Applied',
  applied_date TIMESTAMPTZ DEFAULT now(),
  avatar TEXT,
  source applicant_source,
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

-- applicant_notes
CREATE TABLE IF NOT EXISTS public.applicant_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_avatar TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- interviews
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  date TIMESTAMPTZ,
  time TEXT,
  type interview_type,
  status interview_status,
  candidate_name TEXT,
  candidate_avatar TEXT,
  interviewer_name TEXT,
  interviewer_avatar TEXT,
  job_title TEXT
);

-- onboarding_workflows
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name TEXT,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT DEFAULT 'Manager Welcome',
    start_date TIMESTAMPTZ DEFAULT now()
);

-- leave_balances
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  sick_leave INT DEFAULT 12,
  casual_leave INT DEFAULT 12,
  earned_leave INT DEFAULT 12,
  unpaid_leave INT DEFAULT 0
);

-- leaves
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approver_id UUID REFERENCES public.users(id),
    total_days INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- company_posts
CREATE TABLE IF NOT EXISTS public.company_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- kudos
CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- weekly_awards
CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- payslips
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary NUMERIC NOT NULL,
    net_salary NUMERIC NOT NULL,
    download_url TEXT NOT NULL
);

-- company_documents
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    download_url TEXT NOT NULL
);

-- objectives
CREATE TABLE IF NOT EXISTS public.objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);

-- key_results
CREATE TABLE IF NOT EXISTS public.key_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT DEFAULT 0,
    status key_result_status DEFAULT 'on_track'
);

-- expense_reports
CREATE TABLE IF NOT EXISTS public.expense_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status expense_status DEFAULT 'draft',
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- expense_items
CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT
);

-- helpdesk_tickets
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category,
    status ticket_status DEFAULT 'Open',
    priority ticket_priority DEFAULT 'Medium',
    resolver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ticket_comments
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 🔼 Create functions to be used in policies and triggers
-- This function will run when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a public profile for the new user
  INSERT INTO public.users (id, full_name, avatar_url, email, role, department)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department'
  );

  -- Create a leave balance record for the new user
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- This function gets a user's role from their JWT claims.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

-- This function gets a user's department from their profile.
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;

-- 🔼 Create a trigger to automatically run the handle_new_user function
-- This will only be created if it doesn't exist, to avoid errors on repeated script runs.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 🔼 Set up Row Level Security (RLS) policies
-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
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

-- 🔽 Drop existing policies to avoid conflicts
-- Users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
-- Leave
DROP POLICY IF EXISTS "Users can view and manage their own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can view and manage their own leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Admins and HR can manage all leave" ON public.leaves;
DROP POLICY IF EXISTS "Admins can manage all leave balances" ON public.leave_balances;
-- Applicants & Jobs
DROP POLICY IF EXISTS "Authenticated users can view jobs and applicants" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view jobs and applicants" ON public.applicants;
DROP POLICY IF EXISTS "HR and Admins can manage jobs and applicants" ON public.jobs;
DROP POLICY IF EXISTS "HR and Admins can manage jobs and applicants" ON public.applicants;
-- General Public Read
DROP POLICY IF EXISTS "All users can view general company info" ON public.company_posts;
DROP POLICY IF EXISTS "All users can view general company info" ON public.kudos;
DROP POLICY IF EXISTS "All users can view general company info" ON public.weekly_awards;
DROP POLICY IF EXISTS "All users can view general company info" ON public.company_documents;
-- Payslips
DROP POLICY IF EXISTS "Users can view their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Admins and HR can manage payslips" ON public.payslips;
-- Performance
DROP POLICY IF EXISTS "Users can manage their own objectives" ON public.objectives;
DROP POLICY IF EXISTS "Users can manage their own key results" ON public.key_results;
DROP POLICY IF EXISTS "Admins and HR can manage all performance data" ON public.objectives;
DROP POLICY IF EXISTS "Admins and HR can manage all performance data" ON public.key_results;
-- Expenses
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can manage their own expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Admins/Finance can manage all expenses" ON public.expense_reports;
DROP POLICY IF EXISTS "Admins/Finance can manage all expense items" ON public.expense_items;
-- Helpdesk
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can manage comments on their own tickets" ON public.ticket_comments;
DROP POLICY IF EXISTS "Support staff can manage all tickets and comments" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Support staff can manage all tickets and comments" ON public.ticket_comments;


-- 🔼 Create new policies
-- USERS
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));

-- LEAVE SYSTEM
CREATE POLICY "Users can view and manage their own leave balances" ON public.leave_balances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view and manage their own leave requests" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (public.get_user_department(auth.uid()) = (SELECT department FROM public.users WHERE id = leaves.user_id));
CREATE POLICY "Admins and HR can manage all leave" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Admins can manage all leave balances" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));

-- RECRUITMENT (Jobs, Applicants, etc.)
CREATE POLICY "Authenticated users can view jobs and applicants" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view jobs and applicants" ON public.applicants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR and Admins can manage jobs and applicants" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR and Admins can manage jobs and applicants" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR and Admins can manage applicant notes" ON public.applicant_notes FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer'));
CREATE POLICY "HR, Admins and Interviewers can manage interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));
CREATE POLICY "HR and Admins can manage colleges" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));


-- COMPANY WIDE (Posts, Kudos, Documents)
CREATE POLICY "All users can view general company info" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and HR can create company posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "All users can view general company info" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "All users can view general company info" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers and HR can give weekly awards" ON public.weekly_awards FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "All users can view general company info" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and HR can manage documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- PAYSLIPS
CREATE POLICY "Users can view their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins and HR can manage payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- PERFORMANCE & OKRS
CREATE POLICY "Users can manage their own objectives" ON public.objectives FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their own key results" ON public.key_results FOR ALL USING ((SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid());
CREATE POLICY "Admins and HR can manage all performance data" ON public.objectives FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Admins and HR can manage all performance data" ON public.key_results FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- EXPENSES
CREATE POLICY "Users can manage their own expenses" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expense items" ON public.expense_items FOR ALL USING ((SELECT user_id FROM public.expense_reports WHERE id = expense_report_id) = auth.uid());
CREATE POLICY "Admins/Finance can manage all expenses" ON public.expense_reports FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));
CREATE POLICY "Admins/Finance can manage all expense items" ON public.expense_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));

-- HELPDESK
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL USING ((SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id) = auth.uid());
CREATE POLICY "Support staff can manage all tickets and comments" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin'));
CREATE POLICY "Support staff can manage all tickets and comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin'));


-- 🔼 Create a function to get job funnel statistics
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.stage, COALESCE(a.count, 0) as count
    FROM (VALUES
        ('Sourced'::applicant_stage),
        ('Applied'::applicant_stage),
        ('Phone Screen'::applicant_stage),
        ('Interview'::applicant_stage),
        ('Offer'::applicant_stage),
        ('Hired'::applicant_stage)
    ) AS s(stage)
    LEFT JOIN (
        SELECT stage, count(*) as count
        FROM applicants
        GROUP BY stage
    ) AS a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;

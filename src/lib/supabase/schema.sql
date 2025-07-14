-- ----------------------------
-- Cleanup old schema
-- ----------------------------

-- Drop dependent objects first
DROP TRIGGER IF EXISTS on_auth_user_created on auth.users;

-- Then drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid);
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid);
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- Then drop policies
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow admin full access" ON public.users;
DROP POLICY IF EXISTS "Allow individual read access" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow HR full access to leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow individual CRUD access" ON public.leaves;
DROP POLICY IF EXISTS "Allow HR full access to leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Allow all authenticated users to read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Recruiters to manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow all authenticated users to read applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow HR/Recruiters to manage applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow all authenticated users to read colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow HR/Recruiters to manage colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow all authenticated users to read notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow HR/Recruiters to manage notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow individual read access for interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow HR/Recruiters/Interviewers to manage interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow all authenticated to read company posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow HR/Admin to create company posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow managers/hr to give weekly awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow all authenticated to read weekly awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow individual read access for payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow HR to manage all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated read access for documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow HR to manage documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow individual read access for performance reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow managers/HR to manage performance reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow individual read access for OKRs" ON public.objectives;
DROP POLICY IF EXISTS "Allow managers/HR to manage OKRs" ON public.objectives;
DROP POLICY IF EXISTS "Allow individual read access for key results" ON public.key_results;
DROP POLICY IF EXISTS "Allow managers/HR to manage key results" ON public.key_results;
DROP POLICY IF EXISTS "Allow individual access to their expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow finance/admin access to all expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow individual access to their expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Allow finance/admin access to all expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Allow individual access to their tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow support/admin access to all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow participants to access comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow support/admin access to all comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow users to manage their own onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow HR to manage onboarding workflows" ON public.onboarding_workflows;


-- Then drop tables
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.objectives CASCADE;
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.weekly_awards CASCADE;
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.company_documents CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_comments CASCADE;


-- Finally, drop types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;


-- ----------------------------
-- Create new schema
-- ----------------------------

-- Create Enum Types
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'super_hr',
  'hr_manager',
  'recruiter',
  'interviewer',
  'manager',
  'team_lead',
  'employee',
  'intern',
  'guest',
  'finance',
  'it_admin',
  'support',
  'auditor'
);

CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');


-- Create Tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest'::user_role,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'Open'::job_status,
  posted_date DATE NOT NULL,
  applicants INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  stage applicant_stage DEFAULT 'Applied'::applicant_stage,
  applied_date DATE NOT NULL,
  avatar TEXT,
  source TEXT, -- 'walk-in', 'college', 'email', 'manual'
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
  resume_data JSONB,
  ai_match_score INTEGER,
  ai_justification TEXT,
  wpm INTEGER,
  accuracy INTEGER,
  aptitude_score INTEGER,
  comprehensive_score INTEGER,
  english_grammar_score INTEGER,
  customer_service_score INTEGER,
  rejection_reason TEXT,
  rejection_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INTEGER DEFAULT 0,
    contact_email TEXT NOT NULL,
    last_contacted TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    "time" TEXT NOT NULL,
    type interview_type NOT NULL,
    status interview_status NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_avatar TEXT,
    interviewer_name TEXT NOT NULL,
    interviewer_avatar TEXT,
    job_title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INTEGER DEFAULT 0,
    current_step TEXT DEFAULT 'Initial Setup',
    start_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  status review_status NOT NULL,
  job_title TEXT
);

CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  status key_result_status NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status NOT NULL,
  approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  total_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave INTEGER DEFAULT 12,
  casual_leave INTEGER DEFAULT 12,
  earned_leave INTEGER DEFAULT 12,
  unpaid_leave INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.company_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  week_of DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  gross_salary NUMERIC(10, 2) NOT NULL,
  net_salary NUMERIC(10, 2) NOT NULL,
  download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  last_updated DATE NOT NULL,
  download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status expense_status NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  status ticket_status DEFAULT 'Open'::ticket_status,
  priority ticket_priority DEFAULT 'Medium'::ticket_priority,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------
-- Functions & Triggers
-- ----------------------------

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, full_name, email, avatar_url, role, department, profile_setup_complete)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    NEW.raw_user_meta_data->>'department',
    false
  );
  
  -- Insert into leave_balances for the new user
  INSERT INTO public.leave_balances (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user department
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT department FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Job Funnel Stats
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stage,
        COALESCE(a.count, 0) AS count
    FROM 
        (VALUES 
            ('Sourced'::applicant_stage), 
            ('Applied'::applicant_stage), 
            ('Phone Screen'::applicant_stage), 
            ('Interview'::applicant_stage), 
            ('Offer'::applicant_stage), 
            ('Hired'::applicant_stage)
        ) AS s(stage)
    LEFT JOIN 
        (SELECT stage, count(*) AS count FROM public.applicants GROUP BY stage) AS a
    ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user
-- We check for trigger existence before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- ----------------------------
-- RLS Policies
-- ----------------------------

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;


-- Policies for users table
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admin full access" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));
CREATE POLICY "Allow employees to view other employees" ON public.users FOR SELECT USING (auth.role() = 'authenticated');


-- Policies for leave_balances table
CREATE POLICY "Allow individual read access" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR full access to leave balances" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for leaves table
CREATE POLICY "Allow individual CRUD access" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow HR full access to leaves" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND
  department = public.get_user_department(auth.uid())
);

-- Policies for jobs table
CREATE POLICY "Allow all authenticated users to read jobs" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiters to manage jobs" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for applicants table
CREATE POLICY "Allow all authenticated users to read applicants" ON public.applicants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiters to manage applicants" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for colleges table
CREATE POLICY "Allow all authenticated users to read colleges" ON public.colleges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiters to manage colleges" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for applicant_notes table
CREATE POLICY "Allow all authenticated users to read notes" ON public.applicant_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiters to manage notes" ON public.applicant_notes FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for interviews table
CREATE POLICY "Allow individual read access for interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "Allow HR/Recruiters/Interviewers to manage interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));

-- Policies for company_posts table
CREATE POLICY "Allow all authenticated to read company posts" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to create company posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for kudos and awards
CREATE POLICY "Allow authenticated users to manage kudos" ON public.kudos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow managers/hr to give weekly awards" ON public.weekly_awards FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Allow all authenticated to read weekly awards" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for payslips
CREATE POLICY "Allow individual read access for payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR to manage all payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for company_documents
CREATE POLICY "Allow authenticated read access for documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR to manage documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for performance_reviews
CREATE POLICY "Allow individual read access for performance reviews" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers/HR to manage performance reviews" ON public.performance_reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));

-- Policies for OKRs
CREATE POLICY "Allow individual read access for OKRs" ON public.objectives FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Allow managers/HR to manage OKRs" ON public.objectives FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));
CREATE POLICY "Allow individual read access for key results" ON public.key_results FOR SELECT USING (auth.uid() = (SELECT owner_id FROM public.objectives WHERE id = objective_id));
CREATE POLICY "Allow managers/HR to manage key results" ON public.key_results FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));

-- Policies for expense_reports
CREATE POLICY "Allow individual access to their expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow finance/admin access to all expense reports" ON public.expense_reports FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));

-- Policies for expense_items
CREATE POLICY "Allow individual access to their expense items" ON public.expense_items FOR ALL USING (auth.uid() = (SELECT user_id FROM public.expense_reports WHERE id = expense_report_id));
CREATE POLICY "Allow finance/admin access to all expense items" ON public.expense_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));

-- Policies for helpdesk_tickets
CREATE POLICY "Allow individual access to their tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow support/admin access to all tickets" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin'));

-- Policies for ticket_comments
CREATE POLICY "Allow participants to access comments" ON public.ticket_comments FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id)
);
CREATE POLICY "Allow support/admin access to all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin'));

-- Policies for onboarding_workflows
CREATE POLICY "Allow users to manage their own onboarding" ON public.onboarding_workflows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow HR to manage onboarding workflows" ON public.onboarding_workflows FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

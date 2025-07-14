-- 🧹 Reset the database by dropping objects in dependency order

-- Drop Functions that depend on types first
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_department(uuid);

-- Drop all tables
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

-- Drop all ENUM types
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


-- -----------------------------------------------------------------------------
-- ✨ Recreate ENUM types
-- -----------------------------------------------------------------------------
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


-- -----------------------------------------------------------------------------
-- 📝 Recreate Tables
-- -----------------------------------------------------------------------------

-- Create users table to store public profile information
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'guest',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Public user profile information, linked to auth.users.';

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'Open',
  posted_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  applicants INT DEFAULT 0
);
COMMENT ON TABLE public.jobs IS 'Job postings for recruitment.';

-- Create colleges table
CREATE TABLE public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INT DEFAULT 0,
    contact_email TEXT UNIQUE,
    last_contacted TIMESTAMPTZ
);
COMMENT ON TABLE public.colleges IS 'Colleges for campus recruitment drives.';

-- Create applicants table
CREATE TABLE public.applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  stage applicant_stage DEFAULT 'Applied',
  source applicant_source,
  applied_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  avatar TEXT,
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
COMMENT ON TABLE public.applicants IS 'Stores information about job applicants.';

-- Create applicant_notes table
CREATE TABLE public.applicant_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT,
    author_avatar TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.applicant_notes IS 'Internal notes for applicants.';

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'Scheduled',
  candidate_name TEXT,
  candidate_avatar TEXT,
  interviewer_name TEXT,
  interviewer_avatar TEXT,
  job_title TEXT
);
COMMENT ON TABLE public.interviews IS 'Scheduled interviews for applicants.';

-- Create leave_balances table
CREATE TABLE public.leave_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave INT DEFAULT 12,
    casual_leave INT DEFAULT 12,
    earned_leave INT DEFAULT 15,
    unpaid_leave INT DEFAULT 0
);
COMMENT ON TABLE public.leave_balances IS 'Tracks available leave days for each user.';

-- Create leaves table
CREATE TABLE public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    total_days INT NOT NULL
);
COMMENT ON TABLE public.leaves IS 'Leave requests from employees.';

-- Create onboarding_workflows table
CREATE TABLE public.onboarding_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id),
    buddy_id UUID REFERENCES public.users(id),
    employee_name TEXT,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT DEFAULT 'Welcome Email',
    start_date TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.onboarding_workflows IS 'Tracks onboarding progress for new hires.';

-- Create company_posts table
CREATE TABLE public.company_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.company_posts IS 'Official company announcements.';

-- Create kudos table
CREATE TABLE public.kudos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id),
    to_user_id UUID REFERENCES public.users(id),
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.kudos IS 'Peer-to-peer recognition.';

-- Create weekly_awards table
CREATE TABLE public.weekly_awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id UUID REFERENCES public.users(id),
    awarded_by_user_id UUID REFERENCES public.users(id),
    reason TEXT,
    week_of DATE NOT NULL
);
COMMENT ON TABLE public.weekly_awards IS 'Employee of the Week awards.';

-- Create payslips table
CREATE TABLE public.payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary REAL,
    net_salary REAL,
    download_url TEXT
);
COMMENT ON TABLE public.payslips IS 'Employee payslip records.';

-- Create company_documents table
CREATE TABLE public.company_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    last_updated TIMESTAMPTZ,
    download_url TEXT
);
COMMENT ON TABLE public.company_documents IS 'Repository for company policies and documents.';

-- Create objectives table for OKRs
CREATE TABLE public.objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);
COMMENT ON TABLE public.objectives IS 'High-level objectives for OKRs.';

-- Create key_results table for OKRs
CREATE TABLE public.key_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT DEFAULT 0,
    status key_result_status DEFAULT 'on_track'
);
COMMENT ON TABLE public.key_results IS 'Measurable key results for objectives.';

-- Create expense_reports table
CREATE TABLE public.expense_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    title TEXT,
    total_amount REAL,
    status expense_status,
    submitted_at TIMESTAMPTZ
);
COMMENT ON TABLE public.expense_reports IS 'Header table for expense reports.';

-- Create expense_items table
CREATE TABLE public.expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE,
    category TEXT,
    amount REAL,
    description TEXT
);
COMMENT ON TABLE public.expense_items IS 'Individual line items for expense reports.';

-- Create helpdesk_tickets table
CREATE TABLE public.helpdesk_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    subject TEXT,
    description TEXT,
    category ticket_category,
    status ticket_status DEFAULT 'Open',
    priority ticket_priority DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolver_id UUID REFERENCES public.users(id)
);
COMMENT ON TABLE public.helpdesk_tickets IS 'Support tickets for employees.';

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.ticket_comments IS 'Comments on support tickets.';


-- -----------------------------------------------------------------------------
-- 🔒 Enable RLS for all tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
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


-- -----------------------------------------------------------------------------
-- 🧰 Create Helper Functions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;


-- -----------------------------------------------------------------------------
-- 🔐 Define RLS Policies
-- -----------------------------------------------------------------------------

-- Policies for 'users' table
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));
CREATE POLICY "All authenticated users can view all profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');


-- Policies for 'jobs' table
CREATE POLICY "All users can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "HR/Recruiters/Admins can manage jobs" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));


-- Policies for 'applicants' table
CREATE POLICY "HR/Recruiters/Admins can manage applicants" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Interviewers can view applicants they are interviewing" ON public.applicants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interviews WHERE interviews.applicant_id = applicants.id AND interviews.interviewer_id = auth.uid())
);


-- Policies for 'applicant_notes' table
CREATE POLICY "Users with access to applicant can manage notes" ON public.applicant_notes FOR ALL USING (
    (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')) OR
    (EXISTS (SELECT 1 FROM public.interviews WHERE interviews.applicant_id = applicant_notes.applicant_id AND interviews.interviewer_id = auth.uid()))
);


-- Policies for 'interviews' table
CREATE POLICY "HR/Recruiters/Admins can manage interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Interviewers can see their assigned interviews" ON public.interviews FOR SELECT USING (interviewer_id = auth.uid());


-- Policies for 'colleges' table
CREATE POLICY "All users can view colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "HR/Recruiters/Admins can manage colleges" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));


-- Policies for 'leave_balances' table
CREATE POLICY "Users can see their own leave balance" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins/HR can see all leave balances" ON public.leave_balances FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- Policies for 'leaves' table
CREATE POLICY "Users can manage their own leave requests" ON public.leaves FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (
    public.get_user_department(user_id) = public.get_user_department(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('manager', 'team_lead')
);
CREATE POLICY "Admins/HR can manage all leaves" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- Policies for 'onboarding_workflows' table
CREATE POLICY "HR/Admins can manage onboarding" ON public.onboarding_workflows FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Assigned employee, manager, buddy can view their onboarding" ON public.onboarding_workflows FOR SELECT USING (auth.uid() IN (user_id, manager_id, buddy_id));


-- Policies for 'company_posts' table
CREATE POLICY "All users can view company posts" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "HR/Admins can create posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- Policies for 'kudos' and 'weekly_awards' tables
CREATE POLICY "All users can view kudos and awards" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "All users can view weekly awards" ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Managers/HR/Admins can give awards" ON public.weekly_awards FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- General view-all policies for other tables
CREATE POLICY "All authenticated users can view documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view their own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "HR/Finance/Admins can view all payslips" ON public.payslips FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can manage their own OKRs" ON public.objectives FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users can manage their own OKRs (key results)" ON public.key_results FOR ALL USING ((SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid());
CREATE POLICY "Users can manage their own expenses" ON public.expense_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can see items for their reports" ON public.expense_items FOR SELECT USING ((SELECT user_id FROM public.expense_reports WHERE id = expense_report_id) = auth.uid());
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL USING ((SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id) = auth.uid());
CREATE POLICY "Support staff can manage all tickets and comments" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'it_admin', 'support'));
CREATE POLICY "Support staff can manage all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'it_admin', 'support'));


-- -----------------------------------------------------------------------------
-- ⚡ Create Database Triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a new user profile
  INSERT INTO public.users (id, full_name, email, role, avatar_url, department)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'department'
  );
  
  -- Insert a corresponding leave balance
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Create the trigger on auth.users, which is the only allowed way
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 📊 Create RPC Functions for stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT)
AS $$
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

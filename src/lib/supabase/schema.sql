-- ------------------------------------------------------------------------------------------------
-- --- WARNING: DROPPING ALL DATA AND STRUCTURES. THIS IS A DESTRUCTIVE OPERATION.
-- ------------------------------------------------------------------------------------------------

-- Ensure the script stops on the first error.
\set ON_ERROR_STOP on

-- Disable notices for a cleaner output during script execution.
SET client_min_messages = 'warning';

-- ------------------------------------------------------------------------------------------------
-- --- 1. CLEANUP PHASE: Drop existing objects in the correct dependency order.
-- ------------------------------------------------------------------------------------------------
-- This section ensures a clean slate by removing old objects. The order is critical to avoid
-- dependency errors. Triggers are dropped first, then functions, policies, tables, and finally types.

-- Drop Triggers (if they cannot be dropped, we use CREATE OR REPLACE for functions later)
-- Note: Dropping triggers on auth.users is often restricted. We handle this by using
-- CREATE OR REPLACE for the handle_new_user function. If you have permissions, you can uncomment:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Functions
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_department(uuid);
-- DROP FUNCTION IF EXISTS public.handle_new_user(); -- Replaced with CREATE OR REPLACE

-- Drop Policies
DROP POLICY IF EXISTS "Allow full access to own user data" ON public.users;
DROP POLICY IF EXISTS "Allow admin full access" ON public.users;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Allow admin and HR to manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.applicants;
DROP POLICY IF EXISTS "Allow HR/recruiters to manage applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow HR to read applicant notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leaves;
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Users can update their own pending leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Admins and HR can manage all leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Users can view their own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Admins and HR can manage all leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_posts;
DROP POLICY IF EXISTS "Allow admin/HR to create company posts" ON public.company_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.kudos;
DROP POLICY IF EXISTS "Users can give kudos" ON public.kudos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.weekly_awards;
DROP POLICY IF EXISTS "Managers and HR can give weekly awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Users can view their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "HR can manage all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_documents;
DROP POLICY IF EXISTS "HR can manage company documents" ON public.company_documents;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.performance_reviews;
DROP POLICY IF EXISTS "Managers and HR can manage performance reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Users can view their own OKRs" ON public.objectives;
DROP POLICY IF EXISTS "Managers and HR can view all OKRs" ON public.objectives;
DROP POLICY IF EXISTS "Users can manage their own key results" ON public.key_results;
DROP POLICY IF EXISTS "Managers and HR can manage all key results" ON public.key_results;
DROP POLICY IF EXISTS "Users can view their own expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Finance and managers can view all reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can view their own expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Finance and managers can view all expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Support staff can view all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON public.ticket_comments;
DROP POLICY IF EXISTS "Support staff can manage all comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Users can view their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Interviewers and HR can view relevant interviews" ON public.interviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.colleges;
DROP POLICY IF EXISTS "Allow HR/recruiters to manage colleges" ON public.colleges;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "HR and managers can manage onboarding" ON public.onboarding_workflows;

-- Drop Tables
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.performance_reviews;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.users;

-- Drop Custom Types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.performance_review_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_report_status;
DROP TYPE IF EXISTS public.helpdesk_ticket_status;
DROP TYPE IF EXISTS public.helpdesk_ticket_priority;
DROP TYPE IF EXISTS public.helpdesk_ticket_category;


-- ------------------------------------------------------------------------------------------------
-- --- 2. CREATION PHASE: Create all database objects.
-- ------------------------------------------------------------------------------------------------

-- Create Custom Types
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.applicant_stage AS ENUM (
  'Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'
);
CREATE TYPE public.job_status AS ENUM (
  'Open', 'Closed', 'On hold'
);
CREATE TYPE public.leave_type AS ENUM (
  'sick', 'casual', 'earned', 'unpaid'
);
CREATE TYPE public.leave_status AS ENUM (
  'pending', 'approved', 'rejected'
);
CREATE TYPE public.college_status AS ENUM (
  'Invited', 'Confirmed', 'Attended', 'Declined'
);
CREATE TYPE public.interview_type AS ENUM (
  'Video', 'Phone', 'In-person'
);
CREATE TYPE public.interview_status AS ENUM (
  'Scheduled', 'Completed', 'Canceled'
);
CREATE TYPE public.performance_review_status AS ENUM (
  'Pending', 'In Progress', 'Completed'
);
CREATE TYPE public.key_result_status AS ENUM (
  'on_track', 'at_risk', 'off_track'
);
CREATE TYPE public.expense_report_status AS ENUM (
  'draft', 'submitted', 'approved', 'rejected', 'reimbursed'
);
CREATE TYPE public.helpdesk_ticket_status AS ENUM (
  'Open', 'In Progress', 'Resolved', 'Closed'
);
CREATE TYPE public.helpdesk_ticket_priority AS ENUM (
  'Low', 'Medium', 'High', 'Urgent'
);
CREATE TYPE public.helpdesk_ticket_category AS ENUM (
  'IT', 'HR', 'Finance', 'General'
);


-- Create Tables
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT false
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INT DEFAULT 0,
    contact_email TEXT UNIQUE NOT NULL,
    last_contacted TIMESTAMPTZ
);

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status NOT NULL,
  posted_date TIMESTAMPTZ,
  applicants INT DEFAULT 0
);

CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id),
  stage applicant_stage NOT NULL,
  applied_date TIMESTAMPTZ,
  avatar TEXT,
  source TEXT,
  college_id UUID REFERENCES public.colleges(id),
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

CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status leave_status NOT NULL,
  approver_id uuid REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  total_days INT NOT NULL
);

CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave INT DEFAULT 12,
  casual_leave INT DEFAULT 12,
  earned_leave INT DEFAULT 18,
  unpaid_leave INT DEFAULT 0
);

CREATE TABLE public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    manager_id UUID NOT NULL REFERENCES public.users(id),
    buddy_id UUID REFERENCES public.users(id),
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT DEFAULT 'Initial Setup',
    start_date DATE NOT NULL
);

CREATE TABLE public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES public.users(id),
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

CREATE TABLE public.company_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id),
    to_user_id UUID NOT NULL REFERENCES public.users(id),
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.weekly_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id UUID NOT NULL REFERENCES public.users(id),
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id),
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary REAL NOT NULL,
    net_salary REAL NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    download_url TEXT NOT NULL
);

CREATE TABLE public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    status performance_review_status NOT NULL,
    job_title TEXT
);

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL
);

CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid REFERENCES public.objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INT DEFAULT 0,
  status key_result_status NOT NULL
);

CREATE TABLE public.expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status expense_report_status NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id uuid REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT,
  amount REAL NOT NULL,
  description TEXT
);

CREATE TABLE public.helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category helpdesk_ticket_category NOT NULL,
    status helpdesk_ticket_status NOT NULL,
    priority helpdesk_ticket_priority NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolver_id UUID REFERENCES public.users(id)
);

CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------------------------
-- --- 3. FUNCTIONS & TRIGGERS: Set up database automation.
-- ------------------------------------------------------------------------------------------------

-- Create Functions
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(p_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT department FROM users WHERE id = p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
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
        SELECT applicants.stage, COUNT(*) as count
        FROM applicants
        GROUP BY applicants.stage
    ) AS a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;


-- Function to insert a new user into public.users when one is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, department)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'department'
  );
  
  -- Create an initial leave balance for the new user
  INSERT INTO public.leave_balances(user_id) VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Create Trigger for new user handling
-- This block checks if the trigger exists before creating it, preventing errors on re-runs.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- ------------------------------------------------------------------------------------------------
-- --- 4. ROW-LEVEL SECURITY (RLS) & POLICIES: Define data access rules.
-- ------------------------------------------------------------------------------------------------

-- Enable RLS for all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;


-- Define Policies
CREATE POLICY "Allow full access to own user data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Allow admin full access" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) = 'admin' OR public.get_user_role(auth.uid()) = 'super_hr');
CREATE POLICY "Allow read access to all authenticated users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow admin and HR to manage jobs" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

CREATE POLICY "Enable read access for all users" ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow HR/recruiters to manage applicants" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow HR to read applicant notes" ON public.applicant_notes FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "Users can insert their own notes" ON public.applicant_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own leave requests" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (public.get_user_department(auth.uid()) = (SELECT department FROM users WHERE id = user_id));
CREATE POLICY "Users can insert their own leave requests" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending leave requests" ON public.leaves FOR UPDATE USING (auth.uid() = user_id and status = 'pending');
CREATE POLICY "Admins and HR can manage all leave requests" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Users can view their own leave balances" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins and HR can manage all leave balances" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Enable read access for all users" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Allow admin/HR to create company posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Enable read access for all users" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Users can give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Managers and HR can give weekly awards" ON public.weekly_awards FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

CREATE POLICY "Users can view their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can manage all payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Enable read access for all users" ON public.company_documents FOR SELECT USING (true);
CREATE POLICY "HR can manage company documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Enable read access for all users" ON public.performance_reviews FOR SELECT USING (true);
CREATE POLICY "Managers and HR can manage performance reviews" ON public.performance_reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));

CREATE POLICY "Users can view their own OKRs" ON public.objectives FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Managers and HR can view all OKRs" ON public.objectives FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));
CREATE POLICY "Users can manage their own key results" ON public.key_results FOR ALL USING ((SELECT owner_id FROM objectives WHERE id = objective_id) = auth.uid());
CREATE POLICY "Managers and HR can manage all key results" ON public.key_results FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));

CREATE POLICY "Users can view their own expense reports" ON public.expense_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Finance and managers can view all reports" ON public.expense_reports FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'finance'));
CREATE POLICY "Users can view their own expense items" ON public.expense_items FOR SELECT USING ((SELECT user_id FROM expense_reports WHERE id = expense_report_id) = auth.uid());
CREATE POLICY "Finance and managers can view all expense items" ON public.expense_items FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'finance'));

CREATE POLICY "Users can view their own tickets" ON public.helpdesk_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Support staff can view all tickets" ON public.helpdesk_tickets FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Users can view comments on their tickets" ON public.ticket_comments FOR SELECT USING ((SELECT user_id FROM helpdesk_tickets WHERE id = ticket_id) = auth.uid() OR (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin', 'super_hr', 'hr_manager')));
CREATE POLICY "Support staff can manage all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Users can view their own interviews" ON public.interviews FOR SELECT USING (auth.uid() = (SELECT user_id FROM applicants WHERE id = applicant_id));
CREATE POLICY "Interviewers and HR can view relevant interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id OR public.get_user_role(auth.uid()) IN ('admin', 'recruiter', 'hr_manager', 'super_hr'));

CREATE POLICY "Enable read access for all users" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR/recruiters to manage colleges" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

CREATE POLICY "Enable read access for all users" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR and managers can manage onboarding" ON public.onboarding_workflows FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));


-- ------------------------------------------------------------------------------------------------
-- --- 5. COMMENTING: Add descriptions to database objects for clarity.
-- ------------------------------------------------------------------------------------------------

COMMENT ON TABLE public.users IS 'Stores public user information, extending the internal auth.users table.';
COMMENT ON COLUMN public.users.role IS 'Defines the access level and capabilities of a user.';
COMMENT ON TABLE public.jobs IS 'Contains all job postings, both open and closed.';
COMMENT ON TABLE public.applicants IS 'Tracks all individuals who have applied for jobs.';
COMMENT ON COLUMN public.applicants.resume_data IS 'Stores the parsed JSON output from the AI resume processor.';
COMMENT ON TABLE public.leaves IS 'Records all employee leave requests.';
COMMENT ON TABLE public.leave_balances IS 'Maintains the current leave balance for each employee.';
COMMENT ON TABLE public.onboarding_workflows IS 'Manages the onboarding process for new hires.';
COMMENT ON TABLE public.interviews IS 'Schedules and tracks all interviews with candidates.';

-- --- SCRIPT END ---

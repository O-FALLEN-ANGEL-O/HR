
-- =================================================================
--  DATABASE RESET & SETUP SCRIPT
-- =================================================================
--  This script will completely reset the public schema by dropping
--  and recreating all tables, types, and policies. It is designed
--  to be idempotent and can be run safely multiple times.
--
--  Order of operations:
--  1. Drop functions
--  2. Drop policies
--  3. Drop triggers
--  4. Drop tables
--  5. Drop types
--  6. Recreate types
--  7. Recreate tables
--  8. Recreate functions
--  9. Recreate triggers
-- 10. Recreate policies
-- 11. Seed initial data if necessary
-- =================================================================

BEGIN;

-- 1. Drop dependent functions first
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_department(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- 2. Drop all policies with IF EXISTS
DROP POLICY IF EXISTS "Allow public read access" ON public.jobs;
DROP POLICY IF EXISTS "Allow admin full access" ON public.jobs;
DROP POLICY IF EXISTS "Allow public read access" ON public.applicants;
DROP POLICY IF EXISTS "Allow HR/Recruiter access" ON public.applicants;
DROP POLICY IF EXISTS "Allow admin full access" ON public.applicants;
DROP POLICY IF EXISTS "Allow public read access" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Interviewer access to notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow admin full access" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow public read access" ON public.interviews;
DROP POLICY IF EXISTS "Interviewers can see their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "HR/Recruiters can manage interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow admin full access" ON public.interviews;
DROP POLICY IF EXISTS "Allow read access to everyone" ON public.colleges;
DROP POLICY IF EXISTS "Allow HR/Recruiter to manage" ON public.colleges;
DROP POLICY IF EXISTS "Allow admin full access" ON public.colleges;
DROP POLICY IF EXISTS "Allow HR to manage onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Employees can view their own onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Managers can view their team's onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow admin full access" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Employees can see their own leave" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;
DROP POLICY IF EXISTS "HR can see all leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Allow admin full access" ON public.leaves;
DROP POLICY IF EXISTS "Users can view their own balance" ON public.leave_balances;
DROP POLICY IF EXISTS "HR can manage all balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow admin full access" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin full access" ON public.users;
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.company_posts;
DROP POLICY IF EXISTS "Allow HR/Admins to create posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow admin full access" ON public.company_posts;
DROP POLICY IF EXISTS "Allow all users to read kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow users to give kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow admin full access" ON public.kudos;
DROP POLICY IF EXISTS "Allow all users to read weekly awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow managers/HR/admins to give awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow admin full access" ON public.weekly_awards;
DROP POLICY IF EXISTS "Users can see their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "HR can manage all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow admin full access" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.company_documents;
DROP POLICY IF EXISTS "HR/Admins can manage documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow admin full access" ON public.company_documents;
DROP POLICY IF EXISTS "Users can view their own objectives" ON public.objectives;
DROP POLICY IF EXISTS "Managers can view their team's objectives" ON public.objectives;
DROP POLICY IF EXISTS "Allow HR/Admin full access" ON public.objectives;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Managers can view their team's reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Finance/HR can view all reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow admin full access" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Support staff can manage tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow admin full access" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can view comments on their own tickets" ON public.ticket_comments;
DROP POLICY IF EXISTS "Support staff can manage comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow admin full access" ON public.ticket_comments;

-- 3. Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Drop tables in reverse dependency order
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
DROP TABLE IF EXISTS public.users;

-- 5. Drop ENUM types
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

-- 6. Recreate ENUM types
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

-- 7. Recreate Tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,
  role user_role DEFAULT 'employee',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave INT DEFAULT 12,
  casual_leave INT DEFAULT 12,
  earned_leave INT DEFAULT 18,
  unpaid_leave INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approver_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.users(id),
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

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'Open',
  applicants INT DEFAULT 0,
  posted_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status DEFAULT 'Invited',
    resumes_received INT DEFAULT 0,
    contact_email TEXT UNIQUE,
    last_contacted TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id),
  stage applicant_stage DEFAULT 'Applied',
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  avatar TEXT,
  source applicant_source DEFAULT 'manual',
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

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    author_name TEXT,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES public.users(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'Scheduled',
  candidate_name TEXT,
  candidate_avatar TEXT,
  interviewer_name TEXT,
  interviewer_avatar TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url TEXT,
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
    awarded_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    download_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INT DEFAULT 0,
  status key_result_status DEFAULT 'on_track'
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status expense_status DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approver_id UUID REFERENCES public.users(id),
    reimbursed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT,
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
  resolved_at TIMESTAMPTZ,
  resolver_id UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. Recreate Functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a row into public.users
  INSERT INTO public.users (id, full_name, avatar_url, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::user_role
  );
  -- Insert a row into public.leave_balances
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (
      NEW.id,
      12, -- Default sick leave
      12, -- Default casual leave
      18, -- Default earned leave
      0   -- Default unpaid leave
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.stage,
        COALESCE(a.count, 0) AS count
    FROM
        (VALUES
            ('Sourced'),
            ('Applied'),
            ('Phone Screen'),
            ('Interview'),
            ('Offer'),
            ('Hired'),
            ('Rejected')
        ) AS s(stage)
    LEFT JOIN
        (SELECT
            stage,
            COUNT(*) AS count
        FROM
            public.applicants
        GROUP BY
            stage
        ) AS a ON s.stage::applicant_stage = a.stage
    ORDER BY
        CASE s.stage
            WHEN 'Sourced' THEN 1
            WHEN 'Applied' THEN 2
            WHEN 'Phone Screen' THEN 3
            WHEN 'Interview' THEN 4
            WHEN 'Offer' THEN 5
            WHEN 'Hired' THEN 6
            WHEN 'Rejected' THEN 7
        END;
END;
$$ LANGUAGE plpgsql;


-- 9. Recreate Triggers
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 10. Recreate RLS Policies
-- USERS table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow admin full access" ON public.users FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- JOBS table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to manage" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- APPLICANTS table
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for portal" ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to manage" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- APPLICANT_NOTES table
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR/Recruiter/Interviewer to manage notes" ON public.applicant_notes FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

-- INTERVIEWS table
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interviewers can see their own interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "HR/Recruiter/Admin can manage interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- LEAVES table
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own leave" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (public.get_user_department(auth.uid()) = (SELECT u.department FROM public.users u WHERE u.id = leaves.user_id));
CREATE POLICY "HR/Admin can manage all leaves" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- LEAVE_BALANCES table
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admin can manage all balances" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- COMPANY_POSTS table
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all authenticated users" ON public.company_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR/Admins to manage posts" ON public.company_posts FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- KUDOS table
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read kudos" ON public.kudos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to give kudos" ON public.kudos FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- WEEKLY_AWARDS table
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read weekly awards" ON public.weekly_awards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow managers/HR/admins to give awards" ON public.weekly_awards FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- PAYSLIPS table
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admin can manage all payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- COMPANY_DOCUMENTS table
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read" ON public.company_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR/Admins can manage documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- OBJECTIVES and KEY_RESULTS tables
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own objectives" ON public.objectives FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Managers can view their team's objectives" ON public.objectives FOR SELECT USING (public.get_user_department(auth.uid()) = (SELECT u.department FROM public.users u WHERE u.id = objectives.owner_id));
CREATE POLICY "HR/Admin can manage all objectives" ON public.objectives FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage key results for their objectives" ON public.key_results FOR ALL USING ((SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid());

-- EXPENSE_REPORTS and EXPENSE_ITEMS tables
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can view their team's reports" ON public.expense_reports FOR SELECT USING (public.get_user_department(auth.uid()) = (SELECT u.department FROM public.users u WHERE u.id = expense_reports.user_id));
CREATE POLICY "Finance/HR/Admins can manage all reports" ON public.expense_reports FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items for their own reports" ON public.expense_items FOR ALL USING ((SELECT user_id FROM public.expense_reports WHERE id = expense_report_id) = auth.uid());

-- HELPDESK tables
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support staff can manage all tickets" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin'));

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL USING ((SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id) = auth.uid());
CREATE POLICY "Support staff can manage all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'support', 'it_admin'));


-- 11. Seed initial data if necessary (optional)
-- The seed.ts script can be used for more extensive seeding.
-- A minimal seed for essential lookups can go here if needed.
-- Example:
-- INSERT INTO public.some_lookup_table (name) VALUES ('Default') ON CONFLICT DO NOTHING;


COMMIT;

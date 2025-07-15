
-- Full reset of the database schema
-- This script is designed to be idempotent and can be run multiple times safely.

-- 1. Drop dependent objects first, in the correct order.
-- Drop all policies on tables. "IF EXISTS" prevents errors if the policy isn't there.
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Enable all access for admin and super_hr" ON public.users;
DROP POLICY IF EXISTS "Allow admin and HR to manage applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow individual read access for applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow admin and HR to manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow all users to read open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow admin and HR to manage onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow employees to see their own onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow admin and HR to manage performance reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow employees and managers to see relevant reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow employees to manage their own leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;
DROP POLICY IF EXISTS "HR and Admins can see all leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Enable all access for admin and super_hr" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow employees to see their own balance" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow admin, super_hr, hr_manager, recruiter to manage colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow all authenticated users to read colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow admin, HR to add notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow relevant users to read notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow schedulers to manage interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow participants to view their interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow admin and HR to post" ON public.company_posts;
DROP POLICY IF EXISTS "Allow all users to read company posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow users to give kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow all users to read kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow managers and HR to give weekly awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow all users to read weekly awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow all users to read company documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow admin and HR to manage documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow employees to read their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow admin and HR to manage payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow owners or admins/HR to manage objectives" ON public.objectives;
DROP POLICY IF EXISTS "Allow owners or admins/HR to manage key results" ON public.key_results;
DROP POLICY IF EXISTS "Enable all access for admin, super_hr, finance" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow employees to manage their own expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Managers can see their team's expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Enable all access for admin, super_hr, finance" ON public.expense_items;
DROP POLICY IF EXISTS "Enable read access for report owners" ON public.expense_items;
DROP POLICY IF EXISTS "Enable all access for support roles" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow users to manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Enable all access for support roles" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow ticket participants to manage comments" ON public.ticket_comments;

-- 2. Drop all tables. "IF EXISTS" and "CASCADE" handle dependencies gracefully.
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.objectives CASCADE;
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.company_documents CASCADE;
DROP TABLE IF EXISTS public.weekly_awards CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;


-- 3. Drop all custom types. These are now safe to drop.
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.applicant_stage CASCADE;
DROP TYPE IF EXISTS public.applicant_source CASCADE;
DROP TYPE IF EXISTS public.onboarding_status CASCADE;
DROP TYPE IF EXISTS public.review_status CASCADE;
DROP TYPE IF EXISTS public.leave_type CASCADE;
DROP TYPE IF EXISTS public.leave_status CASCADE;
DROP TYPE IF EXISTS public.college_status CASCADE;
DROP TYPE IF EXISTS public.interview_type CASCADE;
DROP TYPE IF EXISTS public.interview_status CASCADE;
DROP TYPE IF EXISTS public.key_result_status CASCADE;
DROP TYPE IF EXISTS public.expense_report_status CASCADE;
DROP TYPE IF EXISTS public.ticket_status CASCADE;
DROP TYPE IF EXISTS public.ticket_priority CASCADE;
DROP TYPE IF EXISTS public.ticket_category CASCADE;

-- 4. Recreate all types
CREATE TYPE public.user_role AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual', 'referral');
CREATE TYPE public.onboarding_status AS ENUM ('Not Started', 'In Progress', 'Completed');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.key_result_status AS ENum ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');


-- 5. Recreate all tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest'::user_role NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE public.users IS 'Stores public user profile information.';

-- Add phone column if it doesn't exist. This is the specific change requested.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN DEFAULT FALSE;


CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status NOT NULL,
  posted_date DATE NOT NULL,
  applicants INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  stage applicant_stage NOT NULL,
  applied_date DATE NOT NULL,
  avatar TEXT,
  source applicant_source,
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

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    start_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_step TEXT DEFAULT 'Welcome Email Sent'
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  status review_status NOT NULL,
  job_title TEXT
);

CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status leave_status NOT NULL,
  total_days INTEGER NOT NULL,
  approver_id uuid REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave INTEGER DEFAULT 12,
  casual_leave INTEGER DEFAULT 12,
  earned_leave INTEGER DEFAULT 12,
  unpaid_leave INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INTEGER DEFAULT 0,
    contact_email TEXT UNIQUE,
    last_contacted DATE
);

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type interview_type NOT NULL,
    status interview_status NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_avatar TEXT,
    interviewer_name TEXT NOT NULL,
    interviewer_avatar TEXT,
    job_title TEXT NOT NULL
);

CREATE TABLE public.company_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kudos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.weekly_awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.company_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    last_updated DATE NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.payslips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    gross_salary NUMERIC(10, 2) NOT NULL,
    net_salary NUMERIC(10, 2) NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  status key_result_status NOT NULL
);

CREATE TABLE public.expense_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status expense_report_status NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT
);

CREATE TABLE public.helpdesk_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  status ticket_status NOT NULL DEFAULT 'Open',
  priority ticket_priority NOT NULL DEFAULT 'Medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create functions. These must be created after tables they reference.
-- Note: Security definer functions run with the permissions of the user who created them (the service_role key).
-- This allows them to query tables that the calling user might not have direct access to.

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
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

CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
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
        SELECT applicants.stage, COUNT(*) as count
        FROM applicants
        GROUP BY applicants.stage
    ) AS a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;


-- This function runs as a trigger whenever a new user is created in the auth.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a corresponding public profile
  INSERT INTO public.users (id, full_name, email, avatar_url, role, department)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'department'
  );
  
  -- Create a default leave balance for the new user
  INSERT INTO public.leave_balances(user_id)
  VALUES(new.id);

  RETURN new;
END;
$$;


-- 7. Create triggers
-- This trigger calls the handle_new_user function when a new user signs up.
-- Checks if the trigger exists before creating it.
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

-- 8. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;


-- 9. Create all security policies
-- Policies for 'users' table
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable all access for admin and super_hr" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));

-- Policies for 'applicants' table
CREATE POLICY "Allow admin and HR to manage applicants" ON public.applicants FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow individual read access for applicants" ON public.applicants FOR SELECT USING (auth.email() = email);

-- Policies for 'jobs' table
CREATE POLICY "Allow admin and HR to manage jobs" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow all users to read open jobs" ON public.jobs FOR SELECT USING (status = 'Open');

-- Policies for 'onboarding_workflows'
CREATE POLICY "Allow admin and HR to manage onboarding" ON public.onboarding_workflows FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow employees to see their own onboarding" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'performance_reviews'
CREATE POLICY "Allow admin and HR to manage performance reviews" ON public.performance_reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow employees and managers to see relevant reviews" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id OR user_id IN (SELECT id FROM public.users WHERE department = public.get_user_department(auth.uid()) AND public.get_user_role(auth.uid()) IN ('manager', 'team_lead')));

-- Policies for 'leaves'
CREATE POLICY "Allow employees to manage their own leaves" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND department = public.get_user_department(auth.uid()));
CREATE POLICY "HR and Admins can see all leave requests" ON public.leaves FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for 'leave_balances'
CREATE POLICY "Enable all access for admin and super_hr" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));
CREATE POLICY "Allow employees to see their own balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

-- Policies for 'colleges'
CREATE POLICY "Allow admin, super_hr, hr_manager, recruiter to manage colleges" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow all authenticated users to read colleges" ON public.colleges FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'applicant_notes'
CREATE POLICY "Allow admin, HR to add notes" ON public.applicant_notes FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "Allow relevant users to read notes" ON public.applicant_notes FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));

-- Policies for 'interviews'
CREATE POLICY "Allow schedulers to manage interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow participants to view their interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id OR auth.email() = (SELECT email FROM applicants WHERE id = applicant_id));

-- Policies for 'company_posts'
CREATE POLICY "Allow admin and HR to post" ON public.company_posts FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow all users to read company posts" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'kudos'
CREATE POLICY "Allow users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Allow all users to read kudos" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'weekly_awards'
CREATE POLICY "Allow managers and HR to give weekly awards" ON public.weekly_awards FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Allow all users to read weekly awards" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'company_documents'
CREATE POLICY "Allow all users to read company documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin and HR to manage documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for 'payslips'
CREATE POLICY "Allow employees to read their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow admin and HR to manage payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for 'objectives' and 'key_results'
CREATE POLICY "Allow owners or admins/HR to manage objectives" ON public.objectives FOR ALL USING (auth.uid() = owner_id OR public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow owners or admins/HR to manage key results" ON public.key_results FOR ALL USING (
    (SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid() 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

-- Policies for 'expense_reports' and 'expense_items'
CREATE POLICY "Enable all access for admin, super_hr, finance" ON public.expense_reports FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance', 'hr_manager'));
CREATE POLICY "Allow employees to manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their team's expense reports" ON public.expense_reports FOR SELECT USING (public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND user_id IN (SELECT id FROM public.users WHERE department = public.get_user_department(auth.uid())));

CREATE POLICY "Enable all access for admin, super_hr, finance" ON public.expense_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance', 'hr_manager'));
CREATE POLICY "Enable read access for report owners" ON public.expense_items FOR SELECT USING ((SELECT user_id FROM public.expense_reports WHERE id = expense_report_id) = auth.uid());


-- Policies for 'helpdesk_tickets' and 'ticket_comments'
CREATE POLICY "Enable all access for support roles" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'it_admin', 'support'));
CREATE POLICY "Allow users to manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable all access for support roles" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'it_admin', 'support'));
CREATE POLICY "Allow ticket participants to manage comments" ON public.ticket_comments FOR ALL USING (
    auth.uid() = user_id OR
    (SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id) = auth.uid()
);

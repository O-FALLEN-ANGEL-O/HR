-- 🧹 Function Dropping: Drop functions first to remove dependencies
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid) CASCADE;

-- 🧹 Table Dropping: Drop all tables in a safe order
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
DROP TABLE IF EXISTS public.users CASCADE; -- Drop the public users profile table

-- 🧹 Type Dropping: Drop ENUM types last
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

-- ✅ Type Creation: Recreate all ENUM types
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

-- 🏗️ Table Creation

-- users Table for public profiles
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  avatar_url text,
  role user_role DEFAULT 'guest',
  department text,
  created_at timestamptz DEFAULT now()
);

-- leave_balances Table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave integer NOT NULL DEFAULT 12,
  casual_leave integer NOT NULL DEFAULT 12,
  earned_leave integer NOT NULL DEFAULT 12,
  unpaid_leave integer NOT NULL DEFAULT 0
);

-- leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status leave_status NOT NULL DEFAULT 'pending',
  approver_id uuid REFERENCES public.users(id),
  total_days integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- onboarding_workflows Table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.users(id),
  buddy_id uuid REFERENCES public.users(id),
  employee_name text,
  employee_avatar text,
  job_title text,
  manager_name text,
  buddy_name text,
  start_date date NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  current_step text DEFAULT 'Initial Setup'
);

-- jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  description text,
  status job_status NOT NULL DEFAULT 'Open',
  posted_date timestamptz DEFAULT now(),
  applicants integer DEFAULT 0
);

-- colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status college_status NOT NULL DEFAULT 'Invited',
  resumes_received integer DEFAULT 0,
  contact_email text,
  last_contacted date
);

-- applicants Table
CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
  stage applicant_stage NOT NULL DEFAULT 'Applied',
  source applicant_source,
  applied_date timestamptz DEFAULT now(),
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

-- applicant_notes Table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  author_name text,
  author_avatar text,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  type interview_type NOT NULL,
  status interview_status NOT NULL DEFAULT 'Scheduled',
  candidate_name text,
  candidate_avatar text,
  interviewer_name text,
  interviewer_avatar text,
  job_title text
);

-- company_posts Table
CREATE TABLE IF NOT EXISTS public.company_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- kudos Table
CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- weekly_awards Table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  week_of date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  gross_salary numeric(10, 2) NOT NULL,
  net_salary numeric(10, 2) NOT NULL,
  download_url text
);

-- company_documents Table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  last_updated date,
  download_url text
);

-- objectives Table
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  quarter text NOT NULL
);

-- key_results Table
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description text NOT NULL,
  progress integer DEFAULT 0,
  status key_result_status DEFAULT 'on_track'
);

-- expense_reports Table
CREATE TABLE IF NOT EXISTS public.expense_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  status expense_status DEFAULT 'submitted',
  submitted_at timestamptz DEFAULT now()
);

-- expense_items Table
CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date date,
  category text,
  amount numeric(10, 2),
  description text
);

-- helpdesk_tickets Table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  category ticket_category,
  status ticket_status DEFAULT 'Open',
  priority ticket_priority DEFAULT 'Medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolver_id uuid REFERENCES public.users(id)
);

-- ticket_comments Table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 🛡️ Function Creation (Moved to the end)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;

-- 🔐 Row Level Security (RLS) Policies

-- users Table Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own profile" ON "public"."users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON "public"."users" FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin full access to users" ON "public"."users" FOR ALL USING ((public.get_user_role(auth.uid()) = 'admin'::text)) WITH CHECK ((public.get_user_role(auth.uid()) = 'admin'::text));
CREATE POLICY "Allow HR Manager to view all users" ON "public"."users" FOR SELECT USING (((public.get_user_role(auth.uid()) = 'hr_manager'::text) OR (public.get_user_role(auth.uid()) = 'super_hr'::text)));

-- leaves Table Policies
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own leave requests" ON "public"."leaves" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins and HR can view all leave requests" ON "public"."leaves" FOR SELECT USING (((public.get_user_role(auth.uid()) = 'admin'::text) OR (public.get_user_role(auth.uid()) = 'super_hr'::text) OR (public.get_user_role(auth.uid()) = 'hr_manager'::text)));
CREATE POLICY "Managers can see their team's leave requests" ON "public"."leaves" FOR SELECT USING (EXISTS ( SELECT 1 FROM users WHERE users.id = leaves.user_id AND users.department = public.get_user_department(auth.uid())));
CREATE POLICY "Admins and managers can approve/reject leaves" ON "public"."leaves" FOR UPDATE USING (
    (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')) OR
    (
        (public.get_user_role(auth.uid()) IN ('manager', 'team_lead')) AND
        (EXISTS (SELECT 1 FROM users WHERE users.id = leaves.user_id AND users.department = public.get_user_department(auth.uid())))
    )
) WITH CHECK (
    (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')) OR
    (
        (public.get_user_role(auth.uid()) IN ('manager', 'team_lead')) AND
        (EXISTS (SELECT 1 FROM users WHERE users.id = leaves.user_id AND users.department = public.get_user_department(auth.uid())))
    )
);

-- jobs Table Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to open jobs" ON "public"."jobs" FOR SELECT USING (status = 'Open');
CREATE POLICY "Allow HR/Recruiters/Admins to manage jobs" ON "public"."jobs" FOR ALL USING ((public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'))) WITH CHECK ((public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));

-- applicants Table Policies
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR/Recruiters/Admins to manage applicants" ON "public"."applicants" FOR ALL USING ((public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'))) WITH CHECK ((public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));
CREATE POLICY "Allow applicants to view their own profile via portal link (basic)" ON "public"."applicants" FOR SELECT USING (true); -- A more secure version might use a token system

-- This will be executed by the trigger defined below
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, (new.raw_user_meta_data->>'role')::user_role, new.raw_user_meta_data->>'avatar_url');
  
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Trigger to copy new auth.users to public.users and create leave balance
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS for all other tables with a default deny policy (secure by default)
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own leave balances" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employee can view own onboarding" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manager/Buddy/HR can view relevant onboarding" ON public.onboarding_workflows FOR SELECT USING (
    auth.uid() = manager_id OR
    auth.uid() = buddy_id OR
    public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR/Recruiters can manage notes" ON public.applicant_notes FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interviewer can see their assigned interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "HR/Recruiters/Admins can manage interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read company posts" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "HR/Admins can create company posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated user can manage kudos" ON public.kudos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.uid() = from_user_id);

ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated user can read awards" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers/HR can give awards" ON public.weekly_awards FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can manage all payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated user can read documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Admins can manage documents" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own objectives" ON public.objectives FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "HR/Admins can see all objectives" ON public.objectives FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage key results for their objectives" ON public.key_results FOR ALL USING (EXISTS (SELECT 1 FROM objectives WHERE objectives.id = key_results.objective_id AND objectives.owner_id = auth.uid()));
CREATE POLICY "HR/Admins can see all key results" ON public.key_results FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Finance/Admins can manage all reports" ON public.expense_reports FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items for their own reports" ON public.expense_items FOR ALL USING (EXISTS (SELECT 1 FROM expense_reports WHERE expense_reports.id = expense_items.expense_report_id AND expense_reports.user_id = auth.uid()));
CREATE POLICY "Finance/Admins can manage all items" ON public.expense_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));

ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support/IT/Admins can manage all tickets" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin'));

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL USING (EXISTS (SELECT 1 FROM helpdesk_tickets WHERE helpdesk_tickets.id = ticket_comments.ticket_id AND helpdesk_tickets.user_id = auth.uid()));
CREATE POLICY "Support/IT/Admins can manage all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin'));

-- Set up cascade delete for auth.users
CREATE OR REPLACE FUNCTION public.delete_user_cascade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.delete_user_cascade();


-- Create a view for job funnel stats
CREATE OR REPLACE VIEW public.job_funnel_stats AS
SELECT
    stage,
    count(id) as count
FROM public.applicants
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'Sourced' THEN 1
        WHEN 'Applied' THEN 2
        WHEN 'Phone Screen' THEN 3
        WHEN 'Interview' THEN 4
        WHEN 'Offer' THEN 5
        WHEN 'Hired' THEN 6
        WHEN 'Rejected' THEN 7
        ELSE 8
    END;

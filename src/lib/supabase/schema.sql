-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS auth.get_user_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department CASCADE;

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

-- ✅ Recreate functions
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;

-- 📝 Create public.users table for profiles
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'guest'::user_role,
  department text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status job_status DEFAULT 'Open'::job_status NOT NULL,
    posted_date timestamptz DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);

-- 📝 Create Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status college_status DEFAULT 'Invited'::college_status NOT NULL,
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text NOT NULL,
    last_contacted timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Applicants Table
CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    stage applicant_stage DEFAULT 'Applied'::applicant_stage NOT NULL,
    applied_date timestamptz DEFAULT now() NOT NULL,
    avatar text,
    source applicant_source DEFAULT 'manual'::applicant_source,
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
    rejection_notes text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Applicant Notes Table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    time time NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'Scheduled'::interview_status NOT NULL,
    candidate_name text,
    candidate_avatar text,
    interviewer_name text,
    interviewer_avatar text,
    job_title text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Onboarding Workflows Table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text NOT NULL,
    buddy_name text,
    progress integer DEFAULT 0 NOT NULL,
    current_step text DEFAULT 'Pre-boarding'::text NOT NULL,
    start_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Leave Balances Table
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 12 NOT NULL,
    casual_leave integer DEFAULT 12 NOT NULL,
    earned_leave integer DEFAULT 12 NOT NULL,
    unpaid_leave integer DEFAULT 0 NOT NULL
);

-- 📝 Create Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status leave_status DEFAULT 'pending'::leave_status NOT NULL,
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    total_days integer NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);


-- 📝 Create Company Posts Table
CREATE TABLE IF NOT EXISTS public.company_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Kudos Table
CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Weekly Awards Table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10, 2) NOT NULL,
    net_salary numeric(10, 2) NOT NULL,
    download_url text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Company Documents Table
CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated date DEFAULT now() NOT NULL,
    download_url text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Objectives Table
CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Key Results Table
CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    status key_result_status DEFAULT 'on_track'::key_result_status NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Performance Reviews Table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  job_title text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Expense Reports Table
CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status expense_status DEFAULT 'submitted'::expense_status NOT NULL,
    submitted_at timestamptz DEFAULT now() NOT NULL,
    approved_at timestamptz,
    reimbursed_at timestamptz,
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Expense Items Table
CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Helpdesk Tickets Table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category ticket_category NOT NULL,
    status ticket_status DEFAULT 'Open'::ticket_status NOT NULL,
    priority ticket_priority DEFAULT 'Medium'::ticket_priority NOT NULL,
    resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 📝 Create Ticket Comments Table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

----------------------------------------------------
--                ROW LEVEL SECURITY                --
----------------------------------------------------

-- 🔒 Secure users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow individual user update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 🔒 Secure jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- 🔒 Secure colleges table
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to manage colleges" ON public.colleges FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- 🔒 Secure applicants table
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access for applicants" ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to manage applicants" ON public.applicants FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- 🔒 Secure applicant_notes table
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authorized users to see notes" ON public.applicant_notes FOR SELECT USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer'));
CREATE POLICY "Allow authorized users to add notes" ON public.applicant_notes FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer'));

-- 🔒 Secure interviews table
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow participants to see their interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id OR auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow HR/Recruiter/Admin to manage interviews" ON public.interviews FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- 🔒 Secure leave_balances table
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to see their own balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin to see all balances" ON public.leave_balances FOR SELECT USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager'));

-- 🔒 Secure leaves table
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own leave" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin/Manager to see team/all leaves" ON public.leaves FOR SELECT USING (
    auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager') OR
    (auth.jwt()->>'role' IN ('manager', 'team_lead') AND department = public.get_user_department(user_id))
);
CREATE POLICY "Allow Manager/HR/Admin to approve leaves" ON public.leaves FOR UPDATE USING (
    auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager') OR
    (auth.jwt()->>'role' IN ('manager', 'team_lead') AND department = public.get_user_department(user_id))
) WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager') OR
    (auth.jwt()->>'role' IN ('manager', 'team_lead') AND department = public.get_user_department(user_id))
);

-- 🔒 Secure performance_reviews table
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to see their own reviews" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin/Manager to manage reviews" ON public.performance_reviews FOR ALL USING (
    auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager') OR
    (auth.jwt()->>'role' IN ('manager', 'team_lead') AND public.get_user_department(user_id) = (SELECT department FROM public.users WHERE id = auth.uid()))
);

-- 🔒 Secure company_posts table
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read posts" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to create posts" ON public.company_posts FOR INSERT WITH CHECK (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager'));

-- 🔒 Secure kudos table
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all kudos" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 🔒 Secure weekly_awards table
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all awards" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow managers/HR/Admins to give awards" ON public.weekly_awards FOR INSERT WITH CHECK (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- 🔒 Secure payslips table
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to see their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin to manage payslips" ON public.payslips FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager'));

-- 🔒 Secure company_documents table
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to manage documents" ON public.company_documents FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager'));

-- 🔒 Secure objectives table
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own objectives" ON public.objectives FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Allow HR/Admin/Manager to see all objectives" ON public.objectives FOR SELECT USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- 🔒 Secure key_results table
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage key results for their objectives" ON public.key_results FOR ALL USING (
  (SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid()
);
CREATE POLICY "Allow HR/Admin/Manager to see all key results" ON public.key_results FOR SELECT USING (auth.jwt()->>'role' IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- 🔒 Secure expense_reports table
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow finance/admin to manage all reports" ON public.expense_reports FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'finance'));

-- 🔒 Secure helpdesk_tickets table
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow support staff to manage all tickets" ON public.helpdesk_tickets FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'support', 'it_admin', 'super_hr'));

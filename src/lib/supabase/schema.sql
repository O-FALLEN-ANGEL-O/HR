-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS auth.get_user_role CASCADE;

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
DROP TABLE IF EXISTS public.performance_reviews CASCADE;


-- ❌ Drop ENUM types safely with CASCADE
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
DROP TYPE IF EXISTS public.review_status CASCADE;

-- ✅ Recreate ENUM types
CREATE TYPE public.user_role AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual', 'referral');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');

-- ----------------------------------------------------------------
-- 🏢 JOBS & APPLICANTS
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status job_status DEFAULT 'Open'::job_status NOT NULL,
    posted_date timestamp with time zone DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status college_status DEFAULT 'Invited'::college_status NOT NULL,
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text,
    last_contacted timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage applicant_stage DEFAULT 'Applied'::applicant_stage NOT NULL,
    source applicant_source DEFAULT 'manual'::applicant_source,
    applied_date timestamp with time zone DEFAULT now(),
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

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    date date NOT NULL,
    time time without time zone NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'Scheduled'::interview_status,
    candidate_name text,
    candidate_avatar text,
    interviewer_name text,
    interviewer_avatar text,
    job_title text,
    created_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------
-- 🌴 LEAVE MANAGEMENT
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 12,
    unpaid_leave integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status DEFAULT 'pending'::leave_status,
    approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    total_days integer NOT NULL
);

-- ----------------------------------------------------------------
-- 🚀 ONBOARDING & PERFORMANCE
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    buddy_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_name text,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text DEFAULT 'Initial Setup',
    start_date date DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_date date NOT NULL,
    status review_status DEFAULT 'Pending'::review_status,
    job_title text,
    review_text text,
    ratings jsonb,
    goals text,
    feedback text
);

CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0,
    status key_result_status DEFAULT 'on_track'::key_result_status
);


-- ----------------------------------------------------------------
-- 💬 COMPANY & EMPLOYEE ENGAGEMENT
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.company_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------
-- 📂 DOCUMENTS & FINANCIAL
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10, 2) NOT NULL,
    net_salary numeric(10, 2) NOT NULL,
    download_url text
);

CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    last_updated date DEFAULT now(),
    download_url text
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status expense_status DEFAULT 'submitted'::expense_status,
    submitted_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    description text
);

-- ----------------------------------------------------------------
-- 🎫 HELPDESK
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text,
    category ticket_category NOT NULL,
    status ticket_status DEFAULT 'Open'::ticket_status,
    priority ticket_priority DEFAULT 'Medium'::ticket_priority,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------
-- 🛡️ RLS POLICIES
-- ----------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- JOBS
CREATE POLICY "Allow read access to all authenticated users" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));

-- APPLICANTS
CREATE POLICY "Allow HR/Recruiter/Admin to manage applicants" ON public.applicants FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));
CREATE POLICY "Allow public insert for applicants" ON public.applicants FOR INSERT WITH CHECK (true); -- For registration form

-- APPLICANT NOTES
CREATE POLICY "Allow HR/Recruiter/Admin to manage applicant notes" ON public.applicant_notes FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')));
CREATE POLICY "Allow interviewers to read notes for their assigned applicants" ON public.applicant_notes FOR SELECT USING (
    applicant_id IN (SELECT applicant_id FROM interviews WHERE interviewer_id = auth.uid())
);

-- LEAVES
CREATE POLICY "Users can manage their own leave requests" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can read/update leave requests for their team" ON public.leaves FOR ALL USING (
  (get_user_department(auth.uid()) IS NOT NULL) AND
  (user_id IN (SELECT id FROM users WHERE department = get_user_department(auth.uid())))
);
CREATE POLICY "Admins/HR can manage all leave requests" ON public.leaves FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'super_hr', 'hr_manager')));

-- HELPDESK
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support staff can manage all tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'it_admin', 'support')));
CREATE POLICY "Users can read comments on their own tickets" ON public.ticket_comments FOR SELECT USING (ticket_id IN (SELECT id FROM helpdesk_tickets WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert comments on their own tickets" ON public.ticket_comments FOR INSERT WITH CHECK (ticket_id IN (SELECT id FROM helpdesk_tickets WHERE user_id = auth.uid()));
CREATE POLICY "Support staff can manage all comments" ON public.ticket_comments FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('admin', 'it_admin', 'support')));


-- ----------------------------------------------------------------
-- 📦 HELPER FUNCTIONS
-- ----------------------------------------------------------------

-- Function to get a user's department
CREATE OR REPLACE FUNCTION get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;

-- Function to get job funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint)
LANGUAGE sql
AS $$
    SELECT
        stage,
        COUNT(*) as count
    FROM
        public.applicants
    GROUP BY
        stage
    ORDER BY
        -- A bit of a hack to get a logical funnel order
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
$$;

-- ----------------------------------------------------------------
-- ✨ DONE
-- ----------------------------------------------------------------
-- Final sanity check
SELECT 'Database schema setup complete.' as status;

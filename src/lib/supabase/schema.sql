-- HR+ Platform Database Schema
-- This script is idempotent and can be run multiple times safely.
-- It will drop existing application-specific tables and recreate them.

-- Drop existing tables in reverse order of dependency to be safe
DROP TABLE IF EXISTS "public"."ticket_comments" CASCADE;
DROP TABLE IF EXISTS "public"."helpdesk_tickets" CASCADE;
DROP TABLE IF EXISTS "public"."expense_items" CASCADE;
DROP TABLE IF EXISTS "public"."expense_reports" CASCADE;
DROP TABLE IF EXISTS "public"."key_results" CASCADE;
DROP TABLE IF EXISTS "public"."objectives" CASCADE;
DROP TABLE IF EXISTS "public"."company_documents" CASCADE;
DROP TABLE IF EXISTS "public"."payslips" CASCADE;
DROP TABLE IF EXISTS "public"."weekly_awards" CASCADE;
DROP TABLE IF EXISTS "public"."kudos" CASCADE;
DROP TABLE IF EXISTS "public"."company_posts" CASCADE;
DROP TABLE IF EXISTS "public"."interviews" CASCADE;
DROP TABLE IF EXISTS "public"."applicant_notes" CASCADE;
DROP TABLE IF EXISTS "public"."applicants" CASCADE;
DROP TABLE IF EXISTS "public"."colleges" CASCADE;
DROP TABLE IF EXISTS "public"."jobs" CASCADE;
DROP TABLE IF EXISTS "public"."onboarding_workflows" CASCADE;
DROP TABLE IF EXISTS "public"."leaves" CASCADE;
DROP TABLE IF EXISTS "public"."leave_balances" CASCADE;

-- Drop existing types if they exist
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


-- Create ENUM types
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 
    'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
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


-- Create Tables
CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    sick_leave integer NOT NULL DEFAULT 12,
    casual_leave integer NOT NULL DEFAULT 12,
    earned_leave integer NOT NULL DEFAULT 12,
    unpaid_leave integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status public.leave_status NOT NULL DEFAULT 'pending',
    approver_id uuid,
    total_days integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    manager_id uuid,
    buddy_id uuid,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0 NOT NULL,
    current_step text DEFAULT 'Welcome Email Sent' NOT NULL,
    start_date date NOT NULL
);

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status NOT NULL DEFAULT 'Open',
    posted_date date DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status public.college_status NOT NULL DEFAULT 'Invited',
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text,
    last_contacted date
);

CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text NOT NULL,
    job_id uuid,
    college_id uuid,
    stage public.applicant_stage NOT NULL DEFAULT 'Applied',
    applied_date date NOT NULL,
    avatar text,
    source public.applicant_source,
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

CREATE TABLE public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL,
    user_id uuid,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL,
    interviewer_id uuid NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status NOT NULL DEFAULT 'Scheduled',
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);

CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL,
    awarded_by_user_id uuid NOT NULL,
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10,2) NOT NULL,
    net_salary numeric(10,2) NOT NULL,
    download_url text NOT NULL
);

CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    last_updated date NOT NULL,
    download_url text NOT NULL
);

CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL,
    title text NOT NULL,
    quarter text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL,
    description text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    status public.key_result_status NOT NULL DEFAULT 'on_track'
);

CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    title text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.expense_status NOT NULL DEFAULT 'draft',
    submitted_at timestamp with time zone
);

CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text
);

CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL,
    status public.ticket_status NOT NULL DEFAULT 'Open',
    priority public.ticket_priority NOT NULL DEFAULT 'Medium',
    resolver_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add Foreign Key Constraints
ALTER TABLE public.leave_balances ADD CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_buddy_id_fkey FOREIGN KEY (buddy_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE SET NULL;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.company_posts ADD CONSTRAINT company_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_user_id_fkey FOREIGN KEY (awarded_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_by_user_id_fkey FOREIGN KEY (awarded_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payslips ADD CONSTRAINT payslips_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.objectives ADD CONSTRAINT objectives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.key_results ADD CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id) ON DELETE CASCADE;
ALTER TABLE public.expense_reports ADD CONSTRAINT expense_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expense_items ADD CONSTRAINT expense_items_expense_report_id_fkey FOREIGN KEY (expense_report_id) REFERENCES public.expense_reports(id) ON DELETE CASCADE;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_resolver_id_fkey FOREIGN KEY (resolver_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
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

-- Helper function to get user role from auth metadata
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
$$;

-- RLS Policies
-- General policy: Users can see all data in public tables
CREATE POLICY "Allow all users to read" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Allow all users to read" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Allow all users to read" ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Allow all users to read" ON public.company_documents FOR SELECT USING (true);

-- Users can manage their own data
CREATE POLICY "Users can manage their own leave balances" ON public.leave_balances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own leaves" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own onboarding" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own objectives" ON public.objectives FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can see their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own helpdesk tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);

-- Role-based policies
CREATE POLICY "HR can manage all leaves" ON public.leaves FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Managers can see their team's leaves" ON public.leaves FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE department = (SELECT department FROM public.users WHERE id = auth.uid()))
  AND auth.get_user_role() IN ('manager', 'team_lead')
);
CREATE POLICY "HR/Recruiters can see all applicants" ON public.applicants FOR SELECT USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR/Recruiters can manage jobs" ON public.jobs FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR can manage onboarding" ON public.onboarding_workflows FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "HR can manage Kudos" ON public.kudos FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "HR/Finance can manage expenses" ON public.expense_reports FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Support staff can manage tickets" ON public.helpdesk_tickets FOR ALL USING (auth.get_user_role() IN ('admin', 'super_hr', 'support', 'it_admin'));

-- Grant usage on schema to roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges to the postgres, anon, authenticated, and service_role roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Custom RPC function for dashboard stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stage::text,
        COALESCE(a.count, 0) as count
    FROM (
        VALUES
            ('Sourced'),
            ('Applied'),
            ('Phone Screen'),
            ('Interview'),
            ('Offer'),
            ('Hired')
    ) AS s(stage)
    LEFT JOIN (
        SELECT 
            stage,
            COUNT(*) as count
        FROM applicants
        GROUP BY stage
    ) AS a ON s.stage = a.stage::text;
END;
$$;

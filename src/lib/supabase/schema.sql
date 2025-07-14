-- HR+ Platform Database Schema
-- This script is idempotent and can be run multiple times safely.

-- =============================================
-- ========== ENUMERATED TYPES =================
-- =============================================
-- Drop existing types if they exist to avoid conflicts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE public.user_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        DROP TYPE public.job_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicant_stage') THEN
        DROP TYPE public.applicant_stage;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicant_source') THEN
        DROP TYPE public.applicant_source;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        DROP TYPE public.review_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
        DROP TYPE public.leave_type;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_request_status') THEN
        DROP TYPE public.leave_request_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'college_status') THEN
        DROP TYPE public.college_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_type') THEN
        DROP TYPE public.interview_type;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_status') THEN
        DROP TYPE public.interview_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'key_result_status') THEN
        DROP TYPE public.key_result_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_report_status') THEN
        DROP TYPE public.expense_report_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_category') THEN
        DROP TYPE public.ticket_category;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        DROP TYPE public.ticket_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        DROP TYPE public.ticket_priority;
    END IF;
END$$;

-- Create types
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager',
    'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- =============================================
-- =========== HELPER FUNCTIONS ================
-- =============================================
-- Function to get user role from auth metadata
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS public.user_role AS $$
DECLARE
  role_value text;
BEGIN
  SELECT raw_user_meta_data->>'role' INTO role_value
  FROM auth.users
  WHERE id = user_id;
  
  RETURN role_value::public.user_role;
EXCEPTION
  WHEN others THEN
    RETURN 'guest'::public.user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- ================ TABLES =====================
-- =============================================

-- Table: jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status NOT NULL DEFAULT 'Open',
    posted_date timestamp with time zone NOT NULL DEFAULT now(),
    applicants integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: colleges
CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status public.college_status NOT NULL DEFAULT 'Invited',
    resumes_received integer NOT NULL DEFAULT 0,
    contact_email text NOT NULL,
    last_contacted timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: applicants
CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    job_id uuid,
    college_id uuid,
    stage public.applicant_stage NOT NULL DEFAULT 'Applied',
    source public.applicant_source,
    applied_date timestamp with time zone NOT NULL DEFAULT now(),
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

-- Table: applicant_notes
CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: onboarding_workflows
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    manager_id uuid NOT NULL,
    buddy_id uuid,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    progress integer NOT NULL DEFAULT 0,
    current_step text NOT NULL DEFAULT 'Initial Setup'
);

-- Table: performance_reviews
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    review_date date NOT NULL,
    status public.review_status NOT NULL DEFAULT 'Pending',
    job_title text
);

-- Table: leave_balances
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    sick_leave integer NOT NULL DEFAULT 12,
    casual_leave integer NOT NULL DEFAULT 12,
    earned_leave integer NOT NULL DEFAULT 15,
    unpaid_leave integer NOT NULL DEFAULT 0
);

-- Table: leaves
CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL,
    reason text NOT NULL,
    status public.leave_request_status NOT NULL DEFAULT 'pending',
    approver_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: interviews
CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL,
    interviewer_id uuid NOT NULL,
    date date NOT NULL,
    time text NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status NOT NULL DEFAULT 'Scheduled',
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);

-- Table: company_posts
CREATE TABLE IF NOT EXISTS public.company_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: kudos
CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: weekly_awards
CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL,
    awarded_by_user_id uuid NOT NULL,
    reason text NOT NULL,
    week_of date NOT NULL
);

-- Table: payslips
CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10, 2) NOT NULL,
    net_salary numeric(10, 2) NOT NULL,
    download_url text NOT NULL
);

-- Table: company_documents
CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated timestamp with time zone NOT NULL DEFAULT now(),
    download_url text NOT NULL
);

-- Table: objectives
CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL,
    title text NOT NULL,
    quarter text NOT NULL
);

-- Table: key_results
CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL,
    description text NOT NULL,
    progress integer NOT NULL DEFAULT 0,
    status public.key_result_status NOT NULL DEFAULT 'on_track'
);

-- Table: expense_reports
CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    title text NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status public.expense_report_status NOT NULL DEFAULT 'draft',
    submitted_at timestamp with time zone
);

-- Table: expense_items
CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    description text
);

-- Table: helpdesk_tickets
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL,
    status public.ticket_status NOT NULL DEFAULT 'Open',
    priority public.ticket_priority NOT NULL DEFAULT 'Medium',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    resolver_id uuid
);

-- Table: ticket_comments
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- ====== FOREIGN KEY CONSTRAINTS ==============
-- =============================================

-- Drop constraints before adding them to ensure idempotency
ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_job_id_fkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;

ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_college_id_fkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE SET NULL;

ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_applicant_id_fkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;

ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_user_id_fkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_user_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_manager_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_buddy_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_buddy_id_fkey FOREIGN KEY (buddy_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.performance_reviews DROP CONSTRAINT IF EXISTS performance_reviews_user_id_fkey;
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_user_id_fkey;
ALTER TABLE public.leave_balances ADD CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_user_id_fkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_approver_id_fkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_applicant_id_fkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_interviewer_id_fkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.company_posts DROP CONSTRAINT IF EXISTS company_posts_user_id_fkey;
ALTER TABLE public.company_posts ADD CONSTRAINT company_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_from_user_id_fkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_to_user_id_fkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_awarded_user_id_fkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_user_id_fkey FOREIGN KEY (awarded_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_awarded_by_user_id_fkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_by_user_id_fkey FOREIGN KEY (awarded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.payslips DROP CONSTRAINT IF EXISTS payslips_user_id_fkey;
ALTER TABLE public.payslips ADD CONSTRAINT payslips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.objectives DROP CONSTRAINT IF EXISTS objectives_owner_id_fkey;
ALTER TABLE public.objectives ADD CONSTRAINT objectives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.key_results DROP CONSTRAINT IF EXISTS key_results_objective_id_fkey;
ALTER TABLE public.key_results ADD CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id) ON DELETE CASCADE;

ALTER TABLE public.expense_reports DROP CONSTRAINT IF EXISTS expense_reports_user_id_fkey;
ALTER TABLE public.expense_reports ADD CONSTRAINT expense_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.expense_items DROP CONSTRAINT IF EXISTS expense_items_expense_report_id_fkey;
ALTER TABLE public.expense_items ADD CONSTRAINT expense_items_expense_report_id_fkey FOREIGN KEY (expense_report_id) REFERENCES public.expense_reports(id) ON DELETE CASCADE;

ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_user_id_fkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_resolver_id_fkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_resolver_id_fkey FOREIGN KEY (resolver_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_fkey;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_user_id_fkey;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- =============================================
-- === ROW LEVEL SECURITY (RLS) & POLICIES =====
-- =============================================

-- ---- Jobs Table ----
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to update jobs" ON public.jobs;

CREATE POLICY "Allow public read access to jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);


-- ---- Colleges Table ----
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to manage colleges" ON public.colleges;
CREATE POLICY "Allow public read access to colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to manage colleges" ON public.colleges FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

-- ---- Applicants Table ----
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to see all applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow applicant to see their own profile" ON public.applicants;
DROP POLICY IF EXISTS "Allow anyone to create an applicant profile" ON public.applicants;
DROP POLICY IF EXISTS "Allow interviewers to see applicants they are interviewing" ON public.applicants;
CREATE POLICY "Allow HR/Recruiter/Admin to see all applicants" ON public.applicants FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
CREATE POLICY "Allow applicant to see their own profile" ON public.applicants FOR SELECT USING (id = (SELECT a.id FROM public.applicants a WHERE a.email = auth.email()));
CREATE POLICY "Allow anyone to create an applicant profile" ON public.applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow interviewers to see applicants they are interviewing" ON public.applicants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interviews i WHERE i.applicant_id = id AND i.interviewer_id = auth.uid()
  ));

-- ---- Applicant Notes ----
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow related users to view notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin/Interviewers to add notes" ON public.applicant_notes;
CREATE POLICY "Allow related users to view notes" ON public.applicant_notes FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')
);
CREATE POLICY "Allow HR/Recruiter/Admin/Interviewers to add notes" ON public.applicant_notes FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')
);


-- ---- Company Posts ----
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow logged-in users to read posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow HR/Admin to create posts" ON public.company_posts;
CREATE POLICY "Allow logged-in users to read posts" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to create posts" ON public.company_posts FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);


-- ---- Kudos & Awards ----
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow logged-in users to read kudos and awards" ON public.kudos;
DROP POLICY IF EXISTS "Allow logged-in users to read kudos and awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow logged-in users to give kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow managers/HR/admin to give awards" ON public.weekly_awards;
CREATE POLICY "Allow logged-in users to read kudos and awards" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow logged-in users to read kudos and awards" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow logged-in users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND from_user_id = auth.uid());
CREATE POLICY "Allow managers/HR/admin to give awards" ON public.weekly_awards FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead') AND awarded_by_user_id = auth.uid()
);


-- ---- Leaves & Balances ----
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees can view their own balance" ON public.leave_balances;
DROP POLICY IF EXISTS "HR can view all balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Employees can manage their own leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their teams leave requests" ON public.leaves;
DROP POLICY IF EXISTS "HR/Admin can see all leave requests" ON public.leaves;
CREATE POLICY "Employees can view their own balance" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "HR can view all balances" ON public.leave_balances FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Employees can manage their own leave requests" ON public.leaves FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Managers can see their teams leave requests" ON public.leaves FOR SELECT USING (
    (public.get_user_role(auth.uid()) IN ('manager', 'team_lead')) AND
    (SELECT department FROM public.users WHERE id = auth.uid()) = (SELECT department FROM public.users WHERE id = user_id)
);
CREATE POLICY "HR/Admin can see all leave requests" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- ---- Documents & Payslips (Personal Data) ----
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow logged-in users to read company documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow employees to view their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow HR/Admin to manage documents and payslips" ON public.company_documents;
DROP POLICY IF EXISTS "Allow HR/Admin to manage documents and payslips" ON public.payslips;
CREATE POLICY "Allow logged-in users to read company documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow employees to view their own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow HR/Admin to manage documents and payslips" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow HR/Admin to manage documents and payslips" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- ---- Performance (OKRs & Reviews) ----
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own objectives and key results" ON public.objectives;
DROP POLICY IF EXISTS "Users can manage their own objectives and key results" ON public.key_results;
DROP POLICY IF EXISTS "Users can view their own performance reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Managers/HR can manage performance data" ON public.objectives;
DROP POLICY IF EXISTS "Managers/HR can manage performance data" ON public.key_results;
DROP POLICY IF EXISTS "Managers/HR can manage performance data" ON public.performance_reviews;
CREATE POLICY "Users can manage their own objectives and key results" ON public.objectives FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users can manage their own objectives and key results" ON public.key_results FOR ALL USING ((SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid());
CREATE POLICY "Users can view their own performance reviews" ON public.performance_reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Managers/HR can manage performance data" ON public.objectives FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));
CREATE POLICY "Managers/HR can manage performance data" ON public.key_results FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));
CREATE POLICY "Managers/HR can manage performance data" ON public.performance_reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));

-- ---- Expenses ----
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Finance/Admins can see all expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Users can manage items for their own reports" ON public.expense_items;
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Finance/Admins can see all expense reports" ON public.expense_reports FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can manage items for their own reports" ON public.expense_items FOR ALL USING ((SELECT user_id FROM public.expense_reports WHERE id = expense_report_id) = auth.uid());


-- ---- Helpdesk ----
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Support staff can manage all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can manage comments on their own tickets" ON public.ticket_comments;
DROP POLICY IF EXISTS "Support staff can manage all comments" ON public.ticket_comments;
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Support staff can manage all tickets" ON public.helpdesk_tickets FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'it_admin', 'support', 'hr_manager'));
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL USING ((SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id) = auth.uid());
CREATE POLICY "Support staff can manage all comments" ON public.ticket_comments FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'it_admin', 'support', 'hr_manager'));

-- =============================================
-- === FUNCTIONS FOR AGGREGATE DATA ============
-- =============================================
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage text, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stage::text,
        COALESCE(a.count, 0) as count
    FROM 
        (VALUES 
            ('Applied'), 
            ('Phone Screen'), 
            ('Interview'), 
            ('Offer'), 
            ('Hired')
        ) AS s(stage)
    LEFT JOIN 
        (SELECT 
             stage, 
             count(*) as count 
         FROM 
             public.applicants 
         GROUP BY 
             stage
        ) AS a 
    ON 
        s.stage = a.stage::text
    ORDER BY
        CASE s.stage
            WHEN 'Applied' THEN 1
            WHEN 'Phone Screen' THEN 2
            WHEN 'Interview' THEN 3
            WHEN 'Offer' THEN 4
            WHEN 'Hired' THEN 5
        END;
END;
$$ LANGUAGE plpgsql;

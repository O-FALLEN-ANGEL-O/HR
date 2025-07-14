
-- Custom Types
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);

DROP TYPE IF EXISTS public.job_status CASCADE;
CREATE TYPE public.job_status AS ENUM (
    'Open', 'Closed', 'On hold'
);

DROP TYPE IF EXISTS public.applicant_stage CASCADE;
CREATE TYPE public.applicant_stage AS ENUM (
    'Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'
);

DROP TYPE IF EXISTS public.applicant_source CASCADE;
CREATE TYPE public.applicant_source AS ENUM (
    'walk-in', 'college', 'email', 'manual'
);

DROP TYPE IF EXISTS public.college_status CASCADE;
CREATE TYPE public.college_status AS ENUM (
    'Invited', 'Confirmed', 'Attended', 'Declined'
);

DROP TYPE IF EXISTS public.interview_type CASCADE;
CREATE TYPE public.interview_type AS ENUM (
    'Video', 'Phone', 'In-person'
);

DROP TYPE IF EXISTS public.interview_status CASCADE;
CREATE TYPE public.interview_status AS ENUM (
    'Scheduled', 'Completed', 'Canceled'
);

DROP TYPE IF EXISTS public.leave_type CASCADE;
CREATE TYPE public.leave_type AS ENUM (
    'sick', 'casual', 'earned', 'unpaid'
);

DROP TYPE IF EXISTS public.leave_status CASCADE;
CREATE TYPE public.leave_status AS ENUM (
    'pending', 'approved', 'rejected'
);

DROP TYPE IF EXISTS public.performance_review_status CASCADE;
CREATE TYPE public.performance_review_status AS ENUM (
    'Pending', 'In Progress', 'Completed'
);

DROP TYPE IF EXISTS public.key_result_status CASCADE;
CREATE TYPE public.key_result_status AS ENUM (
    'on_track', 'at_risk', 'off_track'
);

DROP TYPE IF EXISTS public.expense_report_status CASCADE;
CREATE TYPE public.expense_report_status AS ENUM (
    'draft', 'submitted', 'approved', 'rejected', 'reimbursed'
);

DROP TYPE IF EXISTS public.helpdesk_ticket_category CASCADE;
CREATE TYPE public.helpdesk_ticket_category AS ENUM (
    'IT', 'HR', 'Finance', 'General'
);

DROP TYPE IF EXISTS public.helpdesk_ticket_status CASCADE;
CREATE TYPE public.helpdesk_ticket_status AS ENUM (
    'Open', 'In Progress', 'Resolved', 'Closed'
);

DROP TYPE IF EXISTS public.helpdesk_ticket_priority CASCADE;
CREATE TYPE public.helpdesk_ticket_priority AS ENUM (
    'Low', 'Medium', 'High', 'Urgent'
);

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    role public.user_role DEFAULT 'guest'::public.user_role,
    department text,
    created_at timestamp with time zone not null default now(),
    email character varying
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    department character varying NOT NULL,
    description text,
    status public.job_status DEFAULT 'Open'::public.job_status NOT NULL,
    posted_date date NOT NULL,
    applicants integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    status public.college_status DEFAULT 'Invited'::public.college_status,
    resumes_received integer DEFAULT 0,
    contact_email character varying,
    last_contacted date
);

CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    job_id uuid,
    stage public.applicant_stage DEFAULT 'Applied'::public.applicant_stage,
    applied_date date NOT NULL,
    avatar character varying,
    source public.applicant_source DEFAULT 'manual'::public.applicant_source,
    college_id uuid,
    resume_data jsonb,
    ai_match_score integer,
    ai_justification text,
    wpm integer,
    accuracy integer,
    aptitude_score integer,
    rejection_reason text,
    rejection_notes text,
    comprehensive_score integer,
    english_grammar_score integer,
    customer_service_score integer
);

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    applicant_id uuid NOT NULL,
    user_id uuid,
    author_name character varying NOT NULL,
    author_avatar character varying,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    applicant_id uuid NOT NULL,
    interviewer_id uuid,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status DEFAULT 'Scheduled'::public.interview_status NOT NULL,
    candidate_name character varying NOT NULL,
    candidate_avatar character varying,
    interviewer_name character varying NOT NULL,
    interviewer_avatar character varying,
    job_title character varying
);


CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status public.leave_status DEFAULT 'pending'::public.leave_status,
    approver_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    total_days integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 12,
    unpaid_leave integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    manager_id uuid NOT NULL,
    buddy_id uuid,
    progress integer DEFAULT 0,
    current_step text DEFAULT 'Initial Setup'::text,
    start_date date NOT NULL,
    employee_name character varying,
    employee_avatar character varying,
    job_title character varying,
    manager_name character varying,
    buddy_name character varying
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    review_date date,
    status public.performance_review_status,
    job_title text
);

CREATE TABLE IF NOT EXISTS public.company_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid,
    to_user_id uuid,
    value text,
    message text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    awarded_user_id uuid,
    awarded_by_user_id uuid,
    reason text,
    week_of date
);

CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    month text,
    year integer,
    gross_salary numeric,
    net_salary numeric,
    download_url text
);

CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    description text,
    category text,
    last_updated date,
    download_url text
);

CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    title text,
    quarter text
);

CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    objective_id uuid,
    description text,
    progress integer,
    status public.key_result_status
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text,
    total_amount numeric,
    status public.expense_report_status,
    submitted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_report_id uuid,
    date date,
    category text,
    amount numeric,
    description text
);

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    subject text,
    description text,
    category public.helpdesk_ticket_category,
    status public.helpdesk_ticket_status,
    priority public.helpdesk_ticket_priority,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid,
    user_id uuid,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);

-- Primary Keys
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);

ALTER TABLE public.colleges DROP CONSTRAINT IF EXISTS colleges_pkey;
ALTER TABLE public.colleges ADD CONSTRAINT colleges_pkey PRIMARY KEY (id);

ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_pkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_pkey PRIMARY KEY (id);

ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_pkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_pkey PRIMARY KEY (id);

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_pkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);

ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_pkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);

ALTER TABLE public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_pkey;
ALTER TABLE public.leave_balances ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_pkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_pkey PRIMARY KEY (id);

ALTER TABLE public.performance_reviews DROP CONSTRAINT IF EXISTS performance_reviews_pkey;
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);

ALTER TABLE public.company_posts DROP CONSTRAINT IF EXISTS company_posts_pkey;
ALTER TABLE public.company_posts ADD CONSTRAINT company_posts_pkey PRIMARY KEY (id);

ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_pkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_pkey PRIMARY KEY (id);

ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_pkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_pkey PRIMARY KEY (id);

ALTER TABLE public.payslips DROP CONSTRAINT IF EXISTS payslips_pkey;
ALTER TABLE public.payslips ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);

ALTER TABLE public.company_documents DROP CONSTRAINT IF EXISTS company_documents_pkey;
ALTER TABLE public.company_documents ADD CONSTRAINT company_documents_pkey PRIMARY KEY (id);

ALTER TABLE public.objectives DROP CONSTRAINT IF EXISTS objectives_pkey;
ALTER TABLE public.objectives ADD CONSTRAINT objectives_pkey PRIMARY KEY (id);

ALTER TABLE public.key_results DROP CONSTRAINT IF EXISTS key_results_pkey;
ALTER TABLE public.key_results ADD CONSTRAINT key_results_pkey PRIMARY KEY (id);

ALTER TABLE public.expense_reports DROP CONSTRAINT IF EXISTS expense_reports_pkey;
ALTER TABLE public.expense_reports ADD CONSTRAINT expense_reports_pkey PRIMARY KEY (id);

ALTER TABLE public.expense_items DROP CONSTRAINT IF EXISTS expense_items_pkey;
ALTER TABLE public.expense_items ADD CONSTRAINT expense_items_pkey PRIMARY KEY (id);

ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_pkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_pkey PRIMARY KEY (id);

ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_pkey;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_job_id_fkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_college_id_fkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_college_id_fkey FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL;

ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_applicant_id_fkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE;

ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_user_id_fkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_applicant_id_fkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE;

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_interviewer_id_fkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_user_id_fkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_approver_id_fkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_user_id_fkey;
ALTER TABLE public.leave_balances ADD CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_user_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_manager_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_buddy_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_buddy_id_fkey FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.performance_reviews DROP CONSTRAINT IF EXISTS performance_reviews_user_id_fkey;
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.company_posts DROP CONSTRAINT IF EXISTS company_posts_user_id_fkey;
ALTER TABLE public.company_posts ADD CONSTRAINT company_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_from_user_id_fkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_to_user_id_fkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_awarded_user_id_fkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_user_id_fkey FOREIGN KEY (awarded_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_awarded_by_user_id_fkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_by_user_id_fkey FOREIGN KEY (awarded_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.payslips DROP CONSTRAINT IF EXISTS payslips_user_id_fkey;
ALTER TABLE public.payslips ADD CONSTRAINT payslips_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.objectives DROP CONSTRAINT IF EXISTS objectives_owner_id_fkey;
ALTER TABLE public.objectives ADD CONSTRAINT objectives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.key_results DROP CONSTRAINT IF EXISTS key_results_objective_id_fkey;
ALTER TABLE public.key_results ADD CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE;

ALTER TABLE public.expense_reports DROP CONSTRAINT IF EXISTS expense_reports_user_id_fkey;
ALTER TABLE public.expense_reports ADD CONSTRAINT expense_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public.expense_items DROP CONSTRAINT IF EXISTS expense_items_expense_report_id_fkey;
ALTER TABLE public.expense_items ADD CONSTRAINT expense_items_expense_report_id_fkey FOREIGN KEY (expense_report_id) REFERENCES expense_reports(id) ON DELETE CASCADE;

ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_user_id_fkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_resolver_id_fkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_resolver_id_fkey FOREIGN KEY (resolver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_ticket_id_fkey;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_user_id_fkey;
ALTER TABLE public.ticket_comments ADD CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, role, department, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    NEW.raw_user_meta_data->>'department',
    NEW.email
  );
  
  INSERT INTO public.leave_balances (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      unnest(enum_range(NULL::public.applicant_stage))::text as stage,
      COUNT(a.id) as count
    FROM unnest(enum_range(NULL::public.applicant_stage)) s(stage)
    LEFT JOIN public.applicants a ON a.stage = s.stage
    GROUP BY s.stage
    ORDER BY array_position(enum_range(NULL::public.applicant_stage), s.stage);
END;
$$;

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to see all users" ON public.users;
CREATE POLICY "Allow all users to see all users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin/super_hr to manage users" ON public.users;
CREATE POLICY "Allow admin/super_hr to manage users" ON public.users FOR ALL
  USING ((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr'))
  WITH CHECK ((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr'));


ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to see jobs" ON public.jobs;
CREATE POLICY "Allow all users to see jobs" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to create jobs" ON public.jobs;
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT 
  WITH CHECK (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to update jobs" ON public.jobs;
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));


ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin/Manager to see applicants" ON public.applicants;
CREATE POLICY "Allow HR/Recruiter/Admin/Manager to see applicants" ON public.applicants FOR SELECT 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer')));
DROP POLICY IF EXISTS "Allow public anonymous to create applicants" ON public.applicants;
CREATE POLICY "Allow public anonymous to create applicants" ON public.applicants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to update applicants" ON public.applicants;
CREATE POLICY "Allow HR/Recruiter/Admin to update applicants" ON public.applicants FOR UPDATE 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));


ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow relevant users to see notes" ON public.applicant_notes;
CREATE POLICY "Allow relevant users to see notes" ON public.applicant_notes FOR SELECT 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer')));
DROP POLICY IF EXISTS "Allow relevant users to create notes" ON public.applicant_notes;
CREATE POLICY "Allow relevant users to create notes" ON public.applicant_notes FOR INSERT 
  WITH CHECK (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer')));


ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow relevant users to see interviews" ON public.interviews;
CREATE POLICY "Allow relevant users to see interviews" ON public.interviews FOR SELECT 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer')));
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to create interviews" ON public.interviews;
CREATE POLICY "Allow HR/Recruiter/Admin to create interviews" ON public.interviews FOR INSERT 
  WITH CHECK (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter')));
DROP POLICY IF EXISTS "Allow relevant users to update interviews" ON public.interviews;
CREATE POLICY "Allow relevant users to update interviews" ON public.interviews FOR UPDATE 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')));


ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own leave" ON public.leaves;
CREATE POLICY "Users can see their own leave" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Managers can see their team's leave" ON public.leaves;
CREATE POLICY "Managers can see their team's leave" ON public.leaves FOR SELECT 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('manager', 'team_lead') AND department = (SELECT department FROM public.users WHERE id = auth.uid())));
DROP POLICY IF EXISTS "Admin/HR can see all leave" ON public.leaves;
CREATE POLICY "Admin/HR can see all leave" ON public.leaves FOR SELECT USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')));
DROP POLICY IF EXISTS "Users can create their own leave" ON public.leaves;
CREATE POLICY "Users can create their own leave" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Managers and Admin/HR can update leave status" ON public.leaves;
CREATE POLICY "Managers and Admin/HR can update leave status" ON public.leaves FOR UPDATE USING (
  ((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')) OR
  ((SELECT auth.jwt()->>'user_role')::text IN ('manager', 'team_lead') AND approver_id = auth.uid())
) WITH CHECK (
  ((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')) OR
  ((SELECT auth.jwt()->>'user_role')::text IN ('manager', 'team_lead') AND approver_id = auth.uid())
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own leave balance" ON public.leave_balances;
CREATE POLICY "Users can see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin/HR can see all leave balances" ON public.leave_balances;
CREATE POLICY "Admin/HR can see all leave balances" ON public.leave_balances FOR SELECT USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')));


ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own onboarding" ON public.onboarding_workflows;
CREATE POLICY "Users can see their own onboarding" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id OR auth.uid() = manager_id OR auth.uid() = buddy_id);
DROP POLICY IF EXISTS "HR can see all onboarding" ON public.onboarding_workflows;
CREATE POLICY "HR can see all onboarding" ON public.onboarding_workflows FOR SELECT USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')));
DROP POLICY IF EXISTS "HR can manage onboarding" ON public.onboarding_workflows;
CREATE POLICY "HR can manage onboarding" ON public.onboarding_workflows FOR ALL 
  USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')))
  WITH CHECK (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')));


ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own reviews, managers see their team's" ON public.performance_reviews;
CREATE POLICY "Users see their own reviews, managers see their team's" ON public.performance_reviews FOR SELECT USING (
  auth.uid() = user_id OR
  ((SELECT auth.jwt()->>'user_role')::text IN ('manager', 'team_lead') AND (SELECT department FROM public.users WHERE id=user_id) = (SELECT department FROM public.users WHERE id=auth.uid()))
);
DROP POLICY IF EXISTS "HR/Admin see all reviews" ON public.performance_reviews;
CREATE POLICY "HR/Admin see all reviews" ON public.performance_reviews FOR SELECT USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')));
DROP POLICY IF EXISTS "HR/Admin/Managers can manage reviews" ON public.performance_reviews;
CREATE POLICY "HR/Admin/Managers can manage reviews" ON public.performance_reviews FOR ALL USING (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead')));

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to see all kudos" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to see company posts" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Allow HR/Admins to create posts" ON public.company_posts FOR INSERT WITH CHECK (((SELECT auth.jwt()->>'user_role')::text IN ('admin', 'super_hr', 'hr_manager')));

-- Unique constraint on leave balances
ALTER TABLE public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_user_id_key;
ALTER TABLE public.leave_balances ADD CONSTRAINT leave_balances_user_id_key UNIQUE (user_id);

-- Drop dependent objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid);
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- Drop policies if they exist
ALTER TABLE public.users DROP POLICY IF EXISTS "Allow individual read access";
ALTER TABLE public.users DROP POLICY IF EXISTS "Allow admin full access";
ALTER TABLE public.leaves DROP POLICY IF EXISTS "Employees can manage their own leave requests";
ALTER TABLE public.leaves DROP POLICY IF EXISTS "Managers can see their team''s leave requests";
ALTER TABLE public.leaves DROP POLICY IF EXISTS "HR can manage all leave requests";
ALTER TABLE public.leave_balances DROP POLICY IF EXISTS "Users can view their own leave balance";
ALTER TABLE public.leave_balances DROP POLICY IF EXISTS "HR can manage all leave balances";
ALTER TABLE public.applicant_notes DROP POLICY IF EXISTS "Allow insert for recruiters and HR";
ALTER TABLE public.applicant_notes DROP POLICY IF EXISTS "Allow read access for recruiters and HR";
ALTER TABLE public.interviews DROP POLICY IF EXISTS "Interviewers can see their assigned interviews";
ALTER TABLE public.interviews DROP POLICY IF EXISTS "Recruiters and HR can manage all interviews";

-- Drop tables if they exist
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.performance_reviews;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.assessments;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.users;

-- Drop types if they exist
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;
DROP TYPE IF EXISTS public.applicant_source;

-- 1. Create custom types
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');


-- 2. Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text NULL,
  avatar_url text NULL,
  email text NULL,
  role user_role NULL,
  department text NULL,
  phone text NULL,
  profile_setup_complete boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title character varying NOT NULL,
    department character varying NOT NULL,
    description text,
    status job_status NOT NULL,
    posted_date date NOT NULL,
    applicants integer DEFAULT 0,
    CONSTRAINT jobs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    status college_status NOT NULL,
    resumes_received integer DEFAULT 0,
    contact_email character varying NOT NULL,
    last_contacted timestamp with time zone NOT NULL,
    CONSTRAINT colleges_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying NOT NULL,
    job_id uuid,
    stage applicant_stage NOT NULL,
    applied_date date NOT NULL,
    avatar text,
    source applicant_source,
    college_id uuid,
    resume_data jsonb,
    ai_match_score numeric,
    ai_justification text,
    wpm integer,
    accuracy numeric,
    aptitude_score numeric,
    comprehensive_score numeric,
    english_grammar_score numeric,
    customer_service_score numeric,
    rejection_reason text,
    rejection_notes text,
    CONSTRAINT applicants_pkey PRIMARY KEY (id),
    CONSTRAINT applicants_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    CONSTRAINT applicants_college_id_fkey FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL,
    interviewer_id uuid NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    type interview_type NOT NULL,
    status interview_status NOT NULL,
    candidate_name character varying NOT NULL,
    candidate_avatar text,
    interviewer_name character varying NOT NULL,
    interviewer_avatar text,
    job_title character varying NOT NULL,
    CONSTRAINT interviews_pkey PRIMARY KEY (id),
    CONSTRAINT interviews_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    author_name character varying NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT applicant_notes_pkey PRIMARY KEY (id),
    CONSTRAINT applicant_notes_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    CONSTRAINT applicant_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    manager_id uuid NOT NULL,
    buddy_id uuid,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text DEFAULT 'Pending',
    start_date date NOT NULL,
    CONSTRAINT onboarding_workflows_pkey PRIMARY KEY (id),
    CONSTRAINT onboarding_workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT onboarding_workflows_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT onboarding_workflows_buddy_id_fkey FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    review_date date NOT NULL,
    status text DEFAULT 'Pending'::text,
    job_title text,
    CONSTRAINT performance_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 12,
    unpaid_leave integer DEFAULT 0,
    CONSTRAINT leave_balances_pkey PRIMARY KEY (id),
    CONSTRAINT leave_balances_user_id_key UNIQUE (user_id),
    CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status NOT NULL,
    approver_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    total_days integer NOT NULL,
    CONSTRAINT leaves_pkey PRIMARY KEY (id),
    CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT leaves_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    month character varying NOT NULL,
    year integer NOT NULL,
    gross_salary numeric NOT NULL,
    net_salary numeric NOT NULL,
    download_url text NOT NULL,
    CONSTRAINT payslips_pkey PRIMARY KEY (id),
    CONSTRAINT payslips_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text,
    last_updated timestamp with time zone DEFAULT now(),
    download_url text,
    CONSTRAINT company_documents_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kudos_pkey PRIMARY KEY (id),
    CONSTRAINT kudos_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT kudos_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    awarded_user_id uuid NOT NULL,
    awarded_by_user_id uuid NOT NULL,
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT weekly_awards_pkey PRIMARY KEY (id),
    CONSTRAINT weekly_awards_awarded_user_id_fkey FOREIGN KEY (awarded_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT weekly_awards_awarded_by_user_id_fkey FOREIGN KEY (awarded_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    title text NOT NULL,
    quarter text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT objectives_pkey PRIMARY KEY (id),
    CONSTRAINT objectives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    objective_id uuid NOT NULL,
    description text NOT NULL,
    progress integer DEFAULT 0,
    status key_result_status NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT key_results_pkey PRIMARY KEY (id),
    CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    total_amount numeric NOT NULL,
    status expense_status NOT NULL,
    submitted_at timestamp with time zone NOT NULL,
    CONSTRAINT expense_reports_pkey PRIMARY KEY (id),
    CONSTRAINT expense_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    expense_report_id uuid NOT NULL,
    date date NOT NULL,
    category text,
    amount numeric NOT NULL,
    description text,
    CONSTRAINT expense_items_pkey PRIMARY KEY (id),
    CONSTRAINT expense_items_expense_report_id_fkey FOREIGN KEY (expense_report_id) REFERENCES expense_reports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    subject text NOT NULL,
    description text,
    category ticket_category NOT NULL,
    status ticket_status DEFAULT 'Open'::ticket_status,
    priority ticket_priority DEFAULT 'Medium'::ticket_priority,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid,
    CONSTRAINT helpdesk_tickets_pkey PRIMARY KEY (id),
    CONSTRAINT helpdesk_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT helpdesk_tickets_resolver_id_fkey FOREIGN KEY (resolver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ticket_comments_pkey PRIMARY KEY (id),
    CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create Functions and Triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create a public user profile
  insert into public.users (id, full_name, avatar_url, email, role, department, profile_setup_complete)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'department',
    false -- Default to false for all new users
  );
  
  -- Create a leave balance entry
  insert into public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  values (new.id, 12, 12, 12, 0);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new user signs up in Auth
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
   ) THEN
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
   END IF;
END
$$;

create or replace function public.get_user_role(user_id uuid)
returns text
language plpgsql
as $$
declare
  user_role text;
begin
  select role::text into user_role from public.users where id = user_id;
  return user_role;
end;
$$;

create or replace function public.get_user_department(user_id uuid)
returns text
language plpgsql
as $$
declare
  user_department text;
begin
  select department into user_department from public.users where id = user_id;
  return user_department;
end;
$$;

create or replace function public.get_job_funnel_stats()
returns table(stage applicant_stage, count bigint)
language sql
as $$
  select stage, count(*)
  from applicants
  group by stage
  order by
    case stage
      when 'Sourced' then 1
      when 'Applied' then 2
      when 'Phone Screen' then 3
      when 'Interview' then 4
      when 'Offer' then 5
      when 'Hired' then 6
      when 'Rejected' then 7
    end;
$$;

-- 4. Enable RLS and Set up Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admin full access" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) = 'admin' OR public.get_user_role(auth.uid()) = 'super_hr');

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own leave requests" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their team''s leave requests" ON public.leaves FOR SELECT USING (public.get_user_department(auth.uid()) = (SELECT department FROM public.users WHERE id = leaves.user_id));
CREATE POLICY "HR can manage all leave requests" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('hr_manager', 'super_hr', 'admin'));

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can manage all leave balances" ON public.leave_balances FOR ALL USING (public.get_user_role(auth.uid()) IN ('hr_manager', 'super_hr', 'admin'));

ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for recruiters and HR" ON public.applicant_notes FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('recruiter', 'hr_manager', 'super_hr', 'admin', 'interviewer', 'manager'));
CREATE POLICY "Allow read access for recruiters and HR" ON public.applicant_notes FOR SELECT USING (public.get_user_role(auth.uid()) IN ('recruiter', 'hr_manager', 'super_hr', 'admin', 'interviewer', 'manager'));

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interviewers can see their assigned interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "Recruiters and HR can manage all interviews" ON public.interviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('recruiter', 'hr_manager', 'super_hr', 'admin'));

-- Set table-level privileges
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.users TO service_role;

GRANT SELECT ON TABLE public.jobs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.jobs TO service_role;

-- ... add grant statements for all other tables as needed ...
-- Example for leaves
GRANT SELECT ON TABLE public.leaves TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.leaves TO service_role;

-- Allow authenticated users to call RLS helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_department(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_funnel_stats() TO authenticated;

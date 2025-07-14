-- Drop existing types and functions first to avoid conflicts, in reverse order of dependency
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();
DROP TYPE IF EXISTS public.job_funnel_stat;

-- Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicant_stage') THEN
        CREATE TYPE public.applicant_stage AS ENUM (
            'Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicant_source') THEN
        CREATE TYPE public.applicant_source AS ENUM (
            'walk-in', 'college', 'email', 'manual'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE public.job_status AS ENUM (
            'Open', 'Closed', 'On hold'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'college_status') THEN
       CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_type') THEN
        CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_status') THEN
        CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
        CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
        CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'key_result_status') THEN
       CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_report_status') THEN
        CREATE TYPE public.expense_report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpdesk_ticket_category') THEN
        CREATE TYPE public.helpdesk_ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpdesk_ticket_status') THEN
        CREATE TYPE public.helpdesk_ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpdesk_ticket_priority') THEN
        CREATE TYPE public.helpdesk_ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
    END IF;
END$$;

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    email text UNIQUE,
    department text,
    role public.user_role NOT NULL DEFAULT 'guest'::public.user_role,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status NOT NULL DEFAULT 'Open'::public.job_status,
    posted_date timestamp with time zone NOT NULL DEFAULT now(),
    applicants integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    job_id uuid REFERENCES public.jobs(id),
    college_id uuid,
    stage public.applicant_stage NOT NULL DEFAULT 'Applied'::public.applicant_stage,
    applied_date timestamp with time zone NOT NULL DEFAULT now(),
    avatar text,
    source public.applicant_source,
    resume_data jsonb,
    ai_match_score integer,
    ai_justification text,
    wpm integer,
    accuracy numeric,
    aptitude_score integer,
    comprehensive_score integer,
    english_grammar_score integer,
    customer_service_score integer,
    rejection_reason text,
    rejection_notes text
);

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status public.college_status NOT NULL DEFAULT 'Invited',
    resumes_received integer NOT NULL DEFAULT 0,
    contact_email text NOT NULL,
    last_contacted timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id),
    interviewer_id uuid NOT NULL REFERENCES public.users(id),
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

CREATE TABLE IF NOT EXISTS public.company_posts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id),
    to_user_id uuid NOT NULL REFERENCES public.users(id),
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id),
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id),
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric NOT NULL,
    net_salary numeric NOT NULL,
    download_url text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated date NOT NULL,
    download_url text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id),
    buddy_id uuid REFERENCES public.users(id),
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text NOT NULL,
    buddy_name text,
    progress integer NOT NULL DEFAULT 0,
    current_step text NOT NULL DEFAULT 'Initiated',
    start_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer NOT NULL DEFAULT 12,
    casual_leave integer NOT NULL DEFAULT 12,
    earned_leave integer NOT NULL DEFAULT 15,
    unpaid_leave integer NOT NULL DEFAULT 0,
    CONSTRAINT leave_balances_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status public.leave_status NOT NULL DEFAULT 'pending',
    approver_id uuid REFERENCES public.users(id),
    total_days integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    review_date date NOT NULL,
    status public.review_status NOT NULL DEFAULT 'Pending',
    job_title text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id),
    title text NOT NULL,
    quarter text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer NOT NULL DEFAULT 0,
    status public.key_result_status NOT NULL DEFAULT 'on_track',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    title text NOT NULL,
    total_amount numeric NOT NULL,
    status public.expense_report_status NOT NULL DEFAULT 'submitted',
    submitted_at date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text
);

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    subject text NOT NULL,
    description text NOT NULL,
    category public.helpdesk_ticket_category NOT NULL,
    status public.helpdesk_ticket_status NOT NULL DEFAULT 'Open',
    priority public.helpdesk_ticket_priority NOT NULL DEFAULT 'Medium',
    resolver_id uuid REFERENCES public.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    comment text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Foreign Key Constraints
ALTER TABLE public.applicants
ADD CONSTRAINT applicants_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE SET NULL;

-- Functions
CREATE TYPE public.job_funnel_stat AS (stage public.applicant_stage, count bigint);

CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS SETOF public.job_funnel_stat
LANGUAGE sql STABLE
AS $$
    SELECT stage, count(id) as count
    FROM public.applicants
    GROUP BY stage;
$$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This is important!
AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, full_name, avatar_url, email, role, department)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    NEW.raw_user_meta_data->>'department'
  );
  
  -- Insert into public.leave_balances
  INSERT INTO public.leave_balances (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Row Level Security (RLS)
-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'guest'
  )
$$;

-- Policies
-- users table
DROP POLICY IF EXISTS "Allow users to see their own profile" ON public.users;
CREATE POLICY "Allow users to see their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Allow HR/Admins to view all user profiles" ON public.users;
CREATE POLICY "Allow HR/Admins to view all user profiles" ON public.users FOR SELECT USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
DROP POLICY IF EXISTS "Allow all authenticated users to see other users" ON public.users;
CREATE POLICY "Allow all authenticated users to see other users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

-- jobs table
DROP POLICY IF EXISTS "Allow anyone to read job postings" ON public.jobs;
CREATE POLICY "Allow anyone to read job postings" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to create jobs" ON public.jobs;
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to update jobs" ON public.jobs;
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- applicants table
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to manage applicants" ON public.applicants;
CREATE POLICY "Allow HR/Recruiter/Admin to manage applicants" ON public.applicants FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
DROP POLICY IF EXISTS "Allow anonymous to create applicants" ON public.applicants;
CREATE POLICY "Allow anonymous to create applicants" ON public.applicants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow applicant to view own data via portal" ON public.applicants;
CREATE POLICY "Allow applicant to view own data via portal" ON public.applicants FOR SELECT USING (auth.uid() IS NULL); -- Simplified for portal access, a real app would use a token

-- applicant_notes table
DROP POLICY IF EXISTS "Allow authorized users to manage notes" ON public.applicant_notes;
CREATE POLICY "Allow authorized users to manage notes" ON public.applicant_notes FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

-- leaves table
DROP POLICY IF EXISTS "Employees can manage their own leave requests" ON public.leaves;
CREATE POLICY "Employees can manage their own leave requests" ON public.leaves FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Managers/HR can see their team's/all leave requests" ON public.leaves;
CREATE POLICY "Managers/HR can see their team's/all leave requests" ON public.leaves FOR SELECT USING (
    get_my_role() IN ('admin', 'super_hr', 'hr_manager')
    OR (get_my_role() IN ('manager', 'team_lead') AND department = (SELECT department FROM users WHERE id = auth.uid()))
);
DROP POLICY IF EXISTS "Managers/HR can approve/reject leaves" ON public.leaves;
CREATE POLICY "Managers/HR can approve/reject leaves" ON public.leaves FOR UPDATE USING (
    get_my_role() IN ('admin', 'super_hr', 'hr_manager')
    OR (get_my_role() IN ('manager', 'team_lead') AND user_id IN (SELECT id FROM users WHERE department = (SELECT department FROM users WHERE id = auth.uid())))
) WITH CHECK (
    get_my_role() IN ('admin', 'super_hr', 'hr_manager')
    OR (get_my_role() IN ('manager', 'team_lead') AND user_id IN (SELECT id FROM users WHERE department = (SELECT department FROM users WHERE id = auth.uid())))
);


-- leave_balances table
DROP POLICY IF EXISTS "Employees can see their own leave balance" ON public.leave_balances;
CREATE POLICY "Employees can see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

-- helpdesk_tickets table
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.helpdesk_tickets;
CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Support/Admin can see all tickets" ON public.helpdesk_tickets;
CREATE POLICY "Support/Admin can see all tickets" ON public.helpdesk_tickets FOR SELECT USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));
DROP POLICY IF EXISTS "Support/Admin can update tickets" ON public.helpdesk_tickets;
CREATE POLICY "Support/Admin can update tickets" ON public.helpdesk_tickets FOR UPDATE USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));

-- ticket_comments table
DROP POLICY IF EXISTS "Users can manage comments on their own tickets" ON public.ticket_comments;
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL USING (
    (auth.uid() = user_id) OR
    (ticket_id IN (SELECT id FROM helpdesk_tickets WHERE user_id = auth.uid()))
);
DROP POLICY IF EXISTS "Support/Admin can manage all comments" ON public.ticket_comments;
CREATE POLICY "Support/Admin can manage all comments" ON public.ticket_comments FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));

-- All other tables can be viewed by any authenticated user for now.
-- More granular policies can be added as needed.
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.company_posts;
CREATE POLICY "Allow authenticated users to read" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow HR/Admin to create posts" ON public.company_posts;
CREATE POLICY "Allow HR/Admin to create posts" ON public.company_posts FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.kudos;
CREATE POLICY "Allow authenticated users to read" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to create kudos" ON public.kudos;
CREATE POLICY "Allow authenticated users to create kudos" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.weekly_awards;
CREATE POLICY "Allow authenticated users to read" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow managers/HR to create awards" ON public.weekly_awards;
CREATE POLICY "Allow managers/HR to create awards" ON public.weekly_awards FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

DROP POLICY IF EXISTS "Users can view their own payslips" ON public.payslips;
CREATE POLICY "Users can view their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "HR/Admin can view all payslips" ON public.payslips;
CREATE POLICY "HR/Admin can view all payslips" ON public.payslips FOR SELECT USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

DROP POLICY IF EXISTS "Allow authenticated users to read documents" ON public.company_documents;
CREATE POLICY "Allow authenticated users to read documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow HR/Admin to manage onboarding" ON public.onboarding_workflows;
CREATE POLICY "Allow HR/Admin to manage onboarding" ON public.onboarding_workflows FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager'));
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.onboarding_workflows;
CREATE POLICY "Users can view their own onboarding" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id OR auth.uid() = manager_id OR auth.uid() = buddy_id);

DROP POLICY IF EXISTS "Users can view their own reviews" ON public.performance_reviews;
CREATE POLICY "Users can view their own reviews" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "HR/Admins can manage all reviews" ON public.performance_reviews;
CREATE POLICY "HR/Admins can manage all reviews" ON public.performance_reviews FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

DROP POLICY IF EXISTS "Users can manage their own objectives" ON public.objectives;
CREATE POLICY "Users can manage their own objectives" ON public.objectives FOR ALL USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "HR/Admin can view all objectives" ON public.objectives;
CREATE POLICY "HR/Admin can view all objectives" ON public.objectives FOR SELECT USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

DROP POLICY IF EXISTS "Users can manage their own key results" ON public.key_results;
CREATE POLICY "Users can manage their own key results" ON public.key_results FOR ALL USING (
    objective_id IN (SELECT id FROM objectives WHERE owner_id = auth.uid())
);
DROP POLICY IF EXISTS "HR/Admin can view all key results" ON public.key_results;
CREATE POLICY "HR/Admin can view all key results" ON public.key_results FOR SELECT USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager'));

DROP POLICY IF EXISTS "Users can manage their own expense reports" ON public.expense_reports;
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "HR/Admin/Finance can manage all reports" ON public.expense_reports;
CREATE POLICY "HR/Admin/Finance can manage all reports" ON public.expense_reports FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'finance'));

DROP POLICY IF EXISTS "Allow access for related expense items" ON public.expense_items;
CREATE POLICY "Allow access for related expense items" ON public.expense_items FOR ALL USING (
    expense_report_id IN (SELECT id FROM expense_reports)
);

DROP POLICY IF EXISTS "Allow access for colleges" ON public.colleges;
CREATE POLICY "Allow access for colleges" ON public.colleges FOR ALL USING (get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

DROP POLICY IF EXISTS "Allow access for interviews" ON public.interviews;
CREATE POLICY "Allow access for interviews" ON public.interviews FOR ALL USING (
    get_my_role() IN ('admin', 'super_hr', 'hr_manager', 'recruiter') OR
    auth.uid() = interviewer_id
);

-- Enable storage access
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Allow anyone to view public avatars" ON storage.objects;
CREATE POLICY "Allow anyone to view public avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

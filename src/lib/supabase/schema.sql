--
-- Enums
--
CREATE TYPE public.user_role AS ENUM (
    'admin',
    'super_hr',
    'hr_manager',
    'recruiter',
    'interviewer',
    'manager',
    'team_lead',
    'employee',
    'intern',
    'guest',
    'finance',
    'it_admin',
    'support',
    'auditor'
);

CREATE TYPE public.applicant_stage AS ENUM (
    'Sourced',
    'Applied',
    'Phone Screen',
    'Interview',
    'Offer',
    'Hired',
    'Rejected'
);

CREATE TYPE public.applicant_source AS ENUM (
    'walk-in',
    'college',
    'email',
    'manual'
);

CREATE TYPE public.college_status AS ENUM (
    'Invited',
    'Confirmed',
    'Attended',
    'Declined'
);

CREATE TYPE public.expense_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'reimbursed'
);

CREATE TYPE public.ticket_category AS ENUM (
    'IT',
    'HR',
    'Finance',
    'General'
);

CREATE TYPE public.ticket_priority AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
);

CREATE TYPE public.ticket_status AS ENUM (
    'Open',
    'In Progress',
    'Resolved',
    'Closed'
);

CREATE TYPE public.interview_type AS ENUM (
    'Video',
    'Phone',
    'In-person'
);

CREATE TYPE public.interview_status AS ENUM (
    'Scheduled',
    'Completed',
    'Canceled'
);

CREATE TYPE public.job_status AS ENUM (
    'Open',
    'Closed',
    'On hold'
);

CREATE TYPE public.key_result_status AS ENUM (
    'on_track',
    'at_risk',
    'off_track'
);

CREATE TYPE public.leave_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE public.leave_type AS ENUM (
    'sick',
    'casual',
    'earned',
    'unpaid'
);

CREATE TYPE public.review_status AS ENUM (
    'Pending',
    'In Progress',
    'Completed'
);


--
-- Tables
--

-- Users Table (public view of auth.users)
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    role public.user_role NOT NULL DEFAULT 'guest'::public.user_role,
    department text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Jobs Table
CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status DEFAULT 'Open'::public.job_status NOT NULL,
    posted_date timestamp with time zone DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Applicants Table
CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    stage public.applicant_stage DEFAULT 'Applied'::public.applicant_stage NOT NULL,
    applied_date timestamp with time zone DEFAULT now() NOT NULL,
    avatar text,
    source public.applicant_source DEFAULT 'manual'::public.applicant_source,
    college_id uuid,
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
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Applicant Notes Table
CREATE TABLE public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;

-- Colleges Table
CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    status public.college_status DEFAULT 'Invited'::public.college_status NOT NULL,
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text NOT NULL,
    last_contacted timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Company Documents Table
CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    download_url text NOT NULL
);
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Company Posts Table
CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;

-- Expense Items Table
CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expense_report_id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text NOT NULL
);
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- Expense Reports Table
CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric NOT NULL,
    status public.expense_status DEFAULT 'draft'::public.expense_status NOT NULL,
    submitted_at timestamp with time zone NOT NULL
);
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ADD CONSTRAINT expense_items_expense_report_id_fkey FOREIGN KEY (expense_report_id) REFERENCES public.expense_reports(id) ON DELETE CASCADE;


-- Helpdesk Tickets Table
CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL,
    status public.ticket_status DEFAULT 'Open'::public.ticket_status NOT NULL,
    priority public.ticket_priority DEFAULT 'Medium'::public.ticket_priority NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket Comments Table
CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Interviews Table
CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status DEFAULT 'Scheduled'::public.interview_status NOT NULL,
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Key Results Table
CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    objective_id uuid NOT NULL,
    description text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    status public.key_result_status DEFAULT 'on_track'::public.key_result_status NOT NULL
);
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Kudos Table
CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

-- Leave Balances Table
CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 12 NOT NULL,
    casual_leave integer DEFAULT 12 NOT NULL,
    earned_leave integer DEFAULT 12 NOT NULL,
    unpaid_leave integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Leaves Table
CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status public.leave_status DEFAULT 'pending'::public.leave_status NOT NULL,
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_days integer NOT NULL
);
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Objectives Table
CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL
);
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ADD CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id) ON DELETE CASCADE;


-- Onboarding Workflows Table
CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text NOT NULL,
    manager_name text NOT NULL,
    buddy_name text,
    progress integer DEFAULT 0 NOT NULL,
    current_step text DEFAULT 'Initiated'::text NOT NULL,
    start_date date DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;

-- Payslips Table
CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric NOT NULL,
    net_salary numeric NOT NULL,
    download_url text NOT NULL
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Performance Reviews Table
CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date date NOT NULL,
    status public.review_status DEFAULT 'Pending'::public.review_status NOT NULL,
    job_title text
);
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- Weekly Awards Table
CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL
);
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;

--
-- Functions for Auth/User sync
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, role, department, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department',
    new.email
  );
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    full_name = new.raw_user_meta_data->>'full_name',
    avatar_url = new.raw_user_meta_data->>'avatar_url',
    role = (new.raw_user_meta_data->>'role')::public.user_role,
    department = new.raw_user_meta_data->>'department',
    email = new.email
  WHERE id = new.id;
  RETURN new;
END;
$$;


--
-- Triggers for Auth/User sync
--
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();

--
-- Function for job funnel stats
--
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage text, count bigint)
LANGUAGE sql
AS $$
  SELECT
    stage::text,
    COUNT(*) as count
  FROM public.applicants
  GROUP BY stage
  ORDER BY
    CASE stage::text
      WHEN 'Applied' THEN 1
      WHEN 'Phone Screen' THEN 2
      WHEN 'Interview' THEN 3
      WHEN 'Offer' THEN 4
      WHEN 'Hired' THEN 5
      ELSE 6
    END;
$$;


--
-- RLS Policies
--

-- Users Table
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow individual user to update their own info" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin to manage users" ON public.users FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role)
) WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role)
);

-- General "Deny All" for most tables, forcing explicit SELECT/INSERT/UPDATE/DELETE policies
-- This is a secure default. We will open up permissions as needed below.

CREATE POLICY "Deny all access" ON public.jobs FOR ALL USING (false);
CREATE POLICY "Deny all access" ON public.applicants FOR ALL USING (false);
CREATE POLICY "Deny all access" ON public.leaves FOR ALL USING (false);
-- ... and so on for other tables if you want to be extra secure.

-- Jobs Table
CREATE POLICY "Allow HR/Recruiter/Admin read access to jobs" ON public.jobs FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role, 'recruiter'::public.user_role)
);
CREATE POLICY "Allow HR/Recruiter/Admin to create/update jobs" ON public.jobs FOR INSERT, UPDATE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role, 'recruiter'::public.user_role)
);

-- Applicants Table
CREATE POLICY "Allow HR/Recruiter/Admin/Interviewer to read applicants" ON public.applicants FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role, 'recruiter'::public.user_role, 'interviewer'::public.user_role, 'manager'::public.user_role)
);
CREATE POLICY "Allow HR/Recruiter/Admin to manage applicants" ON public.applicants FOR INSERT, UPDATE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role, 'recruiter'::public.user_role)
);
CREATE POLICY "Allow public access for registration" ON public.applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow applicant to read their own profile" ON public.applicants FOR SELECT USING (id::text IN (SELECT unnest(string_to_array(current_setting('app.applicant_ids', true), ','))));

-- Leaves & Leave Balances
CREATE POLICY "Allow users to see their own leave and balance" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to request leave" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers to see their team's leave" ON public.leaves FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager'::public.user_role, 'team_lead'::public.user_role) AND
  department = (SELECT department FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Allow managers to approve/reject leave" ON public.leaves FOR UPDATE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager'::public.user_role, 'team_lead'::public.user_role) AND
  user_id IN (SELECT id FROM public.users WHERE department = (SELECT department FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Allow HR/Admin to see all leaves" ON public.leaves FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role)
);
CREATE POLICY "Allow HR/Admin to manage all leaves" ON public.leaves FOR UPDATE, DELETE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role)
);

-- Company Feed/Kudos/Documents (allow all authenticated users to read)
CREATE POLICY "Allow authenticated users to read" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');

-- All other tables can be set to "Allow logged-in users to read" as a baseline
CREATE POLICY "Allow authenticated read" ON public.applicant_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.colleges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.expense_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.helpdesk_tickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.interviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.objectives FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.onboarding_workflows FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.payslips FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON public.performance_reviews FOR SELECT USING (auth.role() = 'authenticated');

-- More specific write policies
CREATE POLICY "Users can insert their own records" ON public.kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can insert their own expense reports" ON public.expense_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert their own helpdesk tickets" ON public.helpdesk_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin/HR policies for writing
CREATE POLICY "Allow admin/hr to manage" ON public.company_posts FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'::public.user_role, 'super_hr'::public.user_role, 'hr_manager'::public.user_role)
);

-- Enable RLS for all tables created
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Storage Policies
--
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

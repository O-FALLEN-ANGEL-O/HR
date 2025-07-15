-- Wipe all existing data and policies for a clean slate.
-- The order is important to avoid dependency errors.

-- 1. Drop Policies
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON "public"."ticket_comments";
DROP POLICY IF EXISTS "Allow authenticated users to view tickets" ON "public"."helpdesk_tickets";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."helpdesk_tickets";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."expense_reports";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."company_documents";
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "public"."payslips";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."weekly_awards";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."weekly_awards";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."kudos";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."kudos";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."post_comments";
DROP POLICY IF EXISTS "Enable insert for HR/Admins" ON "public"."company_posts";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."company_posts";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."key_results";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."objectives";
DROP POLICY IF EXISTS "Enable all for admins and HR" ON "public"."performance_reviews";
DROP POLICY IF EXISTS "Allow user to see their own review" ON "public"."performance_reviews";
DROP POLICY IF EXISTS "Enable insert for admins and HR" ON "public"."onboarding_workflows";
DROP POLICY IF EXISTS "Enable read for assigned user/manager" ON "public"."onboarding_workflows";
DROP POLICY IF EXISTS "Enable all for admin and HR" ON "public"."leaves";
DROP POLICY IF EXISTS "Allow user to manage their own leaves" ON "public"."leaves";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."leave_balances";
DROP POLICY IF EXISTS "Enable read access for interviewers" ON "public"."interviews";
DROP POLICY IF EXISTS "Enable all for admin and HR" ON "public"."interviews";
DROP POLICY IF EXISTS "Enable all for admin and HR" ON "public"."applicant_notes";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."applicants";
DROP POLICY IF EXISTS "Enable all for admin and HR" ON "public"."applicants";
DROP POLICY IF EXISTS "Enable insert for admin and HR" ON "public"."colleges";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."colleges";
DROP POLICY IF EXISTS "Enable all for admin and HR" ON "public"."jobs";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."jobs";
DROP POLICY IF EXISTS "Allow admin to manage users" ON "public"."users";
DROP POLICY IF EXISTS "Allow user to view their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Allow all users to view public profiles" ON "public"."users";
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON "storage"."objects";

-- 2. Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- 4. Drop Tables (in reverse order of dependency)
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.post_comments;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.performance_reviews;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.users;

-- 5. Drop Types (in reverse order of dependency)
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.user_role;


-- =============================================
-- ==========      CREATE NEW SCHEMA     =========
-- =============================================

-- 1. Create Types

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


-- 2. Create Tables

CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text UNIQUE,
    avatar_url text,
    role user_role DEFAULT 'guest'::user_role NOT NULL,
    department text,
    phone text,
    profile_setup_complete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status text DEFAULT 'Open'::text NOT NULL,
    posted_date timestamp with time zone DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    status text DEFAULT 'Invited'::text NOT NULL,
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text,
    last_contacted timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    stage applicant_stage DEFAULT 'Applied'::applicant_stage NOT NULL,
    applied_date timestamp with time zone DEFAULT now() NOT NULL,
    avatar text,
    source text,
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
    rejection_notes text
);

CREATE TABLE public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    time time without time zone NOT NULL,
    type text,
    status text DEFAULT 'Scheduled'::text,
    candidate_name text,
    candidate_avatar text,
    interviewer_name text,
    interviewer_avatar text,
    job_title text
);

CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 15,
    unpaid_leave integer DEFAULT 0
);

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text,
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    total_days integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text DEFAULT 'Welcome Kit'::text,
    start_date date NOT NULL
);

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date date NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    job_title text
);

CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text,
    week_of date NOT NULL
);

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text,
    year integer,
    gross_salary numeric,
    net_salary numeric,
    download_url text
);

CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    last_updated date,
    download_url text
);

CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text,
    quarter text
);

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text,
    progress integer DEFAULT 0,
    status text DEFAULT 'on_track'::text
);

CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text,
    total_amount numeric,
    status text,
    submitted_at timestamp with time zone
);

CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expense_report_id uuid REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date,
    category text,
    amount numeric,
    description text
);

CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text,
    description text,
    category text,
    status text,
    priority text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid REFERENCES public.users(id)
);

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);


-- 3. Create Functions and Triggers

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, department, avatar_url, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone'
  );
  
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT s.stage, COALESCE(a.count, 0) as count
    FROM unnest(enum_range(NULL::applicant_stage)) s(stage)
    LEFT JOIN (
      SELECT applicants.stage, COUNT(*) as count
      FROM applicants
      GROUP BY applicants.stage
    ) a ON s.stage = a.stage
    ORDER BY
      CASE s.stage
        WHEN 'Sourced' THEN 1
        WHEN 'Applied' THEN 2
        WHEN 'Phone Screen' THEN 3
        WHEN 'Interview' THEN 4
        WHEN 'Offer' THEN 5
        WHEN 'Hired' THEN 6
        WHEN 'Rejected' THEN 7
      END;
END;
$$;


-- 4. Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;


-- 5. Create RLS Policies

-- Users
CREATE POLICY "Allow all users to view public profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow user to view their own profile" ON public.users FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Allow admin to manage users" ON public.users FOR ALL USING (get_my_claim('user_role') = 'admin'::jsonb);

-- Jobs
CREATE POLICY "Enable read for all users" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Enable all for admin and HR" ON public.jobs FOR ALL USING (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"', '"recruiter"'));

-- Colleges
CREATE POLICY "Enable read for all users" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Enable insert for admin and HR" ON public.colleges FOR INSERT WITH CHECK (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"', '"recruiter"'));

-- Applicants
CREATE POLICY "Enable all for admin and HR" ON public.applicants FOR ALL USING (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"', '"recruiter"'));
CREATE POLICY "Enable read access for all users" ON public.applicants FOR SELECT USING (true);

-- Applicant Notes
CREATE POLICY "Enable all for admin and HR" ON public.applicant_notes FOR ALL USING (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"', '"recruiter"'));

-- Interviews
CREATE POLICY "Enable all for admin and HR" ON public.interviews FOR ALL USING (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"', '"recruiter"'));
CREATE POLICY "Enable read access for interviewers" ON public.interviews FOR SELECT USING (get_my_claim('user_role') = '"interviewer"'::jsonb AND auth.uid() = interviewer_id);

-- Leave Balances
CREATE POLICY "Enable all for users based on user_id" ON public.leave_balances FOR ALL USING (auth.uid() = user_id);

-- Leaves
CREATE POLICY "Allow user to manage their own leaves" ON public.leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Enable all for admin and HR" ON public.leaves FOR ALL USING (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"'))
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = leaves.user_id AND users.department = (SELECT department FROM users WHERE id = auth.uid())
  ) OR get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"')
);

-- Onboarding Workflows
CREATE POLICY "Enable read for assigned user/manager" ON public.onboarding_workflows FOR SELECT USING (auth.uid() IN (user_id, manager_id, buddy_id));
CREATE POLICY "Enable insert for admins and HR" ON public.onboarding_workflows FOR INSERT WITH CHECK (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"'));

-- Performance Reviews
CREATE POLICY "Allow user to see their own review" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable all for admins and HR" ON public.performance_reviews FOR ALL USING (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"'));

-- Company Posts & Comments
CREATE POLICY "Enable read access for all users" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Enable insert for HR/Admins" ON public.company_posts FOR INSERT WITH CHECK (get_my_claim('user_role') IN ('"admin"', '"super_hr"', '"hr_manager"'));
CREATE POLICY "Enable all for users based on user_id" ON public.post_comments FOR ALL USING (auth.uid() = user_id);

-- Kudos & Awards
CREATE POLICY "Enable read access for all users" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.weekly_awards FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Payslips & Documents
CREATE POLICY "Enable read access for users based on user_id" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable read access for all users" ON public.company_documents FOR SELECT USING (true);

-- OKRs
CREATE POLICY "Enable all for users based on user_id" ON public.objectives FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Enable all for users based on user_id" ON public.key_results FOR ALL USING (
    EXISTS (SELECT 1 FROM objectives WHERE objectives.id = key_results.objective_id AND objectives.owner_id = auth.uid())
);

-- Expense Reports
CREATE POLICY "Enable all for users based on user_id" ON public.expense_reports FOR ALL USING (auth.uid() = user_id);

-- Helpdesk
CREATE POLICY "Enable insert for authenticated users" ON public.helpdesk_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view tickets" ON public.helpdesk_tickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for users based on user_id" ON public.ticket_comments FOR ALL USING (auth.uid() = user_id);


-- 6. Setup Storage Policies
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'post_images' );
CREATE POLICY "Authenticated users can upload post images." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'post_images' AND auth.role() = 'authenticated' );

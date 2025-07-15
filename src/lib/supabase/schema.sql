-- Universal Cleanup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP FUNCTION IF EXISTS public.get_job_funnel_stats;

-- Drop Policies in reverse order of creation, handling dependencies
-- Note: Dropping policies on tables that depend on others first.
DROP POLICY IF EXISTS "Allow user to see their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow support staff to see all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow authorized users to manage all expenses" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow user to see their own expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow user to see their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow finance/HR to see all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow authenticated user to see all kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow authenticated users to read posts and comments" ON public.company_posts;
DROP POLICY IF EXISTS "Allow admin/hr to manage posts" ON public.company_posts;
DROP POLICY IF EXISTS "Allow authenticated users to create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Allow admin/hr to delete comments" ON public.post_comments;
DROP POLICY IF EXISTS "Allow authenticated users to view all" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow managers/hr/admin to create awards" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow authenticated to view" ON public.company_documents;
DROP POLICY IF EXISTS "Allow admin/hr to manage documents" ON public.company_documents;
DROP POLICY IF EXISTS "Allow users to view objectives" ON public.objectives;
DROP POLICY IF EXISTS "Allow users to manage their own objectives" ON public.objectives;
DROP POLICY IF EXISTS "Allow authenticated users to view key results" ON public.key_results;
DROP POLICY IF EXISTS "Allow objective owner to manage key results" ON public.key_results;
DROP POLICY IF EXISTS "Allow admins/hr to manage reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow users to see their own review" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow admins/hr to manage all onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow employee to see their own onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow manager/buddy to see onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow admin/hr to manage all interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow interviewer to see their interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow admin/hr to read all notes" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow users to insert notes for applicants" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow admin/hr to manage applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow authenticated to read colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow admin/hr to manage colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow authenticated to read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow admin/hr to manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated users to read user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow admin/super_hr to manage user roles" ON public.users;
DROP POLICY IF EXISTS "Allow user to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;

-- Drop Tables in reverse order of creation
DROP TABLE IF EXISTS public.ticket_comments;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.post_comments;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.objectives;
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

-- Drop Types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;

-- =================================================================
-- 1. Custom Types
-- =================================================================
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.applicant_stage AS ENUM (
  'Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'
);

-- =================================================================
-- 2. Tables
-- =================================================================

-- Users Table: Stores public user data, linked to auth.users
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text UNIQUE,
    avatar_url text,
    role user_role DEFAULT 'guest'::public.user_role,
    department text,
    phone text,
    profile_setup_complete boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Public user data, syncs with auth.users.';

-- Jobs Table
CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status text DEFAULT 'Open'::text NOT NULL,
    posted_date timestamptz DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);

-- Colleges Table
CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    status text DEFAULT 'Invited'::text NOT NULL,
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text,
    last_contacted timestamptz DEFAULT now() NOT NULL
);

-- Applicants Table
CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text,
    phone text,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage applicant_stage DEFAULT 'Applied'::public.applicant_stage,
    applied_date timestamptz DEFAULT now(),
    avatar text,
    source text,
    resume_data jsonb,
    ai_match_score integer,
    ai_justification text,
    wpm integer,
    accuracy integer,
    aptitude_score integer,
    comprehensive_score integer,
    english_grammar_score integer,
    customer_service_score integer
);

-- Applicant Notes Table
CREATE TABLE public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text,
    author_avatar text,
    note text,
    created_at timestamptz DEFAULT now()
);

-- Interviews Table
CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    "time" time without time zone,
    type text,
    status text DEFAULT 'Scheduled'::text,
    candidate_name text,
    interviewer_name text,
    job_title text
);

-- Leave Balances Table
CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 0,
    casual_leave integer DEFAULT 0,
    earned_leave integer DEFAULT 0,
    unpaid_leave integer DEFAULT 0
);

-- Leaves Table
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
    created_at timestamptz DEFAULT now()
);

-- Onboarding Workflows Table
CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text,
    start_date date
);

-- Performance Reviews Table
CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date date NOT NULL,
    status text,
    job_title text
);

-- Objectives Table
CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text
);

-- Key Results Table
CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0,
    status text DEFAULT 'on_track'::text
);

-- Company Posts Table
CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    content text,
    image_url text,
    created_at timestamptz DEFAULT now()
);

-- Post Comments Table
CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Kudos Table
CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text,
    message text,
    created_at timestamptz DEFAULT now()
);

-- Weekly Awards Table
CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    reason text,
    week_of date
);

-- Payslips Table
CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text,
    year integer,
    gross_salary numeric,
    net_salary numeric,
    download_url text
);

-- Company Documents Table
CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text,
    description text,
    category text,
    last_updated date,
    download_url text
);

-- Expense Reports Table
CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text,
    total_amount numeric,
    status text,
    submitted_at timestamptz DEFAULT now()
);

-- Expense Items Table
CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date,
    category text,
    amount numeric,
    description text
);

-- Helpdesk Tickets Table
CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text,
    description text,
    category text,
    status text,
    priority text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Ticket Comments Table
CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text,
    created_at timestamptz DEFAULT now()
);

-- =================================================================
-- 3. Functions and Triggers
-- =================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, department, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (new.id, 12, 12, 15, 0);

  RETURN new;
END;
$$;

-- Trigger to call the function on new user sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function for HR dashboard stats
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint)
LANGUAGE sql
AS $$
  SELECT stage, count(id) FROM applicants GROUP BY stage ORDER BY
    CASE stage
        WHEN 'Sourced' THEN 1
        WHEN 'Applied' THEN 2
        WHEN 'Phone Screen' THEN 3
        WHEN 'Interview' THEN 4
        WHEN 'Offer' THEN 5
        WHEN 'Hired' THEN 6
        WHEN 'Rejected' THEN 7
    END;
$$;


-- =================================================================
-- 4. Row Level Security (RLS)
-- =================================================================

-- Enable RLS for all tables
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
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies for `users`
CREATE POLICY "Allow authenticated users to read user profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow user to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin/super_hr to manage user roles" ON public.users FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr'));

-- Policies for `jobs`
CREATE POLICY "Allow authenticated to read jobs" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/hr to manage jobs" ON public.jobs FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for `colleges`
CREATE POLICY "Allow authenticated to read colleges" ON public.colleges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/hr to manage colleges" ON public.colleges FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for `applicants`
CREATE POLICY "Allow admin/hr to manage applicants" ON public.applicants FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for `applicant_notes`
CREATE POLICY "Allow admin/hr to read all notes" ON public.applicant_notes FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow users to insert notes for applicants" ON public.applicant_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for `interviews`
CREATE POLICY "Allow admin/hr to manage all interviews" ON public.interviews FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow interviewer to see their interviews" ON public.interviews FOR SELECT USING (interviewer_id = auth.uid());

-- Policies for `onboarding_workflows`
CREATE POLICY "Allow employee to see their own onboarding" ON public.onboarding_workflows FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow manager/buddy to see onboarding" ON public.onboarding_workflows FOR SELECT USING (manager_id = auth.uid() OR buddy_id = auth.uid());
CREATE POLICY "Allow admins/hr to manage all onboarding" ON public.onboarding_workflows FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for `performance_reviews`
CREATE POLICY "Allow users to see their own review" ON public.performance_reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow admins/hr to manage reviews" ON public.performance_reviews FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for `objectives` & `key_results`
CREATE POLICY "Allow users to view objectives" ON public.objectives FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to manage their own objectives" ON public.objectives FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Allow authenticated users to view key results" ON public.key_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow objective owner to manage key results" ON public.key_results FOR ALL USING ((SELECT owner_id FROM public.objectives WHERE id = objective_id) = auth.uid());

-- Policies for `company_posts` & `post_comments`
CREATE POLICY "Allow authenticated users to read posts and comments" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/hr to manage posts" ON public.company_posts FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow authenticated users to create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/hr to delete comments" ON public.post_comments FOR DELETE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for `kudos` & `weekly_awards`
CREATE POLICY "Allow authenticated user to see all kudos" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view all" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow managers/hr/admin to create awards" ON public.weekly_awards FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- Policies for `payslips`
CREATE POLICY "Allow user to see their own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow finance/HR to see all payslips" ON public.payslips FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));

-- Policies for `company_documents`
CREATE POLICY "Allow authenticated to view" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/hr to manage documents" ON public.company_documents FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for `expense_reports` & `expense_items`
CREATE POLICY "Allow user to see their own expense reports" ON public.expense_reports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow authorized users to manage all expenses" ON public.expense_reports FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance', 'manager', 'team_lead'));

-- Policies for `helpdesk_tickets` & `ticket_comments`
CREATE POLICY "Allow user to see their own tickets" ON public.helpdesk_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow support staff to see all tickets" ON public.helpdesk_tickets FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));

-- =================================================================
-- 5. Storage Policies
-- =================================================================
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'post_images');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "HR/Admin can upload post images." ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'post_images') AND ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')));

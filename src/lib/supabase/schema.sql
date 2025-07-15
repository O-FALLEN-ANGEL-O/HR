-- Full schema for the HR+ application.
-- This script is designed to be idempotent and can be run on a new or existing database.

-- ----------------------------------------------------------------
-- 1. DROP EXISTING OBJECTS in reverse dependency order
-- ----------------------------------------------------------------
-- Drop RLS policies first
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow admin read access" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.jobs;
DROP POLICY IF EXISTS "Allow admin, hr, recruiter write access" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.colleges;
DROP POLICY IF EXISTS "Allow admin, hr, recruiter write access" ON public.colleges;
DROP POLICY IF EXISTS "Allow individual or hr read access" ON public.applicants;
DROP POLICY IF EXISTS "Allow hr, recruiter write access" ON public.applicants;
DROP POLICY IF EXISTS "Allow admin, hr write access" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow authors and hr to read" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow participants and hr to read" ON public.interviews;
DROP POLICY IF EXISTS "Allow admin, hr, recruiter to write" ON public.interviews;
DROP POLICY IF EXISTS "Allow individual, manager, hr read access" ON public.leaves;
DROP POLICY IF EXISTS "Allow individual write access" ON public.leaves;
DROP POLICY IF EXISTS "Allow hr to approve/reject" ON public.leaves;
DROP POLICY IF EXISTS "Allow individual read access" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.company_posts;
DROP POLICY IF EXISTS "Allow admin, hr write access" ON public.company_posts;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.post_comments;
DROP POLICY IF EXISTS "Allow individual write access" ON public.post_comments;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow individual and support write access" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow participants to read" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow individual write access" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.kudos;
DROP POLICY IF EXISTS "Allow individual write access" ON public.kudos;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow managers and hr to write" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.company_documents;
DROP POLICY IF EXISTS "Allow hr and admin to write" ON public.company_documents;
DROP POLICY IF EXISTS "Allow individual and finance to read" ON public.payslips;
DROP POLICY IF EXISTS "Allow finance to write" ON public.payslips;
DROP POLICY IF EXISTS "Allow participants, manager, hr read access" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow hr and manager to write" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow individual, manager, hr read access" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow manager and hr write access" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow owner and hr to read" ON public.objectives;
DROP POLICY IF EXISTS "Allow owner and hr to write" ON public.objectives;
DROP POLICY IF EXISTS "Allow related users to read" ON public.key_results;
DROP POLICY IF EXISTS "Allow owner to write" ON public.key_results;
DROP POLICY IF EXISTS "Allow individual, finance, manager read access" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow individual write access" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow related users to read" ON public.expense_items;
DROP POLICY IF EXISTS "Allow related users to write" ON public.expense_items;

-- Drop Storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Allow post image uploads for hr/admin" ON storage.objects;

-- Drop trigger before function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions before types
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_job_funnel_stats();

-- Drop tables (use CASCADE to handle dependencies like foreign keys)
-- Note: Dropping in a somewhat logical order to be safe, though CASCADE should handle it.
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.objectives CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.company_documents CASCADE;
DROP TABLE IF EXISTS public.weekly_awards CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop types last
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;

-- ----------------------------------------------------------------
-- 2. CREATE DATABASE OBJECTS
-- ----------------------------------------------------------------

-- Create ENUM types
CREATE TYPE public.user_role AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');

-- Create tables in dependency order
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text UNIQUE,
    avatar_url text,
    role public.user_role DEFAULT 'guest'::public.user_role,
    department text,
    phone text,
    profile_setup_complete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status DEFAULT 'Open'::public.job_status,
    posted_date timestamp with time zone DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0
);

CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    status public.college_status DEFAULT 'Invited'::public.college_status,
    resumes_received integer DEFAULT 0,
    contact_email text,
    last_contacted timestamp with time zone DEFAULT now()
);

CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    stage public.applicant_stage DEFAULT 'Applied'::public.applicant_stage,
    applied_date timestamp with time zone DEFAULT now(),
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
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text,
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
    type public.interview_type NOT NULL,
    status public.interview_status DEFAULT 'Scheduled'::public.interview_status,
    candidate_name text,
    interviewer_name text,
    job_title text,
    candidate_avatar text,
    interviewer_avatar text
);

CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 0,
    casual_leave integer DEFAULT 0,
    earned_leave integer DEFAULT 0,
    unpaid_leave integer DEFAULT 0
);

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status public.leave_status DEFAULT 'pending'::public.leave_status,
    approver_id uuid REFERENCES public.users(id),
    total_days integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
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

CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL,
    status public.ticket_status DEFAULT 'Open'::public.ticket_status,
    priority public.ticket_priority DEFAULT 'Low'::public.ticket_priority,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolver_id uuid REFERENCES public.users(id)
);

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL
);

CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    last_updated timestamp with time zone DEFAULT now(),
    download_url text
);

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric,
    net_salary numeric,
    download_url text
);

CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name text,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text,
    start_date date NOT NULL
);

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date date,
    status public.review_status DEFAULT 'Pending'::public.review_status,
    job_title text
);

CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text
);

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0,
    status public.key_result_status DEFAULT 'on_track'::public.key_result_status
);

CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric NOT NULL,
    status public.expense_status DEFAULT 'draft'::public.expense_status,
    submitted_at timestamp with time zone
);

CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text,
    amount numeric NOT NULL,
    description text
);

-- ----------------------------------------------------------------
-- 3. FUNCTIONS AND TRIGGERS
-- ----------------------------------------------------------------

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, avatar_url, role, department, profile_setup_complete)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department',
    (new.raw_user_meta_data->>'profile_setup_complete')::boolean
  );
  
  -- Create a default leave balance for the new user
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (new.id, 12, 12, 15, 0);

  RETURN new;
END;
$$;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Function for HR dashboard stats
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint)
LANGUAGE sql
AS $$
  SELECT stage, count(id) as count
  FROM public.applicants
  GROUP BY stage
  ORDER BY
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


-- ----------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- Define RLS policies
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admin read access" ON public.users FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr'));
CREATE POLICY "Allow authenticated read access" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin, hr, recruiter write access" ON public.jobs FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow authenticated read access" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin, hr, recruiter write access" ON public.colleges FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow individual or hr read access" ON public.applicants FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "Allow hr, recruiter write access" ON public.applicants FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow admin, hr write access" ON public.applicant_notes FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));
CREATE POLICY "Allow authors and hr to read" ON public.applicant_notes FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow participants and hr to read" ON public.interviews FOR SELECT USING (interviewer_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow admin, hr, recruiter to write" ON public.interviews FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow individual, manager, hr read access" ON public.leaves FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Allow individual write access" ON public.leaves FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow hr to approve/reject" ON public.leaves FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Allow individual read access" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow authenticated read access" ON public.company_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin, hr write access" ON public.company_posts FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow authenticated read access" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individual write access" ON public.post_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow individual and support read access" ON public.helpdesk_tickets FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'support', 'it_admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow individual write access" ON public.helpdesk_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow participants to read" ON public.ticket_comments FOR SELECT USING (ticket_id IN (SELECT id FROM public.helpdesk_tickets WHERE user_id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'support', 'it_admin'));
CREATE POLICY "Allow individual write access" ON public.ticket_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow authenticated read access" ON public.kudos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individual write access" ON public.kudos FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Allow authenticated read access" ON public.weekly_awards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow managers and hr to write" ON public.weekly_awards FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Allow authenticated read access" ON public.company_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow hr and admin to write" ON public.company_documents FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow individual and finance to read" ON public.payslips FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance'));
CREATE POLICY "Allow finance to write" ON public.payslips FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance'));
CREATE POLICY "Allow participants, manager, hr read access" ON public.onboarding_workflows FOR SELECT USING (user_id = auth.uid() OR manager_id = auth.uid() OR buddy_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow hr and manager to write" ON public.onboarding_workflows FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow individual, manager, hr read access" ON public.performance_reviews FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));
CREATE POLICY "Allow manager and hr write access" ON public.performance_reviews FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager'));
CREATE POLICY "Allow owner and hr to read" ON public.objectives FOR SELECT USING (owner_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow owner and hr to write" ON public.objectives FOR ALL USING (owner_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow related users to read" ON public.key_results FOR SELECT USING (objective_id IN (SELECT id FROM public.objectives WHERE owner_id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow owner to write" ON public.key_results FOR ALL USING (objective_id IN (SELECT id FROM public.objectives WHERE owner_id = auth.uid()));
CREATE POLICY "Allow individual, finance, manager read access" ON public.expense_reports FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance', 'manager', 'super_hr'));
CREATE POLICY "Allow individual write access" ON public.expense_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Allow related users to read" ON public.expense_items FOR SELECT USING (expense_report_id IN (SELECT id FROM public.expense_reports WHERE user_id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance', 'manager'));
CREATE POLICY "Allow related users to write" ON public.expense_items FOR ALL USING (expense_report_id IN (SELECT id FROM public.expense_reports WHERE user_id = auth.uid()));


-- ----------------------------------------------------------------
-- 5. STORAGE POLICIES
-- ----------------------------------------------------------------

-- Create Storage Buckets
-- Note: Bucket creation is not idempotent, so it's best done via the Supabase Studio UI.
-- If you need to do it via script, you would handle errors for existing buckets.

-- Avatar images
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow uploads for authenticated users" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Post images
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'post_images');
CREATE POLICY "Allow post image uploads for hr/admin" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post_images' AND
  (SELECT role from public.users where id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

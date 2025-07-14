-- src/lib/supabase/schema.sql

-- Drop existing types if they exist to avoid conflicts
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.leave_type CASCADE;
DROP TYPE IF EXISTS public.leave_status CASCADE;
DROP TYPE IF EXISTS public.applicant_stage CASCADE;
DROP TYPE IF EXISTS public.applicant_source CASCADE;
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.interview_type CASCADE;
DROP TYPE IF EXISTS public.interview_status CASCADE;
DROP TYPE IF EXISTS public.college_status CASCADE;
DROP TYPE IF EXISTS public.review_status CASCADE;
DROP TYPE IF EXISTS public.objective_status CASCADE;
DROP TYPE IF EXISTS public.key_result_status CASCADE;
DROP TYPE IF EXISTS public.expense_report_status CASCADE;
DROP TYPE IF EXISTS public.helpdesk_ticket_status CASCADE;
DROP TYPE IF EXISTS public.helpdesk_ticket_priority CASCADE;
DROP TYPE IF EXISTS public.helpdesk_ticket_category CASCADE;


-- Recreate all custom types
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 
  'manager', 'team_lead', 'employee', 'intern', 'guest', 
  'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.objective_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.helpdesk_ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.helpdesk_ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.helpdesk_ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');


-- Function to handle user updates and create public user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, department)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department'
  );

  -- Create a leave balance for the new user
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (new.id, 12, 12, 18, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to get job funnel statistics
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stage, 
        COALESCE(a.count, 0) as count
    FROM 
        (VALUES 
            ('Applied'::applicant_stage), 
            ('Phone Screen'::applicant_stage), 
            ('Interview'::applicant_stage), 
            ('Offer'::applicant_stage), 
            ('Hired'::applicant_stage)
        ) AS s(stage)
    LEFT JOIN 
        (SELECT stage, count(*) as count FROM applicants GROUP BY stage) AS a
    ON 
        s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;


-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'guest',
  department text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  description text,
  status public.job_status NOT NULL DEFAULT 'Open',
  posted_date date NOT NULL DEFAULT now(),
  applicants integer NOT NULL DEFAULT 0
);

-- 3. Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status public.college_status NOT NULL,
  resumes_received integer NOT NULL DEFAULT 0,
  contact_email text,
  last_contacted timestamptz NOT NULL DEFAULT now()
);

-- 4. Applicants Table
CREATE TABLE IF NOT EXISTS public.applicants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  job_id uuid,
  college_id uuid,
  stage public.applicant_stage NOT NULL DEFAULT 'Applied',
  source public.applicant_source NOT NULL DEFAULT 'manual',
  applied_date timestamptz NOT NULL DEFAULT now(),
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

-- 5. Applicant Notes Table
CREATE TABLE IF NOT EXISTS public.applicant_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  author_avatar text,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 7. Leave Balances Table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  sick_leave integer NOT NULL DEFAULT 12,
  casual_leave integer NOT NULL DEFAULT 12,
  earned_leave integer NOT NULL DEFAULT 18,
  unpaid_leave integer NOT NULL DEFAULT 0
);

-- 8. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  leave_type public.leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'pending',
  approver_id uuid,
  total_days integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Company Posts Table
CREATE TABLE IF NOT EXISTS public.company_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Kudos Table
CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  value text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Weekly Awards Table
CREATE TABLE IF NOT EXISTS public.weekly_awards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  awarded_user_id uuid NOT NULL,
  awarded_by_user_id uuid NOT NULL,
  reason text NOT NULL,
  week_of date NOT NULL DEFAULT now()
);

-- 12. Onboarding Workflows Table
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  manager_id uuid NOT NULL,
  buddy_id uuid,
  employee_name text NOT NULL,
  employee_avatar text,
  job_title text NOT NULL,
  manager_name text NOT NULL,
  buddy_name text,
  progress integer NOT NULL DEFAULT 0,
  current_step text NOT NULL DEFAULT 'Initiated',
  start_date date NOT NULL
);

-- 13. Performance Reviews Table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  review_date date NOT NULL,
  status public.review_status NOT NULL DEFAULT 'Pending',
  job_title text
);

-- 14. Payslips Table
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  gross_salary numeric(10, 2) NOT NULL,
  net_salary numeric(10, 2) NOT NULL,
  download_url text
);

-- 15. Company Documents Table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  last_updated date NOT NULL,
  download_url text
);

-- 16. Objectives Table
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  quarter text NOT NULL
);

-- 17. Key Results Table
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL,
  description text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  status public.key_result_status NOT NULL DEFAULT 'on_track'
);

-- 18. Expense Reports Table
CREATE TABLE IF NOT EXISTS public.expense_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  status public.expense_report_status NOT NULL DEFAULT 'draft',
  submitted_at timestamptz
);

-- 19. Expense Items Table
CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_report_id uuid NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text
);

-- 20. Helpdesk Tickets Table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category public.helpdesk_ticket_category NOT NULL,
  status public.helpdesk_ticket_status NOT NULL DEFAULT 'Open',
  priority public.helpdesk_ticket_priority NOT NULL DEFAULT 'Medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolver_id uuid
);

-- 21. Ticket Comments Table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ALTER TABLES to add FOREIGN KEYS
-- We drop the constraint first to make the script idempotent
ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_job_id_fkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_college_id_fkey;
ALTER TABLE public.applicants ADD CONSTRAINT applicants_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE SET NULL;

ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_applicant_id_fkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;
ALTER TABLE public.applicant_notes DROP CONSTRAINT IF EXISTS applicant_notes_user_id_fkey;
ALTER TABLE public.applicant_notes ADD CONSTRAINT applicant_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_applicant_id_fkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;
ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_interviewer_id_fkey;
ALTER TABLE public.interviews ADD CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_user_id_fkey;
ALTER TABLE public.leave_balances ADD CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_user_id_fkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_approver_id_fkey;
ALTER TABLE public.leaves ADD CONSTRAINT leaves_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.company_posts DROP CONSTRAINT IF EXISTS company_posts_user_id_fkey;
ALTER TABLE public.company_posts ADD CONSTRAINT company_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_from_user_id_fkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_to_user_id_fkey;
ALTER TABLE public.kudos ADD CONSTRAINT kudos_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_awarded_user_id_fkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_user_id_fkey FOREIGN KEY (awarded_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.weekly_awards DROP CONSTRAINT IF EXISTS weekly_awards_awarded_by_user_id_fkey;
ALTER TABLE public.weekly_awards ADD CONSTRAINT weekly_awards_awarded_by_user_id_fkey FOREIGN KEY (awarded_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_user_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_manager_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_workflows DROP CONSTRAINT IF EXISTS onboarding_workflows_buddy_id_fkey;
ALTER TABLE public.onboarding_workflows ADD CONSTRAINT onboarding_workflows_buddy_id_fkey FOREIGN KEY (buddy_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.performance_reviews DROP CONSTRAINT IF EXISTS performance_reviews_user_id_fkey;
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

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


-- ROW LEVEL SECURITY (RLS) POLICIES
-- We drop policies first to make the script idempotent

-- USERS table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true); -- Assuming a directory is public within the org

-- JOBS table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Jobs are publicly viewable" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Recruiter/Admin to update jobs" ON public.jobs;
CREATE POLICY "Jobs are publicly viewable" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);


-- APPLICANTS table
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to own application via portal" ON public.applicants;
DROP POLICY IF EXISTS "HR/Recruiters can manage all applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow public creation of applicants" ON public.applicants;
CREATE POLICY "Allow public read access to own application via portal" ON public.applicants FOR SELECT USING (id::text = current_setting('request.jwt.claims', true)::jsonb->>'applicant_id');
CREATE POLICY "HR/Recruiters can manage all applicants" ON public.applicants FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer')
);
CREATE POLICY "Allow public creation of applicants" ON public.applicants FOR INSERT WITH CHECK (true);

-- LEAVES table
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees can manage their own leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Managers can view/approve their team's leaves" ON public.leaves;
DROP POLICY IF EXISTS "HR/Admins can manage all leaves" ON public.leaves;
CREATE POLICY "Employees can manage their own leave requests" ON public.leaves FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Managers can view/approve their team's leaves" ON public.leaves FOR ALL
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'team_lead') AND
    user_id IN (SELECT id FROM public.users WHERE department = (SELECT department FROM public.users WHERE id = auth.uid()))
  );
CREATE POLICY "HR/Admins can manage all leaves" ON public.leaves FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Add other table policies similarly...
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view kudos" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Users can give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);

ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view company posts" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "HR/Admins can create posts" ON public.company_posts FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);


-- Storage Policies
-- Avatars bucket policies
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
CREATE POLICY "Allow public read access to avatars" ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

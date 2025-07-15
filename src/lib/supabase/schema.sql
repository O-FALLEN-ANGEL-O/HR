
-- Drop existing policies, functions, and types with dependency management
DROP FUNCTION IF EXISTS get_job_funnel_stats;
DROP FUNCTION IF EXISTS handle_new_user;

DROP TYPE IF EXISTS "user_role";
DROP TYPE IF EXISTS "applicant_stage";
DROP TYPE IF EXISTS "job_status";
DROP TYPE IF EXISTS "leave_type";
DROP TYPE IF EXISTS "leave_status";
DROP TYPE IF EXISTS "onboarding_status";
DROP TYPE IF EXISTS "review_status";
DROP TYPE IF EXISTS "college_status";
DROP TYPE IF EXISTS "interview_status";
DROP TYPE IF EXISTS "interview_type";
DROP TYPE IF EXISTS "kudo_value";
DROP TYPE IF EXISTS "objective_status";
DROP TYPE IF EXISTS "expense_status";
DROP TYPE IF EXISTS "ticket_status";
DROP TYPE IF EXISTS "ticket_priority";
DROP TYPE IF EXISTS "ticket_category";

-- Recreate types
CREATE TYPE "user_role" AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE "applicant_stage" AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE "job_status" AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE "leave_type" AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE "leave_status" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "onboarding_status" AS ENUM ('Not Started', 'In Progress', 'Completed');
CREATE TYPE "review_status" AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE "college_status" AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE "interview_status" AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE "interview_type" AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE "kudo_value" AS ENUM ('Team Player', 'Innovation', 'Customer First', 'Ownership');
CREATE TYPE "objective_status" AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE "expense_status" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE "ticket_status" AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE "ticket_priority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE "ticket_category" AS ENUM ('IT', 'HR', 'Finance', 'General');


-- Create tables with dependencies in mind
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY,
    full_name text,
    avatar_url text,
    role user_role DEFAULT 'guest'::user_role NOT NULL,
    department text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    phone text,
    profile_setup_complete boolean DEFAULT false NOT NULL
);
COMMENT ON TABLE public.users IS 'Public user profiles, linked to auth.users.';

CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status job_status DEFAULT 'Open'::job_status NOT NULL,
    posted_date date NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);
COMMENT ON TABLE public.jobs IS 'Job postings for recruitment.';

CREATE TABLE IF NOT EXISTS public.colleges (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status college_status DEFAULT 'Invited'::college_status NOT NULL,
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text,
    last_contacted date
);
COMMENT ON TABLE public.colleges IS 'Colleges for campus recruitment drives.';


CREATE TABLE IF NOT EXISTS public.applicants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    job_id uuid REFERENCES public.jobs(id),
    stage applicant_stage DEFAULT 'Applied'::applicant_stage NOT NULL,
    applied_date date NOT NULL,
    avatar text,
    source text,
    college_id uuid REFERENCES public.colleges(id),
    resume_data jsonb,
    ai_match_score integer,
    ai_justification text,
    wpm integer,
    accuracy real,
    aptitude_score integer,
    rejection_reason text,
    rejection_notes text,
    comprehensive_score integer,
    english_grammar_score integer,
    customer_service_score integer
);
COMMENT ON TABLE public.applicants IS 'Candidate profiles for job applications.';

CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.applicant_notes IS 'Internal notes on applicants by HR/interviewers.';

CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    time text NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'Scheduled'::interview_status NOT NULL,
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);
COMMENT ON TABLE public.interviews IS 'Scheduled interviews for applicants.';

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 0 NOT NULL,
    casual_leave integer DEFAULT 0 NOT NULL,
    earned_leave integer DEFAULT 0 NOT NULL,
    unpaid_leave integer DEFAULT 0 NOT NULL
);
COMMENT ON TABLE public.leave_balances IS 'Tracks available leave days for each employee.';

CREATE TABLE IF NOT EXISTS public.leaves (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status DEFAULT 'pending'::leave_status NOT NULL,
    approver_id uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_days integer NOT NULL
);
COMMENT ON TABLE public.leaves IS 'Leave requests submitted by employees.';

CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id),
    buddy_id uuid REFERENCES public.users(id),
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0 NOT NULL,
    current_step text,
    start_date date NOT NULL
);
COMMENT ON TABLE public.onboarding_workflows IS 'Tracks new hire onboarding progress.';

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date date NOT NULL,
    status review_status DEFAULT 'Pending'::review_status NOT NULL,
    job_title text
);
COMMENT ON TABLE public.performance_reviews IS 'Employee performance review cycles.';

CREATE TABLE IF NOT EXISTS public.company_posts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.company_posts IS 'Official company announcements and updates.';

CREATE TABLE IF NOT EXISTS public.post_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.post_comments IS 'Comments on company posts.';

CREATE TABLE IF NOT EXISTS public.kudos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id),
    to_user_id uuid NOT NULL REFERENCES public.users(id),
    value kudo_value NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.kudos IS 'Peer-to-peer recognition messages.';

CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id),
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id),
    reason text NOT NULL,
    week_of date NOT NULL
);
COMMENT ON TABLE public.weekly_awards IS 'Employee of the Week awards.';

CREATE TABLE IF NOT EXISTS public.payslips (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10,2) NOT NULL,
    net_salary numeric(10,2) NOT NULL,
    download_url text NOT NULL
);
COMMENT ON TABLE public.payslips IS 'Employee payslip records.';

CREATE TABLE IF NOT EXISTS public.company_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    download_url text NOT NULL
);
COMMENT ON TABLE public.company_documents IS 'Repository for company-wide documents.';

CREATE TABLE IF NOT EXISTS public.objectives (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id),
    title text NOT NULL,
    quarter text NOT NULL
);
COMMENT ON TABLE public.objectives IS 'High-level objectives for OKRs.';

CREATE TABLE IF NOT EXISTS public.key_results (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    status objective_status DEFAULT 'on_track'::objective_status NOT NULL
);
COMMENT ON TABLE public.key_results IS 'Measurable results for objectives in OKRs.';

CREATE TABLE IF NOT EXISTS public.expense_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    title text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status expense_status DEFAULT 'submitted'::expense_status NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.expense_reports IS 'Expense reports submitted by employees.';

CREATE TABLE IF NOT EXISTS public.expense_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text,
    amount numeric(10,2) NOT NULL,
    description text
);
COMMENT ON TABLE public.expense_items IS 'Individual line items within an expense report.';

CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    subject text NOT NULL,
    description text,
    category ticket_category DEFAULT 'General'::ticket_category,
    status ticket_status DEFAULT 'Open'::ticket_status,
    priority ticket_priority DEFAULT 'Medium'::ticket_priority,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolver_id uuid REFERENCES public.users(id)
);
COMMENT ON TABLE public.helpdesk_tickets IS 'Support tickets for IT, HR, etc.';

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.ticket_comments IS 'Comments on helpdesk tickets.';

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, department, avatar_url, profile_setup_complete)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    NEW.raw_user_meta_data ->> 'department',
    NEW.raw_user_meta_data ->> 'avatar_url',
    (NEW.raw_user_meta_data ->> 'profile_setup_complete')::boolean
  );
  
  -- Create a default leave balance for the new user
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave)
  VALUES (NEW.id, 12, 12, 15);
  
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to populate public.users and leave_balances from auth.users on new user creation.';

CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint)
LANGUAGE plpgsql
AS $$
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
      (SELECT 
         stage, 
         COUNT(*) as count 
       FROM 
         public.applicants 
       GROUP BY 
         stage
      ) AS a ON s.stage = a.stage;
END;
$$;
COMMENT ON FUNCTION public.get_job_funnel_stats() IS 'Returns a count of applicants in each stage of the hiring funnel.';


-- Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
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

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to view public user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin to manage user profiles" ON public.users;

DROP POLICY IF EXISTS "Allow all users to view job postings" ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/recruiters to manage job postings" ON public.jobs;

DROP POLICY IF EXISTS "Allow HR/recruiters to view all applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow interviewers to view their assigned applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow applicants to manage their own record" ON public.applicants;

DROP POLICY IF EXISTS "Allow HR/interviewers to manage notes" ON public.applicant_notes;

DROP POLICY IF EXISTS "Allow involved parties to see interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow HR/recruiters to manage interviews" ON public.interviews;

DROP POLICY IF EXISTS "Allow individual to view their own leave" ON public.leaves;
DROP POLICY IF EXISTS "Allow managers to view team leave" ON public.leaves;
DROP POLICY IF EXISTS "Allow HR to view all leave" ON public.leaves;
DROP POLICY IF EXISTS "Allow users to create their own leave requests" ON public.leaves;

DROP POLICY IF EXISTS "Allow user to see their own leave balance" ON public.leave_balances;

DROP POLICY IF EXISTS "Allow authenticated users to view all company content" ON public.company_posts;
DROP POLICY IF EXISTS "Allow authenticated users to view all company content" ON public.post_comments;
DROP POLICY IF EXISTS "Allow authenticated users to view all company content" ON public.kudos;
DROP POLICY IF EXISTS "Allow authenticated users to view all company content" ON public.weekly_awards;
DROP POLICY IF EXISTS "Allow authenticated users to view all company content" ON public.company_documents;

DROP POLICY IF EXISTS "Allow individual user to read their own payslips" ON public.payslips;

-- Policies for public.users
CREATE POLICY "Allow all users to view public user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow individual user to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin to manage user profiles" ON public.users FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr'));

-- Policies for public.jobs
CREATE POLICY "Allow all users to view job postings" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/recruiters to manage job postings" ON public.jobs FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for public.applicants
CREATE POLICY "Allow HR/recruiters to view all applicants" ON public.applicants FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Allow interviewers to view their assigned applicants" ON public.applicants FOR SELECT USING (id IN (SELECT applicant_id FROM public.interviews WHERE interviewer_id = auth.uid()));
CREATE POLICY "Allow applicants to manage their own record" ON public.applicants FOR ALL USING (auth.uid() IS NULL OR (SELECT role FROM public.users WHERE id = auth.uid()) IS NULL); -- Public access for initial creation

-- Policies for public.applicant_notes
CREATE POLICY "Allow HR/interviewers to manage notes" ON public.applicant_notes FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

-- Policies for public.interviews
CREATE POLICY "Allow involved parties to see interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id OR auth.uid() IN (SELECT user_id FROM public.users WHERE role IN ('hr_manager', 'recruiter', 'super_hr', 'admin')));
CREATE POLICY "Allow HR/recruiters to manage interviews" ON public.interviews FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for public.leaves
CREATE POLICY "Allow individual to view their own leave" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers to view team leave" ON public.leaves FOR SELECT USING ((SELECT department FROM public.users WHERE id = auth.uid()) = (SELECT department FROM public.users WHERE id = leaves.user_id) AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'team_lead'));
CREATE POLICY "Allow HR to view all leave" ON public.leaves FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow users to create their own leave requests" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for public.leave_balances
CREATE POLICY "Allow user to see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

-- Policies for company-wide content (posts, kudos, etc.)
CREATE POLICY "Allow authenticated users to view all company content" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view all company content" ON public.post_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view all company content" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view all company content" ON public.weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view all company content" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for public.payslips
CREATE POLICY "Allow individual user to read their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);

-- Storage Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'post_images');

DROP POLICY IF EXISTS "HR can upload post images." ON storage.objects;
CREATE POLICY "HR can upload post images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post_images' AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

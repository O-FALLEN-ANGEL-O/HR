--
-- Main Database Schema
--
-- This file contains the complete schema for the database.
-- It's designed to be idempotent and can be run to set up the
-- database from scratch.
--
-- Order of operations:
-- 1. Drop existing policies, functions, and triggers.
-- 2. Create tables.
-- 3. Create functions and triggers.
-- 4. Create Row Level Security (RLS) policies.
-- 5. Create storage buckets and policies.

-- ----------------------------------------------------------------------------
-- 1. CLEANUP (DROPPING EXISTING OBJECTS)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.weekly_awards CASCADE;
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.company_documents CASCADE;
DROP TABLE IF EXISTS public.objectives CASCADE;
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_comments CASCADE;

DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_category;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;

-- ----------------------------------------------------------------------------
-- 2. CREATE TABLES
-- ----------------------------------------------------------------------------

-- User Roles Enum
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 
  'manager', 'team_lead', 'employee', 'intern', 'guest', 
  'finance', 'it_admin', 'support', 'auditor'
);

-- Users Table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest'::public.user_role,
  department TEXT,
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Job Status Enum
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');

-- Jobs Table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'Open'::public.job_status,
  posted_date TIMESTAMPTZ DEFAULT now(),
  applicants INT DEFAULT 0
);

-- College Status Enum
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');

-- Colleges Table
CREATE TABLE public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    status college_status DEFAULT 'Invited'::public.college_status,
    resumes_received INT DEFAULT 0,
    contact_email TEXT,
    last_contacted TIMESTAMPTZ
);

-- Applicant Stage Enum
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');

-- Applicants Table
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  stage applicant_stage DEFAULT 'Applied'::public.applicant_stage,
  applied_date TIMESTAMPTZ DEFAULT now(),
  avatar TEXT,
  source TEXT,
  resume_data JSONB,
  ai_match_score INT,
  ai_justification TEXT,
  wpm INT,
  accuracy REAL,
  aptitude_score REAL,
  comprehensive_score REAL,
  english_grammar_score REAL,
  customer_service_score REAL,
  rejection_reason TEXT,
  rejection_notes TEXT
);

-- Applicant Notes Table
CREATE TABLE public.applicant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Interview Type & Status Enums
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');

-- Interviews Table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "time" TIME NOT NULL,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'Scheduled'::public.interview_status,
  candidate_name TEXT NOT NULL,
  candidate_avatar TEXT,
  interviewer_name TEXT NOT NULL,
  interviewer_avatar TEXT,
  job_title TEXT
);

-- Leave Balances Table
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave INT DEFAULT 12,
  casual_leave INT DEFAULT 12,
  earned_leave INT DEFAULT 15,
  unpaid_leave INT DEFAULT 0
);

-- Leave Type & Status Enums
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Leaves Table
CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT NOT NULL,
  status leave_status DEFAULT 'pending'::public.leave_status,
  approver_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding Workflows Table
CREATE TABLE public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buddy_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT NOT NULL,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT DEFAULT 'Documentation',
    start_date TIMESTAMPTZ DEFAULT now()
);

-- Performance Review Status Enum
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');

-- Performance Reviews Table
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  status review_status DEFAULT 'Pending'::public.review_status,
  job_title TEXT
);

-- Kudos Table
CREATE TABLE public.kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Awards Table
CREATE TABLE public.weekly_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL
);

-- Company Posts Table
CREATE TABLE public.company_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Post Comments Table
CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Payslips Table
CREATE TABLE public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary REAL NOT NULL,
    net_salary REAL NOT NULL,
    download_url TEXT NOT NULL
);

-- Company Documents Table
CREATE TABLE public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    download_url TEXT NOT NULL
);

-- Key Result Status Enum
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');

-- Objectives Table
CREATE TABLE public.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);

-- Key Results Table
CREATE TABLE public.key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT DEFAULT 0,
    status key_result_status DEFAULT 'on_track'::public.key_result_status
);

-- Expense Status Enum
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');

-- Expense Reports Table
CREATE TABLE public.expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status expense_status DEFAULT 'draft'::public.expense_status,
    submitted_at TIMESTAMPTZ
);

-- Expense Items Table
CREATE TABLE public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT
);

-- Ticket Enums
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- Helpdesk Tickets Table
CREATE TABLE public.helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category DEFAULT 'General'::public.ticket_category,
    status ticket_status DEFAULT 'Open'::public.ticket_status,
    priority ticket_priority DEFAULT 'Medium'::public.ticket_priority,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolver_id UUID REFERENCES public.users(id)
);

-- Ticket Comments Table
CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 3. CREATE FUNCTIONS AND TRIGGERS
-- ----------------------------------------------------------------------------

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation in auth.users
-- We check if the trigger exists before creating it to make the script idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

-- Function to get job funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
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
       applicants 
     GROUP BY 
       stage
    ) AS a 
  ON s.stage = a.stage
  ORDER BY
    CASE s.stage
      WHEN 'Applied' THEN 1
      WHEN 'Phone Screen' THEN 2
      WHEN 'Interview' THEN 3
      WHEN 'Offer' THEN 4
      WHEN 'Hired' THEN 5
      ELSE 6
    END;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can read all public user profiles." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
DROP POLICY IF EXISTS "Admins can manage all user profiles." ON public.users;
DROP POLICY IF EXISTS "Allow public read-only access to all jobs." ON public.jobs;
DROP POLICY IF EXISTS "Allow HR/Admin to manage jobs." ON public.jobs;
DROP POLICY IF EXISTS "Allow public read-only access to all colleges." ON public.colleges;
DROP POLICY IF EXISTS "Allow HR/Admin to manage colleges." ON public.colleges;
DROP POLICY IF EXISTS "Allow anonymous read access to public applicant data." ON public.applicants;
DROP POLICY IF EXISTS "Allow HR/Admin to manage applicants." ON public.applicants;
DROP POLICY IF EXISTS "Interviewers can see candidates they are interviewing." ON public.applicants;
DROP POLICY IF EXISTS "Users can see their own applicant notes." ON public.applicant_notes;
DROP POLICY IF EXISTS "HR/Admin/Interviewers can manage all notes." ON public.applicant_notes;
DROP POLICY IF EXISTS "Interviewers can see their own interviews." ON public.interviews;
DROP POLICY IF EXISTS "HR/Admin can manage all interviews." ON public.interviews;
DROP POLICY IF EXISTS "Allow individual read access." ON public.leaves;
DROP POLICY IF EXISTS "Allow manager access to department leaves." ON public.leaves;
DROP POLICY IF EXISTS "Allow admin/hr access to all leaves." ON public.leaves;
DROP POLICY IF EXISTS "Allow individual access to own leave balances." ON public.leave_balances;
DROP POLICY IF EXISTS "Allow admin/hr access to all leave balances." ON public.leave_balances;
DROP POLICY IF EXISTS "Users can view their own onboarding." ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Managers can view their team members' onboarding." ON public.onboarding_workflows;
DROP POLICY IF EXISTS "HR/Admins can view all onboardings." ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Users can view their own performance reviews." ON public.performance_reviews;
DROP POLICY IF EXISTS "Managers can view their team members' reviews." ON public.performance_reviews;
DROP POLICY IF EXISTS "HR/Admins can manage all reviews." ON public.performance_reviews;
DROP POLICY IF EXISTS "Users can read all kudos." ON public.kudos;
DROP POLICY IF EXISTS "Users can insert their own kudos." ON public.kudos;
DROP POLICY IF EXISTS "Users can read all weekly awards." ON public.weekly_awards;
DROP POLICY IF EXISTS "Managers/HR/Admins can give weekly awards." ON public.weekly_awards;
DROP POLICY IF EXISTS "Users can read all company posts." ON public.company_posts;
DROP POLICY IF EXISTS "HR/Admins can create posts." ON public.company_posts;
DROP POLICY IF EXISTS "Users can read all comments." ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert their own comments." ON public.post_comments;
DROP POLICY IF EXISTS "Users can update their own comments." ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments." ON public.post_comments;
DROP POLICY IF EXISTS "Users can view their own payslips." ON public.payslips;
DROP POLICY IF EXISTS "HR/Admins can view all payslips." ON public.payslips;
DROP POLICY IF EXISTS "Users can read all company documents." ON public.company_documents;
DROP POLICY IF EXISTS "HR/Admins can manage documents." ON public.company_documents;
DROP POLICY IF EXISTS "Users can view their own OKRs." ON public.objectives;
DROP POLICY IF EXISTS "Managers can view team OKRs." ON public.objectives;
DROP POLICY IF EXISTS "HR/Admins can view all OKRs." ON public.objectives;
DROP POLICY IF EXISTS "Allow all access for related objectives." ON public.key_results;
DROP POLICY IF EXISTS "Users can manage their own expense reports." ON public.expense_reports;
DROP POLICY IF EXISTS "Admins/Finance can manage all reports." ON public.expense_reports;
DROP POLICY IF EXISTS "Users can manage their own tickets." ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Support staff can manage all tickets." ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can view comments on their own tickets." ON public.ticket_comments;
DROP POLICY IF EXISTS "Users can insert comments on their own tickets." ON public.ticket_comments;
DROP POLICY IF EXISTS "Support staff can manage all comments." ON public.ticket_comments;

-- Policies for public.users
CREATE POLICY "Users can read all public user profiles." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all user profiles." ON public.users FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr')) WITH CHECK (get_my_claim('user_role') IN ('admin', 'super_hr'));

-- Policies for public.jobs
CREATE POLICY "Allow public read-only access to all jobs." ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Admin to manage jobs." ON public.jobs FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for public.colleges
CREATE POLICY "Allow public read-only access to all colleges." ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow HR/Admin to manage colleges." ON public.colleges FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for public.applicants
CREATE POLICY "Allow anonymous read access to public applicant data." ON public.applicants FOR SELECT USING (true);
CREATE POLICY "Allow HR/Admin to manage applicants." ON public.applicants FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Interviewers can see candidates they are interviewing." ON public.applicants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.interviews WHERE interviews.applicant_id = applicants.id AND interviews.interviewer_id = auth.uid()
  )
);

-- Policies for public.applicant_notes
CREATE POLICY "Users can see their own applicant notes." ON public.applicant_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admin/Interviewers can manage all notes." ON public.applicant_notes FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

-- Policies for public.interviews
CREATE POLICY "Interviewers can see their own interviews." ON public.interviews FOR SELECT USING (interviewer_id = auth.uid());
CREATE POLICY "HR/Admin can manage all interviews." ON public.interviews FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Policies for public.leaves
CREATE POLICY "Allow individual read access." ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow manager access to department leaves." ON public.leaves FOR SELECT USING (
  get_my_claim('user_role') IN ('manager', 'team_lead') AND
  department = (SELECT department FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Allow admin/hr access to all leaves." ON public.leaves FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for public.leave_balances
CREATE POLICY "Allow individual access to own leave balances." ON public.leave_balances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow admin/hr access to all leave balances." ON public.leave_balances FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for public.onboarding_workflows
CREATE POLICY "Users can view their own onboarding." ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view their team members' onboarding." ON public.onboarding_workflows FOR SELECT USING (auth.uid() = manager_id);
CREATE POLICY "HR/Admins can view all onboardings." ON public.onboarding_workflows FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for public.performance_reviews
CREATE POLICY "Users can view their own performance reviews." ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view their team members' reviews." ON public.performance_reviews FOR SELECT USING (
    (get_my_claim('user_role') IN ('manager', 'team_lead')) AND
    EXISTS (SELECT 1 FROM users WHERE users.id = performance_reviews.user_id AND users.department = (SELECT u.department FROM users u WHERE u.id = auth.uid()))
);
CREATE POLICY "HR/Admins can manage all reviews." ON public.performance_reviews FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for public.kudos & weekly_awards
CREATE POLICY "Users can read all kudos." ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Users can insert their own kudos." ON public.kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can read all weekly awards." ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Managers/HR/Admins can give weekly awards." ON public.weekly_awards FOR INSERT WITH CHECK (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- Policies for public.company_posts and comments
CREATE POLICY "Users can read all company posts." ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "HR/Admins can create posts." ON public.company_posts FOR INSERT WITH CHECK (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Users can read all comments." ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments." ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Policies for payslips & documents
CREATE POLICY "Users can view their own payslips." ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Admins can view all payslips." ON public.payslips FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can read all company documents." ON public.company_documents FOR SELECT USING (true);
CREATE POLICY "HR/Admins can manage documents." ON public.company_documents FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));

-- Policies for OKRs
CREATE POLICY "Users can view their own OKRs." ON public.objectives FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Managers can view team OKRs." ON public.objectives FOR SELECT USING (
    get_my_claim('user_role') IN ('manager', 'team_lead') AND
    EXISTS (SELECT 1 FROM users WHERE users.id = objectives.owner_id AND users.department = (SELECT u.department FROM users u WHERE u.id = auth.uid()))
);
CREATE POLICY "HR/Admins can view all OKRs." ON public.objectives FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Allow all access for related objectives." ON public.key_results FOR ALL USING (
    EXISTS (SELECT 1 FROM objectives WHERE objectives.id = key_results.objective_id)
);

-- Policies for Expenses
CREATE POLICY "Users can manage their own expense reports." ON public.expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins/Finance can manage all reports." ON public.expense_reports FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'finance'));

-- Policies for Helpdesk
CREATE POLICY "Users can manage their own tickets." ON public.helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support staff can manage all tickets." ON public.helpdesk_tickets FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'it_admin', 'support', 'hr_manager'));
CREATE POLICY "Users can view comments on their own tickets." ON public.ticket_comments FOR SELECT USING (EXISTS (SELECT 1 FROM helpdesk_tickets WHERE helpdesk_tickets.id = ticket_comments.ticket_id));
CREATE POLICY "Users can insert comments on their own tickets." ON public.ticket_comments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM helpdesk_tickets WHERE helpdesk_tickets.id = ticket_comments.ticket_id AND helpdesk_tickets.user_id = auth.uid()));
CREATE POLICY "Support staff can manage all comments." ON public.ticket_comments FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'it_admin', 'support', 'hr_manager'));

-- ----------------------------------------------------------------------------
-- 5. STORAGE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "HR/Admin can upload post images." ON storage.objects;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;


CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );
  
CREATE POLICY "Post images are publicly accessible." ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'post_images' );

CREATE POLICY "HR/Admin can upload post images." ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'post_images' AND
    get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager')
  );

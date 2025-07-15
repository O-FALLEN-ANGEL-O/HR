-- Drop existing objects
-- Drop policies first to remove dependencies on tables
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow admins to manage everything" ON public.users;
DROP POLICY IF EXISTS "Allow HR and Admins to read all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow admin and HR to read all applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow admin and HR to manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.colleges;
DROP POLICY IF EXISTS "Allow admin and HR to manage colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow all access for admins and HR" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow user to see their own onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow manager to see their team's onboarding" ON public.onboarding_workflows;
DROP POLICY IF EXISTS "Allow employees to manage their own reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow managers to manage team reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Allow HR/Admins to manage all reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Employees can manage their own leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can see their team's leave requests" ON public.leaves;
DROP POLICY IF EXISTS "HR and Admins can manage all leaves" ON public.leaves;

-- Drop tables
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.performance_reviews;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.company_posts;
DROP TABLE IF EXISTS public.kudos;
DROP TABLE IF EXISTS public.weekly_awards;
DROP TABLE IF EXISTS public.payslips;
DROP TABLE IF EXISTS public.company_documents;
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.key_results;
DROP TABLE IF EXISTS public.expense_reports;
DROP TABLE IF EXISTS public.expense_items;
DROP TABLE IF EXISTS public.helpdesk_tickets;
DROP TABLE IF EXISTS public.ticket_comments;

-- Drop custom types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.okr_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;


-- Create custom types
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 
  'manager', 'team_lead', 'employee', 'intern', 'guest', 
  'finance', 'it_admin', 'support', 'auditor'
);

CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.okr_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');


-- Create tables
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,
  role user_role DEFAULT 'guest'::user_role,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT false
);

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status NOT NULL,
  posted_date TIMESTAMPTZ NOT NULL,
  applicants INT NOT NULL DEFAULT 0
);

CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status college_status NOT NULL,
  resumes_received INT NOT NULL DEFAULT 0,
  contact_email TEXT NOT NULL UNIQUE,
  last_contacted TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  stage applicant_stage NOT NULL,
  applied_date TIMESTAMPTZ NOT NULL,
  avatar TEXT,
  source applicant_source,
  resume_data JSONB,
  ai_match_score INT,
  ai_justification TEXT,
  wpm INT,
  accuracy INT,
  aptitude_score INT,
  comprehensive_score INT,
  english_grammar_score INT,
  customer_service_score INT,
  rejection_reason TEXT,
  rejection_notes TEXT
);

CREATE TABLE public.onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buddy_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  employee_avatar TEXT,
  job_title TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  buddy_name TEXT,
  progress INT NOT NULL DEFAULT 0,
  current_step TEXT NOT NULL DEFAULT 'Welcome Email Sent',
  start_date TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_date TIMESTAMPTZ,
  status review_status NOT NULL DEFAULT 'Pending',
  job_title TEXT
);

CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sick_leave INT NOT NULL DEFAULT 12,
  casual_leave INT NOT NULL DEFAULT 12,
  earned_leave INT NOT NULL DEFAULT 12,
  unpaid_leave INT NOT NULL DEFAULT 0
);

CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status leave_status NOT NULL,
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  total_days INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.applicant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  type interview_type NOT NULL,
  status interview_status NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_avatar TEXT,
  interviewer_name TEXT NOT NULL,
  interviewer_avatar TEXT,
  job_title TEXT NOT NULL
);

CREATE TABLE public.company_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.weekly_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary DECIMAL(10, 2) NOT NULL,
    net_salary DECIMAL(10, 2) NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  status okr_status NOT NULL DEFAULT 'on_track'
);

CREATE TABLE public.expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status expense_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT
);

CREATE TABLE public.helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category NOT NULL,
    status ticket_status NOT NULL DEFAULT 'Open',
    priority ticket_priority NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolver_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Functions and Triggers
-- This function will be called by a trigger when a new user is created in the auth.users table.
-- It inserts a corresponding row into the public.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, email, role, department, profile_setup_complete)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.raw_user_meta_data->>'department',
    false
  );
  -- Also initialize their leave balance
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This trigger calls the handle_new_user function whenever a new user is created.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

-- Function to get a user's role from the public table, safely.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_input uuid)
RETURNS user_role AS $$
DECLARE
  user_role_output user_role;
BEGIN
  SELECT role INTO user_role_output FROM public.users WHERE id = user_id_input;
  RETURN user_role_output;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's department from the public table.
CREATE OR REPLACE FUNCTION public.get_user_department(user_id_input uuid)
RETURNS TEXT AS $$
DECLARE
  department_output TEXT;
BEGIN
  SELECT department INTO department_output FROM public.users WHERE id = user_id_input;
  RETURN department_output;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (Row Level Security)
-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admins to manage everything" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Allow HR and Admins to read all profiles" ON public.users FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));

-- Policies for public.jobs
CREATE POLICY "Allow admin and HR to manage jobs" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'recruiter', 'super_hr'));
CREATE POLICY "Enable read access for all users" ON public.jobs FOR SELECT USING (true);

-- Policies for public.applicants
CREATE POLICY "Allow admin and HR to read all applicants" ON public.applicants FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'recruiter', 'super_hr'));

-- Policies for public.colleges
CREATE POLICY "Enable read access for all users" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Allow admin and HR to manage colleges" ON public.colleges FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'recruiter', 'super_hr'));

-- Policies for public.onboarding_workflows
CREATE POLICY "Allow all access for admins and HR" ON public.onboarding_workflows FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));
CREATE POLICY "Allow user to see their own onboarding" ON public.onboarding_workflows FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow manager to see their team's onboarding" ON public.onboarding_workflows FOR SELECT USING (manager_id = auth.uid());

-- Policies for public.performance_reviews
CREATE POLICY "Allow employees to manage their own reviews" ON public.performance_reviews FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Allow managers to manage team reviews" ON public.performance_reviews FOR ALL USING (public.get_user_department(user_id) = public.get_user_department(auth.uid()) AND public.get_user_role(auth.uid()) IN ('manager', 'team_lead'));
CREATE POLICY "Allow HR/Admins to manage all reviews" ON public.performance_reviews FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));

-- Policies for public.leaves
CREATE POLICY "Employees can manage their own leaves" ON public.leaves FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (public.get_user_department(user_id) = public.get_user_department(auth.uid()) AND public.get_user_role(auth.uid()) IN ('manager', 'team_lead'));
CREATE POLICY "HR and Admins can manage all leaves" ON public.leaves FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'hr_manager', 'super_hr'));

-- Storage Policies
-- Assuming a bucket named 'avatars' exists
-- Give all users read access to avatars
-- CREATE POLICY "allow_read_access_to_all" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- Allow authenticated users to upload their own avatar
-- CREATE POLICY "allow_individual_avatar_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
-- Allow authenticated users to update their own avatar
-- CREATE POLICY "allow_individual_avatar_update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);


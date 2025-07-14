-- ⚠️ WARNING: This script will completely reset your database.
-- All data will be lost.
-- It is designed for a clean, fresh start.

-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_job_funnel_stats() CASCADE;

-- 🧹 Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.expense_reports CASCADE;
DROP TABLE IF EXISTS public.key_results CASCADE;
DROP TABLE IF EXISTS public.objectives CASCADE;
DROP TABLE IF EXISTS public.company_documents CASCADE;
DROP TABLE IF EXISTS public.payslips CASCADE;
DROP TABLE IF EXISTS public.weekly_awards CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.company_posts CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.applicant_notes CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.metrics CASCADE;

-- ❌ Drop ENUM types safely
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;

-- ✅ Recreate ENUM types
CREATE TYPE public.user_role AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual', 'referral');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.onboarding_status AS ENUM ('Not Started', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');

--
-- Tables
--

-- Users table to store public-facing profile information.
-- This is linked to the auth.users table via the 'id' column.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for HR Dashboard Metrics
CREATE TABLE IF NOT EXISTS public.metrics (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    value TEXT NOT NULL,
    change TEXT,
    change_type TEXT
);

-- Table for Job Postings
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    status job_status DEFAULT 'Open',
    applicants INT DEFAULT 0,
    posted_date TIMESTAMPTZ DEFAULT now()
);

-- Table for Colleges (Campus Recruitment)
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status college_status DEFAULT 'Invited',
    resumes_received INT DEFAULT 0,
    contact_email TEXT UNIQUE NOT NULL,
    last_contacted TIMESTAMPTZ DEFAULT now()
);

-- Table for Applicants
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage applicant_stage DEFAULT 'Applied',
    applied_date TIMESTAMPTZ DEFAULT now(),
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

-- Table for Applicant Notes
CREATE TABLE IF NOT EXISTS public.applicant_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'Scheduled',
    candidate_name TEXT,
    candidate_avatar TEXT,
    interviewer_name TEXT,
    interviewer_avatar TEXT,
    job_title TEXT
);

-- Table for Leave Balances
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave INT DEFAULT 12,
    casual_leave INT DEFAULT 12,
    earned_leave INT DEFAULT 15,
    unpaid_leave INT DEFAULT 0
);

-- Table for Leave Requests
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Table for Onboarding Workflows
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT,
    manager_name TEXT,
    buddy_name TEXT,
    progress INT DEFAULT 0,
    current_step TEXT DEFAULT 'Initial Setup',
    start_date DATE DEFAULT now()
);

-- Table for Company Posts (Feed)
CREATE TABLE IF NOT EXISTS public.company_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Kudos
CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Weekly Awards
CREATE TABLE IF NOT EXISTS public.weekly_awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Payslips
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary NUMERIC(10, 2) NOT NULL,
    net_salary NUMERIC(10, 2) NOT NULL,
    download_url TEXT NOT NULL
);

-- Table for Company Documents
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    last_updated DATE NOT NULL,
    download_url TEXT NOT NULL
);

-- Table for Performance Reviews
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title TEXT,
    review_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending'
);

-- Table for Objectives (OKRs)
CREATE TABLE IF NOT EXISTS public.objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);

-- Table for Key Results (OKRs)
CREATE TABLE IF NOT EXISTS public.key_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    status key_result_status NOT NULL DEFAULT 'on_track'
);

-- Table for Expense Reports
CREATE TABLE IF NOT EXISTS public.expense_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status expense_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    reimbursed_at TIMESTAMPTZ
);

-- Table for Expense Items (line items in a report)
CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT
);

-- Table for Helpdesk Tickets
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category NOT NULL,
    status ticket_status NOT NULL DEFAULT 'Open',
    priority ticket_priority NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolver_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Table for Helpdesk Ticket Comments
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

--
-- Functions
--

-- Helper function to get a user's role from their JWT claims.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Fetches the role of the specified user from the public users table.';

-- Helper function to get a user's department from their profile.
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT department FROM public.users WHERE id = user_id;
$$;
COMMENT ON FUNCTION public.get_user_department(uuid) IS 'Fetches the department of the specified user.';

-- Helper function for dashboard stats
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT)
LANGUAGE sql
AS $$
    SELECT stage, count(*) as count
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

--
-- Triggers
--

-- This trigger automatically creates a user entry in public.users when a new user signs up in Supabase auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, avatar_url, department)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'department'
  );

  INSERT INTO public.leave_balances (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists before creating it to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--
-- Row Level Security (RLS) Policies
--

-- Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true); -- For employee directory
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr'));

-- Applicants Table
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters and HR can manage applicants" ON public.applicants FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'));
CREATE POLICY "Interviewers and Managers can view applicants in their interview pipeline or department" ON public.applicants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.applicant_id = applicants.id AND interviews.interviewer_id = auth.uid()
    ) OR
    (
      public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND
      EXISTS (
        SELECT 1 FROM public.jobs WHERE jobs.id = applicants.job_id AND jobs.department = public.get_user_department(auth.uid())
      )
    )
  );
  
-- Applicant Notes Table
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hiring team can manage notes" ON public.applicant_notes FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager', 'interviewer', 'manager'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager', 'interviewer', 'manager'));


-- Interviews Table
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hiring team can manage interviews" ON public.interviews FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'));
CREATE POLICY "Assigned interviewers can view their interviews" ON public.interviews FOR SELECT USING (interviewer_id = auth.uid());
CREATE POLICY "Interviewers can update status of interviews they are on" ON public.interviews FOR UPDATE
  USING (interviewer_id = auth.uid())
  WITH CHECK (interviewer_id = auth.uid());


-- Leave Balances Table
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own leave balance" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "HR can view all leave balances" ON public.leave_balances FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- Leaves Table
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own leave requests" ON public.leaves FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND
    EXISTS (
      SELECT 1 FROM public.users WHERE users.id = leaves.user_id AND users.department = public.get_user_department(auth.uid())
    )
  );
CREATE POLICY "HR and Admins can manage all leave requests" ON public.leaves FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- All other tables can be public for now for simplicity
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Hiring team can manage jobs" ON public.jobs FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'));


ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hiring team can manage colleges" ON public.colleges FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'recruiter', 'hr_manager'));

ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage onboarding" ON public.onboarding_workflows FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Employee can view their own onboarding" ON public.onboarding_workflows FOR SELECT
  USING (user_id = auth.uid() OR manager_id = auth.uid() OR buddy_id = auth.uid());


ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view their own reviews" ON public.performance_reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Managers and HR can manage reviews" ON public.performance_reviews FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can read company posts" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "HR/Admin can create posts" ON public.company_posts FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can read and create kudos" ON public.kudos FOR ALL USING (true);

ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can read weekly awards" ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Managers and HR can create awards" ON public.weekly_awards FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
    
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "HR can manage payslips" ON public.payslips FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can read documents" ON public.company_documents FOR SELECT USING (true);
CREATE POLICY "HR can manage documents" ON public.company_documents FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own objectives" ON public.objectives FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Managers and HR can see all objectives" ON public.objectives FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage key results for objectives they own" ON public.key_results FOR ALL
    USING (EXISTS (SELECT 1 FROM public.objectives WHERE objectives.id = key_results.objective_id AND objectives.owner_id = auth.uid()));

ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own expense reports" ON public.expense_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Finance and Admins can manage all reports" ON public.expense_reports FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'finance'));

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items on their own reports" ON public.expense_items FOR ALL
    USING (EXISTS (SELECT 1 FROM public.expense_reports WHERE expense_reports.id = expense_items.expense_report_id AND expense_reports.user_id = auth.uid()));

ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tickets" ON public.helpdesk_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Support staff and Admins can manage all tickets" ON public.helpdesk_tickets FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'it_admin', 'support'));

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage comments on their own tickets" ON public.ticket_comments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.helpdesk_tickets WHERE helpdesk_tickets.id = ticket_comments.ticket_id AND helpdesk_tickets.user_id = auth.uid()));
CREATE POLICY "Support staff can manage all comments" ON public.ticket_comments FOR ALL
    USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'it_admin', 'support'));
    
COMMENT ON POLICY "Hiring team can manage colleges" ON public.colleges IS 'Allows Admin, Super HR, Recruiter, and HR Manager to perform all operations on the colleges table.';
COMMENT ON POLICY "Hiring team can manage jobs" ON public.jobs IS 'Allows Admin, Super HR, Recruiter, and HR Manager to perform all operations on the jobs table.';
COMMENT ON POLICY "All users can view jobs" ON public.jobs IS 'Allows any authenticated user to view job postings.';
COMMENT ON POLICY "Recruiters and HR can manage applicants" ON public.applicants IS 'Allows full control over applicants for hiring roles.';
COMMENT ON POLICY "Interviewers and Managers can view applicants in their interview pipeline or department" ON public.applicants IS 'Allows interviewers and managers to see candidates they are involved with.';
COMMENT ON POLICY "Hiring team can manage notes" ON public.applicant_notes IS 'Allows relevant hiring roles to add and view notes on applicants.';
COMMENT ON POLICY "Hiring team can manage interviews" ON public.interviews IS 'Allows HR and recruiters to schedule and modify any interview.';
COMMENT ON POLICY "Assigned interviewers can view their interviews" ON public.interviews IS 'Allows an interviewer to see the details of interviews they are assigned to.';
COMMENT ON POLICY "Interviewers can update status of interviews they are on" ON public.interviews IS 'Allows an interviewer to mark their assigned interviews as complete or canceled.';
COMMENT ON POLICY "Users can view their own profile" ON public.users IS 'Enables users to read their own profile data.';
COMMENT ON POLICY "Users can update their own profile" ON public.users IS 'Allows users to modify their own profile information.';
COMMENT ON POLICY "Users can view all profiles" ON public.users IS 'Makes all user profiles visible for features like the Employee Directory.';
COMMENT ON POLICY "Admins can manage all users" ON public.users IS 'Gives admin and super_hr full control over the users table.';
COMMENT ON POLICY "Users can view their own leave balance" ON public.leave_balances IS 'Allows employees to see how many leave days they have.';
COMMENT ON POLICY "HR can view all leave balances" ON public.leave_balances IS 'Allows HR roles to see anyone''s leave balance.';
COMMENT ON POLICY "Users can manage their own leave requests" ON public.leaves IS 'Allows an employee to create, view, and cancel their own leave requests.';
COMMENT ON POLICY "Managers can see their team''s leave requests" ON public.leaves IS 'Allows managers to view leave requests from employees within their same department.';
COMMENT ON POLICY "HR and Admins can manage all leave requests" ON public.leaves IS 'Gives HR and admin roles full control to approve, reject, and view all leave requests.';
COMMENT ON POLICY "HR can manage onboarding" ON public.onboarding_workflows IS 'Allows HR roles to create and manage all onboarding workflows.';
COMMENT ON POLICY "Employee can view their own onboarding" ON public.onboarding_workflows IS 'Allows the new employee, their manager, and their buddy to view the onboarding workflow.';
COMMENT ON POLICY "Employees can view their own reviews" ON public.performance_reviews IS 'Allows an employee to see their own performance review.';
COMMENT ON POLICY "Managers and HR can manage reviews" ON public.performance_reviews IS 'Allows managers and HR to create and manage all performance reviews.';
COMMENT ON POLICY "All users can read company posts" ON public.company_posts IS 'Allows anyone to see the company feed.';
COMMENT ON POLICY "HR/Admin can create posts" ON public.company_posts IS 'Restricts post creation to HR and admin roles.';
COMMENT ON POLICY "All users can read and create kudos" ON public.kudos IS 'Allows any user to give and see kudos.';
COMMENT ON POLICY "All users can read weekly awards" ON public.weekly_awards IS 'Allows anyone to see the employee of the week.';
COMMENT ON POLICY "Managers and HR can create awards" ON public.weekly_awards IS 'Restricts giving the weekly award to managers and HR.';
COMMENT ON POLICY "Users can view own payslips" ON public.payslips IS 'Ensures users can only access their own payslips.';
COMMENT ON POLICY "HR can manage payslips" ON public.payslips IS 'Allows HR and finance roles to manage all payslips.';
COMMENT ON POLICY "All users can read documents" ON public.company_documents IS 'Allows any employee to view company documents.';
COMMENT ON POLICY "HR can manage documents" ON public.company_documents IS 'Allows HR to upload and manage company documents.';
COMMENT ON POLICY "Users can manage own objectives" ON public.objectives IS 'Allows users to set and update their own OKRs.';
COMMENT ON POLICY "Managers and HR can see all objectives" ON public.objectives IS 'Allows managers and HR to view and manage all OKRs for reporting.';
COMMENT ON POLICY "Users can manage key results for objectives they own" ON public.key_results IS 'Allows users to update progress on key results for their own objectives.';
COMMENT ON POLICY "Users can manage own expense reports" ON public.expense_reports IS 'Allows employees to create and track their own expenses.';
COMMENT ON POLICY "Finance and Admins can manage all reports" ON public.expense_reports IS 'Allows finance and admin roles to approve, reject, and process all expense reports.';
COMMENT ON POLICY "Users can manage items on their own reports" ON public.expense_items IS 'Allows employees to add line items to their own expense reports.';
COMMENT ON POLICY "Users can manage own tickets" ON public.helpdesk_tickets IS 'Allows employees to create and comment on their own support tickets.';
COMMENT ON POLICY "Support staff and Admins can manage all tickets" ON public.helpdesk_tickets IS 'Gives support roles full control over the helpdesk system.';
COMMENT ON POLICY "Users can manage comments on their own tickets" ON public.ticket_comments IS 'Allows the ticket creator to add comments.';
COMMENT ON POLICY "Support staff can manage all comments" ON public.ticket_comments IS 'Allows support staff to comment on any ticket.';

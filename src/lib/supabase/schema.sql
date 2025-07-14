
-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_department(user_id uuid) CASCADE;

-- 🧹 Drop tables in reverse dependency order with CASCADE
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
DROP TABLE IF EXISTS public.metrics CASCADE;

-- ❌ Drop ENUM types safely now that dependencies are gone
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


-- ________________________________________
--
--           TABLES
-- ________________________________________

-- Metrics Table
CREATE TABLE public.metrics (
  id SERIAL PRIMARY KEY,
  title TEXT,
  value TEXT,
  change TEXT,
  change_type TEXT
);

-- Jobs Table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'Open',
  applicants INT DEFAULT 0,
  posted_date TIMESTAMPTZ DEFAULT now()
);

-- Colleges Table
CREATE TABLE public.colleges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status college_status DEFAULT 'Invited',
  resumes_received INT DEFAULT 0,
  contact_email TEXT UNIQUE,
  last_contacted TIMESTAMPTZ DEFAULT now()
);

-- Applicants Table
CREATE TABLE public.applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
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

-- Applicant Notes Table
CREATE TABLE public.applicant_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_avatar TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Interviews Table
CREATE TABLE public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date TIMESTAMPTZ,
  time TEXT,
  type interview_type,
  status interview_status DEFAULT 'Scheduled',
  candidate_name TEXT,
  candidate_avatar TEXT,
  interviewer_name TEXT,
  interviewer_avatar TEXT,
  job_title TEXT
);

-- Onboarding Workflows Table
CREATE TABLE public.onboarding_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buddy_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name TEXT,
  employee_avatar TEXT,
  job_title TEXT,
  manager_name TEXT,
  buddy_name TEXT,
  progress INT DEFAULT 0,
  current_step TEXT DEFAULT 'Welcome Email Sent',
  start_date TIMESTAMPTZ DEFAULT now()
);

-- Performance Reviews Table
CREATE TABLE public.performance_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Pending',
  job_title TEXT
);

-- Leave Balances Table
CREATE TABLE public.leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sick_leave INT DEFAULT 10,
  casual_leave INT DEFAULT 10,
  earned_leave INT DEFAULT 15,
  unpaid_leave INT DEFAULT 0
);

-- Leaves Table
CREATE TABLE public.leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_days INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company Posts Table
CREATE TABLE public.company_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kudos Table
CREATE TABLE public.kudos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Awards Table
CREATE TABLE public.weekly_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  awarded_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  awarded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  week_of DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payslips Table
CREATE TABLE public.payslips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INT NOT NULL,
  gross_salary NUMERIC(10, 2) NOT NULL,
  net_salary NUMERIC(10, 2) NOT NULL,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company Documents Table
CREATE TABLE public.company_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  download_url TEXT
);

-- Objectives Table
CREATE TABLE public.objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Key Results Table
CREATE TABLE public.key_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INT DEFAULT 0,
  status key_result_status DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expense Reports Table
CREATE TABLE public.expense_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status expense_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ
);

-- Expense Items Table
CREATE TABLE public.expense_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  date DATE,
  category TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT
);

-- Helpdesk Tickets Table
CREATE TABLE public.helpdesk_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  category ticket_category,
  status ticket_status DEFAULT 'Open',
  priority ticket_priority DEFAULT 'Medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Ticket Comments Table
CREATE TABLE public.ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ________________________________________
--
--    RLS POLICIES & HELPER FUNCTIONS
-- ________________________________________


-- Create the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT raw_user_meta_data->>'role'
  FROM auth.users
  WHERE id = user_id;
$$;

-- Create the get_user_department function
CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT raw_user_meta_data->>'department'
  FROM auth.users
  WHERE id = user_id;
$$;


-- Set up RLS for all tables
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
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


-- ________________________________________
--
--      POLICIES
-- ________________________________________

-- Metrics: Publicly viewable
CREATE POLICY "Public can view metrics" ON public.metrics FOR SELECT USING (true);
CREATE POLICY "Admins can manage metrics" ON public.metrics FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Jobs: Publicly viewable, restricted creation/update
CREATE POLICY "Public can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "HR/Admin can create jobs" ON public.jobs FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR/Admin can update jobs" ON public.jobs FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));


-- Colleges: Publicly viewable, restricted creation/update
CREATE POLICY "Public can view colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "HR/Admin can create colleges" ON public.colleges FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR/Admin can update colleges" ON public.colleges FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));


-- Applicants: Viewable by relevant roles, restricted creation/update
CREATE POLICY "HR/Admin/Interviewer can view applicants" ON public.applicants FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "Public can create an applicant profile" ON public.applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "HR/Admin can update applicants" ON public.applicants FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));

-- Applicant Notes: Viewable by relevant roles, restricted creation
CREATE POLICY "HR/Admin/Interviewer can view notes" ON public.applicant_notes FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));
CREATE POLICY "HR/Admin/Interviewer can create notes" ON public.applicant_notes FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager'));


-- Interviews: Viewable by relevant roles, restricted creation/update
CREATE POLICY "Involved parties can view interviews" ON public.interviews FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager') OR interviewer_id = auth.uid());
CREATE POLICY "HR/Admin/Manager can schedule interviews" ON public.interviews FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager'));
CREATE POLICY "HR/Admin/Manager can update interviews" ON public.interviews FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager'));


-- Onboarding: Viewable by relevant roles and the user themselves
CREATE POLICY "Involved parties can view onboarding" ON public.onboarding_workflows FOR SELECT USING (user_id = auth.uid() OR manager_id = auth.uid() OR buddy_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "HR/Admin can create onboarding" ON public.onboarding_workflows FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- Leave Balances: Users can see their own, HR/Admins can see all
CREATE POLICY "Users can see own leave balance" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "HR/Admin can see all leave balances" ON public.leave_balances FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

-- Leaves: Users can see own, Managers their team's, HR/Admins all
CREATE POLICY "Users can manage own leaves" ON public.leaves FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Managers can see their team's leaves" ON public.leaves FOR SELECT USING (public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND public.get_user_department(user_id) = public.get_user_department(auth.uid()));
CREATE POLICY "HR/Admin can see all leaves" ON public.leaves FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "HR/Admin/Manager can approve leaves" ON public.leaves FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead')) WITH CHECK (status IN ('approved', 'rejected'));

-- Company Posts & Kudos: Viewable by all authenticated, restricted creation
CREATE POLICY "Authenticated users can view company feed and kudos" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Admin can create company posts" ON public.company_posts FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Authenticated users can give kudos" ON public.kudos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Managers/HR/Admin can give weekly awards" ON public.weekly_awards FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));


-- Payslips & Documents: Users can see own, HR/Admin can see all
CREATE POLICY "Users can see own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can view company documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Admin can manage financial docs" ON public.payslips FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "HR/Admin can manage company docs" ON public.company_documents FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));


-- Performance, Objectives, Key Results: Users see their own, Managers their team's, HR/Admins see all
CREATE POLICY "Users can manage own performance data" ON public.performance_reviews FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Managers can view team performance data" ON public.performance_reviews FOR SELECT USING (public.get_user_role(auth.uid()) IN ('manager', 'team_lead') AND public.get_user_department(user_id) = public.get_user_department(auth.uid()));
CREATE POLICY "HR/Admin can view all performance data" ON public.performance_reviews FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

CREATE POLICY "Users can manage own objectives" ON public.objectives FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users can manage own key results" ON public.key_results FOR ALL USING (objectives.owner_id = auth.uid());
CREATE POLICY "Public can view all OKRs" ON public.objectives FOR SELECT USING (true);
CREATE POLICY "Public can view all KRs" ON public.key_results FOR SELECT USING (true);


-- Expenses: Users see own, Finance/HR/Admin see all
CREATE POLICY "Users can manage own expense reports" ON public.expense_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Finance/HR/Admins can see all expense reports" ON public.expense_reports FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can manage items for own reports" ON public.expense_items FOR ALL USING ((SELECT user_id FROM public.expense_reports WHERE id = expense_report_id) = auth.uid());
CREATE POLICY "Finance/HR/Admins can see all expense items" ON public.expense_items FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'finance'));


-- Helpdesk: Users see own, support roles see all
CREATE POLICY "Users can manage own tickets" ON public.helpdesk_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Support roles can view all tickets" ON public.helpdesk_tickets FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));
CREATE POLICY "Support roles can update tickets" ON public.helpdesk_tickets FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));

CREATE POLICY "Involved parties can manage comments" ON public.ticket_comments FOR ALL USING (
    (SELECT user_id FROM public.helpdesk_tickets WHERE id = ticket_id) = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support')
);

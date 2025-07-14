-- HR+ Platform Complete Database Setup
-- This script will:
-- 1. Drop all existing application tables for a clean slate.
-- 2. Create all necessary tables with the correct schema and relationships.
-- 3. Populate the tables with realistic fake data.
-- To run: Copy and paste the entire content of this file into the Supabase SQL Editor.

-- ========== 1. DROP EXISTING OBJECTS ==========
-- Drop tables in reverse order of dependency to be safe. CASCADE handles dependencies.
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
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.applicants CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.helpdesk_category;
DROP TYPE IF EXISTS public.helpdesk_status;
DROP TYPE IF EXISTS public.helpdesk_priority;


-- ========== 2. CREATE TYPES & TABLES ==========

-- Create custom enum types
CREATE TYPE public.user_role AS ENUM (
    'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');
CREATE TYPE public.review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.helpdesk_category AS ENUM ('IT', 'HR', 'Finance', 'General');
CREATE TYPE public.helpdesk_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.helpdesk_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- Create Tables
CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status job_status NOT NULL,
    posted_date date NOT NULL,
    applicants integer DEFAULT 0
);

CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    status college_status NOT NULL,
    resumes_received integer DEFAULT 0,
    contact_email text NOT NULL,
    last_contacted date NOT NULL
);

CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    job_id uuid REFERENCES public.jobs(id),
    stage applicant_stage NOT NULL,
    applied_date date NOT NULL,
    avatar text,
    source applicant_source,
    college_id uuid REFERENCES public.colleges(id),
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

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    review_date date NOT NULL,
    status review_status NOT NULL,
    job_title text
);

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status NOT NULL,
    approver_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    total_days integer NOT NULL
);

CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 15,
    unpaid_leave integer DEFAULT 0
);

CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    manager_id uuid NOT NULL REFERENCES auth.users(id),
    buddy_id uuid REFERENCES auth.users(id),
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text DEFAULT 'Pre-boarding',
    start_date date NOT NULL
);

CREATE TABLE public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id),
    interviewer_id uuid NOT NULL REFERENCES auth.users(id),
    date date NOT NULL,
    time text NOT NULL,
    type interview_type NOT NULL,
    status interview_status NOT NULL,
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);

CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES auth.users(id),
    to_user_id uuid NOT NULL REFERENCES auth.users(id),
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES auth.users(id),
    awarded_by_user_id uuid NOT NULL REFERENCES auth.users(id),
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10, 2) NOT NULL,
    net_salary numeric(10, 2) NOT NULL,
    download_url text
);

CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated date NOT NULL,
    download_url text
);

CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    title text NOT NULL,
    quarter text NOT NULL
);

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id),
    description text NOT NULL,
    progress integer DEFAULT 0,
    status key_result_status NOT NULL
);

CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    title text NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status expense_status NOT NULL,
    submitted_at date NOT NULL,
    approved_by uuid REFERENCES auth.users(id),
    reimbursed_at date
);

CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id),
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    description text
);

CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    subject text NOT NULL,
    description text NOT NULL,
    category helpdesk_category NOT NULL,
    status helpdesk_status NOT NULL DEFAULT 'Open',
    priority helpdesk_priority NOT NULL DEFAULT 'Medium',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid REFERENCES auth.users(id)
);

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ========== 3. CREATE FUNCTIONS & TRIGGERS ==========

-- Function to get job funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT a.stage, COUNT(a.id)
  FROM applicants a
  GROUP BY a.stage
  ORDER BY
    CASE a.stage
      WHEN 'Sourced' THEN 1
      WHEN 'Applied' THEN 2
      WHEN 'Phone Screen' THEN 3
      WHEN 'Interview' THEN 4
      WHEN 'Offer' THEN 5
      WHEN 'Hired' THEN 6
      WHEN 'Rejected' THEN 7
      ELSE 8
    END;
END;
$$ LANGUAGE plpgsql;

-- ========== 4. POPULATE FAKE DATA ==========

-- Jobs
INSERT INTO public.jobs (title, department, description, status, posted_date, applicants) VALUES
('Frontend Developer', 'Engineering', 'We are looking for a skilled Frontend Developer to join our team.', 'Open', '2024-05-10', 3),
('Backend Developer', 'Engineering', 'Hiring an experienced Backend Developer proficient in Node.js and PostgreSQL.', 'Open', '2024-05-15', 2),
('UI/UX Designer', 'Design', 'Creative UI/UX Designer needed to shape our user experience.', 'Open', '2024-04-20', 1),
('HR Generalist', 'Human Resources', 'Seeking an HR Generalist to support our growing team.', 'Closed', '2024-03-01', 0);

-- Colleges
INSERT INTO public.colleges (name, status, resumes_received, contact_email, last_contacted) VALUES
('Tech University', 'Confirmed', 2, 'placements@tech.edu', '2024-05-01'),
('Business College', 'Invited', 0, 'careers@business.edu', '2024-05-20'),
('Arts Institute', 'Attended', 1, 'info@artsinstitute.edu', '2024-04-15');

-- Applicants (Link to jobs and colleges)
WITH job_ids AS (SELECT id, title FROM public.jobs),
     college_ids AS (SELECT id, name FROM public.colleges)
INSERT INTO public.applicants (name, email, phone, job_id, stage, applied_date, source, college_id, wpm, accuracy, aptitude_score, comprehensive_score, english_grammar_score, customer_service_score)
VALUES
('Alice Johnson', 'alice.j@example.com', '123-456-7890', (SELECT id FROM job_ids WHERE title = 'Frontend Developer'), 'Interview', '2024-05-12', 'manual', NULL, 65, 95, 88, 92, 95, 85),
('Bob Williams', 'bob.w@example.com', '234-567-8901', (SELECT id FROM job_ids WHERE title = 'Frontend Developer'), 'Phone Screen', '2024-05-18', 'walk-in', NULL, 72, 98, 85, 90, 91, 88),
('Charlie Brown', 'charlie.b@example.com', '345-678-9012', (SELECT id FROM job_ids WHERE title = 'Backend Developer'), 'Applied', '2024-05-20', 'college', (SELECT id FROM college_ids WHERE name = 'Tech University')),
('Diana Prince', 'diana.p@example.com', '456-789-0123', (SELECT id FROM job_ids WHERE title = 'Backend Developer'), 'Applied', '2024-05-21', 'college', (SELECT id FROM college_ids WHERE name = 'Tech University')),
('Eve Adams', 'eve.a@example.com', '567-890-1234', (SELECT id FROM job_ids WHERE title = 'UI/UX Designer'), 'Hired', '2024-04-25', 'college', (SELECT id FROM college_ids WHERE name = 'Arts Institute')),
('Frank Miller', 'frank.m@example.com', '678-901-2345', (SELECT id FROM job_ids WHERE title = 'Frontend Developer'), 'Rejected', '2024-05-15', 'walk-in', NULL, 55, 80, 60, 70, 75, 65);

-- Onboarding (uses 'Eve Adams' who was hired)
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.onboarding_workflows (user_id, manager_id, buddy_id, employee_name, employee_avatar, job_title, manager_name, buddy_name, progress, current_step, start_date)
VALUES
((SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), (SELECT id FROM user_ids WHERE email = 'manager@hrplus.com'), (SELECT id FROM user_ids WHERE email = 'team_lead@hrplus.com'), 'Eve Adams', 'https://placehold.co/100x100.png', 'UI/UX Designer', 'Manager Mike', 'Team Lead Tina', 50, 'IT Setup', '2024-05-01');

-- Performance Reviews
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.performance_reviews (user_id, review_date, status, job_title) VALUES
((SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), '2024-06-30', 'Pending', 'Software Engineer'),
((SELECT id FROM user_ids WHERE email = 'team_lead@hrplus.com'), '2024-06-30', 'Completed', 'Team Lead');

-- Leave Balances (for all users)
INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
SELECT id, 12, 12, 15, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Leaves
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.leaves (user_id, leave_type, start_date, end_date, reason, status, total_days, approver_id) VALUES
((SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), 'casual', '2024-05-25', '2024-05-25', 'Personal appointment', 'approved', 1, (SELECT id FROM user_ids WHERE email = 'manager@hrplus.com')),
((SELECT id FROM user_ids WHERE email = 'team_lead@hrplus.com'), 'sick', '2024-06-01', '2024-06-02', 'Fever', 'pending', 2, NULL);

-- Interviews
WITH applicant_ids AS (SELECT id, name FROM public.applicants),
     user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.interviews (applicant_id, interviewer_id, date, time, type, status, candidate_name, interviewer_name, job_title) VALUES
((SELECT id FROM applicant_ids WHERE name = 'Alice Johnson'), (SELECT id FROM user_ids WHERE email = 'interviewer@hrplus.com'), '2024-05-28', '11:00', 'Video', 'Scheduled', 'Alice Johnson', 'Interviewer Ingrid', 'Frontend Developer');

-- OKRs
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.objectives (owner_id, title, quarter) VALUES
((SELECT id FROM user_ids WHERE email = 'manager@hrplus.com'), 'Improve team performance by 15%', 'Q2 2024');

INSERT INTO public.key_results (objective_id, description, progress, status)
SELECT id, 'Reduce bug resolution time by 20%', 50, 'on_track' FROM public.objectives WHERE title = 'Improve team performance by 15%';

-- Expenses
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.expense_reports (user_id, title, total_amount, status, submitted_at) VALUES
((SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), 'Client visit travel expenses', 150.75, 'submitted', '2024-05-18');

-- Helpdesk
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.helpdesk_tickets (user_id, subject, description, category, status, priority) VALUES
((SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), 'Laptop running slow', 'My laptop has been very slow since the last update.', 'IT', 'Open', 'Medium');

-- Kudos
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.kudos (from_user_id, to_user_id, value, message) VALUES
((SELECT id FROM user_ids WHERE email = 'manager@hrplus.com'), (SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), 'Team Player', 'Great job helping out with the recent deployment!');

-- Payslips
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.payslips (user_id, month, year, gross_salary, net_salary, download_url) VALUES
((SELECT id FROM user_ids WHERE email = 'employee@hrplus.com'), 'April', 2024, 5000.00, 4200.00, '#');

-- Company Documents
INSERT INTO public.company_documents (title, description, category, last_updated, download_url) VALUES
('Employee Handbook 2024', 'The latest version of the company-wide employee handbook.', 'HR Policy', '2024-01-01', '#');

-- Company Posts
WITH user_ids AS (SELECT id, email FROM auth.users)
INSERT INTO public.company_posts (user_id, content, image_url) VALUES
((SELECT id FROM user_ids WHERE email = 'hr_manager@hrplus.com'), 'Welcome to all our new hires for Q2! We are excited to have you on board.', 'https://placehold.co/600x400.png');


-- ========== 5. ENABLE RLS and CREATE POLICIES ==========
-- Enable RLS for all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
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

-- Policies for jobs
CREATE POLICY "Allow read access to all authenticated users" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Recruiter/Admin to create jobs" ON public.jobs FOR INSERT WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr_manager', 'recruiter', 'super_hr', 'admin'));
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING ((auth.jwt() ->> 'user_role') IN ('hr_manager', 'recruiter', 'super_hr', 'admin'));

-- Policies for applicants
CREATE POLICY "Allow HR/Recruiter/Admin to see all applicants" ON public.applicants FOR SELECT USING ((auth.jwt() ->> 'user_role') IN ('hr_manager', 'recruiter', 'super_hr', 'admin', 'interviewer'));
CREATE POLICY "Allow public insert for applicants" ON public.applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow applicant to view their own data" ON public.applicants FOR SELECT USING (id::text = (auth.jwt() ->> 'applicant_id'));

-- Policies for leaves
CREATE POLICY "Allow user to see their own leaves" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow manager to see team leaves" ON public.leaves FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'team_lead') AND
    (SELECT department FROM public.users WHERE id = auth.uid()) = (SELECT department FROM public.users WHERE id = user_id)
);
CREATE POLICY "Allow admin/hr to see all leaves" ON public.leaves FOR SELECT USING ((auth.jwt() ->> 'user_role') IN ('admin', 'hr_manager', 'super_hr'));
CREATE POLICY "Allow user to create their own leave" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for leave_balances
CREATE POLICY "Allow user to see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);

-- Policies for interviews
CREATE POLICY "Allow interviewer to see their interviews" ON public.interviews FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "Allow HR/Recruiter/Admin to see all interviews" ON public.interviews FOR SELECT USING ((auth.jwt() ->> 'user_role') IN ('hr_manager', 'recruiter', 'super_hr', 'admin'));

-- Policies for company_posts
CREATE POLICY "Allow all authenticated to read" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to create posts" ON public.company_posts FOR INSERT WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr_manager', 'super_hr', 'admin'));

-- Policies for kudos
CREATE POLICY "Allow all authenticated to read" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated to create" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for payslips
CREATE POLICY "Allow user to see their own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin to see all payslips" ON public.payslips FOR SELECT USING ((auth.jwt() ->> 'user_role') IN ('hr_manager', 'super_hr', 'admin'));

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
-- Grant select on all tables to anon and authenticated roles (RLS will handle access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;

-- Print completion message
SELECT '✅ HR+ Database setup complete.';

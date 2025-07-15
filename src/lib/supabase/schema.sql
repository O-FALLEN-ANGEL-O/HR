
-- Drop policies first to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.applicants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.applicants;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.leaves;
DROP POLICY IF EXISTS "Allow users to insert their own leave" ON public.leaves;
DROP POLICY IF EXISTS "Allow admins to manage leaves" ON public.leaves;
DROP POLICY IF EXISTS "Allow individual read access" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow admins to read all balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow admins to manage everything" ON public.users;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.colleges;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.colleges;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.applicant_notes;
DROP POLICY IF EXISTS "Allow full access to HR and admins" ON public.interviews;
DROP POLICY IF EXISTS "Allow interviewers to see their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_posts;
DROP POLICY IF EXISTS "Enable insert for admins and HR" ON public.company_posts;
DROP POLICY IF EXISTS "Enable read for all users" ON public.post_comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.post_comments;
DROP POLICY IF EXISTS "Enable read for all users" ON public.kudos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kudos;
DROP POLICY IF EXISTS "Enable read for all users" ON public.weekly_awards;
DROP POLICY IF EXISTS "Enable insert for managers and HR" ON public.weekly_awards;
DROP POLICY IF EXISTS "Enable read for own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Allow admin to read all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Enable read for all users" ON public.company_documents;
DROP POLICY IF EXISTS "Enable read access for own data" ON public.objectives;
DROP POLICY IF EXISTS "Enable CRUD for admin/hr" ON public.objectives;
DROP POLICY IF EXISTS "Enable read access for own data" ON public.key_results;
DROP POLICY IF EXISTS "Enable CRUD for admin/hr" ON public.key_results;
DROP POLICY IF EXISTS "Allow users to manage their own expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow finance/admin to manage all expense reports" ON public.expense_reports;
DROP POLICY IF EXISTS "Allow users to manage items on their own reports" ON public.expense_items;
DROP POLICY IF EXISTS "Allow finance/admin to manage all expense items" ON public.expense_items;
DROP POLICY IF EXISTS "Allow users to manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow support/admin to manage all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow users to manage their own comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Allow support/admin to manage all comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.onboarding_workflows;


-- Drop tables in reverse order of creation due to dependencies
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
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.applicant_notes;
DROP TABLE IF EXISTS public.onboarding_workflows;
DROP TABLE IF EXISTS public.leaves;
DROP TABLE IF EXISTS public.leave_balances;
DROP TABLE IF EXISTS public.applicants;
DROP TABLE IF EXISTS public.colleges;
DROP TABLE IF EXISTS public.jobs;

-- Drop dependent types last
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_report_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;

-- Functions and Triggers
-- The handle_new_user function and its trigger on auth.users are managed in a separate file
-- to avoid permission issues with dropping/creating triggers on the auth schema.
-- This schema file focuses on the public schema.


-- Custom Types
CREATE TYPE public.user_role AS ENUM (
  'admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor'
);
CREATE TYPE public.applicant_stage AS ENUM (
  'Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'
);
CREATE TYPE public.job_status AS ENUM (
  'Open', 'Closed', 'On hold'
);
CREATE TYPE public.leave_status AS ENUM (
  'pending', 'approved', 'rejected'
);
CREATE TYPE public.leave_type AS ENUM (
  'sick', 'casual', 'earned', 'unpaid'
);
CREATE TYPE public.college_status AS ENUM (
    'Invited', 'Confirmed', 'Attended', 'Declined'
);
CREATE TYPE public.interview_status AS ENUM (
    'Scheduled', 'Completed', 'Canceled'
);
CREATE TYPE public.interview_type AS ENUM (
    'Video', 'Phone', 'In-person'
);
CREATE TYPE public.review_status AS ENUM (
    'Pending', 'In Progress', 'Completed'
);
CREATE TYPE public.key_result_status AS ENUM (
    'on_track', 'at_risk', 'off_track'
);
CREATE TYPE public.expense_report_status AS ENUM (
    'draft', 'submitted', 'approved', 'rejected', 'reimbursed'
);
CREATE TYPE public.ticket_status AS ENUM (
    'Open', 'In Progress', 'Resolved', 'Closed'
);
CREATE TYPE public.ticket_priority AS ENUM (
    'Low', 'Medium', 'High', 'Urgent'
);
CREATE TYPE public.ticket_category AS ENUM (
    'IT', 'HR', 'Finance', 'General'
);


-- Tables
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'guest',
    department TEXT,
    phone TEXT,
    profile_setup_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;


CREATE TABLE public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sick_leave INT NOT NULL DEFAULT 0,
    casual_leave INT NOT NULL DEFAULT 0,
    earned_leave INT NOT NULL DEFAULT 0,
    unpaid_leave INT NOT NULL DEFAULT 0,
    UNIQUE(user_id)
);


CREATE TABLE public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    approver_id UUID REFERENCES public.users(id),
    total_days INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.users(id),
    buddy_id UUID REFERENCES public.users(id),
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    job_title TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    buddy_name TEXT,
    progress INT NOT NULL DEFAULT 0,
    current_step TEXT NOT NULL DEFAULT 'Welcome Kit',
    start_date DATE NOT NULL
);

CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    status job_status NOT NULL,
    posted_date DATE NOT NULL,
    applicants INT DEFAULT 0
);

CREATE TABLE public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status college_status NOT NULL,
    resumes_received INT DEFAULT 0,
    contact_email TEXT,
    last_contacted DATE
);

CREATE TABLE public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage applicant_stage NOT NULL,
    applied_date DATE NOT NULL,
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


CREATE TABLE public.applicant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.weekly_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    week_of DATE NOT NULL
);

CREATE TABLE public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary REAL NOT NULL,
    net_salary REAL NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    download_url TEXT NOT NULL
);

CREATE TABLE public.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);

CREATE TABLE public.key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    status key_result_status NOT NULL DEFAULT 'on_track'
);

CREATE TABLE public.expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status expense_report_status NOT NULL DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT
);

CREATE TABLE public.helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category NOT NULL,
    status ticket_status NOT NULL DEFAULT 'Open',
    priority ticket_priority NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolver_id UUID REFERENCES public.users(id)
);

CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get job funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.stage,
        COUNT(a.id) as count
    FROM 
        public.applicants a
    GROUP BY 
        a.stage
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

-- Create handle_new_user function if it doesn't exist, or replace it if it does
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    NEW.raw_user_meta_data ->> 'department'
  );
  -- Also create a default leave balance
  INSERT INTO public.leave_balances(user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (NEW.id, 12, 12, 15, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create the trigger only if it does not already exist
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
   ) THEN
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   END IF;
END
$$;

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admins to manage everything" ON public.users FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr')
) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr')
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to read all balances" ON public.leave_balances FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);


ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own leave" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admins to manage leaves" ON public.leaves FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (
    department = (SELECT department FROM public.users WHERE id = auth.uid())
);


ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Enable write access for hr and admin" ON public.jobs FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated users" ON public.applicants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.applicants FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer')
);
CREATE POLICY "Enable write access for hr and admin" ON public.applicants FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access for admins" ON public.colleges FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
CREATE POLICY "Allow read access for authenticated users" ON public.colleges FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access for admins" ON public.applicant_notes FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'manager', 'interviewer')
);
CREATE POLICY "Allow read access for authenticated users" ON public.applicant_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON public.applicant_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to HR and admins" ON public.interviews FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
CREATE POLICY "Allow interviewers to see their own interviews" ON public.interviews FOR SELECT USING (
    interviewer_id = auth.uid()
);

ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Enable insert for admins and HR" ON public.company_posts FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can manage their own comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.kudos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users" ON public.weekly_awards FOR SELECT USING (true);
CREATE POLICY "Enable insert for managers and HR" ON public.weekly_awards FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead')
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow admin to read all payslips" ON public.payslips FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users" ON public.company_documents FOR SELECT USING (true);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for own data" ON public.objectives FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Enable CRUD for admin/hr" ON public.objectives FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager'));

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for own data" ON public.key_results FOR SELECT USING (
    objective_id IN (SELECT id FROM public.objectives WHERE owner_id = auth.uid())
);
CREATE POLICY "Enable CRUD for admin/hr" ON public.key_results FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own expense reports" ON public.expense_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Allow finance/admin to manage all expense reports" ON public.expense_reports FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'finance')
);

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage items on their own reports" ON public.expense_items FOR ALL USING (
    expense_report_id IN (SELECT id FROM public.expense_reports WHERE user_id = auth.uid())
);
CREATE POLICY "Allow finance/admin to manage all expense items" ON public.expense_items FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'finance')
);

ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own tickets" ON public.helpdesk_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Allow support/admin to manage all tickets" ON public.helpdesk_tickets FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin')
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own comments" ON public.ticket_comments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Allow support/admin to manage all comments" ON public.ticket_comments FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'support', 'it_admin')
);

ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON public.onboarding_workflows FOR SELECT USING (
    user_id = auth.uid() OR manager_id = auth.uid() OR buddy_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post_images', 'post_images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'post_images');

DROP POLICY IF EXISTS "Anyone can upload a post image." ON storage.objects;
CREATE POLICY "Anyone can upload a post image." ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'post_images');

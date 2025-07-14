-- Wipe all tables
-- This will delete all data and reset the database schema.
-- Only run this if you want a completely fresh start.
-- DO NOT RUN IN PRODUCTION.
-- drop schema public cascade;
-- create schema public;


-- =================================================================
-- 1. Helper Functions
-- =================================================================

-- Function to get the role of the currently authenticated user
-- This is used in Row Level Security (RLS) policies.
create or replace function get_my_claim(claim text) returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> claim, '')::text;
$$ language sql stable;

-- Function to get all claims of the currently authenticated user
create or replace function get_my_claims() returns jsonb as $$
  select current_setting('request.jwt.claims', true)::jsonb;
$$ language sql stable;


-- =================================================================
-- 2. Create Tables
-- =================================================================

-- Users Table
-- Stores public user profiles. Note that auth.users is the master table.
-- A trigger is used to automatically copy new users from auth.users.
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY,
    full_name text,
    avatar_url text,
    role text DEFAULT 'guest'::text NOT NULL,
    department text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Jobs Table
-- Stores job postings.
CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status text DEFAULT 'Open'::text NOT NULL, -- Open, Closed, On hold
    posted_date timestamp with time zone DEFAULT now() NOT NULL,
    applicants integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Applicants Table
-- Stores information about job applicants.
CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    stage text DEFAULT 'Applied'::text NOT NULL,
    applied_date timestamp with time zone DEFAULT now() NOT NULL,
    avatar text,
    source text, -- walk-in, college, email, manual
    college_id uuid,
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
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Onboarding Workflows Table
-- Tracks the onboarding process for new hires.
CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    buddy_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0 NOT NULL,
    current_step text DEFAULT 'Welcome Email'::text NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;

-- Performance Reviews Table
-- Stores records of performance reviews.
CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    review_date timestamp with time zone NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL, -- Pending, In Progress, Completed
    job_title text
);
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- Leave Balances Table
-- Stores the leave balances for each employee.
CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    sick_leave integer DEFAULT 12 NOT NULL,
    casual_leave integer DEFAULT 12 NOT NULL,
    earned_leave integer DEFAULT 12 NOT NULL,
    unpaid_leave integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Leaves Table
-- Logs all leave requests.
CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type text NOT NULL, -- sick, casual, earned, unpaid
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL, -- pending, approved, rejected
    approver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_days integer NOT NULL
);
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Colleges Table
-- Manages relationships with colleges for campus recruitment.
CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    status text DEFAULT 'Invited'::text NOT NULL, -- Invited, Confirmed, Attended, Declined
    resumes_received integer DEFAULT 0 NOT NULL,
    contact_email text NOT NULL,
    last_contacted timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Applicant Notes Table
-- Internal notes for the hiring team about an applicant.
CREATE TABLE public.applicant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;

-- Interviews Table
-- Schedules and tracks interviews for applicants.
CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    time text NOT NULL,
    type text NOT NULL, -- Video, Phone, In-person
    status text DEFAULT 'Scheduled'::text NOT NULL, -- Scheduled, Completed, Canceled
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Company Posts Table
-- For official company announcements on the feed.
CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;

-- Kudos Table
-- Peer-to-peer recognition system.
CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    value text NOT NULL, -- e.g., Team Player, Innovation
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

-- Weekly Awards Table
-- For the "Employee of the Week" award.
CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL
);
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;

-- Payslips Table
-- Stores links to employee payslips.
CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary real NOT NULL,
    net_salary real NOT NULL,
    download_url text NOT NULL
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Company Documents Table
-- Central repository for policies like the HR Handbook.
CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated date NOT NULL,
    download_url text NOT NULL
);
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Objectives Table
-- For the OKR (Objectives and Key Results) system.
CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL -- e.g., 'Q3 2024'
);
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Key Results Table
-- Child table for Objectives in the OKR system.
CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'on_track'::text NOT NULL -- on_track, at_risk, off_track
);
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Expense Reports Table
-- Main table for tracking expense claims.
CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount real NOT NULL,
    status text DEFAULT 'submitted'::text NOT NULL, -- submitted, approved, rejected, reimbursed
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;

-- Expense Items Table
-- Line items for each expense report.
CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text NOT NULL,
    amount real NOT NULL,
    description text
);
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- Helpdesk Tickets Table
-- For the IT/HR support ticketing system.
CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category text NOT NULL, -- IT, HR, Finance, General
    status text DEFAULT 'Open'::text NOT NULL, -- Open, In Progress, Resolved, Closed
    priority text DEFAULT 'Medium'::text NOT NULL, -- Low, Medium, High, Urgent
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolver_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket Comments Table
-- Comments on helpdesk tickets.
CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;


-- =================================================================
-- 3. Views
-- =================================================================

-- View to get job funnel statistics
CREATE OR REPLACE VIEW public.job_funnel_stats AS
SELECT
    stage,
    count(*) AS count
FROM
    public.applicants
GROUP BY
    stage
ORDER BY
    CASE stage
        WHEN 'Sourced' THEN 1
        WHEN 'Applied' THEN 2
        WHEN 'Phone Screen' THEN 3
        WHEN 'Interview' THEN 4
        WHEN 'Offer' THEN 5
        WHEN 'Hired' THEN 6
        ELSE 7
    END;

-- =================================================================
-- 4. Triggers
-- =================================================================

-- Trigger function to automatically create a public.users profile when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, avatar_url, role, department)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'guest')::text,
    new.raw_user_meta_data->>'department'
  );
  return new;
end;
$$;

-- Attach the trigger to the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger function to automatically create a leave balance entry for a new user
create or replace function public.handle_new_user_leave_balance()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.leave_balances (user_id)
  values (new.id);
  return new;
end;
$$;

-- Attach the trigger to the public.users table
create trigger on_public_user_created
  after insert on public.users
  for each row execute procedure public.handle_new_user_leave_balance();


-- =================================================================
-- 5. Row Level Security (RLS) Policies
-- =================================================================

-- Policies for USERS table
CREATE POLICY "Allow authenticated users to see all user profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow individual users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin/super_hr to update any user profile" ON public.users FOR UPDATE USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text]));
CREATE POLICY "Allow admin/super_hr to create users" ON public.users FOR INSERT WITH CHECK ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text]));

-- Policies for JOBS table
CREATE POLICY "Allow all users to see open jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiter/Admin to insert jobs" ON public.jobs FOR INSERT WITH CHECK ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'recruiter'::text]));
CREATE POLICY "Allow HR/Recruiter/Admin to update jobs" ON public.jobs FOR UPDATE USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'recruiter'::text]));

-- Policies for APPLICANTS table
CREATE POLICY "Allow HR/Recruiter/Admin to see all applicants" ON public.applicants FOR SELECT USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'recruiter'::text]));
CREATE POLICY "Allow anyone to create an applicant (for public registration)" ON public.applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow HR/Recruiter/Admin to update applicants" ON public.applicants FOR UPDATE USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'recruiter'::text]));

-- Policies for ONBOARDING WORKFLOWS table
CREATE POLICY "Allow HR/Admin/Manager to see relevant workflows" ON public.onboarding_workflows FOR SELECT USING (((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text])) OR (auth.uid() = manager_id));
CREATE POLICY "Allow employee to see their own onboarding workflow" ON public.onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin to create workflows" ON public.onboarding_workflows FOR INSERT WITH CHECK (((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text])));

-- Policies for LEAVES table
CREATE POLICY "Allow employee to see their own leave requests" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow managers to see leave requests from their department" ON public.leaves FOR SELECT USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'manager'::text, 'team_lead'::text]));
CREATE POLICY "Allow employees to create their own leave requests" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow managers/hr to update leave status" ON public.leaves FOR UPDATE USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'manager'::text, 'team_lead'::text]));

-- Policies for LEAVE BALANCES table
CREATE POLICY "Allow employee to see their own leave balance" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow HR/Admin to see all leave balances" ON public.leave_balances FOR SELECT USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text]));

-- Policies for HELPDESK TICKETS table
CREATE POLICY "Allow users to see their own tickets" ON public.helpdesk_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow support staff/admins to see all tickets" ON public.helpdesk_tickets FOR SELECT USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'support'::text, 'it_admin'::text]));
CREATE POLICY "Allow authenticated users to create tickets" ON public.helpdesk_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow ticket owner and support to update tickets" ON public.helpdesk_tickets FOR UPDATE USING ((auth.uid() = user_id) OR ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'support'::text, 'it_admin'::text])));

-- Policies for TICKET COMMENTS table
CREATE POLICY "Allow users involved in a ticket to see comments" ON public.ticket_comments FOR SELECT USING (
  ticket_id IN (SELECT id FROM public.helpdesk_tickets WHERE user_id = auth.uid() OR resolver_id = auth.uid()) OR
  (get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'support'::text, 'it_admin'::text])
);
CREATE POLICY "Allow users involved to add comments" ON public.ticket_comments FOR INSERT WITH CHECK (
  ticket_id IN (SELECT id FROM public.helpdesk_tickets WHERE user_id = auth.uid() OR resolver_id = auth.uid()) OR
  (get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text, 'support'::text, 'it_admin'::text])
);

-- Policies for COMPANY DOCUMENTS table
CREATE POLICY "Allow authenticated users to view documents" ON public.company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to manage documents" ON public.company_documents FOR ALL USING ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text]));

-- Policies for COMPANY POSTS table
CREATE POLICY "Allow authenticated users to view posts" ON public.company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow HR/Admin to create posts" ON public.company_posts FOR INSERT WITH CHECK ((get_my_claim('role'::text))::text = ANY (ARRAY['admin'::text, 'super_hr'::text, 'hr_manager'::text]));

-- Policies for KUDOS table
CREATE POLICY "Allow authenticated users to view all kudos" ON public.kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to give kudos" ON public.kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Enable RLS for all tables (as a final check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
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

-- =================================================================
-- 6. Storage Policies
-- =================================================================

-- Policies for AVATARS bucket
CREATE POLICY "Allow authenticated users to view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow users to upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Allow users to update their own avatar" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);


-- Grant all privileges to the 'postgres' and 'anon' roles
-- These are default Supabase roles.
grant all on table public.users to postgres, anon;
grant all on table public.jobs to postgres, anon;
grant all on table public.applicants to postgres, anon;
grant all on table public.onboarding_workflows to postgres, anon;
grant all on table public.performance_reviews to postgres, anon;
grant all on table public.leave_balances to postgres, anon;
grant all on table public.leaves to postgres, anon;
grant all on table public.colleges to postgres, anon;
grant all on table public.applicant_notes to postgres, anon;
grant all on table public.interviews to postgres, anon;
grant all on table public.company_posts to postgres, anon;
grant all on table public.kudos to postgres, anon;
grant all on table public.weekly_awards to postgres, anon;
grant all on table public.payslips to postgres, anon;
grant all on table public.company_documents to postgres, anon;
grant all on table public.objectives to postgres, anon;
grant all on table public.key_results to postgres, anon;
grant all on table public.expense_reports to postgres, anon;
grant all on table public.expense_items to postgres, anon;
grant all on table public.helpdesk_tickets to postgres, anon;
grant all on table public.ticket_comments to postgres, anon;

grant all on function public.get_my_claim(text) to postgres, anon;
grant all on function public.get_my_claims() to postgres, anon;
grant all on function public.handle_new_user() to postgres, anon;
grant all on function public.handle_new_user_leave_balance() to postgres, anon;

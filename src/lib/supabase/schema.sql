-- Drop existing tables in reverse order of dependency to avoid conflicts
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
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.onboarding_workflows CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.applicant_stage;
DROP TYPE IF EXISTS public.applicant_source;
DROP TYPE IF EXISTS public.onboarding_status;
DROP TYPE IF EXISTS public.performance_review_status;
DROP TYPE IF EXISTS public.leave_type;
DROP TYPE IF EXISTS public.leave_status;
DROP TYPE IF EXISTS public.college_status;
DROP TYPE IF EXISTS public.interview_type;
DROP TYPE IF EXISTS public.interview_status;
DROP TYPE IF EXISTS public.key_result_status;
DROP TYPE IF EXISTS public.expense_report_status;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;


-- Create custom ENUM types
CREATE TYPE public.user_role AS ENUM ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager', 'team_lead', 'employee', 'intern', 'guest', 'finance', 'it_admin', 'support', 'auditor');
CREATE TYPE public.job_status AS ENUM ('Open', 'Closed', 'On hold');
CREATE TYPE public.applicant_stage AS ENUM ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected');
CREATE TYPE public.applicant_source AS ENUM ('walk-in', 'college', 'email', 'manual');
CREATE TYPE public.onboarding_status AS ENUM ('Not Started', 'In Progress', 'Completed');
CREATE TYPE public.performance_review_status AS ENUM ('Pending', 'In Progress', 'Completed');
CREATE TYPE public.leave_type AS ENUM ('sick', 'casual', 'earned', 'unpaid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.college_status AS ENUM ('Invited', 'Confirmed', 'Attended', 'Declined');
CREATE TYPE public.interview_type AS ENUM ('Video', 'Phone', 'In-person');
CREATE TYPE public.interview_status AS ENUM ('Scheduled', 'Completed', 'Canceled');
CREATE TYPE public.key_result_status AS ENUM ('on_track', 'at_risk', 'off_track');
CREATE TYPE public.expense_report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
CREATE TYPE public.ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE public.ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE public.ticket_category AS ENUM ('IT', 'HR', 'Finance', 'General');


-- Create tables
CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 12,
    unpaid_leave integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason character varying(255) NOT NULL,
    status public.leave_status DEFAULT 'pending'::public.leave_status,
    approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    total_days integer NOT NULL
);

CREATE TABLE public.onboarding_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    buddy_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_name text NOT NULL,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress integer DEFAULT 0,
    current_step text DEFAULT 'Welcome Email Sent',
    start_date date NOT NULL
);

CREATE TABLE public.colleges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    status public.college_status DEFAULT 'Invited',
    resumes_received integer DEFAULT 0,
    contact_email text NOT NULL,
    last_contacted date NOT NULL
);

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status public.job_status DEFAULT 'Open',
    posted_date date NOT NULL,
    applicants integer DEFAULT 0
);

CREATE TABLE public.applicants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage public.applicant_stage DEFAULT 'Applied',
    applied_date date NOT NULL,
    avatar text,
    source public.applicant_source DEFAULT 'manual',
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
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    author_avatar text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    type public.interview_type NOT NULL,
    status public.interview_status DEFAULT 'Scheduled',
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);

CREATE TABLE public.company_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.weekly_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    awarded_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric(10,2) NOT NULL,
    net_salary numeric(10,2) NOT NULL,
    download_url text NOT NULL
);

CREATE TABLE public.company_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    last_updated date NOT NULL,
    download_url text NOT NULL
);

CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer DEFAULT 0,
    status public.key_result_status DEFAULT 'on_track'
);

CREATE TABLE public.expense_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.expense_report_status DEFAULT 'submitted',
    submitted_at timestamp with time zone NOT NULL,
    approved_at timestamp with time zone,
    approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reimbursed_at timestamp with time zone
);

CREATE TABLE public.expense_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text
);

CREATE TABLE public.helpdesk_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category public.ticket_category NOT NULL,
    status public.ticket_status DEFAULT 'Open',
    priority public.ticket_priority DEFAULT 'Medium',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    review_date date NOT NULL,
    status public.performance_review_status DEFAULT 'Pending',
    job_title text,
    goals text,
    strengths text,
    areas_for_improvement text,
    overall_rating integer,
    manager_comments text,
    employee_comments text
);

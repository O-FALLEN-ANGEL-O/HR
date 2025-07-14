-- 🔁 Drop dependent functions first to avoid ENUM type dependency errors
DROP FUNCTION IF EXISTS auth.get_user_role() CASCADE;

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

-- ✅ Recreate helper functions for RLS
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT raw_user_meta_data->>'department'
  FROM auth.users
  WHERE id = user_id;
$$;


-- 🏢 1. jobs
CREATE TABLE public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    department text NOT NULL,
    description text,
    status job_status NOT NULL DEFAULT 'Open',
    posted_date timestamp with time zone NOT NULL DEFAULT now(),
    applicants integer NOT NULL DEFAULT 0
);

-- 🎓 2. colleges
CREATE TABLE public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status college_status NOT NULL DEFAULT 'Invited',
    resumes_received integer NOT NULL DEFAULT 0,
    contact_email text,
    last_contacted timestamp with time zone DEFAULT now()
);

-- 🧑‍💼 3. applicants
CREATE TABLE public.applicants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
    stage applicant_stage NOT NULL DEFAULT 'Applied',
    source applicant_source,
    applied_date timestamp with time zone NOT NULL DEFAULT now(),
    avatar text,
    resume_data jsonb,
    ai_match_score numeric,
    ai_justification text,
    wpm integer,
    accuracy numeric,
    aptitude_score numeric,
    comprehensive_score numeric,
    english_grammar_score numeric,
    customer_service_score numeric,
    rejection_reason text,
    rejection_notes text
);

-- 📝 4. applicant_notes
CREATE TABLE public.applicant_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name text,
    author_avatar text,
    note text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 🎙️ 5. interviews
CREATE TABLE public.interviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id uuid NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    time time without time zone NOT NULL,
    type interview_type NOT NULL,
    status interview_status NOT NULL DEFAULT 'Scheduled',
    candidate_name text NOT NULL,
    candidate_avatar text,
    interviewer_name text NOT NULL,
    interviewer_avatar text,
    job_title text
);

-- 📬 6. company_posts
CREATE TABLE public.company_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ✨ 7. kudos
CREATE TABLE public.kudos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 🏆 8. weekly_awards
CREATE TABLE public.weekly_awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    awarded_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    week_of date NOT NULL
);

-- 💵 9. payslips
CREATE TABLE public.payslips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    gross_salary numeric NOT NULL,
    net_salary numeric NOT NULL,
    download_url text
);

-- 📄 10. company_documents
CREATE TABLE public.company_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text,
    last_updated date NOT NULL,
    download_url text
);

-- 🎯 11. objectives
CREATE TABLE public.objectives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    quarter text NOT NULL
);

-- 🗝️ 12. key_results
CREATE TABLE public.key_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
    description text NOT NULL,
    progress integer NOT NULL DEFAULT 0,
    status key_result_status NOT NULL DEFAULT 'on_track'
);

-- 💸 13. expense_reports
CREATE TABLE public.expense_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    total_amount numeric NOT NULL,
    status expense_status NOT NULL DEFAULT 'draft',
    submitted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 🧾 14. expense_items
CREATE TABLE public.expense_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_report_id uuid NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date date NOT NULL,
    category text,
    amount numeric NOT NULL,
    description text
);

-- 🆘 15. helpdesk_tickets
CREATE TABLE public.helpdesk_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category ticket_category NOT NULL,
    status ticket_status NOT NULL DEFAULT 'Open',
    priority ticket_priority NOT NULL DEFAULT 'Medium',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    resolver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 💬 16. ticket_comments
CREATE TABLE public.ticket_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);


-- 🚀 17. onboarding_workflows
CREATE TABLE public.onboarding_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 🏖️ 18. leave_balances
CREATE TABLE public.leave_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    sick_leave integer DEFAULT 12,
    casual_leave integer DEFAULT 12,
    earned_leave integer DEFAULT 12,
    unpaid_leave integer DEFAULT 0
);

-- 🗓️ 19. leaves
CREATE TABLE public.leaves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status NOT NULL DEFAULT 'pending',
    approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    total_days integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT dates_check CHECK (end_date >= start_date)
);

-- Automatically create leave balance for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.leave_balances (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically get job funnel stats
CREATE OR REPLACE FUNCTION public.get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count bigint) AS $$
BEGIN
  RETURN QUERY
    SELECT s.stage, COALESCE(a.count, 0) as count
    FROM (
        SELECT unnest(enum_range(NULL::applicant_stage)) AS stage
    ) s
    LEFT JOIN (
        SELECT stage, count(*) as count
        FROM applicants
        GROUP BY stage
    ) a ON s.stage = a.stage
    ORDER BY
        CASE s.stage
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

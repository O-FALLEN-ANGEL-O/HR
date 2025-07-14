-- Drop all tables if they exist for a clean slate
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

-- Create metrics table
CREATE TABLE public.metrics (
    id SERIAL PRIMARY KEY, 
    title TEXT, 
    value TEXT, 
    change TEXT, 
    change_type TEXT
);
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for metrics" ON public.metrics FOR ALL USING (true) WITH CHECK (true);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    title TEXT, 
    department TEXT,
    description TEXT,
    status TEXT, 
    applicants INT, 
    posted_date TIMESTAMPTZ
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

-- Create colleges table
CREATE TABLE public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    name TEXT, 
    status TEXT, 
    resumes_received INT, 
    contact_email TEXT, 
    last_contacted TIMESTAMPTZ
);
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for colleges" ON public.colleges FOR ALL USING (true) WITH CHECK (true);

-- Create applicants table
CREATE TABLE public.applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    name TEXT, 
    email TEXT, 
    phone TEXT, 
    job_id UUID REFERENCES public.jobs(id),
    stage TEXT, 
    applied_date TIMESTAMPTZ, 
    avatar TEXT, 
    source TEXT, 
    wpm INT, 
    accuracy INT, 
    college_id UUID,
    resume_data JSONB,
    ai_match_score INT,
    ai_justification TEXT,
    aptitude_score INT,
    comprehensive_score INT,
    english_grammar_score INT,
    customer_service_score INT,
    rejection_reason TEXT,
    rejection_notes TEXT
);
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for applicants" ON public.applicants FOR ALL USING (true) WITH CHECK (true);

-- Create applicant_notes table
CREATE TABLE public.applicant_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    author_avatar TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for applicant notes" ON public.applicant_notes FOR ALL USING (true) WITH CHECK (true);

-- Create interviews table
CREATE TABLE public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES auth.users(id),
    candidate_name TEXT, 
    candidate_avatar TEXT, 
    job_title TEXT, 
    interviewer_name TEXT, 
    interviewer_avatar TEXT, 
    date TIMESTAMPTZ, 
    time TEXT, 
    type TEXT, 
    status TEXT
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);

-- Create company_posts table
CREATE TABLE public.company_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for company posts" ON public.company_posts FOR ALL USING (true) WITH CHECK (true);

-- Create kudos table
CREATE TABLE public.kudos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES auth.users(id),
    to_user_id UUID REFERENCES auth.users(id),
    value TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for kudos" ON public.kudos FOR ALL USING (true) WITH CHECK (true);

-- Create weekly_awards table
CREATE TABLE public.weekly_awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    awarded_user_id UUID REFERENCES auth.users(id),
    awarded_by_user_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    week_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for weekly awards" ON public.weekly_awards FOR ALL USING (true) WITH CHECK (true);

-- Create onboarding_workflows table
CREATE TABLE public.onboarding_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    user_id UUID REFERENCES auth.users(id),
    manager_id UUID REFERENCES auth.users(id),
    buddy_id UUID REFERENCES auth.users(id),
    employee_name TEXT, 
    employee_avatar TEXT, 
    job_title TEXT, 
    manager_name TEXT, 
    buddy_name TEXT, 
    progress INT DEFAULT 0, 
    current_step TEXT DEFAULT 'Initial Setup', 
    start_date TIMESTAMPTZ
);
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for onboarding" ON public.onboarding_workflows FOR ALL USING (true) WITH CHECK (true);

-- Create performance_reviews table
CREATE TABLE public.performance_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    job_title TEXT,
    review_date TEXT, 
    status TEXT
);
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for performance" ON public.performance_reviews FOR ALL USING (true) WITH CHECK (true);

-- Create objectives table
CREATE TABLE public.objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    quarter TEXT NOT NULL
);
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for objectives" ON public.objectives FOR ALL USING (true) WITH CHECK (true);

-- Create key_results table
CREATE TABLE public.key_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    progress INT DEFAULT 0,
    status TEXT
);
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for key results" ON public.key_results FOR ALL USING (true) WITH CHECK (true);

-- Create leave_balances table
CREATE TABLE public.leave_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    sick_leave INT DEFAULT 12,
    casual_leave INT DEFAULT 12,
    earned_leave INT DEFAULT 12,
    unpaid_leave INT DEFAULT 0
);
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for leave balances" ON public.leave_balances FOR ALL USING (true) WITH CHECK (true);

-- Create leaves table
CREATE TABLE public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    leave_type TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT,
    total_days INT NOT NULL,
    approver_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for leaves" ON public.leaves FOR ALL USING (true) WITH CHECK (true);

-- Create company_documents table
CREATE TABLE public.company_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    last_updated TIMESTAMPTZ,
    download_url TEXT NOT NULL
);
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for company documents" ON public.company_documents FOR ALL USING (true) WITH CHECK (true);

-- Create payslips table
CREATE TABLE public.payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    month TEXT NOT NULL,
    year INT NOT NULL,
    gross_salary NUMERIC NOT NULL,
    net_salary NUMERIC NOT NULL,
    download_url TEXT NOT NULL
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for payslips" ON public.payslips FOR ALL USING (true) WITH CHECK (true);

-- Create expense_reports table
CREATE TABLE public.expense_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT,
    submitted_at TIMESTAMPTZ
);
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for expense reports" ON public.expense_reports FOR ALL USING (true) WITH CHECK (true);

-- Create expense_items table
CREATE TABLE public.expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT,
    amount NUMERIC NOT NULL,
    description TEXT
);
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for expense items" ON public.expense_items FOR ALL USING (true) WITH CHECK (true);

-- Create helpdesk_tickets table
CREATE TABLE public.helpdesk_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    status TEXT,
    priority TEXT,
    resolver_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for helpdesk tickets" ON public.helpdesk_tickets FOR ALL USING (true) WITH CHECK (true);

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for ticket comments" ON public.ticket_comments FOR ALL USING (true) WITH CHECK (true);

-- Drop functions and triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_job_funnel_stats();

-- Drop policies before dropping tables
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.users;
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin access to all user profiles" ON public.users;
-- ... add other policy drops if any exist ...

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS expense_reports CASCADE;
DROP TABLE IF EXISTS company_documents CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS weekly_awards CASCADE;
DROP TABLE IF EXISTS kudos CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS company_posts CASCADE;
DROP TABLE IF EXISTS key_results CASCADE;
DROP TABLE IF EXISTS objectives CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS onboarding_workflows CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS applicant_notes CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types last
DROP TYPE IF EXISTS applicant_stage;
DROP TYPE IF EXISTS user_role;

-- Recreate types
CREATE TYPE user_role AS ENUM (
  'admin',
  'super_hr',
  'hr_manager',
  'recruiter',
  'interviewer',
  'manager',
  'team_lead',
  'employee',
  'intern',
  'guest',
  'finance',
  'it_admin',
  'support',
  'auditor'
);

CREATE TYPE applicant_stage AS ENUM (
  'Sourced',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
);

-- Recreate tables with all columns and correct dependencies
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest',
  department TEXT,
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  applicants INTEGER DEFAULT 0
);

CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  resumes_received INTEGER DEFAULT 0,
  contact_email TEXT,
  last_contacted TIMESTAMPTZ
);

CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  stage applicant_stage NOT NULL,
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  avatar TEXT,
  source TEXT,
  resume_data JSONB,
  ai_match_score INTEGER,
  ai_justification TEXT,
  wpm INTEGER,
  accuracy INTEGER,
  aptitude_score INTEGER,
  comprehensive_score INTEGER,
  english_grammar_score INTEGER,
  customer_service_score INTEGER,
  rejection_reason TEXT,
  rejection_notes TEXT
);

CREATE TABLE applicant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_avatar TEXT,
  interviewer_name TEXT NOT NULL,
  interviewer_avatar TEXT,
  job_title TEXT NOT NULL
);

CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  sick_leave INTEGER DEFAULT 0,
  casual_leave INTEGER DEFAULT 0,
  earned_leave INTEGER DEFAULT 0,
  unpaid_leave INTEGER DEFAULT 0
);

CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buddy_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  employee_avatar TEXT,
  job_title TEXT,
  manager_name TEXT,
  buddy_name TEXT,
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  start_date DATE NOT NULL
);

CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  status TEXT NOT NULL,
  job_title TEXT
);

CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL
);

CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  status TEXT NOT NULL
);

CREATE TABLE company_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES company_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  awarded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  week_of DATE NOT NULL
);

CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  gross_salary NUMERIC(12, 2) NOT NULL,
  net_salary NUMERIC(12, 2) NOT NULL,
  download_url TEXT
);

CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  last_updated DATE,
  download_url TEXT
);

CREATE TABLE expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT
);

CREATE TABLE helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolver_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, avatar_url, role, department, profile_setup_complete)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'department',
    (NEW.raw_user_meta_data->>'profile_setup_complete')::boolean
  );
  
  -- Also create a leave balance for the new user
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
  VALUES (NEW.id, 12, 12, 15, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.stage, COALESCE(a.count, 0) as count
    FROM (
        SELECT unnest(enum_range(NULL::applicant_stage)) AS stage
    ) s
    LEFT JOIN (
        SELECT a.stage, count(*)
        FROM applicants a
        GROUP BY a.stage
    ) a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_applicants_college_id ON applicants(college_id);
CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_user_id ON helpdesk_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_category ON helpdesk_tickets(category);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);


-- Row Level Security Policies
-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies for USERS table
CREATE POLICY "Allow authenticated users to read all users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individual user access to their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin access to all user profiles" ON public.users FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr')
) WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr')
);

-- Policies for JOBS table
CREATE POLICY "Allow all users to read jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow HR/Recruiters/Admins to manage jobs" ON public.jobs FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
) WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

-- Policies for APPLICANTS table
CREATE POLICY "Allow HR/Recruiters/Admins to manage applicants" ON public.applicants FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer', 'manager')
);
CREATE POLICY "Allow applicants to view their own portal data" ON public.applicants FOR SELECT USING (id::text = (auth.jwt()->>'applicant_id'));


-- Policies for INTERVIEWS table
CREATE POLICY "Allow involved parties to see interviews" ON public.interviews FOR SELECT USING (
  interviewer_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
CREATE POLICY "Allow HR/Recruiters/Admins to manage interviews" ON public.interviews FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

-- Policies for LEAVES table
CREATE POLICY "Users can manage their own leave requests" ON public.leaves FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Managers can see their team's leave requests" ON public.leaves FOR SELECT USING (
  (SELECT department FROM public.users WHERE id = user_id) = (SELECT department FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admins/HR can see all leave requests" ON public.leaves FOR SELECT USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

-- Policies for COMPANY_POSTS and POST_COMMENTS
CREATE POLICY "Allow all users to read posts and comments" ON public.company_posts FOR SELECT USING (true);
CREATE POLICY "Allow all users to read posts and comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Allow users to create comments" ON public.post_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow HR/Admins to create posts" ON public.company_posts FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
);

-- Default policies for other tables (adjust as needed)
-- Example: Allow users to see their own data, and admins to see all.
CREATE POLICY "Users can see their own leave balance" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can see their own onboarding" ON public.onboarding_workflows FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can see their own performance reviews" ON public.performance_reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can see their own OKRs" ON public.objectives FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Allow read access to all for Kudos" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Allow users to give kudos" ON public.kudos FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Users can see their own payslips" ON public.payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "All authenticated users can see company documents" ON public.company_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own expense reports" ON public.expense_reports FOR ALL USING (user_id = auth.uid());

-- Storage Policies
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Post images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'post_images' );

CREATE POLICY "Allow authenticated users to upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'avatars' );
  
CREATE POLICY "Allow HR/Admin to upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post_images' AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_hr', 'hr_manager')
  );
-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user;
DROP FUNCTION IF EXISTS get_job_funnel_stats;

-- Drop tables first (in reverse order of dependencies)
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

-- Drop types
DROP TYPE IF EXISTS applicant_stage CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

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

-- Recreate tables
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
  "time" TIME NOT NULL,
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
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sick_leave INTEGER DEFAULT 12,
  casual_leave INTEGER DEFAULT 12,
  earned_leave INTEGER DEFAULT 15,
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
  gross_salary NUMERIC(10, 2) NOT NULL,
  net_salary NUMERIC(10, 2) NOT NULL,
  download_url TEXT NOT NULL
);

CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  last_updated DATE NOT NULL,
  download_url TEXT NOT NULL
);

CREATE TABLE expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL,
  submitted_at TIMESTAMPTZ
);

CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT,
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

-- Create indexes for better performance
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

-- Function to create a user profile when a new user signs up in auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, department, profile_setup_complete)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'department',
    (NEW.raw_user_meta_data->>'profile_setup_complete')::boolean
  );
  INSERT INTO public.leave_balances (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for job funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT s.stage, COALESCE(a.count, 0) as count
    FROM unnest(enum_range(NULL::applicant_stage)) s(stage)
    LEFT JOIN (
      SELECT applicants.stage, count(*) as count
      FROM applicants
      GROUP BY applicants.stage
    ) a ON s.stage = a.stage;
END;
$$ LANGUAGE plpgsql;


-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view their own profile." ON users;
DROP POLICY IF EXISTS "Admins and HR can view all profiles." ON users;
DROP POLICY IF EXISTS "Authenticated users can see all public jobs" ON jobs;
DROP POLICY IF EXISTS "HR/Recruiters can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can see all colleges" ON colleges;
DROP POLICY IF EXISTS "HR/Recruiters can manage colleges" ON colleges;
DROP POLICY IF EXISTS "HR/Recruiters/Interviewers can see all applicants" ON applicants;
DROP POLICY IF EXISTS "Applicants can view their own profile" ON applicants;
DROP POLICY IF EXISTS "HR/Recruiters/Interviewers can manage notes" ON applicant_notes;
DROP POLICY IF EXISTS "Interviewers can see their assigned interviews" ON interviews;
DROP POLICY IF EXISTS "HR/Recruiters can manage all interviews" ON interviews;
DROP POLICY IF EXISTS "Users can view their own leave balance" ON leave_balances;
DROP POLICY IF EXISTS "HR can view all leave balances" ON leave_balances;
DROP POLICY IF EXISTS "Users can manage their own leave requests" ON leaves;
DROP POLICY IF EXISTS "Managers can see their teams leave requests" ON leaves;
DROP POLICY IF EXISTS "HR can manage all leave requests" ON leaves;
DROP POLICY IF EXISTS "HR can manage all onboarding" ON onboarding_workflows;
DROP POLICY IF EXISTS "Managers/Buddies can see assigned new hires" ON onboarding_workflows;
DROP POLICY IF EXISTS "Employees can see their own onboarding" ON onboarding_workflows;
DROP POLICY IF EXISTS "Users can see their own reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Managers can see their teams reviews" ON performance_reviews;
DROP POLICY IF EXISTS "HR can see all reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Authenticated users can view all posts and comments" ON company_posts;
DROP POLICY IF EXISTS "HR/Admins can manage posts" ON company_posts;
DROP POLICY IF EXISTS "Authenticated users can manage their own comments" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can see all kudos and awards" ON kudos;
DROP POLICY IF EXISTS "Authenticated users can give kudos" ON kudos;
DROP POLICY IF EXISTS "Authenticated users can see all kudos and awards" ON weekly_awards;
DROP POLICY IF EXISTS "Managers/HR can give weekly awards" ON weekly_awards;
DROP POLICY IF EXISTS "Users can see their own payslips" ON payslips;
DROP POLICY IF EXISTS "HR/Finance can see all payslips" ON payslips;
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON company_documents;
DROP POLICY IF EXISTS "HR/Admins can manage documents" ON company_documents;
DROP POLICY IF EXISTS "Users can manage their own expense reports" ON expense_reports;
DROP POLICY IF EXISTS "Finance/HR can see all expense reports" ON expense_reports;
DROP POLICY IF EXISTS "Users can see items for their own reports" ON expense_items;
DROP POLICY IF EXISTS "Finance/HR can see all expense items" ON expense_items;
DROP POLICY IF EXISTS "Users can manage their own tickets" ON helpdesk_tickets;
DROP POLICY IF EXISTS "Support staff can see all tickets" ON helpdesk_tickets;
DROP POLICY IF EXISTS "Users can manage comments on their own tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Support staff can manage all comments" ON ticket_comments;
DROP POLICY IF EXISTS "Users can manage their own objectives and key results" ON objectives;
DROP POLICY IF EXISTS "HR/Managers can view all OKRs" ON objectives;
DROP POLICY IF EXISTS "Users can manage their own objectives and key results" ON key_results;
DROP POLICY IF EXISTS "HR/Managers can view all OKRs" ON key_results;

-- Recreate Policies
CREATE POLICY "Users can view their own profile." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins and HR can view all profiles." ON users FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Authenticated users can see all public jobs" ON jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Recruiters can manage jobs" ON jobs FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Authenticated users can see all colleges" ON colleges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Recruiters can manage colleges" ON colleges FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "HR/Recruiters/Interviewers can see all applicants" ON applicants FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));
CREATE POLICY "Applicants can view their own profile" ON applicants FOR SELECT USING (auth.uid() = id);
CREATE POLICY "HR/Recruiters/Interviewers can manage notes" ON applicant_notes FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));
CREATE POLICY "Interviewers can see their assigned interviews" ON interviews FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "HR/Recruiters can manage all interviews" ON interviews FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'recruiter'));
CREATE POLICY "Users can view their own leave balance" ON leave_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can view all leave balances" ON leave_balances FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Users can manage their own leave requests" ON leaves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their teams leave requests" ON leaves FOR SELECT USING (department = get_my_claim('department') AND get_my_claim('user_role') IN ('manager', 'team_lead'));
CREATE POLICY "HR can manage all leave requests" ON leaves FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "HR can manage all onboarding" ON onboarding_workflows FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Managers/Buddies can see assigned new hires" ON onboarding_workflows FOR SELECT USING (auth.uid() = manager_id OR auth.uid() = buddy_id);
CREATE POLICY "Employees can see their own onboarding" ON onboarding_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own reviews" ON performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can see their teams reviews" ON performance_reviews FOR SELECT USING (department = get_my_claim('department') AND get_my_claim('user_role') IN ('manager', 'team_lead'));
CREATE POLICY "HR can see all reviews" ON performance_reviews FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Authenticated users can view all posts and comments" ON company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Admins can manage posts" ON company_posts FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Authenticated users can manage their own comments" ON post_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can see all kudos and awards" ON kudos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can give kudos" ON kudos FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Authenticated users can see all kudos and awards" ON weekly_awards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers/HR can give weekly awards" ON weekly_awards FOR INSERT WITH CHECK (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Users can see their own payslips" ON payslips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR/Finance can see all payslips" ON payslips FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Authenticated users can view all documents" ON company_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HR/Admins can manage documents" ON company_documents FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager'));
CREATE POLICY "Users can manage their own expense reports" ON expense_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Finance/HR can see all expense reports" ON expense_reports FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can see items for their own reports" ON expense_items FOR SELECT USING ((SELECT user_id FROM expense_reports WHERE id = expense_report_id) = auth.uid());
CREATE POLICY "Finance/HR can see all expense items" ON expense_items FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'finance'));
CREATE POLICY "Users can manage their own tickets" ON helpdesk_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Support staff can see all tickets" ON helpdesk_tickets FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'it_admin', 'support'));
CREATE POLICY "Users can manage comments on their own tickets" ON ticket_comments FOR ALL USING ((SELECT user_id FROM helpdesk_tickets WHERE id = ticket_id) = auth.uid());
CREATE POLICY "Support staff can manage all comments" ON ticket_comments FOR ALL USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'it_admin', 'support'));
CREATE POLICY "Users can manage their own objectives and key results" ON objectives FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "HR/Managers can view all OKRs" ON objectives FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));
CREATE POLICY "Users can manage their own objectives and key results" ON key_results FOR ALL USING ((SELECT owner_id FROM objectives WHERE id = objective_id) = auth.uid());
CREATE POLICY "HR/Managers can view all OKRs" ON key_results FOR SELECT USING (get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead'));

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Post images are publicly accessible." ON storage.objects;
CREATE POLICY "Post images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'post_images');

DROP POLICY IF EXISTS "HR/Admins can upload post images." ON storage.objects;
CREATE POLICY "HR/Admins can upload post images." ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post_images' AND
  get_my_claim('user_role') IN ('admin', 'super_hr', 'hr_manager')
);

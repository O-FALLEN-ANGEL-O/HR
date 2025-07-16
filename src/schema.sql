-- Drop tables first (in reverse order of dependencies)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS helpdesk_tickets CASCADE;
DROP TABLE IF EXISTS payroll_history CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS expense_reports CASCADE;
DROP TABLE IF EXISTS employee_documents CASCADE;
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
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS applicant_notes CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types and functions
DROP TYPE IF EXISTS applicant_stage CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- === ENUMS & TYPES ===
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

-- === TABLES ===

-- 1. Users Table: Core table for all system users.
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest',
  department TEXT,
  phone TEXT,
  profile_setup_complete BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  job_title TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  permanent_address TEXT,
  current_address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  bank_account_holder_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE users IS 'Stores public profile information for all users, synced from auth.users.';

-- 2. Jobs Table: For job postings.
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Open', 'Closed', 'On hold')),
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  applicants INTEGER DEFAULT 0
);
COMMENT ON TABLE jobs IS 'Stores job postings created by the HR/recruiter team.';

-- 3. Colleges Table: For campus recruitment.
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Invited', 'Confirmed', 'Attended', 'Declined')),
  resumes_received INTEGER DEFAULT 0,
  contact_email TEXT,
  last_contacted TIMESTAMPTZ
);
COMMENT ON TABLE colleges IS 'Stores information about colleges for campus recruitment drives.';

-- 4. Applicants Table: For job candidates.
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
COMMENT ON TABLE applicants IS 'Stores information about job applicants.';

-- 5. Applicant Notes Table
CREATE TABLE applicant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE applicant_notes IS 'Stores internal notes for an applicant.';

-- 6. Interviews Table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Video', 'Phone', 'In-person')),
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Canceled')),
  candidate_name TEXT NOT NULL,
  interviewer_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  candidate_avatar TEXT,
  interviewer_avatar TEXT
);
COMMENT ON TABLE interviews IS 'Stores scheduled interviews for applicants.';

-- 7. Leave Balances Table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  sick_leave NUMERIC(4, 2) DEFAULT 0,
  casual_leave NUMERIC(4, 2) DEFAULT 0,
  earned_leave NUMERIC(4, 2) DEFAULT 0,
  unpaid_leave NUMERIC(4, 2) DEFAULT 0
);
COMMENT ON TABLE leave_balances IS 'Tracks available leave days for each user.';

-- 8. Leaves Table
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'earned', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_days NUMERIC(4, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE leaves IS 'Stores all leave requests made by users.';

-- 9. Shifts Table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    department TEXT
);
COMMENT ON TABLE shifts IS 'Defines different work shifts.';

-- 10. Attendance Logs Table
CREATE TABLE attendance_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT, -- e.g., 'Present', 'Late', 'On Leave'
    latitude_in NUMERIC(9, 6),
    longitude_in NUMERIC(9, 6),
    latitude_out NUMERIC(9, 6),
    longitude_out NUMERIC(9, 6)
);
COMMENT ON TABLE attendance_logs IS 'Logs employee check-in and check-out times.';

-- 11. Onboarding Workflows Table
CREATE TABLE onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buddy_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  buddy_name TEXT,
  employee_avatar TEXT,
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  start_date DATE NOT NULL
);
COMMENT ON TABLE onboarding_workflows IS 'Tracks onboarding progress for new hires.';

-- 12. Performance Reviews Table
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  job_title TEXT NOT NULL
);
COMMENT ON TABLE performance_reviews IS 'Stores records of employee performance reviews.';

-- 13. Objectives Table (OKRs)
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL
);
COMMENT ON TABLE objectives IS 'Stores company-wide or individual objectives (OKRs).';

-- 14. Key Results Table (OKRs)
CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('on_track', 'at_risk', 'off_track'))
);
COMMENT ON TABLE key_results IS 'Stores key results associated with an objective.';

-- 15. Company Posts Table (Social Feed)
CREATE TABLE company_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE company_posts IS 'Stores posts for the company-wide social feed.';

-- 16. Post Comments Table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES company_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE post_comments IS 'Stores comments on company feed posts.';

-- 17. Kudos Table
CREATE TABLE kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE kudos IS 'Stores records of recognition given between employees.';

-- 18. Weekly Awards Table
CREATE TABLE weekly_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  awarded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  week_of DATE NOT NULL
);
COMMENT ON TABLE weekly_awards IS 'Stores the "Employee of the Week" awards.';

-- 19. Payslips Table
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  gross_salary NUMERIC(10, 2) NOT NULL,
  net_salary NUMERIC(10, 2) NOT NULL,
  download_url TEXT NOT NULL
);
COMMENT ON TABLE payslips IS 'Stores metadata for employee payslips.';

-- 20. Payroll History Table
CREATE TABLE payroll_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    paid_days INTEGER NOT NULL,
    overtime_hours NUMERIC(5, 2) DEFAULT 0,
    gross_pay NUMERIC(10, 2) NOT NULL,
    deductions NUMERIC(10, 2) NOT NULL,
    net_pay NUMERIC(10, 2) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE payroll_history IS 'Detailed log for each payroll run.';

-- 21. Company Documents Table
CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  last_updated DATE NOT NULL,
  download_url TEXT NOT NULL
);
COMMENT ON TABLE company_documents IS 'Stores links to company-wide documents and policies.';

-- 22. Employee Documents Table
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g., 'PAN', 'Aadhaar', 'Resume', 'OfferLetter'
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    digital_signature TEXT -- To store signature data
);
COMMENT ON TABLE employee_documents IS 'Securely stores documents uploaded by or for an employee.';

-- 23. Expense Reports Table
CREATE TABLE expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'reimbursed')),
  submitted_at TIMESTAMPTZ
);
COMMENT ON TABLE expense_reports IS 'Stores employee expense reports.';

-- 24. Expense Items Table
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_report_id UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT
);
COMMENT ON TABLE expense_items IS 'Stores individual line items for an expense report.';

-- 25. Helpdesk Tickets Table
CREATE TABLE helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('IT', 'HR', 'Finance', 'General')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolver_id UUID REFERENCES users(id) ON DELETE SET NULL
);
COMMENT ON TABLE helpdesk_tickets IS 'Stores support tickets raised by employees.';

-- 26. Ticket Comments Table
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE ticket_comments IS 'Stores comments on a helpdesk ticket.';

-- 27. Audit Logs Table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_entity TEXT, -- e.g., 'employee', 'document'
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE audit_logs IS 'Tracks significant actions performed in the system for auditing purposes.';


-- === FUNCTIONS & TRIGGERS ===

-- Function to create a public user profile when an auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, department, avatar_url, profile_setup_complete)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    (new.raw_user_meta_data ->> 'role')::user_role,
    new.raw_user_meta_data ->> 'department',
    new.raw_user_meta_data ->> 'avatar_url',
    COALESCE((new.raw_user_meta_data ->> 'profile_setup_complete')::boolean, FALSE)
  );

  -- Also create an initial leave balance for the new user
  INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave)
  VALUES (new.id, 12, 12, 0); -- Example starting balance

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates a user profile and leave balance upon new user signup.';

-- Trigger to execute the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to get applicant funnel stats
CREATE OR REPLACE FUNCTION get_job_funnel_stats()
RETURNS TABLE(stage applicant_stage, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.stage,
        COALESCE(a.count, 0) as count
    FROM
        (SELECT unnest(enum_range(NULL::applicant_stage)) as stage) s
    LEFT JOIN
        (SELECT stage, count(*) as count FROM applicants GROUP BY stage) a
    ON s.stage = a.stage
    ORDER BY
        array_position(enum_range(NULL::applicant_stage), s.stage);
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_job_funnel_stats() IS 'Returns a count of applicants in each stage of the hiring pipeline.';


-- === INDEXES ===
CREATE INDEX idx_applicants_job_id ON applicants(job_id);
CREATE INDEX idx_applicants_college_id ON applicants(college_id);
CREATE INDEX idx_applicants_stage ON applicants(stage);
CREATE INDEX idx_interviews_applicant_id ON interviews(applicant_id);
CREATE INDEX idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_helpdesk_tickets_user_id ON helpdesk_tickets(user_id);
CREATE INDEX idx_helpdesk_tickets_status ON helpdesk_tickets(status);
CREATE INDEX idx_helpdesk_tickets_category ON helpdesk_tickets(category);
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_users_department ON users(department);

-- === RLS POLICIES ===
-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy: HR roles and admins can see all user profiles
CREATE POLICY "HR and Admins can view all profiles" ON users
FOR SELECT USING (
  (get_my_claim('user_role')::text IN ('admin', 'super_hr', 'hr_manager', 'recruiter'))
);

-- Policy: Employees can view their own documents
CREATE POLICY "Employees can view their own documents" ON employee_documents
FOR SELECT USING (auth.uid() = user_id);

-- Policy: HR and admins can manage all employee documents
CREATE POLICY "HR and Admins can manage all employee documents" ON employee_documents
FOR ALL USING (
  (get_my_claim('user_role')::text IN ('admin', 'super_hr', 'hr_manager'))
);

-- Policy: Employees can manage their own leave requests
CREATE POLICY "Employees can manage their own leave" ON leaves
FOR ALL USING (auth.uid() = user_id);

-- Policy: Managers can view their team's leave requests
CREATE POLICY "Managers can view team leaves" ON leaves
FOR SELECT USING (
    (get_my_claim('user_role')::text IN ('manager', 'team_lead')) AND
    department = (SELECT u.department FROM users u WHERE u.id = auth.uid())
);

-- Policy: HR and admins can manage all leave requests
CREATE POLICY "HR and Admins can manage all leaves" ON leaves
FOR ALL USING (
    (get_my_claim('user_role')::text IN ('admin', 'super_hr', 'hr_manager'))
);

-- Policy: Anyone logged in can see public info like jobs and company posts
CREATE POLICY "Allow public read access for authenticated users" ON jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public read access for authenticated users" ON company_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public read access for authenticated users" ON company_documents FOR SELECT USING (auth.role() = 'authenticated');

-- More policies would be added here for each table based on specific roles.
-- For example, managers can see their team's performance reviews, etc.

-- === STORAGE BUCKETS ===
-- NOTE: Buckets must be created manually in the Supabase Dashboard for this to work.
-- The RLS policies for storage are also set in the Dashboard.

-- For public images like post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;

-- For user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- For private employee documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_documents', 'employee_documents', false)
ON CONFLICT (id) DO NOTHING;

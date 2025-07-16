-- This script is designed to be run in the Supabase SQL Editor.
-- It will clear existing data and populate your tables with fake data.

-- 1. Disable the trigger that syncs auth.users to public.users temporarily
ALTER TABLE public.users DISABLE TRIGGER supabase_auth_on_user_updated;

-- 2. Clear existing data from all tables in reverse dependency order.
TRUNCATE public.ticket_comments RESTART IDENTITY CASCADE;
TRUNCATE public.expense_items RESTART IDENTITY CASCADE;
TRUNCATE public.post_comments RESTART IDENTITY CASCADE;
TRUNCATE public.kudos RESTART IDENTITY CASCADE;
TRUNCATE public.weekly_awards RESTART IDENTITY CASCADE;
TRUNCATE public.key_results RESTART IDENTITY CASCADE;
TRUNCATE public.applicant_notes RESTART IDENTITY CASCADE;
TRUNCATE public.interviews RESTART IDENTITY CASCADE;
TRUNCATE public.onboarding_workflows RESTART IDENTITY CASCADE;
TRUNCATE public.helpdesk_tickets RESTART IDENTITY CASCADE;
TRUNCATE public.expense_reports RESTART IDENTITY CASCADE;
TRUNCATE public.company_posts RESTART IDENTITY CASCADE;
TRUNCATE public.objectives RESTART IDENTITY CASCADE;
TRUNCATE public.leaves RESTART IDENTITY CASCADE;
TRUNCATE public.leave_balances RESTART IDENTITY CASCADE;
TRUNCATE public.payslips RESTART IDENTITY CASCADE;
TRUNCATE public.company_documents RESTART IDENTITY CASCADE;
TRUNCATE public.applicants RESTART IDENTITY CASCADE;
TRUNCATE public.colleges RESTART IDENTITY CASCADE;
TRUNCATE public.jobs RESTART IDENTITY CASCADE;
TRUNCATE public.users RESTART IDENTITY CASCADE;

-- 3. Insert Users
-- Note: These users will exist in your public.users table but not in auth.users.
-- This is suitable for development UI testing. For full auth features,
-- you would need to create them via the Supabase dashboard or API after seeding.
INSERT INTO public.users (id, full_name, email, avatar_url, role, department, profile_setup_complete) VALUES
('a1b2c3d4-0001-4000-8000-000000000001', 'Admin User', 'admin@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0001-4000-8000-000000000001', 'admin', 'Management', true),
('a1b2c3d4-0002-4000-8000-000000000002', 'Super HR Susan', 'super_hr@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0002-4000-8000-000000000002', 'super_hr', 'Human Resources', true),
('a1b2c3d4-0003-4000-8000-000000000003', 'HR Manager Harry', 'hr_manager@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0003-4000-8000-000000000003', 'hr_manager', 'Human Resources', true),
('a1b2c3d4-0004-4000-8000-000000000004', 'Recruiter Rick', 'recruiter@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0004-4000-8000-000000000004', 'recruiter', 'Human Resources', true),
('a1b2c3d4-0005-4000-8000-000000000005', 'Manager Mike', 'manager@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0005-4000-8000-000000000005', 'manager', 'Engineering', true),
('a1b2c3d4-0006-4000-8000-000000000006', 'Team Lead Tina', 'team_lead@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0006-4000-8000-000000000006', 'team_lead', 'Engineering', true),
('a1b2c3d4-0007-4000-8000-000000000007', 'Interviewer Ingrid', 'interviewer@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0007-4000-8000-000000000007', 'interviewer', 'Engineering', true),
('a1b2c3d4-0008-4000-8000-000000000008', 'Employee Eric', 'employee@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0008-4000-8000-000000000008', 'employee', 'Engineering', true),
('a1b2c3d4-0009-4000-8000-000000000009', 'Intern Ian', 'intern@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0009-4000-8000-000000000009', 'intern', 'Engineering', true),
('a1b2c3d4-0010-4000-8000-000000000010', 'Finance Fiona', 'finance@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0010-4000-8000-000000000010', 'finance', 'Finance', true),
('a1b2c3d4-0011-4000-8000-000000000011', 'IT Admin Ira', 'it_admin@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0011-4000-8000-000000000011', 'it_admin', 'IT', true),
('a1b2c3d4-0012-4000-8000-000000000012', 'Support Steve', 'support@hrplus.com', 'https://i.pravatar.cc/150?u=a1b2c3d4-0012-4000-8000-000000000012', 'support', 'IT', true);

-- 4. Insert Jobs
INSERT INTO public.jobs (title, department, description, status) VALUES
('Senior Frontend Engineer', 'Engineering', 'Build amazing user experiences with React and Next.js.', 'Open'),
('Product Manager', 'Product', 'Define the future of our HR platform.', 'Open'),
('UI/UX Designer', 'Design', 'Create beautiful and intuitive interfaces.', 'On hold'),
('DevOps Engineer', 'Engineering', 'Manage our cloud infrastructure and CI/CD pipelines.', 'Closed');

-- 5. Insert Applicants (linking to jobs)
INSERT INTO public.applicants (name, email, phone, job_id, stage, source, avatar)
SELECT
    'Alice Applicant',
    'alice@example.com',
    '111-222-3333',
    id,
    'Applied',
    'walk-in',
    'https://i.pravatar.cc/150?u=alice'
FROM public.jobs WHERE title = 'Senior Frontend Engineer'
LIMIT 1;

INSERT INTO public.applicants (name, email, phone, job_id, stage, source, avatar)
SELECT
    'Bob Builder',
    'bob@example.com',
    '222-333-4444',
    id,
    'Interview',
    'manual',
    'https://i.pravatar.cc/150?u=bob'
FROM public.jobs WHERE title = 'Product Manager'
LIMIT 1;

-- 6. Insert Leave Balances (for the first 5 users)
INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave)
SELECT id, 12, 12, 15, 0 FROM public.users LIMIT 5;

-- 7. Insert Leave Applications
INSERT INTO public.leaves (user_id, leave_type, start_date, end_date, reason, status, approver_id, total_days)
VALUES
(
    (SELECT id FROM public.users WHERE email = 'employee@hrplus.com'),
    'casual',
    current_date - interval '10 days',
    current_date - interval '8 days',
    'Family vacation',
    'approved',
    (SELECT id FROM public.users WHERE email = 'manager@hrplus.com'),
    3
),
(
    (SELECT id FROM public.users WHERE email = 'intern@hrplus.com'),
    'sick',
    current_date - interval '2 days',
    current_date - interval '2 days',
    'Feeling unwell',
    'pending',
    NULL,
    1
);

-- 8. Insert Company Posts
INSERT INTO public.company_posts (user_id, content, image_url)
VALUES
(
    (SELECT id FROM public.users WHERE email = 'hr_manager@hrplus.com'),
    'Welcome to our new team members! We are thrilled to have you join us. Let''s give them a warm welcome.',
    'https://placehold.co/600x400.png'
),
(
    (SELECT id FROM public.users WHERE email = 'admin@hrplus.com'),
    'Q3 results are in, and we have exceeded our targets! Great job everyone. Let''s keep up the momentum for Q4.',
    NULL
);

-- 9. Insert Post Comments
INSERT INTO public.post_comments (post_id, user_id, comment)
SELECT
    p.id,
    u.id,
    'This is great news! Congratulations to the team.'
FROM public.company_posts p, public.users u
WHERE p.content LIKE 'Q3 results%' AND u.email = 'employee@hrplus.com'
LIMIT 1;

-- 10. Insert Kudos
INSERT INTO public.kudos (from_user_id, to_user_id, value, message)
VALUES
(
    (SELECT id FROM public.users WHERE email = 'manager@hrplus.com'),
    (SELECT id FROM public.users WHERE email = 'employee@hrplus.com'),
    'Team Player',
    'Eric did an amazing job helping the new interns get up to speed this week. Truly a team player!'
);

-- 11. Insert Payslips
INSERT INTO public.payslips (user_id, month, year, gross_salary, net_salary, download_url)
VALUES
(
    (SELECT id FROM public.users WHERE email = 'employee@hrplus.com'),
    'August',
    2024,
    50000,
    45000,
    '#'
),
(
    (SELECT id FROM public.users WHERE email = 'employee@hrplus.com'),
    'July',
    2024,
    50000,
    45000,
    '#'
);

-- 12. Insert Company Documents
INSERT INTO public.company_documents (title, description, category, last_updated, download_url)
VALUES
('Employee Handbook', 'All company policies and procedures.', 'HR', current_date, '#'),
('IT Security Policy', 'Guidelines for using company IT resources securely.', 'IT', current_date - interval '30 days', '#');

-- 13. Re-enable the trigger
ALTER TABLE public.users ENABLE TRIGGER supabase_auth_on_user_updated;

-- End of script
SELECT 'Database seeding complete!' as status;

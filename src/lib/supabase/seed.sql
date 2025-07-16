-- This script is designed to be run in the Supabase SQL Editor.
-- It will clear all existing data and seed your tables with a fresh set of realistic fake data.

-- Truncate all tables in reverse order of dependency to clear existing data safely.
TRUNCATE TABLE public.ticket_comments, public.expense_items, public.post_comments, public.kudos, public.weekly_awards, public.key_results, public.applicant_notes, public.interviews, public.onboarding_workflows, public.helpdesk_tickets, public.expense_reports, public.company_posts, public.objectives, public.leaves, public.leave_balances, public.payslips, public.company_documents, public.applicants, public.colleges, public.jobs, public.users CASCADE;

-- Note: You must manually create users in the Supabase Auth dashboard.
-- This script uses placeholder UUIDs. For this to work perfectly, you would
-- need to replace the UUIDs below with the actual UUIDs of the users you create.
-- Example: '00000000-0000-0000-0000-000000000001' should be an actual user ID from auth.users.
-- For now, we will use these placeholders.

BEGIN;

-- Seed Users (assuming these users are created in Supabase Auth)
INSERT INTO public.users (id, full_name, email, avatar_url, role, department, profile_setup_complete) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@hrplus.com', 'https://i.pravatar.cc/150?u=000000000001', 'admin', 'Management', true),
('00000000-0000-0000-0000-000000000002', 'Super HR Susan', 'super_hr@hrplus.com', 'https://i.pravatar.cc/150?u=000000000002', 'super_hr', 'Human Resources', true),
('00000000-0000-0000-0000-000000000003', 'Manager Mike', 'manager@hrplus.com', 'https://i.pravatar.cc/150?u=000000000003', 'manager', 'Engineering', true),
('00000000-0000-0000-0000-000000000004', 'Employee Eric', 'employee@hrplus.com', 'https://i.pravatar.cc/150?u=000000000004', 'employee', 'Engineering', true),
('00000000-0000-0000-0000-000000000005', 'Recruiter Rick', 'recruiter@hrplus.com', 'https://i.pravatar.cc/150?u=000000000005', 'recruiter', 'Human Resources', true),
('00000000-0000-0000-0000-000000000006', 'Interviewer Ingrid', 'interviewer@hrplus.com', 'https://i.pravatar.cc/150?u=000000000006', 'interviewer', 'Engineering', true),
('00000000-0000-0000-0000-000000000007', 'Team Lead Tina', 'team_lead@hrplus.com', 'https://i.pravatar.cc/150?u=000000000007', 'team_lead', 'Product', true),
('00000000-0000-0000-0000-000000000008', 'Finance Fiona', 'finance@hrplus.com', 'https://i.pravatar.cc/150?u=000000000008', 'finance', 'Finance', true),
('00000000-0000-0000-0000-000000000009', 'IT Admin Ira', 'it_admin@hrplus.com', 'https://i.pravatar.cc/150?u=000000000009', 'it_admin', 'IT', true),
('00000000-0000-0000-0000-000000000010', 'Support Steve', 'support@hrplus.com', 'https://i.pravatar.cc/150?u=000000000010', 'support', 'IT', true),
('00000000-0000-0000-0000-000000000011', 'Intern Ian', 'intern@hrplus.com', 'https://i.pravatar.cc/150?u=000000000011', 'intern', 'Engineering', false);

-- Seed Jobs
INSERT INTO public.jobs (id, title, department, description, status, applicants) VALUES
('10000000-0000-0000-0000-000000000001', 'Senior Frontend Engineer', 'Engineering', 'Looking for a skilled React developer.', 'Open', 2),
('10000000-0000-0000-0000-000000000002', 'Product Manager', 'Product', 'Seeking a visionary product leader.', 'Open', 1),
('10000000-0000-0000-0000-000000000003', 'HR Generalist', 'Human Resources', 'Join our dynamic HR team.', 'Closed', 0);

-- Seed Applicants
INSERT INTO public.applicants (name, email, phone, job_id, stage, source) VALUES
('Alice Johnson', 'alice@example.com', '123-456-7890', '10000000-0000-0000-0000-000000000001', 'Interview', 'walk-in'),
('Bob Williams', 'bob@example.com', '234-567-8901', '10000000-0000-0000-0000-000000000001', 'Applied', 'email'),
('Charlie Brown', 'charlie@example.com', '345-678-9012', '10000000-0000-0000-0000-000000000002', 'Offer', 'college');

-- Seed Leaves and Balances
INSERT INTO public.leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave) VALUES
('00000000-0000-0000-0000-000000000004', 10, 5, 12, 0),
('00000000-0000-0000-0000-000000000003', 12, 12, 15, 1);

INSERT INTO public.leaves (user_id, leave_type, start_date, end_date, reason, status, total_days) VALUES
('00000000-0000-0000-0000-000000000004', 'casual', '2024-07-20', '2024-07-21', 'Family event', 'approved', 2),
('00000000-0000-0000-0000-000000000003', 'sick', '2024-07-22', '2024-07-22', 'Feeling unwell', 'pending', 1);

-- Seed Company Feed
INSERT INTO public.company_posts (user_id, content, image_url) VALUES
('00000000-0000-0000-0000-000000000002', 'Welcome to our new hires for this quarter! We are so excited to have you.', 'https://placehold.co/600x400.png');

INSERT INTO public.post_comments (post_id, user_id, comment)
SELECT id, '00000000-0000-0000-0000-000000000004', 'Excited to be here!' FROM public.company_posts LIMIT 1;

-- Seed Kudos & Awards
INSERT INTO public.kudos (from_user_id, to_user_id, value, message) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Team Player', 'Thanks for helping out with the big project!');

INSERT INTO public.weekly_awards (awarded_user_id, awarded_by_user_id, reason, week_of) VALUES
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Exceptional performance this week!', '2024-07-22');

-- Seed OKRs
INSERT INTO public.objectives (owner_id, title, quarter) VALUES
('00000000-0000-0000-0000-000000000003', 'Launch V2 of the main application', 'Q3 2024');

INSERT INTO public.key_results (objective_id, description, progress, status)
SELECT id, 'Achieve 99.9% uptime', 95, 'on_track' FROM public.objectives LIMIT 1;
SELECT id, 'Increase user engagement by 15%', 50, 'at_risk' FROM public.objectives LIMIT 1;

-- Seed Helpdesk Tickets
INSERT INTO public.helpdesk_tickets (user_id, subject, description, category, status, priority) VALUES
('00000000-0000-0000-0000-000000000004', 'Cannot access my email', 'My outlook is showing a connection error.', 'IT', 'Open', 'High');

INSERT INTO public.ticket_comments (ticket_id, user_id, comment)
SELECT id, '00000000-0000-0000-0000-000000000010', 'Looking into this for you now.' FROM public.helpdesk_tickets LIMIT 1;

COMMIT;

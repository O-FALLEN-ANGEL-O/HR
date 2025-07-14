-- HR+ Platform Fake Data Seed Script
-- Run this script in your Supabase SQL Editor to populate the database with sample data.
-- This script assumes you have run the initial user seed script (npm run db:seed).

-- Clear existing data to prevent duplicates (optional, use with caution)
TRUNCATE TABLE 
  jobs, applicants, applicant_notes, colleges, interviews, leave_balances, leaves, 
  onboarding_workflows, performance_reviews, objectives, key_results, company_posts, 
  kudos, weekly_awards, payslips, company_documents, expense_reports, expense_items, 
  helpdesk_tickets, ticket_comments 
RESTART IDENTITY CASCADE;

-- 1. Jobs
INSERT INTO jobs (title, department, description, status, posted_date, applicants) VALUES
('Senior Frontend Engineer', 'Engineering', 'Seeking a skilled Senior Frontend Engineer with experience in React and Next.js.', 'Open', '2023-10-15', 3),
('Product Manager', 'Product', 'Join our product team to lead the development of our new AI-powered features.', 'Open', '2023-10-20', 2),
('UI/UX Designer', 'Design', 'Creative UI/UX designer needed to craft beautiful and intuitive user experiences.', 'On hold', '2023-09-01', 1),
('DevOps Engineer', 'Engineering', 'Manage our cloud infrastructure and CI/CD pipelines.', 'Closed', '2023-08-05', 0);

-- 2. Colleges
INSERT INTO colleges (name, status, resumes_received, contact_email, last_contacted) VALUES
('Greenwood University', 'Confirmed', 2, 'placements@greenwood.edu', '2023-10-10'),
('Mapleleaf Institute of Technology', 'Invited', 0, 'tpo@mapleleaf.tech', '2023-10-22'),
('Riverside College of Arts & Science', 'Attended', 1, 'career@riverside.edu', '2023-09-15');

-- 3. Applicants
-- We will link applicants to the jobs and colleges created above.
INSERT INTO applicants (name, email, phone, job_id, stage, applied_date, source, college_id, ai_match_score, ai_justification, wpm, accuracy, aptitude_score, comprehensive_score, english_grammar_score, customer_service_score, avatar) VALUES
('Alice Johnson', 'alice.j@example.com', '555-0101', (SELECT id FROM jobs WHERE title = 'Senior Frontend Engineer'), 'Interview', '2023-10-16', 'manual', NULL, 85, 'Strong alignment with React and Next.js skills mentioned in the job description. Good project experience.', 75, 98, 92, 88, 95, 90, 'https://i.pravatar.cc/150?u=alice'),
('Bob Williams', 'bob.w@example.com', '555-0102', (SELECT id FROM jobs WHERE title = 'Senior Frontend Engineer'), 'Phone Screen', '2023-10-18', 'walk-in', NULL, 72, 'Some experience with React, but lacks Next.js expertise. Worth a phone screen to explore further.', 60, 91, 85, 78, 88, 82, 'https://i.pravatar.cc/150?u=bob'),
('Charlie Brown', 'charlie.b@example.com', '555-0103', (SELECT id FROM jobs WHERE title = 'Product Manager'), 'Applied', '2023-10-21', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://i.pravatar.cc/150?u=charlie'),
('Diana Miller', 'diana.m@example.com', '555-0104', (SELECT id FROM jobs WHERE title = 'Senior Frontend Engineer'), 'Hired', '2023-09-25', 'college', (SELECT id FROM colleges WHERE name = 'Greenwood University'), 95, 'Excellent candidate with perfect skill match and great cultural fit.', 85, 99, 95, 92, 98, 94, 'https://i.pravatar.cc/150?u=diana'),
('Ethan Davis', 'ethan.d@example.com', '555-0105', (SELECT id FROM jobs WHERE title = 'Product Manager'), 'Rejected', '2023-10-22', 'college', (SELECT id FROM colleges WHERE name = 'Riverside College of Arts & Science'), 45, 'Lacks experience in B2B product management.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://i.pravatar.cc/150?u=ethan');

-- 4. Applicant Notes
INSERT INTO applicant_notes (applicant_id, user_id, author_name, author_avatar, note) VALUES
((SELECT id FROM applicants WHERE name = 'Alice Johnson'), (SELECT id FROM users WHERE email = 'recruiter@hrplus.com'), 'Recruiter Rick', (SELECT avatar_url FROM users WHERE email = 'recruiter@hrplus.com'), 'Initial screen passed. Alice seems very promising. Moving to technical interview.'),
((SELECT id FROM applicants WHERE name = 'Alice Johnson'), (SELECT id FROM users WHERE email = 'interviewer@hrplus.com'), 'Interviewer Ingrid', (SELECT avatar_url FROM users WHERE email = 'interviewer@hrplus.com'), 'Strong technical skills demonstrated. Great problem-solver. Recommend for final round.');

-- 5. Interviews
INSERT INTO interviews (applicant_id, interviewer_id, date, "time", type, status, candidate_name, candidate_avatar, interviewer_name, interviewer_avatar, job_title) VALUES
((SELECT id FROM applicants WHERE name = 'Alice Johnson'), (SELECT id FROM users WHERE email = 'interviewer@hrplus.com'), '2023-10-25', '14:00', 'Video', 'Completed', 'Alice Johnson', (SELECT avatar FROM applicants WHERE name = 'Alice Johnson'), 'Interviewer Ingrid', (SELECT avatar_url FROM users WHERE email = 'interviewer@hrplus.com'), 'Senior Frontend Engineer'),
((SELECT id FROM applicants WHERE name = 'Bob Williams'), (SELECT id FROM users WHERE email = 'recruiter@hrplus.com'), '2023-10-28', '11:00', 'Phone', 'Scheduled', 'Bob Williams', (SELECT avatar FROM applicants WHERE name = 'Bob Williams'), 'Recruiter Rick', (SELECT avatar_url FROM users WHERE email = 'recruiter@hrplus.com'), 'Senior Frontend Engineer');

-- 6. Leave Balances
-- Set initial leave balances for a few key users.
INSERT INTO leave_balances (user_id, sick_leave, casual_leave, earned_leave, unpaid_leave) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 12, 7, 15, 0),
((SELECT id FROM users WHERE email = 'manager@hrplus.com'), 12, 7, 18, 0),
((SELECT id FROM users WHERE email = 'intern@hrplus.com'), 6, 3, 0, 0);

-- 7. Leaves
INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, status, approver_id, total_days) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'casual', '2023-11-10', '2023-11-11', 'Family event.', 'approved', (SELECT id FROM users WHERE email = 'manager@hrplus.com'), 2),
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'sick', '2023-10-05', '2023-10-05', 'Feeling unwell.', 'approved', (SELECT id FROM users WHERE email = 'manager@hrplus.com'), 1),
((SELECT id FROM users WHERE email = 'intern@hrplus.com'), 'casual', '2023-11-15', '2023-11-15', 'Personal appointment.', 'pending', NULL, 1);

-- 8. Onboarding Workflows
INSERT INTO onboarding_workflows (user_id, manager_id, buddy_id, employee_name, employee_avatar, job_title, manager_name, buddy_name, progress, current_step, start_date) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), (SELECT id FROM users WHERE email = 'manager@hrplus.com'), (SELECT id FROM users WHERE email = 'team_lead@hrplus.com'), 'Employee Eric', (SELECT avatar_url FROM users WHERE email = 'employee@hrplus.com'), 'Software Engineer', 'Manager Mike', 'Team Lead Tina', 75, 'IT Setup', '2023-09-01');

-- 9. Performance Reviews
INSERT INTO performance_reviews (user_id, review_date, status, job_title) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), '2023-12-31', 'Pending', 'Software Engineer'),
((SELECT id FROM users WHERE email = 'manager@hrplus.com'), '2023-12-31', 'In Progress', 'Engineering Manager');

-- 10. Objectives and Key Results
INSERT INTO objectives (owner_id, title, quarter) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'Improve application performance', 'Q4 2023');
INSERT INTO key_results (objective_id, description, progress, status) VALUES
((SELECT id FROM objectives WHERE title = 'Improve application performance'), 'Reduce page load time by 15%', 50, 'on_track'),
((SELECT id FROM objectives WHERE title = 'Improve application performance'), 'Achieve 99.9% API uptime', 90, 'on_track'),
((SELECT id FROM objectives WHERE title = 'Improve application performance'), 'Fix 10 critical bugs', 20, 'at_risk');

-- 11. Company Posts
INSERT INTO company_posts (user_id, content, image_url) VALUES
((SELECT id FROM users WHERE email = 'hr_manager@hrplus.com'), 'Welcome to all our new hires for Q4! We are excited to have you on board.', 'https://placehold.co/800x400.png'),
((SELECT id FROM users WHERE email = 'admin@hrplus.com'), 'Just a reminder that our annual company retreat is scheduled for next month. Please RSVP by the end of the week!', NULL);

-- 12. Kudos and Weekly Awards
INSERT INTO kudos (from_user_id, to_user_id, value, message) VALUES
((SELECT id FROM users WHERE email = 'manager@hrplus.com'), (SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'Team Player', 'Great job helping out the new intern this week, Eric!'),
((SELECT id FROM users WHERE email = 'intern@hrplus.com'), (SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'Ownership', 'Thanks for the clear documentation on the new feature.');
INSERT INTO weekly_awards (awarded_user_id, awarded_by_user_id, reason, week_of) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), (SELECT id FROM users WHERE email = 'manager@hrplus.com'), 'For going above and beyond to ensure the successful launch of the new feature.', '2023-10-23');

-- 13. Payslips
INSERT INTO payslips (user_id, month, year, gross_salary, net_salary, download_url) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'September', 2023, 5000, 4200, '#'),
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'August', 2023, 5000, 4150, '#'),
((SELECT id FROM users WHERE email = 'manager@hrplus.com'), 'September', 2023, 8000, 6500, '#');

-- 14. Company Documents
INSERT INTO company_documents (title, description, category, last_updated, download_url) VALUES
('Employee Handbook', 'The official company handbook for all employees.', 'Policy', '2023-01-15', '#'),
('Work From Home Policy', 'Guidelines and policies for remote work.', 'Policy', '2023-05-20', '#'),
('Code of Conduct', 'Ethical guidelines and expected behavior.', 'Compliance', '2022-11-30', '#');

-- 15. Expense Reports and Items
INSERT INTO expense_reports (user_id, title, total_amount, status, submitted_at) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'Client Meeting Lunch', 75.50, 'approved', '2023-10-10');
INSERT INTO expense_items (expense_report_id, date, category, amount, description) VALUES
((SELECT id FROM expense_reports WHERE title = 'Client Meeting Lunch'), '2023-10-09', 'Meals', 75.50, 'Lunch with Acme Corp team.');

INSERT INTO expense_reports (user_id, title, total_amount, status, submitted_at) VALUES
((SELECT id FROM users WHERE email = 'manager@hrplus.com'), 'Team Offsite Travel', 520.00, 'submitted', '2023-10-20');
INSERT INTO expense_items (expense_report_id, date, category, amount, description) VALUES
((SELECT id FROM expense_reports WHERE title = 'Team Offsite Travel'), '2023-10-18', 'Travel', 450.00, 'Flights for team offsite event.'),
((SELECT id FROM expense_reports WHERE title = 'Team Offsite Travel'), '2023-10-19', 'Accommodation', 70.00, 'Hotel for team offsite event.');

-- 16. Helpdesk Tickets and Comments
INSERT INTO helpdesk_tickets (user_id, subject, description, category, status, priority) VALUES
((SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'VPN Access Issue', 'I am unable to connect to the company VPN from my home network.', 'IT', 'In Progress', 'High');
INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES
((SELECT id FROM helpdesk_tickets WHERE subject = 'VPN Access Issue'), (SELECT id FROM users WHERE email = 'employee@hrplus.com'), 'I have already tried restarting my router and my laptop.'),
((SELECT id FROM helpdesk_tickets WHERE subject = 'VPN Access Issue'), (SELECT id FROM users WHERE email = 'admin@hrplus.com'), 'Hi Eric, we are looking into this for you. An IT admin will be in touch shortly.');

INSERT INTO helpdesk_tickets (user_id, subject, description, category, status, priority) VALUES
((SELECT id FROM users WHERE email = 'manager@hrplus.com'), 'Question about Leave Policy', 'Could you clarify the policy on carry-over for earned leave?', 'HR', 'Resolved', 'Medium');
INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES
((SELECT id FROM helpdesk_tickets WHERE subject = 'Question about Leave Policy'), (SELECT id FROM users WHERE email = 'hr_manager@hrplus.com'), 'Hi Mike, you can carry over up to 5 days of earned leave into the next calendar year. The full policy is available in the Documents section.');


-- End of script
SELECT '✅ Fake data seeding complete.' AS status;

# **App Name**: HR+

## Core Features:

- Metrics Dashboard: Centralized view of key HR metrics: total employees, attrition rate, compliance score, open positions. Recent job postings and notifications. Quick actions for adding employees, posting jobs, running compliance checks. Role-based access control for data visibility.
- Applicant Management: Searchable and filterable list of job applicants. Detailed applicant profiles with resume summaries, HR notes, and contact info. Actions to schedule interviews, download resumes, and send emails. Export functionality.
- Job Postings Management: Manage job postings with creation, search, and filtering. Job cards display status, applicants count, posting date, and source. Edit and view job details.
- Interview Management: Schedule and manage interviews with candidate and interviewer details. Support for multiple interview types (video, phone, in-person). Collect feedback with ratings and recommendations. Filter interviews by status and type.
- Onboarding Workflow Management: Manage onboarding workflows with templates, phases, and tasks. Track employee progress, current steps, buddies, and managers. Onboarding analytics including completion trends and satisfaction scores. Export reports and start new onboarding workflows.
- Applicant Match Scoring: AI tool to analyze applicant profiles to produce match scores.
- Authentication and Authorization: Supabase-based authentication with user profiles. Role-based access control with roles: admin, hr_manager, employee, recruiter. Permissions mapped to features for fine-grained access control. Row Level Security (RLS) policies in the database.
- Backend API: Next.js app router API routes using Supabase client. CRUD operations for HR entities like assessments, jobs, applicants, interviews. Robust error handling and JSON responses.
- Database Schema: PostgreSQL database managed via Supabase. Tables for onboarding, referrals, document vault, certifications, email monitoring, predictive analytics, integration endpoints, audit logs, and more. Triggers for automatic timestamp updates. Indexes for performance. RLS policies for data security.
- Frontend Architecture: Next.js 13 app directory with React server and client components. Tailwind CSS for styling. UI components for cards, tables, dialogs, buttons, badges, avatars, inputs, selects, progress bars, tabs, toasts. RoleGuard component for permission-based UI rendering. Global layout with sidebar navigation, authentication context, and toast notifications.
- Performance Management: Manage employee performance reviews, track goals, and provide feedback.
- Time and Attendance Tracking: Tools for managing employee attendance, time off requests, and leave balances.
- Payroll and Benefits: Manage employee payroll, taxes, and benefits administration.
- Compliance Management: Ensure compliance with labor laws, regulations, and company policies.
- Learning and Development: Training and development programs for employees to enhance their skills and knowledge.
- AI Chatbot: Chat tool with an LLM to help answer employee questions.
- Performance Review Analysis Tool: Suggest changes to performance reviews based on tone and data.

## Style Guidelines:

- Primary color: Indigo (#4F46E5) for professionalism and trust.
- Background color: Very light gray (#F9FAFB) for a clean and modern look.
- Accent color: Teal (#008080) to provide contrast and highlights in graphs or interactive elements, suggesting growth and balance.
- Body and headline font: 'Inter', a sans-serif, for a clean, modern, neutral look.
- Use a consistent style of outline icons focused on HR-related topics such as users, documents, charts, and tasks.
- Use a responsive layout with a sidebar for navigation, ensuring a consistent user experience across different devices.
- Use subtle transition animations on dashboard updates, such as new applicant alerts or updated metrics, to make the application feel more interactive.
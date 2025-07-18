# HR+ Application Blueprint & Master Prompt

## 1. High-Level Vision & Core Principles

**Application Name:** HR+ (or Throne)

**Vision:** To build a modern, enterprise-grade, and comprehensive Human Resource Management System (HRMS). The platform should be intuitive for employees, powerful for managers, and a centralized control center for HR and administrators. It prioritizes self-service, automation, and data-driven insights.

**Core Principles:**
- **Role-Based Experience:** The UI and functionality must adapt intelligently based on the user's role (Employee, Manager, Recruiter, HR, Admin, etc.).
- **Component-Driven Architecture:** Build with modular, reusable React components using ShadCN UI for a consistent and professional look and feel.
- **Real-Time & Responsive:** Leverage Supabase Realtime to ensure the UI is always up-to-date. The application must be fully responsive for desktop and mobile use.
- **AI-Enhanced Workflows:** Integrate AI using Genkit to automate tasks, provide insights, and enhance user interactions (e.g., resume parsing, applicant scoring, chatbots).
- **Secure & Scalable:** Use Supabase for backend services, including authentication with Row-Level Security (RLS) to enforce data access policies.

---

## 2. Technology Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** ShadCN UI
- **Styling:** Tailwind CSS
- **AI Integration:** Google AI via Genkit
- **State Management:** React Hooks (`useState`, `useEffect`, `useContext`). Use server components and server actions for data fetching and mutations by default.
- **Form Handling:** React Hook Form with Zod for validation.
- **Deployment:** Vercel (or similar Next.js hosting)

---

## 3. Key Modules & Features

### 3.1. Core & Authentication
- **User Roles:** Implement a robust role system (`admin`, `super_hr`, `hr_manager`, `recruiter`, `manager`, `employee`, etc.) stored in the `users` table.
- **Simulated Login:** A login page that allows selecting a role to simulate different user experiences.
- **Onboarding Flow:** A mandatory, multi-step onboarding form for new users to complete their profiles (`/onboarding`).
- **Middleware:** Enforce authentication and onboarding completion for all protected routes.
- **Central Dashboard (`/`):** The root page should intelligently redirect users to their specific dashboard based on their role.

### 3.2. Recruitment Module
- **Job Postings (`/recruiter/jobs`):**
  - HR/Recruiters can create, edit, and manage job postings (title, department, description, status).
  - UI should be a grid of cards, each representing a job.
- **Applicant Tracking (`/hr/applicants`):**
  - A central table to view all applicants.
  - Features: Search, filter by stage/source, real-time updates.
  - Actions: View profile, schedule interview, assign assessments.
- **Applicant Profile (`/hr/applicants/[id]`):**
  - Detailed view of an applicant.
  - **AI Resume Parsing:** Use a Genkit flow (`processResume`) to automatically extract info from an uploaded resume (PDF/image) and populate the applicant's profile.
  - **AI Match Scoring:** Use a Genkit flow (`applicantMatchScoring`) to compare the applicant's profile to the job description and generate a compatibility score and justification.
  - Internal notes section for the hiring team.
- **Public Registration (`/register`):** A public page for walk-in or referred candidates to register, with an option to upload/scan a resume for AI pre-filling.

### 3.3. Leave Management System (`/leaves`)
- **Role-Based Views:**
  - **Employee:** View leave balances (Sick, Casual, Earned), apply for leave via a dialog, and view history.
  - **Manager:** Approve/reject team requests. View a warning for overlapping leave requests.
  - **HR/Admin:** Global view of all requests, dashboard with stats (on leave today, pending requests), and an AI tool to predict leave spikes.
- **AI Leave Spike Prediction:** A Genkit flow (`predictLeaveSpikes`) analyzes leave data to forecast potential mass absenteeism around holidays or long weekends.
- **Database Logic:** Server actions handle leave applications, balance deductions, and status updates, ensuring data integrity.

### 3.4. Employee Engagement & Company Culture
- **Company Feed (`/company-feed`):**
  - A central social feed for company announcements.
  - HR/Admins can create posts with text and images.
  - All users can view, react to (❤️, 🔥, etc.), and comment on posts.
- **Kudos System (`/employee/kudos`):**
  - Employees can give public recognition ("kudos") to colleagues based on company values.
  - A feed displays all kudos.
  - Managers/HR can give a special "Employee of the Week" award.
- **Employee Directory (`/employee/directory`):** A searchable list of all employees with their name, department, and contact info.

### 3.5. Employee Self-Service
- **My Profile (`/profile`):** A page where users can view their personal and job-related information, manager, team members, and leave balances.
- **Company Documents (`/employee/documents`):** A repository for company policies (e.g., Employee Handbook, IT Policy).
- **Payslips (`/employee/payslips`):** A page for employees to view and download their payslips.
- **Expense Reports (`/expenses`):** Employees can submit expense reports; managers/finance can view/approve them.

### 3.6. Helpdesk & Support (`/helpdesk`)
- Users can create support tickets (IT, HR, Finance).
- A two-column layout: a list of tickets on the left and the details/comments of the selected ticket on the right.
- Real-time comment section for tickets.
- Support staff/admins have a global view of all tickets.

### 3.7. AI Tools Section
- **AI Applicant Scoring (`/ai-tools/applicant-scoring`):** A standalone tool for HR to paste a job description and resume text to get a match score, powered by the `applicantMatchScoring` flow.
- **AI Review Analyzer (`/ai-tools/review-analyzer`):** A tool for managers to get AI-powered feedback on performance reviews, making them more constructive and fair. Uses the `analyzePerformanceReview` flow.
- **AI HR Chatbot (`/ai-tools/chatbot`):** A conversational chatbot for employees to ask HR-related questions. Powered by the `aiChatbot` Genkit flow.

---

## 4. Database Schema Overview

The database should contain the following tables. Refer to `DATABASE_REFERENCE.md` for column-level details.

- **Core:** `users`, `jobs`, `colleges`
- **Recruitment:** `applicants`, `applicant_notes`, `interviews`
- **Leave:** `leaves`, `leave_balances`
- **Onboarding:** `onboarding_workflows`
- **Performance:** `performance_reviews`, `objectives`, `key_results`
- **Engagement:** `company_posts`, `post_comments`, `kudos`, `weekly_awards`
- **Finance & Docs:** `payslips`, `company_documents`, `expense_reports`, `expense_items`
- **Support:** `helpdesk_tickets`, `ticket_comments`

---

## 5. Implementation Notes & Best Practices

- **File Naming:** Use kebab-case for files and folders (e.g., `company-feed`).
- **Component Structure:**
  - For pages with significant client-side interactivity, use a client component (e.g., `client.tsx`) that is rendered by a server component page (`page.tsx`).
  - Keep server components clean, primarily for data fetching and passing initial data to client components.
- **Server Actions:** Use server actions (`actions.ts`) for all data mutations (creates, updates, deletes) to ensure security and revalidation logic is handled on the server.
- **Styling:** Use Tailwind CSS utility classes directly. Avoid custom CSS files. Use `cn` utility for conditional classes.
- **Data Fetching:** Fetch data in `page.tsx` (Server Components) and pass it as props to client components. Use Supabase server client.
- **Real-Time:** Use the Supabase browser client within `useEffect` hooks in client components to subscribe to channel updates.
- **AI Flows:** All Genkit flows should be defined in `src/ai/flows/` and follow the established pattern (schema definitions, prompt, flow, exported wrapper function).
- **Modals & Dialogs:** Create reusable dialog components for forms like "Add Applicant", "New Job", "Apply for Leave", etc.
- **Loading & Skeletons:** Provide a root `loading.tsx` for the app shell and consider using skeleton components for a better user experience on data-heavy pages.
- **Error Handling:** Gracefully handle errors from API calls and database queries, providing user-friendly feedback via the `useToast` hook.
- **Seeding:** A comprehensive seed script (`src/lib/supabase/seed.ts`) is crucial for populating the database with realistic data for all roles and features.
- **Public Pages:** Create separate layouts and logic for public-facing pages like the applicant test portals (`/typing-test`, `/portal/[id]`, etc.) that do not require authentication.
- **Security:** Ensure RLS policies are enabled in Supabase for production. The seed script should only be run in development.
- **Environment Variables:** Use a `.env.local` file to store Supabase and other service keys. Ensure public keys are prefixed with `NEXT_PUBLIC_`.
- **Forms:** Use `react-hook-form` and `zod` for all forms to handle validation and state management efficiently.
- **Accessibility:** Use semantic HTML and ARIA attributes where necessary to ensure the application is accessible.
- **User Experience:**
  - Use `ScrollArea` for long lists or tables within cards to prevent page layout from breaking.
  - Employ optimistic UI updates where appropriate, but always re-fetch or revalidate data after a successful mutation.
  - Keep the UI clean and uncluttered. Use whitespace effectively.
- **Code Comments:** Write clear comments for complex logic, especially in server actions and AI flows, but keep component code clean and self-explanatory.

    
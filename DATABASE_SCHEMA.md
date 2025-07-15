
# HR+ Database Schema Documentation

This document outlines the complete database schema for the HR+ application. It includes all custom types, tables, columns, and their relationships.

## Custom Data Types (ENUMs)

These custom types are used to ensure data consistency for specific fields.

- **`user_role`**: Defines the different roles a user can have within the system.
  - Values: `admin`, `super_hr`, `hr_manager`, `recruiter`, `interviewer`, `manager`, `team_lead`, `employee`, `intern`, `guest`, `finance`, `it_admin`, `support`, `auditor`
- **`applicant_stage`**: Tracks the current stage of a job applicant in the hiring pipeline.
  - Values: `Sourced`, `Applied`, `Phone Screen`, `Interview`, `Offer`, `Hired`, `Rejected`
- **`leave_status`**: Represents the status of a leave request.
  - Values: `pending`, `approved`, `rejected`
- **`leave_type`**: The type of leave requested by an employee.
  - Values: `sick`, `casual`, `earned`, `unpaid`
- **`job_status`**: The current status of a job posting.
  - Values: `Open`, `Closed`, `On hold`
- **`college_status`**: The status of a college in a recruitment drive.
  - Values: `Invited`, `Confirmed`, `Attended`, `Declined`
- **`interview_status`**: The status of a scheduled interview.
  - Values: `Scheduled`, `Completed`, `Canceled`
- **`interview_type`**: The format of an interview.
  - Values: `Video`, `Phone`, `In-person`
- **`review_status`**: The status of a performance review cycle.
  - Values: `Pending`, `In Progress`, `Completed`
- **`key_result_status`**: The status of an Objective's Key Result (OKR).
  - Values: `on_track`, `at_risk`, `off_track`
- **`expense_status`**: The status of an expense report.
  - Values: `draft`, `submitted`, `approved`, `rejected`, `reimbursed`
- **`ticket_status`**: The status of a helpdesk support ticket.
  - Values: `Open`, `In Progress`, `Resolved`, `Closed`
- **`ticket_priority`**: The priority level of a helpdesk ticket.
  - Values: `Low`, `Medium`, `High`, `Urgent`
- **`ticket_category`**: The category of a helpdesk ticket.
  - Values: `IT`, `HR`, `Finance`, `General`

---

## Tables

### 1. `users`
Stores public user profile information. Linked to `auth.users` via a trigger.
- `id` (uuid, Primary Key): References `auth.users.id`.
- `full_name` (text): User's full name.
- `email` (text): User's email address.
- `avatar_url` (text): URL to the user's profile picture.
- `role` (user_role): The user's role in the system.
- `department` (text): The department the user belongs to.
- `created_at` (timestamp with time zone): The timestamp when the user was created.
- `phone` (text): The user's phone number.
- `profile_setup_complete` (boolean): Flag to indicate if the user has completed their initial profile setup.

### 2. `jobs`
Stores job postings.
- `id` (uuid, Primary Key): Unique identifier for the job.
- `title` (text): The job title.
- `department` (text): The department this job belongs to.
- `description` (text): A detailed description of the job role and requirements.
- `status` (job_status): The current status of the posting.
- `posted_date` (timestamp with time zone): The date the job was posted.
- `applicants` (integer): A cached count of applicants.

### 3. `colleges`
Stores information about colleges for campus recruitment drives.
- `id` (uuid, Primary Key): Unique identifier for the college.
- `name` (text): The name of the college.
- `status` (college_status): The current status of the college in the drive.
- `resumes_received` (integer): Number of resumes received from this college.
- `contact_email` (text): The contact email for the college's placement office.
- `last_contacted` (timestamp with time zone): The date the college was last contacted.

### 4. `applicants`
Stores information about job applicants.
- `id` (uuid, Primary Key): Unique identifier for the applicant.
- `name` (text): Applicant's full name.
- `email` (text): Applicant's email.
- `phone` (text): Applicant's phone number.
- `job_id` (uuid, Foreign Key): References `jobs.id`.
- `stage` (applicant_stage): The applicant's current stage in the hiring pipeline.
- `applied_date` (timestamp with time zone): The date of application.
- `avatar` (text): URL to the applicant's photo.
- `source` (text): How the applicant was sourced (e.g., 'walk-in', 'college').
- `college_id` (uuid, Foreign Key): References `colleges.id`.
- `resume_data` (jsonb): JSON object containing parsed resume information from Genkit.
- `ai_match_score` (integer): An AI-generated score (0-100) of how well the applicant matches the job.
- `ai_justification` (text): The reasoning behind the AI match score.
- `wpm`, `accuracy`, `aptitude_score`, etc. (integer): Scores from various pre-employment assessments.

### 5. `applicant_notes`
Stores internal notes about applicants made by the hiring team.
- `id` (uuid, Primary Key): Unique identifier for the note.
- `applicant_id` (uuid, Foreign Key): References `applicants.id`.
- `user_id` (uuid, Foreign Key): References `users.id` (the author of the note).
- `author_name` (text): The name of the note's author.
- `author_avatar` (text): The avatar URL of the note's author.
- `note` (text): The content of the note.
- `created_at` (timestamp with time zone): Timestamp of note creation.

### 6. `interviews`
Stores information about scheduled interviews.
- `id` (uuid, Primary Key): Unique identifier for the interview.
- `applicant_id` (uuid, Foreign Key): References `applicants.id`.
- `interviewer_id` (uuid, Foreign Key): References `users.id`.
- `date` (date): The date of the interview.
- `time` (time): The time of the interview.
- `type` (interview_type): The format of the interview.
- `status` (interview_status): The status of the interview.
- `candidate_name`, `interviewer_name`, `job_title` (text): Denormalized data for easy display.
- `candidate_avatar`, `interviewer_avatar` (text): Denormalized avatar URLs.

### 7. `leaves`
Tracks employee leave requests.
- `id` (uuid, Primary Key): Unique identifier for the leave request.
- `user_id` (uuid, Foreign Key): References `users.id`.
- `leave_type` (leave_type): The type of leave.
- `start_date` (date): The start date of the leave.
- `end_date` (date): The end date of the leave.
- `reason` (text): The reason for the leave.
- `status` (leave_status): The current status of the request.
- `approver_id` (uuid, Foreign Key): References `users.id` (the manager who approved/rejected).
- `total_days` (integer): The total number of days for the leave request.

### 8. `leave_balances`
Tracks the available leave days for each employee.
- `id` (uuid, Primary Key): Unique identifier.
- `user_id` (uuid, Foreign Key): References `users.id`.
- `sick_leave`, `casual_leave`, `earned_leave`, `unpaid_leave` (integer): The number of days available for each leave type.

### 9. `company_posts`
Stores posts for the company-wide feed.
- `id` (uuid, Primary Key): Unique identifier for the post.
- `user_id` (uuid, Foreign Key): References `users.id` (the author of the post).
- `content` (text): The text content of the post.
- `image_url` (text): Optional URL for an image associated with the post.
- `created_at` (timestamp with time zone): Timestamp of post creation.

### 10. `post_comments`
Stores comments on company feed posts.
- `id` (uuid, Primary Key): Unique identifier for the comment.
- `post_id` (uuid, Foreign Key): References `company_posts.id`.
- `user_id` (uuid, Foreign Key): References `users.id` (the author of the comment).
- `comment` (text): The content of the comment.
- `created_at` (timestamp with time zone): Timestamp of comment creation.

### 11. `helpdesk_tickets`
Stores support tickets submitted by employees.
- `id` (uuid, Primary Key): Unique identifier for the ticket.
- `user_id` (uuid, Foreign Key): References `users.id`.
- `subject` (text): The subject line of the ticket.
- `description` (text): The detailed description of the issue.
- `category` (ticket_category): The category of the ticket (IT, HR, etc.).
- `status` (ticket_status): The current status of the ticket.
- `priority` (ticket_priority): The priority of the ticket.
- `created_at`, `updated_at` (timestamp with time zone).

### 12. `ticket_comments`
Stores comments and replies for helpdesk tickets.
- `id` (uuid, Primary Key): Unique identifier for the comment.
- `ticket_id` (uuid, Foreign Key): References `helpdesk_tickets.id`.
- `user_id` (uuid, Foreign Key): References `users.id`.
- `comment` (text): The content of the reply.
- `created_at` (timestamp with time zone).

This covers the primary tables and their structures needed to make the HR+ application fully functional.

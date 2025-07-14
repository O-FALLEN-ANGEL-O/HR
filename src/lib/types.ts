import type { ProcessResumeOutput } from "@/ai/flows/process-resume";

export type UserRole = 
  | 'admin'
  | 'super_hr'
  | 'hr_manager'
  | 'recruiter'
  | 'interviewer'
  | 'manager'
  | 'team_lead'
  | 'employee'
  | 'intern'
  | 'guest'
  | 'finance'
  | 'it_admin'
  | 'support'
  | 'auditor';

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  department: string | null;
  created_at: string;
}

export type Metric = {
  id: number;
  title: string;
  value: string;
  change?: string;
  change_type?: 'increase' | 'decrease';
};

export type Job = {
  id:string;
  title: string;
  department: string;
  description?: string;
  status: 'Open' | 'Closed' | 'On hold';
  posted_date: string;
  applicants: number;
};

export type Applicant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_id?: string;
  jobs?: { title: string } | null; // For joined data
  stage: 'Sourced' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  applied_date: string;
  avatar?: string;
  source?: 'walk-in' | 'college' | 'email' | 'manual';
  wpm?: number;
  accuracy?: number;
  college_id?: string;
  resume_data?: ProcessResumeOutput;
  ai_match_score?: number;
  ai_justification?: string;
};

export type Onboarding = {
  id: string;
  user_id: string;
  manager_id: string;
  buddy_id?: string | null;
  employee_name: string;
  employee_avatar: string;
  job_title: string;
  manager_name: string;
  buddy_name?: string | null;
  progress: number;
  current_step: string;
  start_date: string;
};

export type PerformanceReview = {
  id: string;
  user_id: string;
  review_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  users: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type Leave = {
    id: string;
    user_id: string;
    leave_type: 'sick' | 'casual' | 'earned';
    start_date: string;
    end_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approver_id?: string;
    created_at: string;
    users?: Pick<UserProfile, 'full_name' | 'avatar_url'>;
}

export type LeaveBalance = {
    id: string;
    user_id: string;
    sick_leave: number;
    casual_leave: number;
    earned_leave: number;
}

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type College = {
  id: string;
  name: string;
  status: 'Invited' | 'Confirmed' | 'Attended' | 'Declined';
  resumes_received: number;
  contact_email: string;
  last_contacted: string;
  applicants?: { count: number }[];
};

export type ApplicantNote = {
    id: string;
    applicant_id: string;
    user_id: string;
    author_name: string;
    author_avatar: string;
    note: string;
    created_at: string;
};

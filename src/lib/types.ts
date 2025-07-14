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
  | 'guest';

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
  aptitude_score?: number;
  comprehensive_score?: number;
  english_grammar_score?: number;
  customer_service_score?: number;
  college_id?: string;
  resume_data?: ProcessResumeOutput;
  ai_match_score?: number;
  ai_justification?: string;
  rejection_reason?: string;
  rejection_notes?: string;
};

export type Interview = {
  id: string;
  applicant_id: string;
  interviewer_id: string;
  candidate_name: string;
  candidate_avatar: string;
  job_title: string;
  interviewer_name: string;
  interviewer_avatar: string;
  date: string;
  time: string;
  type: 'Video' | 'Phone' | 'In-person';
  status: 'Scheduled' | 'Completed' | 'Canceled';
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
  job_title: string | null;
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
    leave_type: 'sick' | 'casual' | 'earned' | 'unpaid';
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approver_id?: string;
    created_at: string;
    users?: Pick<UserProfile, 'full_name' | 'avatar_url' | 'department'>;
}

export type LeaveBalance = {
    id: string;
    user_id: string;
    sick_leave: number;
    casual_leave: number;
    earned_leave: number;
    unpaid_leave: number;
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

export type Payslip = {
  id: string;
  user_id: string;
  month: string;
  year: number;
  gross_salary: number;
  net_salary: number;
  download_url: string;
};

export type CompanyDocument = {
  id: string;
  title: string;
  category: string;
  description: string;
  last_updated: string;
  download_url: string;
};

export type Kudo = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  value: 'Team Player' | 'Innovation' | 'Customer First' | 'Ownership';
  created_at: string;
  users_from: { full_name: string | null; avatar_url: string | null; } | null;
  users_to: { full_name: string | null; avatar_url: string | null; } | null;
};

export type CompanyPost = {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  users: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type WeeklyAward = {
    id: string;
    user_id: string;
    awarded_by_user_id: string;
    reason: string;
    week_of: string;
    users: { full_name: string | null, avatar_url: string | null } | null;
    awarded_by: { full_name: string | null } | null;
}
    
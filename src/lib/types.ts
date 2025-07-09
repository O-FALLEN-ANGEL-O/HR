import type { ProcessResumeOutput } from "@/ai/flows/process-resume";

export type UserRole = 
  | 'admin'
  | 'super_hr'
  | 'hr_manager'
  | 'recruiter'
  | 'interviewer'
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

export type TimeOffMetric = {
  title: string;
  value: string;
  change?: string;
}

export type Job = {
  id: string;
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
  stage: 'Sourced' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Hired';
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
};

export type Interview = {
  id: string;
  applicant_id?: string;
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
  buddy_id?: string;
  employee_name: string;
  employee_avatar: string;
  job_title: string;
  manager_name: string;
  buddy_name: string;
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

export type TimeOffRequest = {
  id: string;
  user_id: string;
  type: 'Vacation' | 'Sick Leave' | 'Personal';
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  users: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

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
  applicants: { count: number }[];
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
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  downloadUrl: string;
};

export type CompanyDocument = {
  id: string;
  title: string;
  category: string;
  description: string;
  lastUpdated: string;
  downloadUrl: string;
};

export type Kudo = {
  id: string;
  fromName: string;
  fromAvatar: string;
  toName: string;
  toAvatar: string;
  message: string;
  value: 'Team Player' | 'Innovation' | 'Customer First' | 'Ownership';
  timestamp: string;
};

export type CompanyPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

export type WeeklyAward = {
    id: string;
    employeeName: string;
    employeeAvatar: string;
    reason: string;
    weekOf: string;
    awardedByName: string;
}

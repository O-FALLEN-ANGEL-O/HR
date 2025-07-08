export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Admin' | 'HR Manager' | 'Recruiter' | 'Employee';
};

export type Metric = {
  id: number;
  title: string;
  value: string;
  change?: string;
  change_type?: 'increase' | 'decrease';
};

export type Job = {
  id: string;
  title: string;
  department: string;
  status: 'Open' | 'Closed' | 'On hold';
  applicants: number;
  posted_date: string;
};

export type Applicant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_title?: string;
  stage: 'Sourced' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Hired';
  applied_date: string;
  avatar?: string;
  source?: 'walk-in' | 'college' | 'email';
  wpm?: number;
  accuracy?: number;
  college_id?: string;
  aptitude_score?: number;
};

export type Interview = {
  id: string;
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
  employee_name: string;
  employee_avatar: string;
  job_title: string;
  review_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
};

export type TimeOffRequest = {
  id: string;
  employee_name: string;
  employee_avatar: string;
  type: 'Vacation' | 'Sick Leave' | 'Personal';
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
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
};

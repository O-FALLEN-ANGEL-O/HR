export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Admin' | 'HR Manager' | 'Recruiter' | 'Employee';
};

export type Metric = {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
};

export type Job = {
  id: string;
  title: string;
  department: string;
  status: 'Open' | 'Closed' | 'On hold';
  applicants: number;
  postedDate: string;
};

export type Applicant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle?: string;
  stage: 'Sourced' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Hired';
  appliedDate: string;
  avatar?: string;
  source?: 'walk-in' | 'college' | 'email';
  wpm?: number;
  accuracy?: number;
  collegeId?: string;
};

export type Interview = {
  id: string;
  candidateName: string;
  candidateAvatar: string;
  jobTitle: string;
  interviewerName: string;
  interviewerAvatar: string;
  date: string;
  time: string;
  type: 'Video' | 'Phone' | 'In-person';
  status: 'Scheduled' | 'Completed' | 'Canceled';
};

export type Onboarding = {
  id: string;
  employeeName: string;
  employeeAvatar: string;
  jobTitle: string;
  managerName: string;
  buddyName: string;
  progress: number;
  currentStep: string;
  startDate: string;
};

export type PerformanceReview = {
  id: string;
  employeeName: string;
  employeeAvatar: string;
  jobTitle: string;
  reviewDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
};

export type TimeOffRequest = {
  id: string;
  employeeName: string;
  employeeAvatar: string;
  type: 'Vacation' | 'Sick Leave' | 'Personal';
  startDate: string;
  endDate: string;
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
  resumesReceived: number;
  contactEmail: string;
  lastContacted: string;
};

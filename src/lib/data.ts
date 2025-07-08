import type {
  Metric,
  Job,
  Applicant,
  Interview,
  Onboarding,
  PerformanceReview,
  TimeOffRequest,
  User,
} from './types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Wolfe',
  email: 'alex.wolfe@example.com',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  role: 'Admin',
};

export const metrics: Metric[] = [
  {
    title: 'Total Employees',
    value: '1,204',
    change: '+12%',
    changeType: 'increase',
  },
  {
    title: 'Attrition Rate',
    value: '2.5%',
    change: '-0.5%',
    changeType: 'decrease',
  },
  {
    title: 'Compliance Score',
    value: '98.2%',
    change: '+1.2%',
    changeType: 'increase',
  },
  {
    title: 'Open Positions',
    value: '22',
    change: '+3',
    changeType: 'increase',
  },
];

export const recentJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    status: 'Open',
    applicants: 42,
    postedDate: '2024-07-15',
  },
  {
    id: 'job-2',
    title: 'Product Manager',
    department: 'Product',
    status: 'Open',
    applicants: 31,
    postedDate: '2024-07-12',
  },
  {
    id: 'job-3',
    title: 'UX/UI Designer',
    department: 'Design',
    status: 'Closed',
    applicants: 58,
    postedDate: '2024-06-28',
  },
];

export const allJobs: Job[] = [
  ...recentJobs,
  {
    id: 'job-4',
    title: 'Backend Engineer',
    department: 'Engineering',
    status: 'Open',
    applicants: 25,
    postedDate: '2024-07-10',
  },
  {
    id: 'job-5',
    title: 'Data Scientist',
    department: 'Data',
    status: 'On hold',
    applicants: 15,
    postedDate: '2024-07-01',
  },
  {
    id: 'job-6',
    title: 'HR Generalist',
    department: 'Human Resources',
    status: 'Open',
    applicants: 19,
    postedDate: '2024-07-18',
  },
];

export const applicants: Applicant[] = [
  {
    id: 'app-1',
    name: 'Sophia Williams',
    email: 'sophia.w@example.com',
    phone: '(555) 123-4567',
    jobTitle: 'Senior Frontend Developer',
    stage: 'Interview',
    appliedDate: '2024-07-16',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026701d',
  },
  {
    id: 'app-2',
    name: 'Benjamin Carter',
    email: 'ben.carter@example.com',
    phone: '(555) 234-5678',
    jobTitle: 'Product Manager',
    stage: 'Phone Screen',
    appliedDate: '2024-07-14',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026702d',
  },
  {
    id: 'app-3',
    name: 'Olivia Martinez',
    email: 'olivia.m@example.com',
    phone: '(555) 345-6789',
    jobTitle: 'UX/UI Designer',
    stage: 'Hired',
    appliedDate: '2024-07-01',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026703d',
  },
  {
    id: 'app-4',
    name: 'Liam Garcia',
    email: 'liam.g@example.com',
    phone: '(555) 456-7890',
    jobTitle: 'Senior Frontend Developer',
    stage: 'Applied',
    appliedDate: '2024-07-18',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  },
  {
    id: 'app-5',
    name: 'Emma Rodriguez',
    email: 'emma.r@example.com',
    phone: '(555) 567-8901',
    jobTitle: 'Product Manager',
    stage: 'Offer',
    appliedDate: '2024-07-13',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
  },
];

export const interviews: Interview[] = [
  {
    id: 'int-1',
    candidateName: 'Sophia Williams',
    candidateAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026701d',
    jobTitle: 'Senior Frontend Developer',
    interviewerName: 'David Chen',
    interviewerAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    date: '2024-07-22',
    time: '10:00 AM',
    type: 'Video',
    status: 'Scheduled',
  },
  {
    id: 'int-2',
    candidateName: 'Benjamin Carter',
    candidateAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026702d',
    jobTitle: 'Product Manager',
    interviewerName: 'Isabella Rossi',
    interviewerAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    date: '2024-07-20',
    time: '02:30 PM',
    type: 'Phone',
    status: 'Completed',
  },
  {
    id: 'int-3',
    candidateName: 'Emma Rodriguez',
    candidateAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    jobTitle: 'Product Manager',
    interviewerName: 'Alex Wolfe',
    interviewerAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    date: '2024-07-19',
    time: '11:00 AM',
    type: 'In-person',
    status: 'Completed',
  },
];

export const onboardingWorkflows: Onboarding[] = [
  {
    id: 'onb-1',
    employeeName: 'Olivia Martinez',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026703d',
    jobTitle: 'UX/UI Designer',
    managerName: 'Chloe Kim',
    buddyName: 'Lucas Brown',
    progress: 75,
    currentStep: 'IT Setup & Equipment',
    startDate: '2024-07-15',
  },
  {
    id: 'onb-2',
    employeeName: 'Noah Johnson',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d',
    jobTitle: 'Backend Engineer',
    managerName: 'David Chen',
    buddyName: 'Ethan Taylor',
    progress: 25,
    currentStep: 'Welcome & Orientation',
    startDate: '2024-07-20',
  },
];

export const performanceReviews: PerformanceReview[] = [
  {
    id: 'pr-1',
    employeeName: 'David Chen',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    jobTitle: 'Engineering Manager',
    reviewDate: '2024-06-30',
    status: 'Completed',
  },
  {
    id: 'pr-2',
    employeeName: 'Isabella Rossi',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    jobTitle: 'Head of Product',
    reviewDate: '2024-07-15',
    status: 'In Progress',
  },
  {
    id: 'pr-3',
    employeeName: 'Ethan Taylor',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026709d',
    jobTitle: 'Senior Frontend Developer',
    reviewDate: '2024-07-25',
    status: 'Pending',
  },
];

export const timeOffRequests: TimeOffRequest[] = [
  {
    id: 'to-1',
    employeeName: 'Chloe Kim',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e2902670ad',
    type: 'Vacation',
    startDate: '2024-08-05',
    endDate: '2024-08-12',
    status: 'Approved',
  },
  {
    id: 'to-2',
    employeeName: 'Lucas Brown',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e2902670bd',
    type: 'Sick Leave',
    startDate: '2024-07-18',
    endDate: '2024-07-18',
    status: 'Approved',
  },
  {
    id: 'to-3',
    employeeName: 'Ethan Taylor',
    employeeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026709d',
    type: 'Personal',
    startDate: '2024-07-26',
    endDate: '2024-07-26',
    status: 'Pending',
  },
];

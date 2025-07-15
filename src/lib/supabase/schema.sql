-- ------------------------------------------------------------------------------------------------
--  SETUP
-- ------------------------------------------------------------------------------------------------

-- Create a table for public user profiles
create table if not exists public.users (
  id uuid not null references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  department text,
  phone text,
  role text,
  profile_setup_complete boolean default false,
  primary key (id)
);
-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

-- Set up Policies
-- Allow public access to view user profiles
create policy "Public user profiles are viewable by everyone." on public.users for select using (true);
-- Allow users to insert their own profile
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
-- Allow users to update their own profile
create policy "Users can update their own profile." on public.users for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url, role, department)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'department'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function upon user creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  END IF;
END
$$;


-- ------------------------------------------------------------------------------------------------
--  TABLES & RLS
-- ------------------------------------------------------------------------------------------------

-- Jobs Table
create table if not exists public.jobs (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    department text not null,
    description text,
    status text not null default 'Open', -- Open, Closed, On hold
    posted_date timestamptz not null default now(),
    applicants int not null default 0
);
alter table public.jobs enable row level security;
create policy "Jobs are viewable by authenticated users." on public.jobs for select using (auth.role() = 'authenticated');
create policy "HR and admins can create/update jobs." on public.jobs for all using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'recruiter')
);

-- Colleges Table
create table if not exists public.colleges (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    status text not null, -- Invited, Confirmed, Attended
    resumes_received int not null default 0,
    contact_email text,
    last_contacted timestamptz not null default now()
);
alter table public.colleges enable row level security;
create policy "Colleges are viewable by HR team." on public.colleges for select using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'recruiter')
);
create policy "HR and admins can create/update colleges." on public.colleges for all using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'recruiter')
);

-- Applicants Table
create table if not exists public.applicants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    job_id uuid references public.jobs(id),
    stage text not null default 'Sourced',
    applied_date timestamptz not null default now(),
    avatar text,
    source text, -- walk-in, college, email
    college_id uuid references public.colleges(id),
    resume_data jsonb,
    ai_match_score int,
    ai_justification text,
    wpm int,
    accuracy int,
    aptitude_score int,
    comprehensive_score int,
    english_grammar_score int,
    customer_service_score int,
    rejection_reason text,
    rejection_notes text
);
alter table public.applicants enable row level security;
create policy "Applicants are viewable by HR team and interviewers." on public.applicants for select using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'recruiter', 'interviewer', 'manager')
);
create policy "Anyone can create an applicant." on public.applicants for insert with check (true);
create policy "HR team can update applicants." on public.applicants for update using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'recruiter')
);

-- Onboarding Table
create table if not exists public.onboarding_workflows (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    manager_id uuid references public.users(id),
    buddy_id uuid references public.users(id),
    employee_name text not null,
    employee_avatar text,
    job_title text,
    manager_name text,
    buddy_name text,
    progress int not null default 0,
    current_step text not null default 'Pending',
    start_date timestamptz not null default now()
);
alter table public.onboarding_workflows enable row level security;
create policy "Onboarding info accessible by relevant parties." on public.onboarding_workflows for select using (
    user_id = auth.uid() or manager_id = auth.uid() or buddy_id = auth.uid() or (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr')
);
create policy "HR and admins can manage onboarding." on public.onboarding_workflows for all using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr')
);

-- Leave Balances Table
create table if not exists public.leave_balances (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.users(id),
    sick_leave int not null default 12,
    casual_leave int not null default 12,
    earned_leave int not null default 15,
    unpaid_leave int not null default 0
);
alter table public.leave_balances enable row level security;
create policy "Users can view their own leave balance." on public.leave_balances for select using (user_id = auth.uid());
create policy "Admins/HR can view all leave balances." on public.leave_balances for select using ((select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr'));
create policy "Admins/HR can update leave balances." on public.leave_balances for update using ((select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr'));

-- Leaves Table
create table if not exists public.leaves (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    leave_type text not null,
    start_date date not null,
    end_date date not null,
    reason text not null,
    status text not null default 'pending', -- pending, approved, rejected
    approver_id uuid references public.users(id),
    created_at timestamptz not null default now(),
    total_days int not null
);
alter table public.leaves enable row level security;
create policy "Users can view their own leave requests." on public.leaves for select using (user_id = auth.uid());
create policy "Users can create their own leave requests." on public.leaves for insert with check (user_id = auth.uid());
create policy "Managers and HR can view all leave requests." on public.leaves for select using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'manager', 'team_lead')
);
create policy "Managers and HR can approve leave requests." on public.leaves for update using (
    (select role from public.users where id = auth.uid()) in ('admin', 'hr_manager', 'super_hr', 'manager', 'team_lead')
) with check (
    status in ('approved', 'rejected')
);

-- Applicant Notes Table
create table if not exists public.applicant_notes (
    id uuid primary key default gen_random_uuid(),
    applicant_id uuid not null references public.applicants(id),
    user_id uuid not null references public.users(id),
    author_name text not null,
    author_avatar text,
    note text not null,
    created_at timestamptz not null default now()
);
alter table public.applicant_notes enable row level security;
create policy "HR team and interviewers can view notes." on public.applicant_notes for select using ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));
create policy "HR team and interviewers can create notes." on public.applicant_notes for insert with check ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'recruiter', 'interviewer'));

-- Interviews Table
create table if not exists public.interviews (
    id uuid primary key default gen_random_uuid(),
    applicant_id uuid not null references public.applicants(id),
    interviewer_id uuid not null references public.users(id),
    date date not null,
    time text not null,
    type text not null, -- Video, Phone, In-person
    status text not null default 'Scheduled', -- Scheduled, Completed, Canceled
    candidate_name text not null,
    candidate_avatar text,
    interviewer_name text not null,
    interviewer_avatar text,
    job_title text not null
);
alter table public.interviews enable row level security;
create policy "Interviews are visible to involved parties and HR." on public.interviews for select using (
    interviewer_id = auth.uid() 
    or (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
create policy "HR team can schedule interviews." on public.interviews for insert with check (
    (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'recruiter')
);
create policy "Interviewers and HR can update interview status." on public.interviews for update using (
    interviewer_id = auth.uid() 
    or (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'recruiter')
);

-- Company Posts Table
create table if not exists public.company_posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    content text not null,
    image_url text,
    created_at timestamptz not null default now()
);
alter table public.company_posts enable row level security;
create policy "All authenticated users can see company posts." on public.company_posts for select using (auth.role() = 'authenticated');
create policy "HR/Admin can create company posts." on public.company_posts for insert with check (
    (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager')
);

-- Post Comments Table
create table if not exists public.post_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.company_posts(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    comment text not null,
    created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
create policy "Authenticated users can see all comments." on public.post_comments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert comments." on public.post_comments for insert with check (user_id = auth.uid());
create policy "Users can update their own comments." on public.post_comments for update using (user_id = auth.uid());
create policy "Users can delete their own comments." on public.post_comments for delete using (user_id = auth.uid());


-- Kudos Table
create table if not exists public.kudos (
    id uuid primary key default gen_random_uuid(),
    from_user_id uuid not null references public.users(id),
    to_user_id uuid not null references public.users(id),
    value text not null,
    message text not null,
    created_at timestamptz not null default now()
);
alter table public.kudos enable row level security;
create policy "All authenticated users can see kudos." on public.kudos for select using (auth.role() = 'authenticated');
create policy "All authenticated users can give kudos." on public.kudos for insert with check (auth.role() = 'authenticated');

-- Weekly Awards Table
create table if not exists public.weekly_awards (
    id uuid primary key default gen_random_uuid(),
    awarded_user_id uuid not null references public.users(id),
    awarded_by_user_id uuid not null references public.users(id),
    reason text not null,
    week_of date not null
);
alter table public.weekly_awards enable row level security;
create policy "All authenticated users can see awards." on public.weekly_awards for select using (auth.role() = 'authenticated');
create policy "Managers and HR can give awards." on public.weekly_awards for insert with check (
    (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'manager', 'team_lead')
);

-- Company Documents Table
create table if not exists public.company_documents (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    category text not null,
    last_updated date not null,
    download_url text not null
);
alter table public.company_documents enable row level security;
create policy "Documents are visible to all authenticated users." on public.company_documents for select using (auth.role() = 'authenticated');

-- Payslips Table
create table if not exists public.payslips (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    month text not null,
    year int not null,
    gross_salary real not null,
    net_salary real not null,
    download_url text not null
);
alter table public.payslips enable row level security;
create policy "Users can see their own payslips." on public.payslips for select using (user_id = auth.uid());
create policy "HR and admins can see all payslips." on public.payslips for select using ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager'));


-- OKR Tables
create table if not exists public.objectives (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.users(id),
    title text not null,
    quarter text not null
);
create table if not exists public.key_results (
    id uuid primary key default gen_random_uuid(),
    objective_id uuid not null references public.objectives(id),
    description text not null,
    progress int not null default 0,
    status text not null default 'on_track'
);
alter table public.objectives enable row level security;
alter table public.key_results enable row level security;
create policy "Users can see their own OKRs." on public.objectives for select using (owner_id = auth.uid() or (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager'));
create policy "Users can see their own KRs." on public.key_results for select using (
    exists (select 1 from public.objectives where id = objective_id and (owner_id = auth.uid() or (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager')))
);

-- Expense Management Tables
create table if not exists public.expense_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    title text not null,
    total_amount real not null,
    status text not null default 'submitted',
    submitted_at timestamptz not null default now()
);
create table if not exists public.expense_items (
    id uuid primary key default gen_random_uuid(),
    expense_report_id uuid not null references public.expense_reports(id),
    date date not null,
    category text not null,
    amount real not null,
    description text
);
alter table public.expense_reports enable row level security;
alter table public.expense_items enable row level security;
create policy "Users can manage their own expense reports." on public.expense_reports for all using (user_id = auth.uid());
create policy "Users can manage items for their own reports." on public.expense_items for all using (
    exists (select 1 from public.expense_reports where id = expense_report_id and user_id = auth.uid())
);
create policy "Finance/HR/Admin can view all reports." on public.expense_reports for select using ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'finance'));
create policy "Finance/HR/Admin can view all items." on public.expense_items for select using ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'finance'));

-- Helpdesk Table
create table if not exists public.helpdesk_tickets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    subject text not null,
    description text not null,
    category text not null,
    status text not null,
    priority text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    resolver_id uuid references public.users(id)
);
alter table public.helpdesk_tickets enable row level security;
create policy "Users see their own tickets." on public.helpdesk_tickets for select using (user_id = auth.uid());
create policy "Users can create tickets." on public.helpdesk_tickets for insert with check (user_id = auth.uid());
create policy "Support roles can see all tickets." on public.helpdesk_tickets for select using ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));
create policy "Support roles can update tickets." on public.helpdesk_tickets for update using ((select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support'));

-- Ticket Comments Table
create table if not exists public.ticket_comments (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.helpdesk_tickets(id),
    user_id uuid not null references public.users(id),
    comment text not null,
    created_at timestamptz not null default now()
);
alter table public.ticket_comments enable row level security;
create policy "Involved parties and support can see comments." on public.ticket_comments for select using (
    (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support') or 
    exists(select 1 from public.helpdesk_tickets where id = ticket_id and user_id = auth.uid())
);
create policy "Involved parties and support can create comments." on public.ticket_comments for insert with check (
    (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager', 'it_admin', 'support') or 
    exists(select 1 from public.helpdesk_tickets where id = ticket_id and user_id = auth.uid())
);

-- ------------------------------------------------------------------------------------------------
--  STORAGE
-- ------------------------------------------------------------------------------------------------

-- Set up Storage!
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
    ('avatars', 'avatars', true, 5242880, '{"image/jpeg","image/png","image/gif","image/webp"}'),
    ('post_images', 'post_images', true, 10485760, '{"image/jpeg","image/png","image/gif","image/webp"}')
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar." on storage.objects for insert with check (bucket_id = 'avatars');
create policy "Post images are publicly accessible." on storage.objects for select using (bucket_id = 'post_images');
create policy "HR/Admins can upload post images." on storage.objects for insert with check (
    bucket_id = 'post_images' and (select role from public.users where id = auth.uid()) in ('admin', 'super_hr', 'hr_manager')
);


-- ------------------------------------------------------------------------------------------------
--  FUNCTIONS
-- ------------------------------------------------------------------------------------------------

-- Function to get job funnel stats
create or replace function get_job_funnel_stats()
returns table (stage text, count bigint) as $$
begin
  return query
    select 
      a.stage, 
      count(a.id)
    from public.applicants a
    where a.stage in ('Sourced', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired')
    group by a.stage
    order by 
      case a.stage
        when 'Sourced' then 1
        when 'Applied' then 2
        when 'Phone Screen' then 3
        when 'Interview' then 4
        when 'Offer' then 5
        when 'Hired' then 6
      end;
end;
$$ language plpgsql;

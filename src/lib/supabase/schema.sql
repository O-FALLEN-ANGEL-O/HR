-- Create metrics table
CREATE TABLE public.metrics (id SERIAL PRIMARY KEY, title TEXT, value TEXT, change TEXT, change_type TEXT);
-- Enable RLS and define policies
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for metrics" ON public.metrics FOR ALL USING (true) WITH CHECK (true);

-- Create jobs table
CREATE TABLE public.jobs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT, department TEXT, status TEXT, applicants INT, posted_date TIMESTAMPTZ);
-- Enable RLS and define policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

-- Create applicants table
CREATE TABLE public.applicants (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT, email TEXT, phone TEXT, job_title TEXT, stage TEXT, applied_date TIMESTAMPTZ, avatar TEXT, source TEXT, wpm INT, accuracy INT, college_id TEXT, aptitude_score INT);
-- Enable RLS and define policies
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for applicants" ON public.applicants FOR ALL USING (true) WITH CHECK (true);

-- Create interviews table
CREATE TABLE public.interviews (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, candidate_name TEXT, candidate_avatar TEXT, job_title TEXT, interviewer_name TEXT, interviewer_avatar TEXT, date TIMESTAMPTZ, time TEXT, type TEXT, status TEXT);
-- Enable RLS and define policies
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);

-- Create colleges table
CREATE TABLE public.colleges (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT, status TEXT, resumes_received INT, contact_email TEXT, last_contacted TIMESTAMPTZ);
-- Enable RLS and define policies
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for colleges" ON public.colleges FOR ALL USING (true) WITH CHECK (true);

-- Create onboarding_workflows table
CREATE TABLE public.onboarding_workflows (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, employee_name TEXT, employee_avatar TEXT, job_title TEXT, manager_name TEXT, buddy_name TEXT, progress INT, current_step TEXT, start_date TIMESTAMPTZ);
-- Enable RLS and define policies
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for onboarding" ON public.onboarding_workflows FOR ALL USING (true) WITH CHECK (true);

-- Create performance_reviews table
CREATE TABLE public.performance_reviews (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, employee_name TEXT, employee_avatar TEXT, job_title TEXT, review_date TEXT, status TEXT);
-- Enable RLS and define policies
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for performance" ON public.performance_reviews FOR ALL USING (true) WITH CHECK (true);

-- Create time_off_requests table
CREATE TABLE public.time_off_requests (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, employee_name TEXT, employee_avatar TEXT, type TEXT, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, status TEXT);
-- Enable RLS and define policies
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for timeoff" ON public.time_off_requests FOR ALL USING (true) WITH CHECK (true);
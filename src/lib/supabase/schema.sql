-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS "applicant_notes";
DROP TABLE IF EXISTS "time_off_requests";
DROP TABLE IF EXISTS "performance_reviews";
DROP TABLE IF EXISTS "onboarding_workflows";
DROP TABLE IF EXISTS "interviews";
DROP TABLE IF EXISTS "applicants";
DROP TABLE IF EXISTS "colleges";
DROP TABLE IF EXISTS "jobs";
DROP TABLE IF EXISTS "metrics";

-- Create tables
CREATE TABLE "metrics" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "change" TEXT,
    "change_type" TEXT
);

CREATE TABLE "jobs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "applicants" INTEGER NOT NULL,
    "posted_date" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "colleges" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resumes_received" INTEGER NOT NULL,
    "contact_email" TEXT NOT NULL,
    "last_contacted" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "applicants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "job_id" UUID REFERENCES "jobs"("id"),
    "stage" TEXT NOT NULL,
    "applied_date" TIMESTAMPTZ NOT NULL,
    "avatar" TEXT,
    "source" TEXT,
    "wpm" INTEGER,
    "accuracy" INTEGER,
    "aptitude_score" INTEGER,
    "comprehensive_score" INTEGER,
    "english_grammar_score" INTEGER,
    "customer_service_score" INTEGER,
    "college_id" UUID REFERENCES "colleges"("id"),
    "resume_data" JSONB,
    "ai_match_score" INTEGER,
    "ai_justification" TEXT
);

CREATE TABLE "interviews" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidate_name" TEXT NOT NULL,
    "candidate_avatar" TEXT,
    "job_title" TEXT NOT NULL,
    "interviewer_name" TEXT NOT NULL,
    "interviewer_avatar" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "time" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

CREATE TABLE "onboarding_workflows" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employee_name" TEXT NOT NULL,
    "employee_avatar" TEXT,
    "job_title" TEXT NOT NULL,
    "manager_name" TEXT NOT NULL,
    "buddy_name" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "current_step" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "performance_reviews" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employee_name" TEXT NOT NULL,
    "employee_avatar" TEXT,
    "job_title" TEXT NOT NULL,
    "review_date" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

CREATE TABLE "time_off_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employee_name" TEXT NOT NULL,
    "employee_avatar" TEXT,
    "type" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL
);

CREATE TABLE "applicant_notes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "applicant_id" UUID REFERENCES "applicants"("id") ON DELETE CASCADE,
    "author_name" TEXT NOT NULL,
    "author_avatar" TEXT,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies
ALTER TABLE "metrics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to metrics" ON "metrics" FOR SELECT USING (true);

ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to jobs" ON "jobs" FOR SELECT USING (true);

ALTER TABLE "colleges" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to colleges" ON "colleges" FOR SELECT USING (true);

ALTER TABLE "applicants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to applicants" ON "applicants" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to applicants" ON "applicants" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to applicants" ON "applicants" FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE "interviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to interviews" ON "interviews" FOR SELECT USING (true);

ALTER TABLE "onboarding_workflows" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to onboarding" ON "onboarding_workflows" FOR SELECT USING (true);

ALTER TABLE "performance_reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to performance reviews" ON "performance_reviews" FOR SELECT USING (true);

ALTER TABLE "time_off_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to time off requests" ON "time_off_requests" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to time off requests" ON "time_off_requests" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to time off requests" ON "time_off_requests" FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE "applicant_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to notes" ON "applicant_notes" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to notes" ON "applicant_notes" FOR INSERT WITH CHECK (true);


-- Storage Policies
-- Assumes a public bucket named 'avatars' has been created
CREATE POLICY "Allow public read access on avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Allow public insert on avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );


// src/lib/supabase/seed.ts
import { createClient } from './admin';

const supabaseAdmin = createClient();

async function checkTableCounts() {
  console.log('🔍 Checking database table counts...');

  const tables = [
    'users', 'jobs', 'colleges', 'applicants', 'applicant_notes',
    'interviews', 'leave_balances', 'leaves', 'onboarding_workflows',
    'performance_reviews', 'objectives', 'key_results', 'company_posts',
    'post_comments', 'kudos', 'weekly_awards', 'payslips',
    'company_documents', 'expense_reports', 'expense_items',
    'helpdesk_tickets', 'ticket_comments'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') { // "undefined_table"
          console.log(`- Table '${table}': Not found`);
        } else {
          console.error(`🔴 Error checking table ${table}: ${error.message}`);
        }
      } else {
        console.log(`- Table '${table}': ${count} rows`);
      }
    } catch (e: any) {
       console.error(`🔴 Hard error checking table ${table}: ${e.message}`);
    }
  }

  console.log('\n✅ Database check complete.');
}

async function main() {
  console.log('🌱 Starting database check process...');
  await checkTableCounts();
}

main().catch(e => {
    console.error("🔴 Script failed with an unhandled error:", e);
    process.exit(1);
});

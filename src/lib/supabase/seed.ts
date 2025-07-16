// src/lib/supabase/seed.ts
import { createClient } from './admin';

const supabaseAdmin = createClient();

async function inspectSchema() {
  console.log('🔍 Inspecting database schema...');

  const tables = [
    'users', 'jobs', 'colleges', 'applicants', 'applicant_notes',
    'interviews', 'leave_balances', 'leaves', 'onboarding_workflows',
    'performance_reviews', 'objectives', 'key_results', 'company_posts',
    'post_comments', 'kudos', 'weekly_awards', 'payslips',
    'company_documents', 'expense_reports', 'expense_items',
    'helpdesk_tickets', 'ticket_comments'
  ];

  for (const tableName of tables) {
    console.log(`\n--- Table: ${tableName} ---`);
    const { data, error } = await supabaseAdmin
      .rpc('get_table_columns', { p_table_name: tableName });


    if (error) {
        if (error.message.includes('relation "information_schema.columns" does not exist')) {
             console.error(`🔴 Error: Insufficient permissions to read information_schema.columns. Please check your database user permissions.`);
        } else {
            console.error(`- Table not found or error inspecting: ${error.message}`);
        }
    } else if (data.length === 0) {
        console.log(`- Table not found or has no columns.`);
    } else {
      data.forEach((column: { column_name: string, data_type: string }) => {
        console.log(`  - ${column.column_name}: ${column.data_type}`);
      });
    }
  }

  console.log('\n✅ Schema inspection complete.');
}

async function main() {
  console.log('🌱 Starting database schema inspection process...');

  console.log('Setting up helper function...');
  const { error: rpcError } = await supabaseAdmin.sql`
    CREATE OR REPLACE FUNCTION get_table_columns(p_table_name TEXT)
    RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            c.column_name::text, 
            c.data_type::text
        FROM 
            information_schema.columns c
        WHERE 
            c.table_schema = 'public'
            AND c.table_name = p_table_name
        ORDER BY 
            c.ordinal_position;
    END;
    $$ LANGUAGE plpgsql;
  `;

  if (rpcError) {
      console.error('🔴 Failed to create helper function for schema inspection:', rpcError.message);
      console.log('Please ensure your database user has permission to create functions. Aborting.');
      return;
  }
  console.log('✅ Helper function created successfully.');

  await inspectSchema();
}

main().catch(e => {
    console.error("🔴 Script failed with an unhandled error:", e);
    process.exit(1);
});

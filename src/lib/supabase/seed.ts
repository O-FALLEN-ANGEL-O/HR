// src/lib/supabase/seed.ts
import { supabaseAdmin } from './admin';

async function inspectSchema() {
  console.log('🔍 Inspecting database schema...');

  const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_public_tables');

  if (tablesError) {
      console.error('🔴 Could not fetch table list:', tablesError.message);
      return;
  }
  
  if (!tables || tables.length === 0) {
      console.log('No tables found in the public schema.');
      return;
  }

  for (const table of tables) {
    const tableName = table.table_name;
    console.log(`\n--- Table: ${tableName} ---`);
    const { data, error } = await supabaseAdmin
      .rpc('get_table_columns', { p_table_name: tableName });


    if (error) {
        console.error(`- Error inspecting table "${tableName}": ${error.message}`);
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

  console.log('Setting up helper functions...');

  const { error: rpcError1 } = await supabaseAdmin.rpc('execute_sql', { 
      sql_statement: `
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
      `
  });
  
  if (rpcError1) {
      console.error('🔴 Failed to create get_table_columns helper function:', rpcError1.message);
      return;
  }
  
  const { error: rpcError2 } = await supabaseAdmin.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION get_public_tables()
        RETURNS TABLE(table_name TEXT) AS $$
        BEGIN
            RETURN QUERY
            SELECT c.table_name::text FROM information_schema.tables c
            WHERE c.table_schema = 'public' AND c.table_type = 'BASE TABLE'
            ORDER BY c.table_name;
        END;
        $$ LANGUAGE plpgsql;
      `
  });

  if (rpcError2) {
      console.error('🔴 Failed to create get_public_tables helper function:', rpcError2.message);
      return;
  }

  const { error: rpcError3 } = await supabaseAdmin.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION execute_sql(sql_statement TEXT)
        RETURNS void AS $$
        BEGIN
            EXECUTE sql_statement;
        END;
        $$ LANGUAGE plpgsql;
      `
  });
   if (rpcError3) {
      console.error('🔴 Failed to create execute_sql helper function:', rpcError3.message);
      return;
  }

  console.log('✅ Helper functions created successfully.');

  await inspectSchema();
}

main().catch(e => {
    console.error("🔴 Script failed with an unhandled error:", e);
    process.exit(1);
});

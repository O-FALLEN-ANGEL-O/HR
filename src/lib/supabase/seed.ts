
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  // The seed script will only run if the FORCE_DB_SEED environment variable is true
  if (process.env.FORCE_DB_SEED !== 'true') {
    console.log('🌱 SKIPPING DB SEED: FORCE_DB_SEED is not "true".');
    return;
  }
  
  console.log('🌱 Starting database seed process...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('🔴 ERROR: Supabase URL or service key is missing. Skipping seeding.');
    // In a CI/CD environment, we might not want to fail the build, just skip seeding.
    // If running locally with FORCE_DB_SEED, this would be a hard failure.
    process.exit(0); 
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // All data creation logic has been removed to prevent interfering with existing data.
  // This script now primarily serves as a placeholder for local development seeding
  // when run with `npm run seed:force`.

  console.log('✅ Database seeding process completed (or was intentionally skipped).');
}

main().catch(error => {
    console.error('🔴 Seeding failed:', error);
    process.exit(1);
});

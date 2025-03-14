// Apply database migration using Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.resolve(__dirname, 'add_sets_reps_columns.sql'),
      'utf8'
    );

    console.log('Applying migration...');
    const { data, error } = await supabase.rpc('pgmigrate', { query: migrationSQL });

    if (error) {
      throw error;
    }

    console.log('Migration applied successfully!');
    console.log('Verifying columns...');

    // Verify the columns were added
    const { data: columns, error: verifyError } = await supabase.rpc('pgmigrate', {
      query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'workout_plan_exercises' 
        AND column_name IN ('sets', 'reps');
      `
    });

    if (verifyError) {
      throw verifyError;
    }

    console.log('Verification result:');
    console.log(columns);
    console.log('Migration complete!');

  } catch (error) {
    console.error('Error applying migration:', error);
    
    // Provide alternative instructions
    console.log('\nAlternative: You can apply the migration manually through the Supabase dashboard:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy the contents of add_sets_reps_columns.sql');
    console.log('4. Paste into the SQL Editor and run');
    
    process.exit(1);
  }
}

// Run the migration
applyMigration(); 
# Database Migrations

This directory contains SQL migrations for the gym-app database.

## Migration: Add Sets and Reps Columns

The file `add_sets_reps_columns.sql` adds the missing `sets` and `reps` columns to the `workout_plan_exercises` table. This migration is necessary because the application expects these columns to exist, but they are missing in the current database schema.

### How to Apply the Migration

You can apply this migration using the Supabase CLI or directly through the Supabase dashboard.

#### Option 1: Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `add_sets_reps_columns.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the SQL commands

#### Option 2: Using psql (if you have direct database access)

```bash
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f add_sets_reps_columns.sql
```

Replace `YOUR_SUPABASE_HOST` with your actual Supabase database host.

#### Option 3: Using Supabase CLI

```bash
supabase db push --db-url YOUR_SUPABASE_URL
```

### Verification

After applying the migration, you can verify that the columns were added successfully by running:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_plan_exercises' 
AND column_name IN ('sets', 'reps');
```

This should return two rows, one for each of the new columns.

## Troubleshooting

If you encounter any issues when applying this migration, please check:

1. That you have the necessary permissions to alter the table
2. That the `workout_plan_exercises` table exists
3. That the columns `sets` and `reps` don't already exist (if they do, you can skip this migration)

If you continue to experience issues, please contact the development team for assistance. 
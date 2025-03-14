# Database Migrations

This directory contains SQL migration files to update the database schema as the application evolves.

## How to Apply Migrations

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the contents of the migration file you want to apply
5. Run the SQL query
6. Check the results to ensure the migration was successful

## Available Migrations

### add_rest_day_column.sql

This migration adds support for tracking rest days in the workout log system:

- Adds a boolean `is_rest_day` column to the `workout_logs` table
- Makes the `workout_plan_id` column nullable so rest days can have a null value
- Sets existing logs to have `is_rest_day = false` by default

#### Why This Change?

Rest days are an important part of any training program. This change allows users to:

1. Log rest days in their workout history
2. Maintain proper workout streaks that include rest days
3. Keep a complete record of their training schedule

#### Example Usage

The SQL to apply manually is:

```sql
-- Add is_rest_day column to workout_logs table
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS is_rest_day BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_rest_day = false (not rest days)
UPDATE workout_logs SET is_rest_day = FALSE WHERE is_rest_day IS NULL;

-- Make workout_plan_id nullable to accommodate rest days (which don't have workout plans)
ALTER TABLE workout_logs ALTER COLUMN workout_plan_id DROP NOT NULL;
```

### exercise_details_column.sql

If you previously encountered issues with the missing `exercise_details` column, you can add it with:

```sql
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercise_details TEXT;
``` 
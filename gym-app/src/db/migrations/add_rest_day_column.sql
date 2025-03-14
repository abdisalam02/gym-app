-- Add is_rest_day column to workout_logs table
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS is_rest_day BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_rest_day = false (not rest days)
UPDATE workout_logs SET is_rest_day = FALSE WHERE is_rest_day IS NULL;

-- Make workout_plan_id nullable to accommodate rest days (which don't have workout plans)
ALTER TABLE workout_logs ALTER COLUMN workout_plan_id DROP NOT NULL;

-- Add a comment to explain the purpose of the is_rest_day column
COMMENT ON COLUMN workout_logs.is_rest_day IS 'Indicates if this log entry is a rest day rather than a workout day'; 
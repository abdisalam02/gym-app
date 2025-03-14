-- Add sets and reps columns to workout_plan_exercises table
ALTER TABLE workout_plan_exercises ADD COLUMN sets INTEGER DEFAULT 3;
ALTER TABLE workout_plan_exercises ADD COLUMN reps INTEGER DEFAULT 10;

-- Update any existing records to have default values
UPDATE workout_plan_exercises SET sets = 3 WHERE sets IS NULL;
UPDATE workout_plan_exercises SET reps = 10 WHERE reps IS NULL;

-- Add a comment to explain the migration
COMMENT ON COLUMN workout_plan_exercises.sets IS 'Number of sets for this exercise in the workout plan';
COMMENT ON COLUMN workout_plan_exercises.reps IS 'Number of repetitions for this exercise in the workout plan'; 
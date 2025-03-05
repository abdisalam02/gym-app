// components/WorkoutSchedule.tsx
import React from "react";

type WorkoutDay = {
  type: string;
  exercises: string[];
};

// Define your three workout days
const workoutPlan: WorkoutDay[] = [
  {
    type: "Chest & Shoulders",
    exercises: [
      "Bench Press",
      "Lateral Raises",
      "Dumbbell Fly",
      "Incline Bench Press",
      "Shoulder Press",
      "Face Pulls",
    ],
  },
  {
    type: "Back & Biceps",
    exercises: [
      "Barbell Row",
      "Lat Pulldowns",
      "Seated Cable Row",
      "Incline Curls",
      "Hammer Curls",
    ],
  },
  {
    type: "Legs & Triceps",
    exercises: [
      "Squats",
      "Leg Extension",
      "Leg Curl",
    ],
  },
];

// Function to determine today’s workout based on a 4-day cycle:
// Day 0: Workout 1, Day 1: Workout 2, Day 2: Workout 3, Day 3: Rest Day.
const getWorkoutForToday = (): { workoutDay: WorkoutDay | null; cycleDay: number } => {
  // Set a fixed start date (adjust this as your "first" workout day)
  const startDate = new Date("2023-01-01");
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  const cycleDay = diffDays % 4; // 0, 1, 2 for workouts; 3 for rest

  if (cycleDay === 3) {
    return { workoutDay: null, cycleDay };
  } else {
    return { workoutDay: workoutPlan[cycleDay], cycleDay };
  }
};

export default function WorkoutSchedule() {
  const { workoutDay, cycleDay } = getWorkoutForToday();
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const weekday = weekdayNames[today.getDay()];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">
        {weekday} - {cycleDay === 3 ? "Rest Day" : workoutDay?.type}
      </h2>
      {cycleDay === 3 ? (
        <div className="alert alert-info">
          <div>
            <span>Enjoy your rest day! Recovery is as important as training.</span>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-2xl mb-4">
              {workoutDay?.type} Workout
            </h3>
            <ul className="list-disc pl-6">
              {workoutDay?.exercises.map((exercise, index) => (
                <li key={index} className="text-lg">
                  {exercise}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

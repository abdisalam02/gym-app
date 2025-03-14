/**
 * Default weights for common exercises to make logging easier
 * These values can be used as starting points when logging workouts
 */

export interface ExerciseWeight {
  name: string;
  sets: {
    weight: number;
    reps: number;
  }[];
  notes?: string;
}

export const defaultWeights: Record<string, ExerciseWeight> = {
  // Chest exercises
  "Bench Press": {
    name: "Bench Press",
    sets: [
      { weight: 40, reps: 10 },
      { weight: 50, reps: 8 },
      { weight: 60, reps: 6 }
    ],
    notes: "PR: 65kg"
  },
  "Incline Bench Press": {
    name: "Incline Bench Press",
    sets: [
      { weight: 30, reps: 10 },
      { weight: 40, reps: 8 },
      { weight: 40, reps: 8 }
    ]
  },
  "Decline Bench Press": {
    name: "Decline Bench Press",
    sets: [
      { weight: 35, reps: 10 },
      { weight: 45, reps: 8 },
      { weight: 55, reps: 6 }
    ]
  },
  "Dumbbell Fly": {
    name: "Dumbbell Fly",
    sets: [
      { weight: 12, reps: 12 },
      { weight: 14, reps: 10 },
      { weight: 16, reps: 8 }
    ]
  },
  
  // Back exercises
  "Deadlift": {
    name: "Deadlift",
    sets: [
      { weight: 60, reps: 8 },
      { weight: 80, reps: 6 },
      { weight: 100, reps: 4 }
    ],
    notes: "Focus on form"
  },
  "Barbell Row": {
    name: "Barbell Row",
    sets: [
      { weight: 40, reps: 10 },
      { weight: 50, reps: 8 },
      { weight: 60, reps: 6 }
    ]
  },
  "Lat Pulldown": {
    name: "Lat Pulldown",
    sets: [
      { weight: 45, reps: 12 },
      { weight: 55, reps: 10 },
      { weight: 65, reps: 8 }
    ]
  },
  "Pull-up": {
    name: "Pull-up",
    sets: [
      { weight: 0, reps: 8 },
      { weight: 0, reps: 8 },
      { weight: 0, reps: 6 }
    ],
    notes: "Bodyweight"
  },
  
  // Leg exercises
  "Squat": {
    name: "Squat",
    sets: [
      { weight: 50, reps: 10 },
      { weight: 70, reps: 8 },
      { weight: 90, reps: 6 }
    ]
  },
  "Leg Press": {
    name: "Leg Press",
    sets: [
      { weight: 80, reps: 12 },
      { weight: 100, reps: 10 },
      { weight: 120, reps: 8 }
    ]
  },
  "Leg Extension": {
    name: "Leg Extension",
    sets: [
      { weight: 30, reps: 12 },
      { weight: 40, reps: 10 },
      { weight: 50, reps: 8 }
    ]
  },
  "Leg Curl": {
    name: "Leg Curl",
    sets: [
      { weight: 25, reps: 12 },
      { weight: 35, reps: 10 },
      { weight: 45, reps: 8 }
    ]
  },
  
  // Shoulder exercises
  "Overhead Press": {
    name: "Overhead Press",
    sets: [
      { weight: 25, reps: 10 },
      { weight: 35, reps: 8 },
      { weight: 45, reps: 6 }
    ]
  },
  "Lateral Raise": {
    name: "Lateral Raise",
    sets: [
      { weight: 8, reps: 12 },
      { weight: 10, reps: 10 },
      { weight: 12, reps: 8 }
    ]
  },
  "Front Raise": {
    name: "Front Raise",
    sets: [
      { weight: 8, reps: 12 },
      { weight: 10, reps: 10 },
      { weight: 12, reps: 8 }
    ]
  },
  
  // Arm exercises
  "Bicep Curl": {
    name: "Bicep Curl",
    sets: [
      { weight: 12, reps: 12 },
      { weight: 14, reps: 10 },
      { weight: 16, reps: 8 }
    ]
  },
  "Tricep Extension": {
    name: "Tricep Extension",
    sets: [
      { weight: 15, reps: 12 },
      { weight: 20, reps: 10 },
      { weight: 25, reps: 8 }
    ]
  },
  "Hammer Curl": {
    name: "Hammer Curl",
    sets: [
      { weight: 12, reps: 12 },
      { weight: 14, reps: 10 },
      { weight: 16, reps: 8 }
    ]
  },
  "Skull Crusher": {
    name: "Skull Crusher",
    sets: [
      { weight: 15, reps: 12 },
      { weight: 20, reps: 10 },
      { weight: 25, reps: 8 }
    ]
  }
};

/**
 * Get default weights for an exercise by name
 * @param exerciseName The name of the exercise
 * @returns Default weight data or null if not found
 */
export function getDefaultWeights(exerciseName: string): ExerciseWeight | null {
  // Try exact match first
  if (defaultWeights[exerciseName]) {
    return defaultWeights[exerciseName];
  }
  
  // Try case-insensitive match
  const lowerCaseName = exerciseName.toLowerCase();
  const match = Object.keys(defaultWeights).find(
    key => key.toLowerCase() === lowerCaseName
  );
  
  if (match) {
    return defaultWeights[match];
  }
  
  // Try partial match (contains)
  const partialMatch = Object.keys(defaultWeights).find(
    key => key.toLowerCase().includes(lowerCaseName) || 
           lowerCaseName.includes(key.toLowerCase())
  );
  
  if (partialMatch) {
    return defaultWeights[partialMatch];
  }
  
  return null;
} 
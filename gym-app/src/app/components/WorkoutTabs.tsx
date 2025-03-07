"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

// --- Types ---
type Exercise = {
  id: string;
  name: string;
  description: string;
  default_sets: number;
  default_reps: number;
};

type WorkoutPlanExercise = {
  id: string; // join table unique ID
  position: number;
  exercises: Exercise;
};

type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  workout_plan_exercises: WorkoutPlanExercise[];
};

type WorkoutLog = {
  id: string;
  workout_plan_id: string;
  workout_date: string;
  notes: string | null;
  exercise_details?: string;
};

type ExerciseLogDetails = {
  sets: number[];
  reps: number[];
  weight?: number[];
  notes: string;
};

// --- Session-Based Rotation Logic ---
// Returns the default workout plan based on the total logged sessions.
function getWorkoutForSession(
  sessionCount: number,
  workoutPlans: WorkoutPlan[]
): WorkoutPlan | null {
  if (workoutPlans.length === 0) return null;
  return workoutPlans[sessionCount % workoutPlans.length];
}

export default function WorkoutTabs() {
  // Global Data States
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState<boolean>(true);

  // Override state: mapping from date (YYYY-MM-DD) to selected workout plan ID
  const [overrides, setOverrides] = useState<{ [key: string]: string }>({});

  // Modal States
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [selectedOverrideId, setSelectedOverrideId] = useState<string>("");
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isLogWorkoutModalOpen, setIsLogWorkoutModalOpen] = useState<boolean>(false);
  const [currentWorkoutLog, setCurrentWorkoutLog] = useState<ExerciseLogDetails>({
    sets: [],
    reps: [],
    notes: ''
  });

  // Date State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateString = selectedDate.toISOString().split("T")[0];

  // Move the isToday function to the top of the component
  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.toDateString() === today.toDateString();
  };

  // --- Fetch Workout Plans (with Exercises) ---
  useEffect(() => {
    async function fetchWorkoutPlans() {
      const { data, error } = await supabase
        .from("workout_plans")
        .select(`
          *,
          workout_plan_exercises (
            id,
            position,
            exercises:exercises(*)
          )
        `)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching workout plans:", error);
      } else if (data) {
        setWorkoutPlans(data as WorkoutPlan[]);
      }
      setLoadingPlans(false);
    }
    fetchWorkoutPlans();
  }, []);

  // --- Fetch Global Session Count (Total Logged Workouts) ---
  useEffect(() => {
    async function fetchSessionCount() {
      const { count, error } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true });
      if (error) {
        console.error("Error fetching session count:", error);
      } else {
        setSessionCount(count || 0);
      }
      setLoadingCount(false);
    }
    fetchSessionCount();
  }, []);

  // --- Fetch Workout Logs for the Selected Date ---
  useEffect(() => {
    async function fetchWorkoutLogs() {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("workout_date", selectedDateString);
      if (error) {
        console.error("Error fetching workout logs:", error);
      } else if (data) {
        setWorkoutLogs(data as WorkoutLog[]);
      }
      setLoadingLogs(false);
    }
    fetchWorkoutLogs();
  }, [selectedDateString]);

  // --- Determine Workout Plan to Display ---
  const defaultWorkoutPlan = getWorkoutForSession(sessionCount, workoutPlans);
  const overrideWorkoutPlan = overrides[selectedDateString]
    ? workoutPlans.find((plan) => plan.id === overrides[selectedDateString]) || null
    : null;
  const displayedWorkoutPlan = overrideWorkoutPlan || defaultWorkoutPlan;

  // --- Setup for Day Cards ---
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayIndex = new Date().getDay();
  const weekStart = new Date();
  weekStart.setDate(new Date().getDate() - currentDayIndex);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  // --- Horizontal Scrolling for Day Cards ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  // --- Override Modal Handlers ---
  const openOverrideModal = () => {
    setSelectedOverrideId("");
    setIsOverrideModalOpen(true);
  };

  const saveOverride = () => {
    if (selectedOverrideId) {
      setOverrides({ ...overrides, [selectedDateString]: selectedOverrideId });
    }
    setIsOverrideModalOpen(false);
  };

  // --- Detailed Workout Modal Handler ---
  const openWorkoutDetails = (workout: WorkoutPlan) => {
    setSelectedWorkout(workout);
    setIsDetailModalOpen(true);
  };

  // --- Workout Logging Modal Handlers ---
  const openWorkoutLogModal = () => {
    setCurrentWorkoutLog({
      sets: displayedWorkoutPlan?.workout_plan_exercises.map(() => 3) || [],
      reps: displayedWorkoutPlan?.workout_plan_exercises.map(() => 10) || [],
      notes: ''
    });
    setIsLogWorkoutModalOpen(true);
  };

  const logWorkout = async () => {
    try {
      const { error } = await supabase
        .from("workout_logs")
        .insert({
          workout_plan_id: displayedWorkoutPlan?.id,
          workout_date: selectedDateString,
          notes: currentWorkoutLog.notes,
          exercise_details: JSON.stringify(currentWorkoutLog)
        });
      if (error) throw error;
      // Refresh logs after insertion
      const { data: updatedLogs, error: fetchError } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("workout_date", selectedDateString);
      if (fetchError) {
        console.error("Error refreshing logs:", fetchError);
      } else {
        setWorkoutLogs(updatedLogs || []);
      }
      setIsLogWorkoutModalOpen(false);
    } catch (error) {
      console.error("Error logging workout", error);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {(loadingPlans || loadingCount) ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          {/* --- Day Navigation Cards --- */}
          <div className="relative">
            <button
              className="btn btn-circle btn-sm sm:btn-md absolute left-0 top-1/2 transform -translate-y-1/2 z-10 animate-bounce"
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              &#8592;
            </button>
            <div
              ref={scrollContainerRef}
              className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide px-8 sm:px-12"
            >
              {daysOfWeek.map((date, idx) => {
                const dayName = weekdayNames[date.getDay()];
                const formattedDate = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const isActive = selectedDate.toDateString() === date.toDateString();
                const todayCheck = isToday(date);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`card transition-all duration-300 transform hover:scale-105 ${
                      isActive 
                        ? "bg-red-600 text-white shadow-xl" 
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    } w-24 sm:w-32 md:w-40 shrink-0 cursor-pointer ${
                      todayCheck ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    <div className="card-body p-3 text-center">
                      <h3 className="card-title text-sm sm:text-base md:text-lg font-bold justify-center">
                        {dayName}
                      </h3>
                      <p className="text-xs sm:text-sm font-mono">
                        {formattedDate}
                        {todayCheck && (
                          <span className="block text-xs font-semibold text-red-300">Today</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-circle btn-sm sm:btn-md absolute right-0 top-1/2 transform -translate-y-1/2 z-10 animate-bounce"
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              &#8594;
            </button>
          </div>

          {/* --- Workout Details Section --- */}
          <div className="mt-4">
            {loadingLogs ? (
              <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : workoutLogs.length > 0 ? (
              // Display logged workouts for the selected day.
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-2xl">
                    Logged Workout for {weekdayNames[selectedDate.getDay()]}
                  </h3>
                  <ul className="list-disc pl-6">
                    {workoutLogs.map((log) => (
                      <li key={log.id} className="text-lg">
                        Workout ID: {log.workout_plan_id} - Notes: {log.notes || "No notes"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : displayedWorkoutPlan === null ? (
              // Display a rest day message if no workout plan is available.
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-2xl">
                    Rest Day - {weekdayNames[selectedDate.getDay()]}
                  </h3>
                  <p>Enjoy your rest day! Recovery is essential for progress.</p>
                </div>
              </div>
            ) : (
              // Display the default or overridden workout plan.
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body p-3 sm:p-6">
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                    <h3 className="card-title text-xl sm:text-2xl break-words">
                      {displayedWorkoutPlan?.name} - {weekdayNames[selectedDate.getDay()]}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-xs sm:btn-sm btn-outline"
                        onClick={openOverrideModal}
                      >
                        Change
                      </button>
                      <button
                        className="btn btn-xs sm:btn-sm btn-primary"
                        onClick={() => openWorkoutDetails(displayedWorkoutPlan!)}
                      >
                        Details
                      </button>
                      <button
                        className="btn btn-xs sm:btn-sm btn-success"
                        onClick={openWorkoutLogModal}
                      >
                        Log
                      </button>
                    </div>
                  </div>
                  <p>{displayedWorkoutPlan.description}</p>
                  <div className="mt-4">
                    <h4 className="font-bold">Exercises:</h4>
                    <ol className="list-decimal pl-6">
                      {displayedWorkoutPlan.workout_plan_exercises
                        ?.sort((a, b) => a.position - b.position)
                        .map((wpe) => (
                          <li key={wpe.id} className="text-lg flex items-center space-x-2">
                            <span className="badge badge-secondary">
                              {wpe.exercises.default_sets}x{wpe.exercises.default_reps}
                            </span>
                            <span>{wpe.exercises.name}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Total Sessions Logged: {sessionCount}</p>
          </div>

          {/* --- Override Modal --- */}
          {isOverrideModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Select Workout Plan</h3>
                <select
                  className="select select-bordered w-full mt-4"
                  value={selectedOverrideId}
                  onChange={(e) => setSelectedOverrideId(e.target.value)}
                >
                  <option value="">-- Select a Workout --</option>
                  {workoutPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <div className="modal-action">
                  <button
                    className="btn btn-primary"
                    onClick={saveOverride}
                    disabled={!selectedOverrideId}
                  >
                    Save
                  </button>
                  <button className="btn" onClick={() => setIsOverrideModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- Detailed Workout Modal --- */}
          {isDetailModalOpen && selectedWorkout && (
            <div className="modal modal-open">
              <div className="modal-box w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-2xl mb-4">{selectedWorkout.name}</h3>
                <p className="mb-4">{selectedWorkout.description}</p>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="table table-compact sm:table-normal w-full">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Exercise</th>
                        <th>Sets</th>
                        <th>Reps</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkout.workout_plan_exercises
                        .sort((a, b) => a.position - b.position)
                        .map((exercise, index) => (
                          <tr key={exercise.id}>
                            <td>{index + 1}</td>
                            <td>{exercise.exercises.name}</td>
                            <td>{exercise.exercises.default_sets}</td>
                            <td>{exercise.exercises.default_reps}</td>
                            <td>{exercise.exercises.description}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="modal-action">
                  <button className="btn btn-primary" onClick={() => setIsDetailModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- Workout Logging Modal --- */}
          {isLogWorkoutModalOpen && displayedWorkoutPlan && (
            <div className="modal modal-open">
              <div className="modal-box w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                <h3 className="font-bold text-2xl mb-4">Log Workout: {displayedWorkoutPlan.name}</h3>
                <div className="space-y-4">
                  {displayedWorkoutPlan.workout_plan_exercises
                    .sort((a, b) => a.position - b.position)
                    .map((exercise, index) => (
                      <div key={exercise.id} className="border-b pb-4">
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">
                          {exercise.exercises.name}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <label className="label">Sets</label>
                            <input
                              type="number"
                              className="input input-bordered w-20"
                              value={currentWorkoutLog.sets[index] || 3}
                              onChange={(e) => {
                                const newSets = [...currentWorkoutLog.sets];
                                newSets[index] = parseInt(e.target.value);
                                setCurrentWorkoutLog(prev => ({ ...prev, sets: newSets }));
                              }}
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="label">Reps</label>
                            <input
                              type="number"
                              className="input input-bordered w-20"
                              value={currentWorkoutLog.reps[index] || 10}
                              onChange={(e) => {
                                const newReps = [...currentWorkoutLog.reps];
                                newReps[index] = parseInt(e.target.value);
                                setCurrentWorkoutLog(prev => ({ ...prev, reps: newReps }));
                              }}
                              min="1"
                              max="50"
                            />
                          </div>
                          <div>
                            <label className="label">Weight (optional)</label>
                            <input
                              type="number"
                              className="input input-bordered w-20"
                              value={currentWorkoutLog.weight?.[index] || ''}
                              onChange={(e) => {
                                const newWeight = [...(currentWorkoutLog.weight || [])];
                                newWeight[index] = parseFloat(e.target.value);
                                setCurrentWorkoutLog(prev => ({ ...prev, weight: newWeight }));
                              }}
                              min="0"
                              step="2.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  <div>
                    <label className="label">Workout Notes</label>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      placeholder="Any additional notes about the workout..."
                      value={currentWorkoutLog.notes}
                      onChange={(e) =>
                        setCurrentWorkoutLog(prev => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-action">
                  <button className="btn btn-primary" onClick={logWorkout}>
                    Save Workout Log
                  </button>
                  <button className="btn" onClick={() => setIsLogWorkoutModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

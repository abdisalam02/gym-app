"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { FaDumbbell, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSave, FaFire, FaMagic, FaHistory, FaClipboardList, FaArrowRight, FaBed } from 'react-icons/fa';
import { getDefaultWeights } from "../lib/defaultWeights";
import Link from "next/link";

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
  image_url?: string;
};

type WorkoutLog = {
  id: string;
  workout_plan_id: string | null;
  workout_date: string;
  notes: string | null;
  exercise_details?: string;
  is_rest_day?: boolean;
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
  // --- State ---
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideWorkoutId, setOverrideWorkoutId] = useState<string | null>(null);
  const [showWorkoutLogModal, setShowWorkoutLogModal] = useState(false);
  const [workoutLogNotes, setWorkoutLogNotes] = useState("");
  const [workoutLogDetails, setWorkoutLogDetails] = useState<ExerciseLogDetails[]>([]);
  const [workoutDetailsOpen, setWorkoutDetailsOpen] = useState(false);
  const [selectedWorkoutDetails, setSelectedWorkoutDetails] = useState<WorkoutPlan | null>(null);
  const [selectedLogDate, setSelectedLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pastLogsModalOpen, setpastLogsModalOpen] = useState(false);
  const [dateWorkoutLogs, setDateWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loadingDateLogs, setLoadingDateLogs] = useState(false);
  const [loggingError, setLoggingError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const isToday = (someDate: Date) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
  };

  // --- Data Fetching ---
  useEffect(() => {
    async function fetchWorkoutPlans() {
      const { data, error } = await supabase
        .from("workout_plans")
        .select(
          `
          *,
          workout_plan_exercises (
            id,
            position,
            exercises (*)
          )
        `
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching workout plans:", error);
      } else if (data) {
        // Sort exercises by position for each workout plan
        const plansWithSortedExercises = data.map((plan) => ({
          ...plan,
          workout_plan_exercises: [...plan.workout_plan_exercises].sort(
            (a, b) => a.position - b.position
          ),
        }));
        setWorkoutPlans(plansWithSortedExercises);
      }
      setLoading(false);
    }

    async function fetchSessionCount() {
      // Count both workout logs and rest days for the session count
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

    async function fetchWorkoutLogs() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .gte("workout_date", today.toISOString())
        .order("workout_date", { ascending: false });

      if (error) {
        console.error("Error fetching workout logs:", error);
      } else {
        setWorkoutLogs(data || []);
      }
    }

    fetchWorkoutPlans();
    fetchSessionCount();
    fetchWorkoutLogs();
  }, []);

  // Set the default workout when workoutPlans or sessionCount changes
  useEffect(() => {
    if (!loading && !loadingCount && workoutPlans.length > 0) {
      const todaysLog = workoutLogs.find((log) => {
        const logDate = new Date(log.workout_date);
        return isToday(logDate);
      });

      if (!todaysLog) {
        // No workout logged today, select based on session count
        const defaultWorkout = getWorkoutForSession(sessionCount, workoutPlans);
        setSelectedWorkout(defaultWorkout);
      }
    }
  }, [workoutPlans, sessionCount, loading, loadingCount, workoutLogs]);

  // --- UI Scroll Controls ---
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
    }
  };

  // --- Workout Management ---
  const openOverrideModal = () => {
    setShowOverrideModal(true);
  };

  const saveOverride = () => {
    if (overrideWorkoutId) {
      const workout = workoutPlans.find((wp) => wp.id === overrideWorkoutId);
      if (workout) {
        setSelectedWorkout(workout);

        // Initialize workout log details for the new workout
        const initialLogDetails = workout.workout_plan_exercises.map((wpe) => ({
          sets: Array(wpe.exercises.default_sets).fill(0),
          reps: Array(wpe.exercises.default_sets).fill(
            wpe.exercises.default_reps
          ),
          weight: Array(wpe.exercises.default_sets).fill(0),
          notes: "",
        }));
        setWorkoutLogDetails(initialLogDetails);
      }
    }
    setShowOverrideModal(false);
  };

  const openWorkoutDetails = (workout: WorkoutPlan) => {
    setSelectedWorkoutDetails(workout);
    setWorkoutDetailsOpen(true);
  };

  // --- Workout Logging ---
  const openWorkoutLogModal = () => {
    if (!selectedWorkout) return;
    
    // Reset any previous errors
    setLoggingError(null);

    // Initialize workout log details if not already done
    if (workoutLogDetails.length === 0 || workoutLogDetails.length !== selectedWorkout.workout_plan_exercises.length) {
      const initialLogDetails = selectedWorkout.workout_plan_exercises.map(
        (wpe) => {
          // Check if we have default weights for this exercise
          const defaultWeightData = getDefaultWeights(wpe.exercises.name);
          
          if (defaultWeightData && defaultWeightData.sets.length > 0) {
            // Use default weights from our predefined list
            const sets = defaultWeightData.sets.length;
            return {
              sets: Array(sets).fill(0),
              reps: defaultWeightData.sets.map(set => set.reps),
              weight: defaultWeightData.sets.map(set => set.weight),
              notes: defaultWeightData.notes || "",
            };
          } else {
            // Use default values from the exercise definition
            return {
              sets: Array(wpe.exercises.default_sets).fill(0),
              reps: Array(wpe.exercises.default_sets).fill(
                wpe.exercises.default_reps
              ),
              weight: Array(wpe.exercises.default_sets).fill(0),
              notes: "",
            };
          }
        }
      );
      setWorkoutLogDetails(initialLogDetails);
    }

    // Set today's date as default
    setSelectedLogDate(new Date().toISOString().split('T')[0]);
    setShowWorkoutLogModal(true);
  };

  // Function to apply default weights to an exercise
  const applyDefaultWeights = (exerciseIndex: number) => {
    if (!selectedWorkout) return;
    
    const exerciseName = selectedWorkout.workout_plan_exercises[exerciseIndex].exercises.name;
    const defaultWeightData = getDefaultWeights(exerciseName);
    
    if (defaultWeightData && defaultWeightData.sets.length > 0) {
      const newDetails = [...workoutLogDetails];
      
      // Update with default weights data
      const sets = defaultWeightData.sets.length;
      newDetails[exerciseIndex] = {
        sets: Array(sets).fill(0),
        reps: defaultWeightData.sets.map(set => set.reps),
        weight: defaultWeightData.sets.map(set => set.weight),
        notes: defaultWeightData.notes || newDetails[exerciseIndex].notes,
      };
      
      setWorkoutLogDetails(newDetails);
    }
  };

  const logWorkout = async () => {
    if (!selectedWorkout) return;
    
    setLoggingError(null);

    try {
      // Check if workout plan exists
      if (!selectedWorkout.id) {
        throw new Error("Invalid workout plan selected");
      }

      // Format exercise details for storage
      const exerciseDetails = selectedWorkout.workout_plan_exercises.map(
        (wpe, index) => {
          if (!workoutLogDetails[index]) {
            console.warn(`No log details for exercise at index ${index}`);
            // Create default values if missing
            return {
              exercise_id: wpe.exercises.id,
              name: wpe.exercises.name,
              sets: Array(wpe.exercises.default_sets).fill(0).map((_, i) => ({
                set_number: i + 1,
                weight: 0,
                reps: wpe.exercises.default_reps
              })),
              notes: ""
            };
          }

          return {
            exercise_id: wpe.exercises.id,
            name: wpe.exercises.name,
            sets: workoutLogDetails[index].sets.map((_, setIndex) => ({
              set_number: setIndex + 1,
              weight: workoutLogDetails[index].weight?.[setIndex] || 0,
              reps: workoutLogDetails[index].reps[setIndex] || 0,
            })),
            notes: workoutLogDetails[index].notes || "",
          };
        }
      );

      // Ensure date is properly formatted
      let formattedDate = selectedLogDate;
      try {
        const date = new Date(selectedLogDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString();
        }
      } catch (err) {
        console.warn("Date formatting failed, using original value:", selectedLogDate);
      }

      // Combine workout notes with exercise details as JSON for fallback storage
      const exerciseDetailsJson = JSON.stringify(exerciseDetails);
      const combinedNotes = workoutLogNotes ? 
        `${workoutLogNotes}\n\n--- EXERCISE DATA ---\n${exerciseDetailsJson}` : 
        `--- EXERCISE DATA ---\n${exerciseDetailsJson}`;
      
      // Prepare the workout log entry with proper typing
      const workoutLog: {
        workout_plan_id: string;
        workout_date: string;
        notes: string;
        exercise_details?: string;
      } = {
        workout_plan_id: selectedWorkout.id,
        workout_date: formattedDate,
        notes: combinedNotes
      };

      // Try to include exercise_details if the column exists
      try {
        workoutLog.exercise_details = exerciseDetailsJson;
      } catch (err) {
        console.warn('Could not include exercise_details, will fall back to storing in notes');
      }
      
      console.log('Attempting to save workout log:', workoutLog);

      // First check if today's workout is already logged
      const today = new Date(formattedDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingLogs, error: checkError } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("workout_plan_id", selectedWorkout.id)
        .gte("workout_date", today.toISOString())
        .lt("workout_date", tomorrow.toISOString());

      if (checkError) {
        console.error('Error checking for existing logs:', checkError);
      } else if (existingLogs && existingLogs.length > 0) {
        console.log('Existing log found, will update instead of insert');
        
        // Update the existing log instead of creating a new one
        const { data: updatedData, error: updateError } = await supabase
          .from("workout_logs")
          .update(workoutLog)
          .eq("id", existingLogs[0].id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Update error details:', updateError);
          
          // If error mentions exercise_details, try again without that column
          if (updateError.message && updateError.message.includes('exercise_details')) {
            console.log('Retrying without exercise_details column');
            delete workoutLog.exercise_details;
            
            const { data: retryData, error: retryError } = await supabase
              .from("workout_logs")
              .update(workoutLog)
              .eq("id", existingLogs[0].id)
              .select()
              .single();
              
            if (retryError) {
              console.error('Retry update error:', retryError);
              throw retryError;
            }
            
            console.log('Workout log updated successfully (fallback):', retryData);
          } else {
            throw updateError;
          }
        } else {
          console.log('Workout log updated successfully:', updatedData);
        }
      } else {
        // No existing log, insert a new one
        const { data: insertedData, error: insertError } = await supabase
          .from("workout_logs")
          .insert(workoutLog)
          .select()
          .single();

        if (insertError) {
          console.error('Insert error details:', insertError);
          
          // If error mentions exercise_details, try again without that column
          if (insertError.message && insertError.message.includes('exercise_details')) {
            console.log('Retrying without exercise_details column');
            delete workoutLog.exercise_details;
            
            const { data: retryData, error: retryError } = await supabase
              .from("workout_logs")
              .insert(workoutLog)
              .select()
              .single();
              
            if (retryError) {
              console.error('Retry insert error:', retryError);
              throw retryError;
            }
            
            console.log('Workout log saved successfully (fallback):', retryData);
            
            setLoggingError(`Note: Your workout was saved, but the database is missing the 'exercise_details' column. Your exercise data has been stored in the notes field as a fallback. Please contact the administrator to add the column for better data handling.`);
          } else {
            throw insertError;
          }
        } else {
          console.log('Workout log saved successfully:', insertedData);
        }
      }

      // Only show success alert if no errors (the warning about exercise_details will still be shown)
      if (!loggingError) {
        alert("Workout logged successfully!");
      }
      setShowWorkoutLogModal(false);
      
      // Refresh workout logs for today
      const { data: updatedLogs, error: fetchError } = await supabase
        .from("workout_logs")
        .select("*")
        .gte("workout_date", today.toISOString())
        .order("workout_date", { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching updated logs:', fetchError);
      } else if (updatedLogs) {
        setWorkoutLogs(updatedLogs);
      }
      
      // Update session count
      setSessionCount(sessionCount + 1);
    } catch (error: any) {
      console.error("Error logging workout:", error);
      
      // Provide detailed error message with database schema fix
      if (error.message && error.message.includes('exercise_details')) {
        setLoggingError(`Database error: The 'exercise_details' column is missing. Please run this SQL:
        
ALTER TABLE workout_logs ADD COLUMN exercise_details TEXT;`);
      } else {
        setLoggingError(
          error.message || 
          (error.details ? `Database error: ${error.details}` : "Failed to log workout. Please try again.")
        );
      }
    }
  };

  // Function to open past logs modal
  const openPastLogsModal = () => {
    setpastLogsModalOpen(true);
    // Set today's date and fetch logs for today
    const today = new Date().toISOString().split('T')[0];
    setSelectedLogDate(today);
    fetchLogsForDate(today);
  };

  // Function to fetch logs for a specific date
  const fetchLogsForDate = async (date: string) => {
    setLoadingDateLogs(true);
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .gte("workout_date", startDate.toISOString())
      .lte("workout_date", endDate.toISOString())
      .order("workout_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching logs for date:", error);
    } else {
      setDateWorkoutLogs(data || []);
    }
    
    setLoadingDateLogs(false);
  };

  // Function to get a rest day for today
  const getTodaysRestDay = () => {
    return workoutLogs.find((log) => {
      const logDate = new Date(log.workout_date);
      return isToday(logDate) && log.is_rest_day === true;
    });
  };

  // Check if there's a workout or rest day logged for today
  const hasLoggedActivityToday = () => {
    return workoutLogs.some((log) => {
      const logDate = new Date(log.workout_date);
      return isToday(logDate);
    });
  };

  // --- Render ---
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Today's Workout Section */}
      <div className="bg-base-200 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
          <FaDumbbell className="mr-2 text-primary" /> Today's Workout
        </h2>
        
        {/* Show loading spinner if loading data */}
        {(loading || loadingCount) ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          // Check if a rest day is logged for today
          getTodaysRestDay() ? (
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-400/10 p-4 rounded-lg mb-4 border-l-4 border-blue-400">
              <div className="flex items-center mb-2">
                <FaBed className="text-blue-400 mr-2 text-xl" />
                <p className="font-medium text-base-content">Rest Day Logged</p>
              </div>
              <p className="text-base-content/70 text-sm">
                You've logged today as a rest day. Enjoy your recovery!
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="btn btn-sm bg-base-300 hover:bg-base-200"
                  onClick={openPastLogsModal}
                >
                  <FaHistory className="mr-2" /> View History
                </button>
                <button
                  className="btn btn-sm bg-primary hover:bg-primary-focus text-primary-content"
                  onClick={openOverrideModal}
                >
                  Change to Workout
                </button>
              </div>
            </div>
          ) : 
          // Check if a workout is already logged for today
          hasLoggedActivityToday() ? (
            <div className="bg-gradient-to-r from-base-300 to-base-200 p-4 rounded-lg mb-4 border-l-4 border-warning">
              <div className="flex items-center mb-2">
                <FaFire className="text-warning mr-2 text-xl" />
                <p className="font-medium">Workout already logged today!</p>
              </div>
              <p className="text-base-content/70 text-sm">
                You've already logged a workout for today. View your history or plan for tomorrow.
              </p>
              <button
                className="btn btn-sm bg-base-300 hover:bg-base-200 mt-3"
                onClick={openPastLogsModal}
              >
                <FaHistory className="mr-2" /> View Workout History
              </button>
            </div>
          ) : selectedWorkout ? (
            <Link 
              href="/workouts/today" 
              className="block hover:opacity-95 transition-all"
            >
              <div className="space-y-4 bg-base-300 rounded-lg p-4 cursor-pointer relative hover:bg-base-300/80 transition-colors">
                <div className="absolute top-2 right-2 hidden sm:flex px-2 py-1 bg-primary text-primary-content text-xs rounded items-center">
                  <FaArrowRight className="mr-1" /> Open Workout
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div className="flex items-start">
                    {selectedWorkout.image_url ? (
                      <div className="hidden sm:block h-16 w-16 mr-4 rounded-lg overflow-hidden">
                        <img 
                          src={selectedWorkout.image_url} 
                          alt={selectedWorkout.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedWorkout.name}
                      </h3>
                      <p className="text-base-content/70 text-sm">
                        {selectedWorkout.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                    <button 
                      className="btn btn-sm bg-primary hover:bg-primary-focus text-primary-content flex-1 sm:flex-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openWorkoutLogModal();
                      }}
                    >
                      <FaSave className="mr-2" /> Log Workout
                    </button>
                    <button 
                      className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white flex-1 sm:flex-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setpastLogsModalOpen(true);
                        setSelectedLogDate(new Date().toISOString().split('T')[0]);
                      }}
                    >
                      <FaBed className="mr-2" /> Log Rest Day
                    </button>
                    <button 
                      className="btn btn-sm bg-base-300 hover:bg-base-200 flex-1 sm:flex-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openOverrideModal();
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto bg-base-300 rounded-lg">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-base-200">
                        <th className="text-base-content">Exercise</th>
                        <th className="text-base-content">Sets</th>
                        <th className="text-base-content">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkout.workout_plan_exercises.map((exercise) => (
                        <tr key={exercise.id} className="hover:bg-base-200">
                          <td className="text-base-content">{exercise.exercises.name}</td>
                          <td className="text-base-content">{exercise.exercises.default_sets}</td>
                          <td className="text-base-content">{exercise.exercises.default_reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Open Button */}
                <div className="sm:hidden mt-3">
                  <Link 
                    href="/workouts/today" 
                    className="btn btn-primary w-full flex items-center justify-center"
                  >
                    <FaArrowRight className="mr-2" /> Open Workout
                  </Link>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-base-300 p-4 rounded-lg text-center">
              <p className="text-base-content">No workout plans available. Create your first workout plan!</p>
            </div>
          )
        )}
      </div>
      
      {/* All Workout Plans Section */}
      <div className="bg-base-200 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-0 flex items-center">
            <FaClipboardList className="mr-2 text-primary" /> All Workout Plans
          </h2>
          <div className="flex space-x-2">
            <button onClick={scrollLeft} className="btn btn-sm btn-circle bg-base-300 hover:bg-base-200">
              ←
            </button>
            <button onClick={scrollRight} className="btn btn-sm btn-circle bg-base-300 hover:bg-base-200">
              →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : workoutPlans.length === 0 ? (
          <div className="bg-base-300 p-4 rounded-lg text-center">
            <p className="text-base-content">No workout plans available. Create your first workout plan!</p>
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {workoutPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`card bg-base-300 shadow-md flex-shrink-0 w-64 hover:shadow-lg transition-shadow ${
                  selectedWorkout?.id === plan.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.image_url && (
                  <figure className="h-32">
                    <img 
                      src={plan.image_url} 
                      alt={plan.name} 
                      className="h-full w-full object-cover"
                    />
                  </figure>
                )}
                <div className="card-body p-4">
                  <h3 className="card-title text-base-content">{plan.name}</h3>
                  <p className="text-base-content/70 text-sm line-clamp-2">
                    {plan.description || "No description"}
                  </p>
                  <div className="card-actions justify-end mt-2">
                    <button
                      className="btn btn-sm bg-base-200 hover:bg-base-300 text-base-content"
                      onClick={() => openWorkoutDetails(plan)}
                    >
                      Details
                    </button>
                    <button
                      className={`btn btn-sm ${
                        selectedWorkout?.id === plan.id 
                          ? 'bg-primary hover:bg-primary-focus' 
                          : 'bg-base-200 hover:bg-base-300'
                      } text-base-content`}
                      onClick={() => {
                        setOverrideWorkoutId(plan.id);
                        saveOverride();
                      }}
                    >
                      {selectedWorkout?.id === plan.id ? 'Selected' : 'Use'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override Workout Modal */}
      {showOverrideModal && (
            <div className="modal modal-open">
          <div className="modal-box bg-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4">Choose Workout Plan</h3>
            <div className="space-y-2">
              {workoutPlans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`p-2 rounded-lg cursor-pointer hover:bg-base-300 transition-colors ${
                    overrideWorkoutId === plan.id ? 'bg-base-300 border border-primary' : 'bg-base-300'
                  }`}
                  onClick={() => setOverrideWorkoutId(plan.id)}
                >
                  <div className="flex items-center">
                    {plan.image_url && (
                      <div className="h-12 w-12 mr-3 rounded overflow-hidden">
                        <img 
                          src={plan.image_url} 
                          alt={plan.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-base-content">{plan.name}</div>
                      <div className="text-sm text-base-content/70 line-clamp-1">
                        {plan.description || "No description"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                <div className="modal-action">
                  <button
                className="btn bg-primary hover:bg-primary-focus text-base-content"
                    onClick={saveOverride}
                disabled={!overrideWorkoutId}
                  >
                Use This Workout
                  </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowOverrideModal(false)}
              >
                    Cancel
                  </button>
                </div>
              </div>
          <div className="modal-backdrop" onClick={() => setShowOverrideModal(false)}></div>
            </div>
          )}

      {/* Workout Details Modal */}
      {workoutDetailsOpen && selectedWorkoutDetails && (
            <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-w-3xl">
            <h3 className="font-bold text-lg text-base-content mb-4 flex items-center">
              {selectedWorkoutDetails.image_url && (
                <div className="h-10 w-10 mr-3 rounded overflow-hidden">
                  <img 
                    src={selectedWorkoutDetails.image_url} 
                    alt={selectedWorkoutDetails.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {selectedWorkoutDetails.name}
            </h3>
            <p className="text-base-content/70 mb-4">{selectedWorkoutDetails.description || "No description"}</p>
            
            <div className="overflow-x-auto bg-base-300 rounded-lg">
                  <table className="table w-full">
                    <thead>
                  <tr className="bg-base-200">
                    <th className="text-base-content">#</th>
                    <th className="text-base-content">Exercise</th>
                    <th className="text-base-content">Sets</th>
                    <th className="text-base-content">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                  {selectedWorkoutDetails.workout_plan_exercises.map((exercise, index) => (
                    <tr key={exercise.id} className="hover:bg-base-200">
                      <td className="text-base-content">{index + 1}</td>
                      <td className="text-base-content">{exercise.exercises.name}</td>
                      <td className="text-base-content">{exercise.exercises.default_sets}</td>
                      <td className="text-base-content">{exercise.exercises.default_reps}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
            
                <div className="modal-action">
              <button 
                className="btn bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => {
                  setSelectedWorkout(selectedWorkoutDetails);
                  setWorkoutDetailsOpen(false);
                }}
              >
                Use This Workout
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setWorkoutDetailsOpen(false)}
              >
                    Close
                  </button>
                </div>
              </div>
          <div className="modal-backdrop" onClick={() => setWorkoutDetailsOpen(false)}></div>
            </div>
          )}

      {/* Log Workout Modal */}
      {showWorkoutLogModal && selectedWorkout && (
            <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-w-4xl">
            <h3 className="font-bold text-lg text-base-content mb-4 flex items-center">
              {selectedWorkout.image_url && (
                <div className="h-10 w-10 mr-3 rounded overflow-hidden">
                  <img 
                    src={selectedWorkout.image_url} 
                    alt={selectedWorkout.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              Log Workout: {selectedWorkout.name}
            </h3>
            
            {loggingError && (
              <div className="alert alert-error mb-4">
                <span>{loggingError}</span>
              </div>
            )}
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Workout Date</span>
              </label>
                            <input
                type="date" 
                className="input input-bordered bg-base-300 text-base-content"
                value={selectedLogDate}
                onChange={(e) => setSelectedLogDate(e.target.value)}
                            />
                          </div>
            
            <div className="space-y-6">
              {selectedWorkout.workout_plan_exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="card bg-base-300 shadow-md">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-base-content">{exercise.exercises.name}</h4>
                      <button 
                        className="btn btn-sm bg-base-200 hover:bg-base-100"
                        onClick={() => applyDefaultWeights(exerciseIndex)}
                        title="Apply your default weights"
                      >
                        <FaMagic className="mr-2" /> Default Weights
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto mt-2">
                      <table className="table w-full">
                        <thead>
                          <tr className="bg-base-200">
                            <th className="text-base-content/80">Set</th>
                            <th className="text-base-content/80">Weight (kg)</th>
                            <th className="text-base-content/80">Reps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: workoutLogDetails[exerciseIndex]?.reps.length || exercise.exercises.default_sets }).map((_, setIndex) => (
                            <tr key={setIndex} className="hover:bg-base-200">
                              <td>{setIndex + 1}</td>
                              <td>
                            <input
                              type="number"
                                  className="input input-bordered input-sm w-20 bg-base-200 text-base-content"
                                  value={workoutLogDetails[exerciseIndex]?.weight?.[setIndex] || 0}
                              onChange={(e) => {
                                    const newDetails = [...workoutLogDetails];
                                    if (!newDetails[exerciseIndex].weight) {
                                      newDetails[exerciseIndex].weight = Array(exercise.exercises.default_sets).fill(0);
                                    }
                                    newDetails[exerciseIndex].weight![setIndex] = Number(e.target.value);
                                    setWorkoutLogDetails(newDetails);
                                  }}
                                />
                              </td>
                              <td>
                            <input
                              type="number"
                                  className="input input-bordered input-sm w-20 bg-base-200 text-base-content"
                                  value={workoutLogDetails[exerciseIndex]?.reps[setIndex] || 0}
                              onChange={(e) => {
                                    const newDetails = [...workoutLogDetails];
                                    newDetails[exerciseIndex].reps[setIndex] = Number(e.target.value);
                                    setWorkoutLogDetails(newDetails);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="form-control mt-2">
                      <label className="label">
                        <span className="label-text text-base-content/80">Notes</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered bg-base-200 text-base-content"
                        placeholder="Any notes about this exercise..."
                        value={workoutLogDetails[exerciseIndex]?.notes || ''}
                        onChange={(e) => {
                          const newDetails = [...workoutLogDetails];
                          newDetails[exerciseIndex].notes = e.target.value;
                          setWorkoutLogDetails(newDetails);
                        }}
                      ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
            </div>
            
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text text-base-content">Workout Notes</span>
              </label>
                    <textarea
                className="textarea textarea-bordered bg-base-300 text-base-content"
                placeholder="How was your workout overall?"
                value={workoutLogNotes}
                onChange={(e) => setWorkoutLogNotes(e.target.value)}
              ></textarea>
                  </div>
            
                <div className="modal-action">
              <button 
                className="btn bg-primary hover:bg-primary-focus text-primary-content"
                onClick={logWorkout}
              >
                Save Workout
                  </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowWorkoutLogModal(false)}
              >
                    Cancel
                  </button>
                </div>
              </div>
          <div className="modal-backdrop" onClick={() => setShowWorkoutLogModal(false)}></div>
        </div>
      )}

      {/* Past Logs Modal */}
      {pastLogsModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-w-3xl">
            <h3 className="font-bold text-lg text-base-content mb-4">View or Log Past Activities</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-base-content">Select Date</span>
              </label>
              <input 
                type="date" 
                className="input input-bordered bg-base-300 text-base-content"
                value={selectedLogDate}
                onChange={(e) => {
                  setSelectedLogDate(e.target.value);
                  fetchLogsForDate(e.target.value);
                }}
              />
            </div>
            
            {loadingDateLogs ? (
              <div className="flex justify-center items-center h-32">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : dateWorkoutLogs.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-base-content">Activities logged on this date:</h4>
                {dateWorkoutLogs.map(log => {
                  // Handle rest day logs
                  if (log.is_rest_day) {
                    return (
                      <div key={log.id} className="card bg-base-300 p-4 border-l-4 border-blue-400">
                        <h5 className="font-medium text-base-content flex items-center">
                          <FaBed className="mr-2 text-blue-400" /> Rest Day
                        </h5>
                        {log.notes && <p className="text-base-content/70 text-sm mt-2">{log.notes}</p>}
                      </div>
                    );
                  }
                  
                  // Handle regular workout logs
                  const workout = workoutPlans.find(wp => wp.id === log.workout_plan_id);
                  let exerciseData = [];
                  try {
                    if (log.exercise_details) {
                      exerciseData = JSON.parse(log.exercise_details);
                    }
                  } catch (e) {
                    console.error("Error parsing exercise details", e);
                  }
                  
                  return (
                    <div key={log.id} className="card bg-base-300 p-4">
                      <h5 className="font-medium text-base-content flex items-center">
                        {workout?.image_url && (
                          <div className="h-8 w-8 mr-2 rounded overflow-hidden">
                            <img 
                              src={workout.image_url} 
                              alt={workout.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        {workout?.name || 'Unknown workout'}
                      </h5>
                      {log.notes && <p className="text-base-content/70 text-sm mt-2">{log.notes}</p>}
                      
                      {exerciseData.length > 0 && (
                        <div className="mt-3">
                          <div className="divider my-2"></div>
                          <h6 className="font-medium text-base-content mb-2">Exercises:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {exerciseData.map((ex: any, idx: number) => (
                              <div key={idx} className="bg-base-200 p-2 rounded-lg">
                                <div className="font-medium text-base-content">{ex.name}</div>
                                <div className="text-sm text-base-content/70">
                                  {ex.sets.map((set: any, setIdx: number) => (
                                    <div key={setIdx} className="flex justify-between">
                                      <span>Set {set.set_number}:</span> 
                                      <span>{set.weight}kg × {set.reps} reps</span>
                                    </div>
                                  ))}
                                </div>
                                {ex.notes && (
                                  <div className="text-xs text-base-content/70 mt-1 italic">
                                    Notes: {ex.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="alert bg-base-300 text-base-content">
                <span>No activities logged for this date. You can log a workout or rest day.</span>
              </div>
            )}
            
            <div className="modal-action">
              {dateWorkoutLogs.length === 0 && (
                <>
                  <button 
                    className="btn bg-primary hover:bg-primary-focus text-primary-content"
                    onClick={() => {
                      setpastLogsModalOpen(false);
                      setShowWorkoutLogModal(true);
                    }}
                  >
                    <FaSave className="mr-2" /> Log Workout
                  </button>
                  <button 
                    className="btn bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={async () => {
                      try {
                        // Check if date is valid
                        const date = new Date(selectedLogDate);
                        if (isNaN(date.getTime())) {
                          alert("Please select a valid date");
                          return;
                        }
                        
                        // Format date properly
                        const formattedDate = date.toISOString();
                        
                        // Log rest day directly from this modal
                        const restDay = {
                          workout_plan_id: null,
                          workout_date: formattedDate,
                          notes: "Rest day",
                          is_rest_day: true
                        };
                        
                        const { error } = await supabase
                          .from("workout_logs")
                          .insert(restDay);
                        
                        if (error) {
                          console.error("Error logging rest day:", error);
                          alert("Failed to log rest day: " + error.message);
                        } else {
                          // Refresh logs and close modal
                          fetchLogsForDate(selectedLogDate);
                          alert("Rest day logged successfully!");
                          
                          // If today was logged, also refresh today's logs
                          const today = new Date();
                          const selectedDate = new Date(selectedLogDate);
                          if (
                            today.getDate() === selectedDate.getDate() &&
                            today.getMonth() === selectedDate.getMonth() &&
                            today.getFullYear() === selectedDate.getFullYear()
                          ) {
                            // Refresh today's logs
                            const todayStr = today.toISOString();
                            const { data } = await supabase
                              .from("workout_logs")
                              .select("*")
                              .gte("workout_date", new Date(todayStr.split('T')[0]).toISOString())
                              .order("workout_date", { ascending: false });
                            
                            if (data) {
                              setWorkoutLogs(data);
                            }
                            
                            // Update session count
                            setSessionCount(sessionCount + 1);
                          }
                        }
                      } catch (error) {
                        console.error("Error logging rest day:", error);
                        alert("An unexpected error occurred");
                      }
                    }}
                  >
                    <FaBed className="mr-2" /> Log Rest Day
                  </button>
                </>
              )}
              <button 
                className="btn btn-outline"
                onClick={() => setpastLogsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setpastLogsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
}

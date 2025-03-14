"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { FaDumbbell, FaArrowLeft, FaCheck, FaExchangeAlt, FaPlus, FaMinus, FaSave, FaUndo } from 'react-icons/fa';
import Link from 'next/link';

// Define types
type Exercise = {
  id: string;
  name: string;
  default_sets: number;
  default_reps: number;
  image_url?: string | null;
};

type WorkoutPlanExercise = {
  id: string;
  position: number;
  exercises: Exercise;
};

type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  workout_plan_exercises: WorkoutPlanExercise[];
  image_url?: string | null;
};

type ExerciseLogEntry = {
  sets: number[];
  reps: number[];
  weight: number[];
  completed: boolean[];
  notes: string;
};

export default function TodaysWorkout() {
  const router = useRouter();
  
  // State
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogEntry[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(false);
  const [todaysWorkoutLogged, setTodaysWorkoutLogged] = useState(false);
  const [todaysLogId, setTodaysLogId] = useState<string | null>(null);
  
  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Check if a workout was already logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingLogs, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .gte('workout_date', today.toISOString())
        .lt('workout_date', new Date(today.getTime() + 86400000).toISOString());
      
      if (!logsError && existingLogs && existingLogs.length > 0) {
        setTodaysWorkoutLogged(true);
        setTodaysLogId(existingLogs[0].id);
        
        // Get associated workout plan
        const workoutPlanId = existingLogs[0].workout_plan_id;
        
        const { data: loggedWorkout, error: workoutError } = await supabase
          .from('workout_plans')
          .select(`
            *,
            workout_plan_exercises (
              id,
              position,
              exercises (*)
            )
          `)
          .eq('id', workoutPlanId)
          .single();
        
        if (!workoutError && loggedWorkout) {
          // Sort exercises by position
          loggedWorkout.workout_plan_exercises.sort((a, b) => a.position - b.position);
          setSelectedWorkout(loggedWorkout);
          
          // Initialize exercise logs with data from the workout log
          if (existingLogs[0].exercise_details) {
            try {
              const details = JSON.parse(existingLogs[0].exercise_details);
              setExerciseLogs(details);
            } catch (e) {
              console.error('Error parsing exercise details:', e);
              initializeExerciseLogs(loggedWorkout);
            }
          } else {
            initializeExerciseLogs(loggedWorkout);
          }
          
          setWorkoutNotes(existingLogs[0].notes || "");
        }
      } else {
        // Fetch all workout plans
        const { data: plans, error: plansError } = await supabase
          .from('workout_plans')
          .select(`
            *,
            workout_plan_exercises (
              id,
              position,
              exercises (*)
            )
          `)
          .order('created_at', { ascending: true });
        
        if (!plansError && plans) {
          // Sort exercises by position for each plan
          const plansWithSortedExercises = plans.map(plan => ({
            ...plan,
            workout_plan_exercises: [...plan.workout_plan_exercises].sort((a, b) => a.position - b.position)
          }));
          
          setWorkoutPlans(plansWithSortedExercises);
          
          // Get most recent log to determine next workout
          const { data: logs, error: logsError } = await supabase
            .from('workout_logs')
            .select('*')
            .order('workout_date', { ascending: false })
            .limit(1);
          
          if (!logsError && logs && logs.length > 0) {
            const lastLoggedWorkoutId = logs[0].workout_plan_id;
            
            // Find next workout in rotation (or first if at end)
            const lastWorkoutIndex = plans.findIndex(plan => plan.id === lastLoggedWorkoutId);
            const nextWorkoutIndex = (lastWorkoutIndex + 1) % plans.length;
            
            setSelectedWorkout(plansWithSortedExercises[nextWorkoutIndex]);
            initializeExerciseLogs(plansWithSortedExercises[nextWorkoutIndex]);
          } else if (plans.length > 0) {
            // No previous logs, use first workout
            setSelectedWorkout(plansWithSortedExercises[0]);
            initializeExerciseLogs(plansWithSortedExercises[0]);
          }
        }
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, []);
  
  // Initialize exercise logs based on workout plan
  const initializeExerciseLogs = (workout: WorkoutPlan) => {
    if (!workout) return;
    
    const logs = workout.workout_plan_exercises.map(ex => {
      // Initialize with default sets and reps
      const numSets = ex.exercises.default_sets || 3;
      
      return {
        sets: Array(numSets).fill(0),
        reps: Array(numSets).fill(ex.exercises.default_reps || 10),
        weight: Array(numSets).fill(0),
        completed: Array(numSets).fill(false),
        notes: ''
      };
    });
    
    setExerciseLogs(logs);
  };
  
  // Update a specific exercise log
  const updateExerciseLog = (
    exerciseIndex: number, 
    field: 'sets' | 'reps' | 'weight' | 'completed' | 'notes', 
    value: number | boolean | string,
    setIndex?: number
  ) => {
    setExerciseLogs(prev => {
      const updated = [...prev];
      
      if (field === 'notes') {
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          notes: value as string
        };
      } else if (setIndex !== undefined) {
        // Update specific set
        const fieldArray = [...updated[exerciseIndex][field]] as any[];
        fieldArray[setIndex] = value;
        
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          [field]: fieldArray
        };
      }
      
      return updated;
    });
  };
  
  // Add a set to an exercise
  const addSet = (exerciseIndex: number) => {
    setExerciseLogs(prev => {
      const updated = [...prev];
      const exercise = {...updated[exerciseIndex]};
      
      // Get the default reps from the last set, or use 10 if no sets exist
      const defaultReps = exercise.reps.length > 0 
        ? exercise.reps[exercise.reps.length - 1] 
        : 10;
      
      // Get the default weight from the last set, or use 0 if no sets exist
      const defaultWeight = exercise.weight.length > 0 
        ? exercise.weight[exercise.weight.length - 1] 
        : 0;
      
      exercise.sets.push(0);
      exercise.reps.push(defaultReps);
      exercise.weight.push(defaultWeight);
      exercise.completed.push(false);
      
      updated[exerciseIndex] = exercise;
      return updated;
    });
  };
  
  // Remove a set from an exercise
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setExerciseLogs(prev => {
      const updated = [...prev];
      const exercise = {...updated[exerciseIndex]};
      
      exercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
      exercise.reps = exercise.reps.filter((_, i) => i !== setIndex);
      exercise.weight = exercise.weight.filter((_, i) => i !== setIndex);
      exercise.completed = exercise.completed.filter((_, i) => i !== setIndex);
      
      updated[exerciseIndex] = exercise;
      return updated;
    });
  };
  
  // Toggle completion status of a set
  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    setExerciseLogs(prev => {
      const updated = [...prev];
      const newCompleted = [...updated[exerciseIndex].completed];
      newCompleted[setIndex] = !newCompleted[setIndex];
      
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        completed: newCompleted
      };
      
      return updated;
    });
  };
  
  // Save the workout log
  const saveWorkoutLog = async () => {
    if (!selectedWorkout) return;
    
    setSaveLoading(true);
    
    try {
      const today = new Date().toISOString();
      
      if (todaysLogId) {
        // Update existing log
        const { error } = await supabase
          .from('workout_logs')
          .update({
            notes: workoutNotes,
            exercise_details: JSON.stringify(exerciseLogs)
          })
          .eq('id', todaysLogId);
        
        if (error) throw error;
      } else {
        // Create new log
        const { error } = await supabase
          .from('workout_logs')
          .insert({
            workout_plan_id: selectedWorkout.id,
            workout_date: today,
            notes: workoutNotes,
            exercise_details: JSON.stringify(exerciseLogs)
          });
        
        if (error) throw error;
        
        setTodaysWorkoutLogged(true);
      }
      
      // Show success message
      alert('Workout logged successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving workout log:', error);
      alert('Failed to save workout log. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Select a different workout
  const selectWorkout = (workout: WorkoutPlan) => {
    setSelectedWorkout(workout);
    initializeExerciseLogs(workout);
    setShowWorkoutSelector(false);
  };
  
  // Render the page
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Link 
            href="/workouts" 
            className="btn btn-circle btn-sm md:btn-md btn-ghost mr-3"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-base-content">
            {selectedWorkout ? selectedWorkout.name : "Today's Workout"}
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            className="btn btn-sm md:btn-md bg-base-300 hover:bg-base-200 flex-1 sm:flex-none"
            onClick={() => setShowWorkoutSelector(true)}
          >
            <FaExchangeAlt className="mr-2" /> Change Workout
          </button>
          <button
            className="btn btn-sm md:btn-md btn-primary flex-1 sm:flex-none"
            onClick={saveWorkoutLog}
            disabled={saveLoading || !selectedWorkout}
          >
            {saveLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <FaSave className="mr-2" />
            )}
            {todaysWorkoutLogged ? 'Update Log' : 'Save Workout'}
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !selectedWorkout ? (
        <div className="bg-base-200 rounded-xl p-6 text-center space-y-4">
          <p className="text-base-content/70">No workout plans available. Create your first workout plan!</p>
          <Link href="/workouts/create" className="btn btn-primary">
            Create Workout Plan
          </Link>
        </div>
      ) : (
        <>
          {/* Workout Header */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {selectedWorkout.image_url && (
                  <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden">
                    <img 
                      src={selectedWorkout.image_url} 
                      alt={selectedWorkout.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="card-title text-xl md:text-2xl mb-3">{selectedWorkout.name}</h2>
                  <p className="text-base-content/80 mb-4">{selectedWorkout.description}</p>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Workout Notes</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered bg-base-300 h-24"
                      placeholder="Add notes about today's workout (optional)"
                      value={workoutNotes}
                      onChange={(e) => setWorkoutNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Exercise Cards */}
          <div className="space-y-6">
            {selectedWorkout.workout_plan_exercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="card bg-base-200 shadow-lg">
                <div className="card-body p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {exercise.exercises.image_url && (
                      <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden">
                        <img 
                          src={exercise.exercises.image_url} 
                          alt={exercise.exercises.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-4">
                      <h3 className="card-title text-lg md:text-xl">
                        {exercise.exercises.name}
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="table w-full">
                          <thead>
                            <tr className="bg-base-300">
                              <th className="text-center">Set</th>
                              <th className="text-center">Weight (kg)</th>
                              <th className="text-center">Reps</th>
                              <th className="text-center">Done</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exerciseLogs[exerciseIndex]?.sets.map((_, setIndex) => (
                              <tr key={setIndex} className="hover:bg-base-300">
                                <td className="text-center font-medium">
                                  {setIndex + 1}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className={`input input-bordered input-sm w-full max-w-20 text-center ${
                                      exerciseLogs[exerciseIndex]?.completed[setIndex] ? 'bg-base-300' : 'bg-base-200'
                                    }`}
                                    value={exerciseLogs[exerciseIndex]?.weight[setIndex] || 0}
                                    onChange={(e) => updateExerciseLog(
                                      exerciseIndex,
                                      'weight',
                                      Number(e.target.value),
                                      setIndex
                                    )}
                                    disabled={exerciseLogs[exerciseIndex]?.completed[setIndex]}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className={`input input-bordered input-sm w-full max-w-20 text-center ${
                                      exerciseLogs[exerciseIndex]?.completed[setIndex] ? 'bg-base-300' : 'bg-base-200'
                                    }`}
                                    value={exerciseLogs[exerciseIndex]?.reps[setIndex] || 0}
                                    onChange={(e) => updateExerciseLog(
                                      exerciseIndex,
                                      'reps',
                                      Number(e.target.value),
                                      setIndex
                                    )}
                                    disabled={exerciseLogs[exerciseIndex]?.completed[setIndex]}
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    className={`btn btn-circle btn-sm ${
                                      exerciseLogs[exerciseIndex]?.completed[setIndex]
                                        ? 'btn-success'
                                        : 'btn-outline'
                                    }`}
                                    onClick={() => toggleSetCompletion(exerciseIndex, setIndex)}
                                  >
                                    <FaCheck />
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-circle btn-sm btn-outline btn-error"
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                  >
                                    <FaMinus />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={5} className="text-center">
                                <button
                                  className="btn btn-sm btn-outline mt-2 w-full sm:w-auto"
                                  onClick={() => addSet(exerciseIndex)}
                                >
                                  <FaPlus className="mr-2" /> Add Set
                                </button>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Exercise Notes</span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered bg-base-300 h-20"
                          placeholder="Add notes for this exercise..."
                          value={exerciseLogs[exerciseIndex]?.notes || ''}
                          onChange={(e) => updateExerciseLog(
                            exerciseIndex,
                            'notes',
                            e.target.value
                          )}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Save Button - Fixed at Bottom for Mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-base-100 border-t border-base-300 md:hidden z-10">
            <button
              className="btn btn-primary w-full"
              onClick={saveWorkoutLog}
              disabled={saveLoading || !selectedWorkout}
            >
              {saveLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FaSave className="mr-2" />
              )}
              {todaysWorkoutLogged ? 'Update Log' : 'Save Workout'}
            </button>
          </div>
          
          {/* Add padding at the bottom on mobile to accommodate the fixed save button */}
          <div className="h-16 md:hidden"></div>
        </>
      )}
      
      {/* Workout Selector Modal */}
      {showWorkoutSelector && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-w-xl">
            <h3 className="font-bold text-lg mb-4">Select a Workout</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {workoutPlans.map(workout => (
                <div
                  key={workout.id}
                  className={`card bg-base-300 hover:bg-base-300/80 cursor-pointer transition-colors ${
                    selectedWorkout?.id === workout.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    selectWorkout(workout);
                    setShowWorkoutSelector(false);
                  }}
                >
                  <div className="card-body p-4">
                    <div className="flex items-center gap-3">
                      {workout.image_url && (
                        <div className="h-16 w-16 rounded-lg overflow-hidden">
                          <img 
                            src={workout.image_url} 
                            alt={workout.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{workout.name}</h4>
                        <p className="text-sm text-base-content/70 line-clamp-1">
                          {workout.description || "No description"}
                        </p>
                        <p className="text-xs text-base-content/70 mt-1">
                          {workout.workout_plan_exercises.length} exercises
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowWorkoutSelector(false)}
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowWorkoutSelector(false)}></div>
        </div>
      )}
    </div>
  );
} 
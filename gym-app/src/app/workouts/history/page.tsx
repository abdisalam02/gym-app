"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaCalendarAlt, FaDumbbell, FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaBed, FaPlus } from 'react-icons/fa';

type WorkoutLog = {
  id: string;
  workout_plan_id: string | null;
  workout_date: string;
  notes: string | null;
  exercise_details: string | null;
  is_rest_day?: boolean;
  workout_plans?: {
    name: string;
    description: string | null;
  } | null;
};

export default function WorkoutHistory() {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [expandedWorkouts, setExpandedWorkouts] = useState<{ [key: string]: boolean }>({});
  const [showRestDayModal, setShowRestDayModal] = useState(false);
  const [restDayDate, setRestDayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [restDayNotes, setRestDayNotes] = useState("");
  const [isLoggingRestDay, setIsLoggingRestDay] = useState(false);

  useEffect(() => {
    async function fetchWorkoutLogs() {
      setLoading(true);
      
      let query = supabase
        .from('workout_logs')
        .select(`
          *,
          workout_plans (
            name,
            description
          )
        `)
        .order('workout_date', { ascending: false });
      
      // Apply time filter
      if (timeFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('workout_date', oneWeekAgo.toISOString());
      } else if (timeFilter === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte('workout_date', oneMonthAgo.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching workout logs:', error);
      } else {
        setWorkoutLogs(data || []);
      }
      
      setLoading(false);
    }
    
    fetchWorkoutLogs();
  }, [timeFilter]);

  // Filter workout logs based on search term
  const filteredLogs = workoutLogs.filter(log => 
    (log.is_rest_day && searchTerm.toLowerCase().includes('rest')) ||
    (log.workout_plans?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.notes && !log.notes.includes('--- EXERCISE DATA ---') && log.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Parse exercise details from JSON string or notes
  const parseExerciseDetails = (log: WorkoutLog) => {
    // First try the exercise_details column
    if (log.exercise_details) {
      try {
        return JSON.parse(log.exercise_details);
      } catch (error) {
        console.error('Error parsing exercise_details:', error);
      }
    }
    
    // Fallback to parsing from notes
    if (log.notes && log.notes.includes('--- EXERCISE DATA ---')) {
      try {
        const jsonStr = log.notes.split('--- EXERCISE DATA ---')[1].trim();
        return JSON.parse(jsonStr);
      } catch (error) {
        console.error('Error parsing exercise data from notes:', error);
      }
    }
    
    return [];
  };

  // Get clean notes without the exercise data JSON
  const getCleanNotes = (log: WorkoutLog) => {
    if (!log.notes) return null;
    if (log.notes.includes('--- EXERCISE DATA ---')) {
      return log.notes.split('--- EXERCISE DATA ---')[0].trim();
    }
    return log.notes;
  };

  // Calculate workout summary
  const getWorkoutSummary = (exercises: any[]) => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalReps = exercises.reduce((sum, ex) => 
      sum + ex.sets.reduce((setSum: number, set: any) => setSum + set.reps, 0), 0);
    const totalWeight = exercises.reduce((sum, ex) => 
      sum + ex.sets.reduce((setSum: number, set: any) => setSum + (set.weight * set.reps), 0), 0);
    
    return { totalSets, totalReps, totalWeight };
  };

  // Toggle expanded state for a workout
  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  // Function to log a rest day
  const logRestDay = async () => {
    setIsLoggingRestDay(true);
    
    try {
      // Format date properly
      let formattedDate = restDayDate;
      try {
        const date = new Date(restDayDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString();
        }
      } catch (err) {
        console.warn("Date formatting failed, using original value:", restDayDate);
      }
      
      // Check if a rest day or workout already exists for this date
      const startDate = new Date(formattedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(formattedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const { data: existingLogs } = await supabase
        .from("workout_logs")
        .select("id")
        .gte("workout_date", startDate.toISOString())
        .lte("workout_date", endDate.toISOString());
      
      if (existingLogs && existingLogs.length > 0) {
        alert("You already have a workout or rest day logged for this date.");
        setIsLoggingRestDay(false);
        return;
      }
      
      // Prepare the rest day log
      const restDay: WorkoutLog = {
        workout_plan_id: null,
        workout_date: formattedDate,
        notes: restDayNotes,
        exercise_details: null,
        is_rest_day: true
      };
      
      // Insert the rest day
      const { error } = await supabase
        .from("workout_logs")
        .insert(restDay);
      
      if (error) {
        console.error("Error logging rest day:", error);
        alert("Failed to log rest day: " + error.message);
      } else {
        // Refresh the list
        fetchWorkoutLogs();
        setShowRestDayModal(false);
        setRestDayNotes("");
        alert("Rest day logged successfully!");
      }
    } catch (error) {
      console.error("Error in logRestDay:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoggingRestDay(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-base-content">Workout History</h1>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setShowRestDayModal(true)}
            className="btn btn-sm bg-base-300 hover:bg-base-200"
          >
            <FaBed className="mr-2" /> Log Rest Day
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm bg-base-300 hover:bg-base-200">
              <FaFilter className="mr-2" /> {timeFilter === 'all' ? 'All Time' : timeFilter === 'week' ? 'This Week' : 'This Month'}
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
              <li><button onClick={() => setTimeFilter('all')} className="text-base-content hover:bg-base-300">All Time</button></li>
              <li><button onClick={() => setTimeFilter('week')} className="text-base-content hover:bg-base-300">This Week</button></li>
              <li><button onClick={() => setTimeFilter('month')} className="text-base-content hover:bg-base-300">This Month</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-base-content/50" />
        </div>
        <input
          type="text"
          placeholder="Search workouts or notes..."
          className="input input-bordered w-full pl-10 bg-base-300 text-base-content"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <FaCalendarAlt className="mx-auto text-4xl text-base-content/50 mb-4" />
          <p className="text-base-content/70">
            {searchTerm 
              ? "No workout logs found matching your search." 
              : "No workout history yet. Start logging your workouts!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            // Handle rest day logs differently
            if (log.is_rest_day) {
              return (
                <div key={log.id} className="card bg-base-200 shadow-xl border-l-4 border-blue-400">
                  <div className="card-body p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleWorkout(log.id)}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h2 className="card-title text-base-content flex items-center">
                            <FaBed className="mr-2 text-blue-400" /> Rest Day
                          </h2>
                          <button className="btn btn-ghost btn-sm btn-circle">
                            {expandedWorkouts[log.id] ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                        <div className="flex items-center text-base-content/70 text-sm mt-1">
                          <FaCalendarAlt className="mr-2" />
                          {new Date(log.workout_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {expandedWorkouts[log.id] && log.notes && (
                      <div className="mt-4 space-y-4 border-t border-base-300 pt-4">
                        <div>
                          <div className="font-semibold text-base-content mb-2">Notes</div>
                          <div className="bg-base-300 p-4 rounded-lg text-base-content/80">
                            {log.notes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            
            // Regular workout logs (existing code)
            const exerciseDetails = parseExerciseDetails(log);
            const cleanNotes = getCleanNotes(log);
            const summary = getWorkoutSummary(exerciseDetails);
            const isExpanded = expandedWorkouts[log.id];
            
            return (
              <div key={log.id} className="card bg-base-200 shadow-xl">
                <div className="card-body p-4">
                  {/* Header - Always Visible */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleWorkout(log.id)}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h2 className="card-title text-base-content">
                          {log.workout_plans?.name || 'Unknown Workout'}
                        </h2>
                        <button className="btn btn-ghost btn-sm btn-circle">
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>
                      <div className="flex items-center text-base-content/70 text-sm mt-1">
                        <FaCalendarAlt className="mr-2" />
                        {new Date(log.workout_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary - Always Visible */}
                  {exerciseDetails.length > 0 && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-base-content/70">
                      <div className="flex items-center">
                        <FaDumbbell className="mr-1" />
                        {exerciseDetails.length} exercises
                      </div>
                      <div>
                        {summary.totalSets} sets
                      </div>
                      <div>
                        {summary.totalWeight.toLocaleString()}kg total
                      </div>
                    </div>
                  )}

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-base-300 pt-4">
                      {/* Detailed Summary */}
                      {exerciseDetails.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="stat bg-base-300 rounded-lg p-4">
                            <div className="stat-title text-base-content/70">Total Volume</div>
                            <div className="stat-value text-primary">{summary.totalWeight.toLocaleString()}kg</div>
                            <div className="stat-desc text-base-content/60">Total weight × reps</div>
                          </div>
                          <div className="stat bg-base-300 rounded-lg p-4">
                            <div className="stat-title text-base-content/70">Sets</div>
                            <div className="stat-value text-secondary">{summary.totalSets}</div>
                            <div className="stat-desc text-base-content/60">Across all exercises</div>
                          </div>
                          <div className="stat bg-base-300 rounded-lg p-4">
                            <div className="stat-title text-base-content/70">Total Reps</div>
                            <div className="stat-value text-accent">{summary.totalReps}</div>
                            <div className="stat-desc text-base-content/60">All sets combined</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Notes Section */}
                      {cleanNotes && (
                        <div>
                          <div className="font-semibold text-base-content mb-2">Workout Notes</div>
                          <div className="bg-base-300 p-4 rounded-lg text-base-content/80">
                            {cleanNotes}
                          </div>
                        </div>
                      )}
                      
                      {/* Exercise Details */}
                      {exerciseDetails.length > 0 && (
                        <div>
                          <div className="font-semibold text-base-content mb-4">Exercise Details</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {exerciseDetails.map((exercise: any, index: number) => (
                              <div key={index} className="bg-base-300 rounded-lg p-4">
                                <div className="font-medium text-base-content mb-2 flex items-center justify-between">
                                  <span>{exercise.name}</span>
                                  {exercise.notes && (
                                    <span className="text-xs text-base-content/60 italic">
                                      {exercise.notes}
                                    </span>
                                  )}
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="table table-sm w-full">
                                    <thead>
                                      <tr className="text-base-content/70">
                                        <th>Set</th>
                                        <th>Weight</th>
                                        <th>Reps</th>
                                        <th>Volume</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {exercise.sets.map((set: any, setIndex: number) => (
                                        <tr key={setIndex} className="text-base-content/80">
                                          <td>{set.set_number}</td>
                                          <td>{set.weight}kg</td>
                                          <td>{set.reps}</td>
                                          <td>{set.weight * set.reps}kg</td>
                                        </tr>
                                      ))}
                                      <tr className="font-medium">
                                        <td colSpan={3} className="text-right">Total Volume:</td>
                                        <td>
                                          {exercise.sets.reduce((sum: number, set: any) => 
                                            sum + (set.weight * set.reps), 0)}kg
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest Day Modal */}
      {showRestDayModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4 flex items-center">
              <FaBed className="mr-2 text-blue-400" /> Log Rest Day
            </h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-base-content">Rest Day Date</span>
              </label>
              <input 
                type="date" 
                className="input input-bordered bg-base-300 text-base-content"
                value={restDayDate}
                onChange={(e) => setRestDayDate(e.target.value)}
              />
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-base-content">Notes (Optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered bg-base-300 text-base-content"
                placeholder="Why are you taking a rest day? Any recovery activities?"
                value={restDayNotes}
                onChange={(e) => setRestDayNotes(e.target.value)}
              ></textarea>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn bg-blue-500 hover:bg-blue-600 text-white"
                onClick={logRestDay}
                disabled={isLoggingRestDay}
              >
                {isLoggingRestDay ? <span className="loading loading-spinner loading-sm"></span> : <FaBed className="mr-2" />}
                Log Rest Day
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowRestDayModal(false)}
                disabled={isLoggingRestDay}
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !isLoggingRestDay && setShowRestDayModal(false)}></div>
        </div>
      )}
    </div>
  );
} 
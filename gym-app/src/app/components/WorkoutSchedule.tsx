// components/WorkoutSchedule.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaCalendarAlt } from 'react-icons/fa';

type ScheduledWorkout = {
  id: string;
  workout_plan_id: string;
  scheduled_date: string;
  workout_plans: {
    name: string;
  };
};

export default function WorkoutSchedule() {
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScheduledWorkouts() {
      setLoading(true);
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get date 7 days from now
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select(`
          *,
          workout_plans (
            name
          )
        `)
        .gte('scheduled_date', today.toISOString())
        .lt('scheduled_date', nextWeek.toISOString())
        .order('scheduled_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching scheduled workouts:', error);
      } else {
        setScheduledWorkouts(data || []);
      }
      
      setLoading(false);
    }
    
    fetchScheduledWorkouts();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="card bg-slate-800 shadow-xl">
      <div className="card-body p-4">
        <h2 className="card-title text-white">
          <FaCalendarAlt className="mr-2 text-slate-400" /> Upcoming Workouts
        </h2>
        
        {scheduledWorkouts.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No workouts scheduled for the next 7 days</p>
        ) : (
          <div className="space-y-2 mt-2">
            {scheduledWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center p-2 bg-slate-700 rounded-lg">
                <div className="bg-slate-600 rounded-md p-2 mr-3 text-center min-w-[50px]">
                  <div className="text-xs text-slate-300">
                    {new Date(workout.scheduled_date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {new Date(workout.scheduled_date).getDate()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white">{workout.workout_plans.name}</div>
                  <div className="text-xs text-slate-400">{formatDate(workout.scheduled_date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

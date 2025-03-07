"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function History() {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkoutLogs() {
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          *,
          workout_plans (
            name,
            description
          )
        `)
        .order('workout_date', { ascending: false });

      if (error) {
        console.error('Error fetching workout logs:', error);
      } else {
        setWorkoutLogs(data || []);
      }
      setLoading(false);
    }

    fetchWorkoutLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Workout History</h1>
      
      <div className="space-y-4">
        {workoutLogs.map((log: any) => (
          <div key={log.id} className="card bg-zinc-800 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white">
                {log.workout_plans?.name || 'Unknown Workout'}
                <span className="badge badge-red-500">
                  {new Date(log.workout_date).toLocaleDateString()}
                </span>
              </h2>
              <p className="text-zinc-400">{log.notes || 'No notes'}</p>
              {log.exercise_details && (
                <div className="mt-4">
                  <h3 className="font-semibold text-white mb-2">Exercise Details:</h3>
                  <pre className="text-sm text-zinc-400 overflow-x-auto">
                    {JSON.stringify(JSON.parse(log.exercise_details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
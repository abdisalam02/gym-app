"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';

type Exercise = {
  id: string;
  name: string;
  description: string;
  default_sets: number;
  default_reps: number;
  image_url: string;
};

type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  workout_plan_exercises: {
    id: string;
    position: number;
    exercises: Exercise;
  }[];
};

export default function Workouts() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkoutPlans() {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching workout plans:', error);
      } else {
        setWorkoutPlans(data || []);
      }
      setLoading(false);
    }

    fetchWorkoutPlans();
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
      <h1 className="text-3xl font-bold text-white">My Workouts</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workoutPlans.map((plan) => (
          <div key={plan.id} className="card bg-zinc-800 shadow-xl hover:shadow-2xl transition-all">
            <figure className="relative h-48">
              <Image
                src={plan.image_url || '/placeholder-workout.jpg'}
                alt={plan.name}
                fill
                className="object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-white">{plan.name}</h2>
              <p className="text-zinc-400">{plan.description}</p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none">
                  Start Workout
                </button>
                <button className="btn btn-sm btn-outline text-white">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DatabaseChecker() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkDatabase() {
    setLoading(true);
    setError(null);
    
    try {
      // Check if workout_plans table exists
      const { data: workoutPlans, error: workoutPlansError } = await supabase
        .from('workout_plans')
        .select('id')
        .limit(1);
      
      if (workoutPlansError) {
        throw new Error(`Error accessing workout_plans table: ${workoutPlansError.message}`);
      }
      
      // Check if workout_plan_exercises table exists
      const { data: workoutExercises, error: workoutExercisesError } = await supabase
        .from('workout_plan_exercises')
        .select('id')
        .limit(1);
      
      if (workoutExercisesError) {
        throw new Error(`Error accessing workout_plan_exercises table: ${workoutExercisesError.message}`);
      }
      
      // Check if exercises table exists
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('id')
        .limit(1);
      
      if (exercisesError) {
        throw new Error(`Error accessing exercises table: ${exercisesError.message}`);
      }
      
      // Check joined query
      const { data: joinedData, error: joinedError } = await supabase
        .from('workout_plan_exercises')
        .select(`
          id,
          workout_plan_id,
          exercise_id,
          exercises (id, name)
        `)
        .limit(1);
      
      if (joinedError) {
        throw new Error(`Error with joined query: ${joinedError.message}`);
      }
      
      // Get table structure information from Postgres
      const { data: tableInfo, error: tableInfoError } = await supabase
        .rpc('get_table_info', { table_name: 'workout_plan_exercises' });
      
      if (tableInfoError) {
        console.warn('Could not get table info:', tableInfoError);
        // This is optional so we don't throw an error
      }
      
      setResults({
        workoutPlansExists: workoutPlans !== null,
        workoutPlansCount: workoutPlans?.length || 0,
        workoutExercisesExists: workoutExercises !== null,
        workoutExercisesCount: workoutExercises?.length || 0,
        exercisesExists: exercises !== null,
        exercisesCount: exercises?.length || 0,
        joinWorksCorrectly: joinedData !== null,
        joinedDataResults: joinedData,
        tableStructure: tableInfo
      });
    } catch (err) {
      console.error('Database check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card bg-base-200 shadow-lg p-4">
      <h2 className="text-lg font-bold mb-4">Database Diagnostics</h2>
      
      <button 
        className="btn btn-primary mb-4" 
        onClick={checkDatabase}
        disabled={loading}
      >
        {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Check Database'}
      </button>
      
      {error && (
        <div className="alert alert-error mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="space-y-4">
          <h3 className="font-semibold">Results:</h3>
          
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>workout_plans table</td>
                  <td className={results.workoutPlansExists ? "text-success" : "text-error"}>
                    {results.workoutPlansExists ? `✓ (${results.workoutPlansCount} records)` : '✕ Not found'}
                  </td>
                </tr>
                <tr>
                  <td>workout_plan_exercises table</td>
                  <td className={results.workoutExercisesExists ? "text-success" : "text-error"}>
                    {results.workoutExercisesExists ? `✓ (${results.workoutExercisesCount} records)` : '✕ Not found'}
                  </td>
                </tr>
                <tr>
                  <td>exercises table</td>
                  <td className={results.exercisesExists ? "text-success" : "text-error"}>
                    {results.exercisesExists ? `✓ (${results.exercisesCount} records)` : '✕ Not found'}
                  </td>
                </tr>
                <tr>
                  <td>Join relationship</td>
                  <td className={results.joinWorksCorrectly ? "text-success" : "text-error"}>
                    {results.joinWorksCorrectly ? '✓ Works correctly' : '✕ Failed'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {results.joinedDataResults && results.joinedDataResults.length > 0 && (
            <div>
              <h4 className="font-semibold mt-4">Sample Joined Data:</h4>
              <pre className="bg-base-300 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(results.joinedDataResults, null, 2)}
              </pre>
            </div>
          )}
          
          {results.tableStructure && (
            <div>
              <h4 className="font-semibold mt-4">Table Structure:</h4>
              <pre className="bg-base-300 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(results.tableStructure, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
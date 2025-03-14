"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { FaClipboardList, FaEdit, FaSave, FaTrash, FaArrowLeft, FaPlus, FaImage, FaSearch, FaTools } from 'react-icons/fa';
import ImageSearch from '../../components/ImageSearch';
import ExerciseSelector from '../../components/ExerciseSelector';
import WorkoutTabs from '../../components/WorkoutTabs';
import AutoImageFetch from '../../components/AutoImageFetch';
import DatabaseChecker from '../../components/DatabaseChecker';

type Exercise = {
  id: string;
  name: string;
};

type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  order: number;
  sets: number;
  reps: number;
  exercise?: Exercise;
};

type Workout = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

export default function WorkoutDetails() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [activeImageTab, setActiveImageTab] = useState<'auto' | 'search'>('auto');
  const [showImageSearch, setShowImageSearch] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showAutoImageFetch, setShowAutoImageFetch] = useState(false);

  useEffect(() => {
    // Fetch workout data
    const fetchWorkoutData = async () => {
      setLoading(true);
      try {
        // Fetch workout details
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('id', workoutId)
          .single();

        if (workoutError) {
          console.error('Error fetching workout details:', workoutError);
          setFetchError(`Error fetching workout: ${workoutError.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }

        if (!workoutData) {
          setFetchError('Workout not found');
          setLoading(false);
          return;
        }

        // Set workout data
        setWorkout(workoutData);
        setName(workoutData.name);
        setDescription(workoutData.description || '');

        // Fetch workout exercises with exercise details
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('workout_plan_exercises')
          .select(`
            id,
            position,
            workout_plan_id,
            exercise_id,
            sets,
            reps,
            exercises (id, name)
          `)
          .eq('workout_plan_id', workoutId)
          .order('position');

        if (exercisesError) {
          console.error('Error fetching workout exercises:', exercisesError);
          setFetchError(`Error fetching exercises: ${exercisesError.message || 'Unknown error'}`);
          setExercises([]); // Set empty array to avoid null errors
        } else if (!exercisesData || exercisesData.length === 0) {
          console.log('No exercises found for this workout');
          setExercises([]);
        } else {
          // Transform the data
          const transformedExercises = exercisesData.map(exerciseData => ({
            id: exerciseData.id,
            position: exerciseData.position,
            workout_plan_id: exerciseData.workout_plan_id,
            exercise_id: exerciseData.exercise_id,
            sets: exerciseData.sets,
            reps: exerciseData.reps,
            exercise: exerciseData.exercises
          }));
          setExercises(transformedExercises);
        }

        // Fetch workout logs
        const { data: logsData, error: logsError } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('workout_plan_id', workoutId)
          .order('created_at', { ascending: false });

        if (logsError) {
          console.error('Error fetching workout logs:', logsError);
          setFetchError(`Error fetching workout logs: ${logsError.message || 'Unknown error'}`);
          setWorkoutLogs([]);
        } else {
          setWorkoutLogs(logsData || []);
        }

      } catch (error) {
        console.error('Unexpected error:', error);
        setFetchError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (workoutId) {
      fetchWorkoutData();
    }
  }, [workoutId]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Workout name is required');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('workout_plans')
        .update({
          name,
          description,
        })
        .eq('id', workoutId);
      
      if (error) throw error;
      
      // Update local state
      setWorkout({
        ...workout!,
        name,
        description,
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating workout:', error);
      alert('Failed to update workout');
    }
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    if (workout) {
      // Update local state
      setWorkout({
        ...workout,
        image_url: imageUrl,
      });
      
      // Update in database
      supabase
        .from('workout_plans')
        .update({ image_url: imageUrl })
        .eq('id', workoutId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating workout image:', error);
          }
        });
    }
  };

  const addExerciseToWorkout = async (exerciseId: string) => {
    // Get the maximum order value
    const maxOrder = exercises.length > 0
      ? Math.max(...exercises.map(e => e.order))
      : 0;
    
    // Get exercise details
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select('id, name, default_sets, default_reps')
      .eq('id', exerciseId)
      .single();
    
    if (exerciseError) {
      console.error('Error fetching exercise:', exerciseError);
      return;
    }
    
    // Add exercise to workout
    const newWorkoutExercise = {
      workout_plan_id: workoutId,
      exercise_id: exerciseId,
      position: maxOrder + 1,
      sets: exerciseData.default_sets || 3,
      reps: exerciseData.default_reps || 10,
    };
    
    const { data, error } = await supabase
      .from('workout_plan_exercises')
      .insert(newWorkoutExercise)
      .select(`
        id,
        workout_plan_id,
        exercise_id,
        position,
        sets,
        reps,
        exercises (id, name)
      `)
      .single();
    
    if (error) {
      console.error('Error adding exercise to workout:', error);
      alert('Failed to add exercise to workout');
      return;
    }
    
    // Transform the response to match WorkoutExercise type
    const newExercise: WorkoutExercise = {
      id: data.id,
      workout_id: data.workout_plan_id,
      exercise_id: data.exercise_id,
      order: data.position,
      sets: data.sets,
      reps: data.reps,
      exercise: data.exercises
    };
    
    setExercises([...exercises, newExercise]);
  };

  const updateExerciseOrder = async (exerciseId: string, newOrder: number) => {
    // Find the exercise
    const exerciseIndex = exercises.findIndex(e => e.id === exerciseId);
    if (exerciseIndex === -1) return;
    
    const updatedExercises = [...exercises];
    const [movedExercise] = updatedExercises.splice(exerciseIndex, 1);
    updatedExercises.splice(newOrder - 1, 0, movedExercise);
    
    // Update order for all exercises
    const exercisesWithUpdatedOrder = updatedExercises.map((ex, index) => ({
      ...ex,
      order: index + 1,
    }));
    
    setExercises(exercisesWithUpdatedOrder);
    
    // Update in database
    for (const ex of exercisesWithUpdatedOrder) {
      await supabase
        .from('workout_plan_exercises')
        .update({ position: ex.order })
        .eq('id', ex.id);
    }
  };

  const removeExerciseFromWorkout = async (exerciseId: string) => {
    // Remove from state
    const updatedExercises = exercises.filter(e => e.id !== exerciseId);
    setExercises(updatedExercises);
    
    // Remove from database
    const { error } = await supabase
      .from('workout_plan_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      console.error('Error removing exercise from workout:', error);
      alert('Failed to remove exercise from workout');
    }
    
    // Reorder remaining exercises
    const reorderedExercises = updatedExercises.map((ex, index) => ({
      ...ex,
      order: index + 1,
    }));
    
    setExercises(reorderedExercises);
    
    // Update orders in database
    for (const ex of reorderedExercises) {
      await supabase
        .from('workout_plan_exercises')
        .update({ position: ex.order })
        .eq('id', ex.id);
    }
  };

  const updateExerciseSetsReps = async (exerciseId: string, sets: number, reps: number) => {
    // Update in state
    const updatedExercises = exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets, reps };
      }
      return ex;
    });
    
    setExercises(updatedExercises);
    
    // Update in database
    const { error } = await supabase
      .from('workout_plan_exercises')
      .update({ sets, reps })
      .eq('id', exerciseId);
    
    if (error) {
      console.error('Error updating exercise sets/reps:', error);
      alert('Failed to update exercise');
    }
  };

  const renderImageSection = () => {
    if (!workout) return null;
    
    if (activeImageTab === 'auto') {
      return (
        <AutoImageFetch 
          entityType="workout"
          entityId={workoutId}
          entityName={workout.name}
          existingImageUrl={workout.image_url}
          onImageFetched={handleImageUpdate}
          autoFetch={false}
        />
      );
    } else {
      return (
        <div>
          {workout.image_url ? (
            <div className="relative rounded-lg overflow-hidden h-48">
              <div className="relative w-full h-full">
                <img
                  src={workout.image_url}
                  alt={workout.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setShowImageSearch(true)}
                className="absolute top-2 right-2 btn btn-sm btn-circle bg-base-300 hover:bg-base-200"
                title="Change image"
              >
                <FaSearch />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-base-300 rounded-lg h-48 flex flex-col items-center justify-center">
              <FaImage className="text-3xl opacity-50 mb-2" />
              <p className="text-base-content/70 text-center mb-2">No image for this workout</p>
              <button
                onClick={() => setShowImageSearch(true)}
                className="btn btn-sm bg-base-300 hover:bg-base-200"
              >
                <FaSearch className="mr-2" /> Search for Image
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  // Add handleMoveExercise function
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    
    const exercise = exercises[index];
    
    // Update positions in the UI
    const updatedExercises = [...exercises];
    updatedExercises.splice(index, 1);
    updatedExercises.splice(newIndex, 0, exercise);
    
    // Update position values to match new order
    const reorderedExercises = updatedExercises.map((ex, idx) => ({
      ...ex,
      order: idx + 1
    }));
    
    setExercises(reorderedExercises);
    
    // Update in database - can be optimized to only update the affected exercises
    reorderedExercises.forEach(ex => {
      supabase
        .from('workout_plan_exercises')
        .update({ position: ex.order })
        .eq('id', ex.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating exercise position:', error);
          }
        });
    });
  };

  // Add handleSaveChanges function
  const handleSaveChanges = async () => {
    if (!workout) return;
    
    try {
      const { error } = await supabase
        .from('workout_plans')
        .update({
          name,
          description
        })
        .eq('id', workoutId);

      if (error) {
        console.error('Error updating workout:', error);
        alert('Failed to update workout details');
        return;
      }

      // Update the workout in state
      setWorkout({
        ...workout,
        name,
        description
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error in handleSaveChanges:', error);
      alert('An error occurred while saving changes');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-base-content/70">Workout not found</p>
        <button
          onClick={() => setShowDiagnostics(true)}
          className="btn btn-sm bg-base-300 hover:bg-base-200 mt-4"
        >
          <FaTools className="mr-2" /> Run Diagnostics
        </button>
        {showDiagnostics && <DatabaseChecker />}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <button 
          className="btn btn-sm bg-base-300 hover:bg-base-200"
          onClick={() => router.back()}
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
        
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="btn btn-sm bg-base-300 hover:bg-base-200"
        >
          <FaTools className="mr-2" /> {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
        </button>
      </div>
      
      {fetchError && (
        <div className="alert alert-warning mb-4">
          <p className="font-medium">There was a problem loading some data:</p>
          <p>{fetchError}</p>
        </div>
      )}
      
      {showDiagnostics && <DatabaseChecker />}
      
      <div className="tabs tabs-boxed bg-base-300 mb-6">
        <a 
          className={`tab ${activeTab === 'details' ? 'tab-active bg-primary text-primary-content' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Workout Details
        </a>
        <a 
          className={`tab ${activeTab === 'logs' ? 'tab-active bg-primary text-primary-content' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Workout Logs
        </a>
      </div>
      
      {activeTab === 'details' ? (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="space-y-4">
                  <h3 className="font-semibold mb-2">Workout Image</h3>
                  <div className="tabs tabs-boxed bg-base-300 mb-4">
                    <button 
                      className={`tab ${activeImageTab === 'auto' ? 'tab-active bg-primary text-primary-content' : ''}`}
                      onClick={() => setActiveImageTab('auto')}
                    >
                      <FaImage className="mr-2" /> Auto-fetch
                    </button>
                    <button 
                      className={`tab ${activeImageTab === 'search' ? 'tab-active bg-primary text-primary-content' : ''}`}
                      onClick={() => setActiveImageTab('search')}
                    >
                      <FaSearch className="mr-2" /> Search
                    </button>
                  </div>
                  
                  {renderImageSection()}
                  
                  {showImageSearch && (
                    <div className="modal modal-open">
                      <div className="modal-box bg-base-200 max-w-xl">
                        <h3 className="font-bold text-lg mb-4">
                          Search Image for {workout.name}
                        </h3>
                        
                        <ImageSearch
                          entityType="workout"
                          entityId={workoutId}
                          searchTerm={`${workout.name} workout routine`}
                          onImageSelect={(imageUrl) => {
                            handleImageUpdate(imageUrl);
                            setShowImageSearch(false);
                          }}
                        />
                        
                        <div className="modal-action">
                          <button
                            className="btn btn-outline"
                            onClick={() => setShowImageSearch(false)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                      <div className="modal-backdrop" onClick={() => setShowImageSearch(false)}></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:w-2/3">
                {editMode ? (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Workout Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered bg-base-300"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Description</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered bg-base-300 h-24"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        className="btn bg-base-300 hover:bg-base-200"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn bg-primary hover:bg-primary-focus text-primary-content"
                        onClick={handleSave}
                      >
                        <FaSave className="mr-2" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <h1 className="text-2xl font-bold mb-2">{workout.name}</h1>
                      <button
                        className="btn btn-sm bg-base-300 hover:bg-base-200"
                        onClick={() => setEditMode(true)}
                      >
                        <FaEdit className="mr-2" /> Edit
                      </button>
                    </div>
                    
                    <p className="text-base-content/70 mb-6">{workout.description || 'No description available'}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Exercises</h3>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowExerciseSelector(true)}
                        >
                          <FaPlus className="mr-1" /> Add Exercise
                        </button>
                        {exercises.length > 0 && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => setShowAutoImageFetch(true)}
                          >
                            <FaImage className="mr-1" /> Fetch Missing Images
                          </button>
                        )}
                      </div>
                    </div>

                    {exercises.length === 0 ? (
                      <div className="card bg-base-200 shadow-lg mb-6 p-8 text-center">
                        <p className="text-base-content/70 mb-4">No exercises added to this workout yet.</p>
                        <p className="mb-4">
                          Click the "Add Exercise" button above to start building your workout, or run diagnostics if you believe there's an issue.
                        </p>
                        <div className="flex justify-center">
                          <button 
                            className="btn btn-primary"
                            onClick={() => setShowExerciseSelector(true)}
                          >
                            <FaPlus className="mr-2" /> Add Your First Exercise
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {exercises.map((exercise, index) => (
                          <div key={exercise.id} className="card bg-base-200 shadow-lg">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span className="text-lg font-semibold mr-2">
                                    {index + 1}.
                                  </span>
                                  <h3 className="text-lg font-semibold">
                                    {exercise.exercise?.name || 'Unknown Exercise'}
                                  </h3>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className="btn btn-sm bg-base-300"
                                    onClick={() => handleMoveExercise(index, 'up')}
                                    disabled={index === 0}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    className="btn btn-sm bg-base-300"
                                    onClick={() => handleMoveExercise(index, 'down')}
                                    disabled={index === exercises.length - 1}
                                  >
                                    ↓
                                  </button>
                                  <button
                                    className="btn btn-sm btn-error"
                                    onClick={() => removeExerciseFromWorkout(exercise.id)}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-2">
                                <div className="flex items-center">
                                  <span className="mr-2">Sets:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={exercise.sets || 3}
                                    onChange={(e) => updateExerciseSetsReps(
                                      exercise.id,
                                      parseInt(e.target.value) || 1,
                                      exercise.reps
                                    )}
                                    className="input input-bordered input-sm w-16"
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="mr-2">Reps:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={exercise.reps || 10}
                                    onChange={(e) => updateExerciseSetsReps(
                                      exercise.id,
                                      exercise.sets,
                                      parseInt(e.target.value) || 1
                                    )}
                                    className="input input-bordered input-sm w-16"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <WorkoutTabs workoutId={workoutId} workoutPlan={workout} exercises={exercises} />
      )}

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-base-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add Exercise</h3>
                <button 
                  className="btn btn-sm btn-circle" 
                  onClick={() => setShowExerciseSelector(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <ExerciseSelector 
                onSelectExercise={(exerciseId) => {
                  addExerciseToWorkout(exerciseId);
                  setShowExerciseSelector(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Auto Image Fetch Modal */}
      {showAutoImageFetch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-base-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Fetch Missing Images</h3>
                <button 
                  className="btn btn-sm btn-circle" 
                  onClick={() => setShowAutoImageFetch(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <AutoImageFetch 
                exercises={exercises.map(e => e.exercise_id)} 
                onComplete={() => setShowAutoImageFetch(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { FaClipboardList, FaEdit, FaSave, FaTrash, FaArrowLeft, FaPlus, FaImage, FaSearch } from 'react-icons/fa';
import ImageSearch from '../../components/ImageSearch';
import ExerciseSelector from '../../components/ExerciseSelector';
import WorkoutTabs from '../../components/WorkoutTabs';
import AutoImageFetch from '../../components/AutoImageFetch';

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

  useEffect(() => {
    async function fetchWorkoutAndExercises() {
      setLoading(true);
      
      // Fetch workout data
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', workoutId)
        .single();
      
      if (workoutError) {
        console.error('Error fetching workout:', workoutError);
      } else if (workoutData) {
        setWorkout(workoutData);
        // Initialize form state
        setName(workoutData.name);
        setDescription(workoutData.description || '');
      }
      
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
      } else if (exercisesData) {
        // Transform the data to match the WorkoutExercise type
        const transformedExercises = exercisesData.map((item) => ({
          id: item.id,
          workout_id: item.workout_plan_id,
          exercise_id: item.exercise_id,
          order: item.position,
          sets: item.sets || 3,
          reps: item.reps || 10,
          exercise: item.exercises
        }));
        setExercises(transformedExercises);
      }
      
      setLoading(false);
    }
    
    fetchWorkoutAndExercises();
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        className="btn btn-sm bg-base-300 hover:bg-base-200 mb-4"
        onClick={() => router.back()}
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>
      
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
                    
                    <div className="card bg-base-300 p-4 rounded-lg mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Exercises</h3>
                        <ExerciseSelector onSelectExercise={addExerciseToWorkout} />
                      </div>
                      
                      {exercises.length === 0 ? (
                        <div className="text-center py-6 text-base-content/70">
                          <p>No exercises added to this workout yet.</p>
                          <p>Click the "Add Exercise" button to get started.</p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {exercises.map((ex, index) => (
                            <li key={ex.id} className="bg-base-200 p-3 rounded-lg">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div className="flex items-center">
                                  <span className="bg-primary text-primary-content w-6 h-6 rounded-full flex items-center justify-center mr-3">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium">{ex.exercise?.name}</span>
                                </div>
                                
                                <div className="flex items-center mt-2 sm:mt-0">
                                  <div className="flex items-center mr-4">
                                    <span className="text-base-content/70 text-sm mr-2">Sets:</span>
                                    <input
                                      type="number"
                                      className="input input-sm input-bordered bg-base-300 w-16"
                                      value={ex.sets}
                                      onChange={(e) => updateExerciseSetsReps(ex.id, parseInt(e.target.value), ex.reps)}
                                      min="1"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center mr-4">
                                    <span className="text-base-content/70 text-sm mr-2">Reps:</span>
                                    <input
                                      type="number"
                                      className="input input-sm input-bordered bg-base-300 w-16"
                                      value={ex.reps}
                                      onChange={(e) => updateExerciseSetsReps(ex.id, ex.sets, parseInt(e.target.value))}
                                      min="1"
                                    />
                                  </div>
                                  
                                  <button
                                    className="btn btn-sm btn-circle bg-error hover:bg-error/80 border-none text-error-content"
                                    onClick={() => removeExerciseFromWorkout(ex.id)}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <WorkoutTabs workoutId={workoutId} workoutPlan={workout} exercises={exercises} />
      )}
    </div>
  );
} 
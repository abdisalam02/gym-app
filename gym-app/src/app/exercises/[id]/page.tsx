"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';
import { FaDumbbell, FaEdit, FaSave, FaArrowLeft, FaImage, FaSearch } from 'react-icons/fa';
import ImageSearch from '../../components/ImageSearch';
import ExerciseMedia from '../../components/ExerciseMedia';
import AutoImageFetch from '../../components/AutoImageFetch';
import { muscleGroups, equipmentTypes, getStandardMuscleGroup, getStandardEquipment } from '../../lib/muscleGroups';

type Exercise = {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  equipment: string;
  default_sets: number;
  default_reps: number;
  image_url: string | null;
};

export default function ExerciseDetails() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [activeImageTab, setActiveImageTab] = useState<'auto' | 'search'>('auto');
  const [showImageSearch, setShowImageSearch] = useState(false);

  useEffect(() => {
    async function fetchExercise() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
      
      if (error) {
        console.error('Error fetching exercise:', error);
      } else if (data) {
        setExercise(data);
        // Initialize form state
        setName(data.name);
        setDescription(data.description || '');
        setMuscleGroup(data.muscle_group || '');
        setEquipment(data.equipment || '');
        setDefaultSets(data.default_sets);
        setDefaultReps(data.default_reps);
      }
      
      setLoading(false);
    }
    
    fetchExercise();
  }, [exerciseId]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Exercise name is required');
      return;
    }
    
    try {
      // Standardize the values
      const standardMuscleGroup = getStandardMuscleGroup(muscleGroup);
      const standardEquipment = getStandardEquipment(equipment);
      
      const { error } = await supabase
        .from('exercises')
        .update({
          name,
          description,
          muscle_group: standardMuscleGroup,
          equipment: standardEquipment,
          default_sets: defaultSets,
          default_reps: defaultReps,
        })
        .eq('id', exerciseId);
      
      if (error) throw error;
      
      // Update local state
      setExercise({
        ...exercise!,
        name,
        description,
        muscle_group: standardMuscleGroup,
        equipment: standardEquipment,
        default_sets: defaultSets,
        default_reps: defaultReps,
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating exercise:', error);
      alert('Failed to update exercise');
    }
  };

  const handleImageUpdate = async (imageUrl: string | null) => {
    if (!exercise) return;
    
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ image_url: imageUrl })
        .eq('id', exerciseId);
      
      if (error) throw error;
      
      // Update local state with new image URL
      setExercise({
        ...exercise,
        image_url: imageUrl,
      });
      
      // Close any modals
      setShowImageSearch(false);
    } catch (error) {
      console.error('Error updating exercise image:', error);
      alert('Failed to update exercise image');
    }
  };

  const renderImageSection = () => {
    if (activeImageTab === 'auto') {
      return (
        <AutoImageFetch 
          entityType="exercise"
          entityId={exerciseId}
          entityName={exercise?.name || ''}
          muscleGroup={exercise?.muscle_group || ''}
          equipment={exercise?.equipment || ''}
          existingImageUrl={exercise?.image_url || null}
          onImageFetched={handleImageUpdate}
          autoFetch={false}
        />
      );
    } else {
      return (
        <div>
          {exercise?.image_url ? (
            <div className="relative rounded-lg overflow-hidden h-48">
              <div className="relative w-full h-full">
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
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
              <p className="text-base-content/70 text-center mb-2">No image for this exercise</p>
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

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-base-content/70">Exercise not found</p>
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
      
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="space-y-4">
                <h3 className="font-semibold mb-2">Exercise Image</h3>
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
                        Search Image for {exercise.name}
                      </h3>
                      
                      <ImageSearch
                        entityType="exercise"
                        entityId={exerciseId}
                        searchTerm={`${exercise.name} ${exercise.muscle_group || ''} exercise`}
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
                
                <div className="mt-6">
                  <ExerciseMedia 
                    exerciseId={exerciseId} 
                    exerciseName={exercise.name} 
                  />
                </div>
              </div>
            </div>
            
            <div className="md:w-2/3">
              {editMode ? (
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Exercise Name</span>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Muscle Group</span>
                      </label>
                      <select
                        className="select select-bordered bg-base-300"
                        value={Object.keys(muscleGroups).includes(muscleGroup) ? muscleGroup : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            // Keep the current value as custom value
                          } else {
                            setMuscleGroup(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select Muscle Group</option>
                        {Object.keys(muscleGroups).map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                      
                      {!Object.keys(muscleGroups).includes(muscleGroup) && muscleGroup && (
                        <div className="mt-2">
                          <input
                            type="text"
                            className="input input-bordered bg-base-300 w-full"
                            value={muscleGroup}
                            onChange={(e) => setMuscleGroup(e.target.value)}
                            placeholder="Enter custom muscle group"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Equipment</span>
                      </label>
                      <select
                        className="select select-bordered bg-base-300"
                        value={Object.keys(equipmentTypes).includes(equipment) ? equipment : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            // Keep the current value as custom value
                          } else {
                            setEquipment(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select Equipment</option>
                        {Object.keys(equipmentTypes).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                      
                      {!Object.keys(equipmentTypes).includes(equipment) && equipment && (
                        <div className="mt-2">
                          <input
                            type="text"
                            className="input input-bordered bg-base-300 w-full"
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            placeholder="Enter custom equipment"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Default Sets</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered bg-base-300"
                        value={defaultSets}
                        onChange={(e) => setDefaultSets(parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Default Reps</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered bg-base-300"
                        value={defaultReps}
                        onChange={(e) => setDefaultReps(parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
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
                    <h1 className="text-2xl font-bold mb-2">{exercise.name}</h1>
                    <button
                      className="btn btn-sm bg-base-300 hover:bg-base-200"
                      onClick={() => setEditMode(true)}
                    >
                      <FaEdit className="mr-2" /> Edit
                    </button>
                  </div>
                  
                  <p className="text-base-content/70 mb-6">{exercise.description || 'No description available'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card bg-base-300 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Muscle Group</h3>
                      <p className="text-base-content/70">{exercise.muscle_group || 'Not specified'}</p>
                    </div>
                    
                    <div className="card bg-base-300 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Equipment</h3>
                      <p className="text-base-content/70">{exercise.equipment || 'Not specified'}</p>
                    </div>
                    
                    <div className="card bg-base-300 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Default Sets</h3>
                      <p className="text-base-content/70">{exercise.default_sets}</p>
                    </div>
                    
                    <div className="card bg-base-300 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Default Reps</h3>
                      <p className="text-base-content/70">{exercise.default_reps}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { FaDumbbell, FaSave, FaArrowLeft } from 'react-icons/fa';
import AutoImageFetch from '../../components/AutoImageFetch';
import { muscleGroups, equipmentTypes, getStandardMuscleGroup, getStandardEquipment } from '../../lib/muscleGroups';

export default function CreateExercise() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Exercise name is required');
      return;
    }
    
    setLoading(true);
    
    // Determine the final muscle group and equipment values
    const finalMuscleGroup = muscleGroup === 'custom' ? customMuscleGroup : muscleGroup;
    const finalEquipment = equipment === 'custom' ? customEquipment : equipment;
    
    // Standardize the values if needed
    const standardMuscleGroup = getStandardMuscleGroup(finalMuscleGroup);
    const standardEquipment = getStandardEquipment(finalEquipment);
    
    try {
      // Insert the exercise
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name,
          description,
          muscle_group: standardMuscleGroup,
          equipment: standardEquipment,
          default_sets: defaultSets,
          default_reps: defaultReps,
          image_url: imageUrl,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Save the exercise ID for auto image fetching
      setExerciseId(data.id);
      
      // Redirect to the exercises list
      router.push('/exercises');
    } catch (error) {
      console.error('Error creating exercise:', error);
      alert('Failed to create exercise');
      setLoading(false);
    }
  };

  const handleImageUpdate = (url: string | null) => {
    setImageUrl(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        className="btn btn-sm bg-slate-700 hover:bg-slate-600 mb-4"
        onClick={() => router.back()}
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>
      
      <div className="card bg-slate-800 shadow-xl">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title text-white mb-6 flex items-center">
            <FaDumbbell className="mr-2 text-teal-500" /> Create New Exercise
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold mb-2">Exercise Image</h3>
                  
                  {!exerciseId ? (
                    <div className="bg-slate-700 p-4 rounded-lg text-slate-300 text-center">
                      <p>You can add an image after creating the exercise</p>
                    </div>
                  ) : (
                    <AutoImageFetch 
                      entityType="exercise"
                      entityId={exerciseId}
                      entityName={name}
                      muscleGroup={muscleGroup === 'custom' ? customMuscleGroup : muscleGroup}
                      equipment={equipment === 'custom' ? customEquipment : equipment}
                      existingImageUrl={imageUrl}
                      onImageFetched={handleImageUpdate}
                      autoFetch={true}
                    />
                  )}
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Exercise Name*</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered bg-slate-700 text-white"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g., Bench Press, Squat, Deadlift"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Description</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered bg-slate-700 text-white h-24"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the exercise, proper form, tips, etc."
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white">Muscle Group</span>
                      </label>
                      <select
                        className="select select-bordered bg-slate-700 text-white"
                        value={muscleGroup}
                        onChange={(e) => setMuscleGroup(e.target.value)}
                      >
                        <option value="">Select Muscle Group</option>
                        {Object.keys(muscleGroups).map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                      
                      {muscleGroup === 'custom' && (
                        <input
                          type="text"
                          className="input input-bordered bg-slate-700 text-white mt-2"
                          value={customMuscleGroup}
                          onChange={(e) => setCustomMuscleGroup(e.target.value)}
                          placeholder="Enter custom muscle group"
                        />
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white">Equipment</span>
                      </label>
                      <select
                        className="select select-bordered bg-slate-700 text-white"
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value)}
                      >
                        <option value="">Select Equipment</option>
                        {Object.keys(equipmentTypes).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                      
                      {equipment === 'custom' && (
                        <input
                          type="text"
                          className="input input-bordered bg-slate-700 text-white mt-2"
                          value={customEquipment}
                          onChange={(e) => setCustomEquipment(e.target.value)}
                          placeholder="Enter custom equipment"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white">Default Sets</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered bg-slate-700 text-white"
                        value={defaultSets}
                        onChange={(e) => setDefaultSets(parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white">Default Reps</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered bg-slate-700 text-white"
                        value={defaultReps}
                        onChange={(e) => setDefaultReps(parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="card-actions justify-end pt-4">
                    <button
                      type="submit"
                      className="btn bg-teal-600 hover:bg-teal-700 text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        <>
                          <FaSave className="mr-2" /> Save Exercise
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
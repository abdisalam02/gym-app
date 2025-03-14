"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { FaClipboardList, FaSave, FaArrowLeft } from 'react-icons/fa';
import AutoImageFetch from '../../components/AutoImageFetch';

export default function CreateWorkout() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Workout name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Insert the workout into workout_plans table
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          name,
          description,
          image_url: imageUrl,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Save the workout ID for auto image fetching
      setWorkoutId(data.id);
      
      // Redirect to the workout details page to continue adding exercises
      router.push(`/workouts/${data.id}`);
    } catch (error) {
      console.error('Error creating workout:', error);
      alert('Failed to create workout');
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
            <FaClipboardList className="mr-2 text-teal-500" /> Create New Workout
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold mb-2">Workout Image</h3>
                  
                  {!workoutId ? (
                    <div className="bg-slate-700 p-4 rounded-lg text-slate-300 text-center">
                      <p>You can add an image after creating the workout</p>
                    </div>
                  ) : (
                    <AutoImageFetch 
                      entityType="workout"
                      entityId={workoutId}
                      entityName={name}
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
                      <span className="label-text text-white">Workout Name*</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered bg-slate-700 text-white"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g., Push Day, Full Body, Upper/Lower Split"
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
                      placeholder="Describe the workout, goals, frequency, etc."
                    ></textarea>
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
                          <FaSave className="mr-2" /> Create Workout
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
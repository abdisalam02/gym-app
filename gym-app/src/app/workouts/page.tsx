"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { FaPlus, FaClipboardList, FaSearch, FaMagic } from 'react-icons/fa';
import AutoImageFetch from '../components/AutoImageFetch';

type Workout = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAutoFetchImage, setShowAutoFetchImage] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...workouts];
    
    // Search term filter
    if (searchTerm) {
      result = result.filter(workout => 
        workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workout.description && workout.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredWorkouts(result);
  }, [workouts, searchTerm]);

  const fetchWorkouts = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching workouts:', error);
    } else if (data) {
      setWorkouts(data);
      setFilteredWorkouts(data);
    }
    
    setLoading(false);
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    if (selectedWorkout && imageUrl) {
      // Update the workouts list with the new image URL
      setWorkouts(prev => prev.map(w => 
        w.id === selectedWorkout.id ? { ...w, image_url: imageUrl } : w
      ));
      
      // Reset the selected workout and close the modal
      setSelectedWorkout(null);
      setShowAutoFetchImage(false);
    }
  };

  const countMissingImages = () => {
    return workouts.filter(w => !w.image_url).length;
  };

  const openAutoFetchModal = (workout: Workout) => {
    setSelectedWorkout(workout);
    setShowAutoFetchImage(true);
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Workouts</h1>
        <div className="flex flex-wrap gap-2">
          {countMissingImages() > 0 && (
            <button 
              className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white relative"
              onClick={() => {
                const workoutsWithoutImages = workouts.filter(w => !w.image_url);
                if (workoutsWithoutImages.length > 0) {
                  openAutoFetchModal(workoutsWithoutImages[0]);
                }
              }}
            >
              <FaMagic className="mr-2" /> 
              Add Missing Images
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {countMissingImages()}
              </span>
            </button>
          )}
          <Link href="/workouts/create" className="btn btn-sm bg-primary hover:bg-primary-focus text-primary-content">
            <FaPlus className="mr-2" /> Create Workout
          </Link>
        </div>
      </div>
      
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title mb-4">
            <FaSearch className="mr-2" /> Search Workouts
          </h2>
          
          <div className="form-control">
            <input
              type="text"
              placeholder="Search by name or description"
              className="input input-bordered bg-base-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg p-6">
          <p className="text-base-content opacity-70 mb-4">No workouts found matching your search.</p>
          {searchTerm && (
            <button
              className="btn bg-base-300 hover:bg-base-content/10 mt-4"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          )}
          {!searchTerm && (
            <div className="flex flex-col items-center">
              <p className="mb-4">Get started by creating your first workout plan!</p>
              <Link 
                href="/workouts/create" 
                className="btn bg-primary hover:bg-primary-focus text-primary-content mt-2"
              >
                <FaPlus className="mr-2" /> Create Your First Workout
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorkouts.map(workout => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="card bg-base-200 hover:bg-base-300 shadow-xl transition-colors relative"
            >
              {!workout.image_url && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="badge badge-error gap-1 cursor-pointer" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAutoFetchModal(workout);
                  }}>
                    <FaMagic size={10} /> Add Image
                  </span>
                </div>
              )}
              <figure className="h-48 bg-base-300 relative overflow-hidden">
                {workout.image_url ? (
                  <img
                    src={workout.image_url}
                    alt={workout.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <FaClipboardList className="text-5xl opacity-30" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-300 to-transparent p-2">
                  <h2 className="card-title text-lg">{workout.name}</h2>
                </div>
              </figure>
              <div className="card-body p-4">
                <p className="text-base-content/70 text-sm line-clamp-2">
                  {workout.description || 'No description available'}
                </p>
                <p className="text-base-content/70 text-xs mt-2">
                  Created: {formatDate(workout.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Auto Fetch Image Modal */}
      {showAutoFetchImage && selectedWorkout && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-800 max-w-md">
            <h3 className="font-bold text-lg text-white mb-4">
              Auto-Fetch Image for {selectedWorkout.name}
            </h3>
            
            <AutoImageFetch 
              entityType="workout"
              entityId={selectedWorkout.id}
              entityName={selectedWorkout.name}
              existingImageUrl={selectedWorkout.image_url}
              onImageFetched={handleImageUpdate}
              autoFetch={true}
            />
            
            <div className="modal-action">
              <button
                className="btn bg-slate-700 hover:bg-slate-600"
                onClick={() => {
                  // Find the next workout without an image
                  const currentIndex = workouts.findIndex(w => w.id === selectedWorkout.id);
                  const remainingWorkouts = workouts.slice(currentIndex + 1).filter(w => !w.image_url);
                  
                  if (remainingWorkouts.length > 0) {
                    setSelectedWorkout(remainingWorkouts[0]);
                  } else {
                    setShowAutoFetchImage(false);
                    setSelectedWorkout(null);
                  }
                }}
              >
                Next Workout
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowAutoFetchImage(false);
                  setSelectedWorkout(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => {
            setShowAutoFetchImage(false);
            setSelectedWorkout(null);
          }}></div>
        </div>
      )}
    </div>
  );
} 
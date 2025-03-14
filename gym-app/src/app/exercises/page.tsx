"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { FaPlus, FaDumbbell, FaSearch, FaMagic } from 'react-icons/fa';
import AutoImageFetch from '../components/AutoImageFetch';

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  equipment: string | null;
  image_url: string | null;
};

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [uniqueMuscleGroups, setUniqueMuscleGroups] = useState<string[]>([]);
  const [uniqueEquipment, setUniqueEquipment] = useState<string[]>([]);
  const [showAutoFetchImage, setShowAutoFetchImage] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...exercises];
    
    // Search term filter
    if (searchTerm) {
      result = result.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Muscle group filter
    if (muscleGroupFilter) {
      result = result.filter(exercise => 
        exercise.muscle_group === muscleGroupFilter
      );
    }
    
    // Equipment filter
    if (equipmentFilter) {
      result = result.filter(exercise => 
        exercise.equipment === equipmentFilter
      );
    }
    
    setFilteredExercises(result);
  }, [exercises, searchTerm, muscleGroupFilter, equipmentFilter]);

  const fetchExercises = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching exercises:', error);
    } else if (data) {
      setExercises(data);
      setFilteredExercises(data);
      
      // Extract unique muscle groups and equipment
      const muscleGroups = Array.from(
        new Set(data.map(ex => ex.muscle_group).filter(Boolean))
      ) as string[];
      
      const equipment = Array.from(
        new Set(data.map(ex => ex.equipment).filter(Boolean))
      ) as string[];
      
      setUniqueMuscleGroups(muscleGroups);
      setUniqueEquipment(equipment);
    }
    
    setLoading(false);
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    if (selectedExercise && imageUrl) {
      // Update the exercises list with the new image URL
      setExercises(prev => prev.map(ex => 
        ex.id === selectedExercise.id ? { ...ex, image_url: imageUrl } : ex
      ));
      
      // Reset the selected exercise and close the modal
      setSelectedExercise(null);
      setShowAutoFetchImage(false);
    }
  };

  const countMissingImages = () => {
    return exercises.filter(ex => !ex.image_url).length;
  };

  const openAutoFetchModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowAutoFetchImage(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Exercise Library</h1>
        <div className="flex gap-2">
          {countMissingImages() > 0 && (
            <button 
              className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white relative"
              onClick={() => {
                const exercisesWithoutImages = exercises.filter(ex => !ex.image_url);
                if (exercisesWithoutImages.length > 0) {
                  openAutoFetchModal(exercisesWithoutImages[0]);
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
          <Link href="/exercises/create" className="btn btn-sm bg-primary hover:bg-primary-focus text-primary-content">
            <FaPlus className="mr-2" /> Add Exercise
          </Link>
        </div>
      </div>
      
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title mb-4">
            <FaSearch className="mr-2" /> Filter Exercises
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or description"
                className="input input-bordered bg-base-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Muscle Group</span>
              </label>
              <select
                className="select select-bordered bg-base-300"
                value={muscleGroupFilter}
                onChange={(e) => setMuscleGroupFilter(e.target.value)}
              >
                <option value="">All Muscle Groups</option>
                {uniqueMuscleGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Equipment</span>
              </label>
              <select
                className="select select-bordered bg-base-300"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
              >
                <option value="">All Equipment</option>
                {uniqueEquipment.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content opacity-70">No exercises found matching your filters.</p>
          <button
            className="btn bg-base-300 hover:bg-base-content/10 mt-4"
            onClick={() => {
              setSearchTerm('');
              setMuscleGroupFilter('');
              setEquipmentFilter('');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map(exercise => (
            <Link
              key={exercise.id}
              href={`/exercises/${exercise.id}`}
              className="card bg-base-200 hover:bg-base-300 shadow-xl transition-colors relative"
            >
              {!exercise.image_url && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="badge badge-error gap-1 cursor-pointer" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAutoFetchModal(exercise);
                  }}>
                    <FaMagic size={10} /> Add Image
                  </span>
                </div>
              )}
              <figure className="h-48 bg-base-300 relative overflow-hidden">
                {exercise.image_url ? (
                  <img
                    src={exercise.image_url}
                    alt={exercise.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <FaDumbbell className="text-5xl opacity-30" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-300 to-transparent p-2">
                  <h2 className="card-title text-lg">{exercise.name}</h2>
                </div>
              </figure>
              <div className="card-body p-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {exercise.muscle_group && (
                    <span className="badge badge-accent">{exercise.muscle_group}</span>
                  )}
                  {exercise.equipment && (
                    <span className="badge badge-secondary">{exercise.equipment}</span>
                  )}
                </div>
                <p className="text-base-content/70 text-sm line-clamp-2">
                  {exercise.description || 'No description available'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Auto Fetch Image Modal */}
      {showAutoFetchImage && selectedExercise && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-800 max-w-md">
            <h3 className="font-bold text-lg text-white mb-4">
              Auto-Fetch Image for {selectedExercise.name}
            </h3>
            
            <AutoImageFetch 
              entityType="exercise"
              entityId={selectedExercise.id}
              entityName={selectedExercise.name}
              muscleGroup={selectedExercise.muscle_group}
              equipment={selectedExercise.equipment}
              existingImageUrl={selectedExercise.image_url}
              onImageFetched={handleImageUpdate}
              autoFetch={true}
            />
            
            <div className="modal-action">
              <button
                className="btn bg-slate-700 hover:bg-slate-600"
                onClick={() => {
                  // Find the next exercise without an image
                  const currentIndex = exercises.findIndex(ex => ex.id === selectedExercise.id);
                  const remainingExercises = exercises.slice(currentIndex + 1).filter(ex => !ex.image_url);
                  
                  if (remainingExercises.length > 0) {
                    setSelectedExercise(remainingExercises[0]);
                  } else {
                    setShowAutoFetchImage(false);
                    setSelectedExercise(null);
                  }
                }}
              >
                Next Exercise
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowAutoFetchImage(false);
                  setSelectedExercise(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => {
            setShowAutoFetchImage(false);
            setSelectedExercise(null);
          }}></div>
        </div>
      )}
    </div>
  );
} 
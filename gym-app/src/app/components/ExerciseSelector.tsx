"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaSearch } from 'react-icons/fa';

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  equipment: string | null;
};

type ExerciseSelectorProps = {
  onSelectExercise: (exerciseId: string) => void;
  initialOpen?: boolean;
};

export default function ExerciseSelector({ onSelectExercise, initialOpen = true }: ExerciseSelectorProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [uniqueMuscleGroups, setUniqueMuscleGroups] = useState<string[]>([]);
  const [uniqueEquipment, setUniqueEquipment] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

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

  const handleSelectExercise = (exerciseId: string) => {
    onSelectExercise(exerciseId);
    setIsOpen(false);
    // Reset filters
    setSearchTerm('');
    setMuscleGroupFilter('');
    setEquipmentFilter('');
  };

  return (
    <div>
      {!initialOpen && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsOpen(true)}
        >
          <FaPlus className="mr-1" /> Add Exercise
        </button>
      )}

      {isOpen && (
        <div className={initialOpen ? "" : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"}>
          <div className={initialOpen ? "" : "bg-base-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"}>
            {!initialOpen && (
              <div className="p-4 border-b border-base-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Add Exercise</h3>
                  <button 
                    className="btn btn-sm btn-circle" 
                    onClick={() => setIsOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-4">
              {/* Search and filter controls */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select
                    className="select select-bordered w-full"
                    value={muscleGroupFilter}
                    onChange={(e) => setMuscleGroupFilter(e.target.value)}
                  >
                    <option value="">All Muscle Groups</option>
                    {uniqueMuscleGroups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                  
                  <select
                    className="select select-bordered w-full"
                    value={equipmentFilter}
                    onChange={(e) => setEquipmentFilter(e.target.value)}
                  >
                    <option value="">All Equipment</option>
                    {uniqueEquipment.map((equip) => (
                      <option key={equip} value={equip}>{equip}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Exercise list */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredExercises.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">
                      {exercises.length === 0 ? 
                        'No exercises found. Try adding some first.' : 
                        'No exercises match your filters.'}
                    </div>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <div 
                        key={exercise.id} 
                        className="card bg-base-200 hover:bg-base-300 cursor-pointer"
                        onClick={() => handleSelectExercise(exercise.id)}
                      >
                        <div className="card-body p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{exercise.name}</h3>
                              <div className="text-sm text-base-content/70 mt-1">
                                {exercise.muscle_group && <span className="mr-2">{exercise.muscle_group}</span>}
                                {exercise.equipment && <span>• {exercise.equipment}</span>}
                              </div>
                            </div>
                            <button className="btn btn-sm btn-circle btn-primary">
                              <FaPlus />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
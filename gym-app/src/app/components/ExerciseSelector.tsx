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
};

export default function ExerciseSelector({ onSelectExercise }: ExerciseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      <button
        className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white"
        onClick={() => setIsOpen(true)}
      >
        <FaPlus className="mr-2" /> Add Exercise
      </button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-800 w-11/12 max-w-4xl">
            <h3 className="font-bold text-lg text-white mb-4">Select Exercise</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Search</span>
                </label>
                <input
                  type="text"
                  placeholder="Search exercises..."
                  className="input input-bordered bg-slate-700 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Muscle Group</span>
                </label>
                <select
                  className="select select-bordered bg-slate-700 text-white"
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
                  <span className="label-text text-white">Equipment</span>
                </label>
                <select
                  className="select select-bordered bg-slate-700 text-white"
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
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No exercises found matching your filters.</p>
                <button
                  className="btn bg-slate-700 hover:bg-slate-600 mt-4"
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
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="bg-slate-700">Name</th>
                      <th className="bg-slate-700">Muscle Group</th>
                      <th className="bg-slate-700">Equipment</th>
                      <th className="bg-slate-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExercises.map(exercise => (
                      <tr key={exercise.id} className="hover:bg-slate-700">
                        <td className="text-white">{exercise.name}</td>
                        <td className="text-slate-400">{exercise.muscle_group || 'N/A'}</td>
                        <td className="text-slate-400">{exercise.equipment || 'N/A'}</td>
                        <td>
                          <button
                            className="btn btn-sm bg-teal-600 hover:bg-teal-700"
                            onClick={() => handleSelectExercise(exercise.id)}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setIsOpen(false);
                  setSearchTerm('');
                  setMuscleGroupFilter('');
                  setEquipmentFilter('');
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsOpen(false)}></div>
        </div>
      )}
    </>
  );
} 
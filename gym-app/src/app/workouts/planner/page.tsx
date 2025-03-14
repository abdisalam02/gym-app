"use client";
import { useState } from 'react';
import { FaDumbbell, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSave } from 'react-icons/fa';

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes: string;
};

type WorkoutDay = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export default function WorkoutPlanner() {
  const [activeTab, setActiveTab] = useState(0);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    {
      id: '1',
      name: 'Push Day',
      exercises: [
        { id: '1', name: 'Bench Press', sets: 4, reps: 8, rest: 90, notes: 'Focus on chest contraction' },
        { id: '2', name: 'Shoulder Press', sets: 3, reps: 10, rest: 60, notes: '' },
        { id: '3', name: 'Tricep Extensions', sets: 3, reps: 12, rest: 45, notes: 'Superset with dips' },
      ]
    },
    {
      id: '2',
      name: 'Pull Day',
      exercises: [
        { id: '4', name: 'Deadlifts', sets: 4, reps: 6, rest: 120, notes: 'Focus on form' },
        { id: '5', name: 'Pull-ups', sets: 3, reps: 8, rest: 90, notes: 'Use assistance if needed' },
        { id: '6', name: 'Barbell Rows', sets: 3, reps: 10, rest: 60, notes: '' },
      ]
    },
    {
      id: '3',
      name: 'Leg Day',
      exercises: [
        { id: '7', name: 'Squats', sets: 4, reps: 8, rest: 120, notes: 'Go below parallel' },
        { id: '8', name: 'Leg Press', sets: 3, reps: 12, rest: 90, notes: '' },
        { id: '9', name: 'Calf Raises', sets: 4, reps: 15, rest: 45, notes: 'Slow eccentric' },
      ]
    }
  ]);

  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseRest, setNewExerciseRest] = useState(60);
  const [newExerciseNotes, setNewExerciseNotes] = useState('');
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);

  const addWorkoutDay = () => {
    if (newWorkoutName.trim() === '') return;
    
    const newWorkoutDay: WorkoutDay = {
      id: Date.now().toString(),
      name: newWorkoutName,
      exercises: []
    };
    
    setWorkoutDays([...workoutDays, newWorkoutDay]);
    setNewWorkoutName('');
    setActiveTab(workoutDays.length);
  };

  const removeWorkoutDay = (index: number) => {
    const updatedWorkoutDays = [...workoutDays];
    updatedWorkoutDays.splice(index, 1);
    setWorkoutDays(updatedWorkoutDays);
    
    if (activeTab >= updatedWorkoutDays.length) {
      setActiveTab(Math.max(0, updatedWorkoutDays.length - 1));
    }
  };

  const addExercise = () => {
    if (newExerciseName.trim() === '') return;
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      sets: newExerciseSets,
      reps: newExerciseReps,
      rest: newExerciseRest,
      notes: newExerciseNotes
    };
    
    const updatedWorkoutDays = [...workoutDays];
    updatedWorkoutDays[activeTab].exercises.push(newExercise);
    setWorkoutDays(updatedWorkoutDays);
    
    // Reset form
    setNewExerciseName('');
    setNewExerciseNotes('');
    setShowAddExerciseForm(false);
  };

  const removeExercise = (exerciseIndex: number) => {
    const updatedWorkoutDays = [...workoutDays];
    updatedWorkoutDays[activeTab].exercises.splice(exerciseIndex, 1);
    setWorkoutDays(updatedWorkoutDays);
  };

  const moveExercise = (exerciseIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && exerciseIndex === 0) || 
      (direction === 'down' && exerciseIndex === workoutDays[activeTab].exercises.length - 1)
    ) {
      return;
    }
    
    const updatedWorkoutDays = [...workoutDays];
    const exercises = [...updatedWorkoutDays[activeTab].exercises];
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    
    [exercises[exerciseIndex], exercises[newIndex]] = [exercises[newIndex], exercises[exerciseIndex]];
    
    updatedWorkoutDays[activeTab].exercises = exercises;
    setWorkoutDays(updatedWorkoutDays);
  };

  const saveWorkoutPlan = () => {
    // This would typically save to a database
    console.log('Saving workout plan:', workoutDays);
    alert('Workout plan saved!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Workout Planner</h1>
        <button 
          className="btn bg-teal-600 hover:bg-teal-700 text-white"
          onClick={saveWorkoutPlan}
        >
          <FaSave className="mr-2" /> Save Plan
        </button>
      </div>
      
      <div className="tabs tabs-boxed bg-slate-800 mb-6">
        {workoutDays.map((day, index) => (
          <button
            key={day.id}
            className={`tab ${activeTab === index ? 'bg-teal-600 text-white' : 'text-slate-300'}`}
            onClick={() => setActiveTab(index)}
          >
            {day.name}
          </button>
        ))}
        
        <div className="flex-grow"></div>
        
        <div className="join">
          <input
            type="text"
            placeholder="New workout day"
            className="input input-sm join-item bg-slate-700 text-white"
            value={newWorkoutName}
            onChange={(e) => setNewWorkoutName(e.target.value)}
          />
          <button 
            className="btn btn-sm join-item bg-slate-700 hover:bg-slate-600 text-white"
            onClick={addWorkoutDay}
          >
            <FaPlus />
          </button>
        </div>
      </div>
      
      {workoutDays.length > 0 ? (
        <div className="card bg-slate-800 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-white">
                <FaDumbbell className="mr-2" /> {workoutDays[activeTab].name}
              </h2>
              <button 
                className="btn btn-sm bg-slate-700 hover:bg-slate-600 text-white"
                onClick={() => removeWorkoutDay(activeTab)}
              >
                <FaTrash className="mr-2" /> Remove Day
              </button>
            </div>
            
            <div className="divider"></div>
            
            {workoutDays[activeTab].exercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No exercises added yet. Add your first exercise!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-slate-700">
                      <th className="text-slate-300">Exercise</th>
                      <th className="text-slate-300">Sets</th>
                      <th className="text-slate-300">Reps</th>
                      <th className="text-slate-300">Rest</th>
                      <th className="text-slate-300">Notes</th>
                      <th className="text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutDays[activeTab].exercises.map((exercise, index) => (
                      <tr key={exercise.id} className="hover:bg-slate-700">
                        <td>{exercise.name}</td>
                        <td>{exercise.sets}</td>
                        <td>{exercise.reps}</td>
                        <td>{exercise.rest}s</td>
                        <td>{exercise.notes || '-'}</td>
                        <td>
                          <div className="flex space-x-1">
                            <button 
                              className="btn btn-xs bg-slate-700 hover:bg-slate-600"
                              onClick={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                            >
                              <FaArrowUp />
                            </button>
                            <button 
                              className="btn btn-xs bg-slate-700 hover:bg-slate-600"
                              onClick={() => moveExercise(index, 'down')}
                              disabled={index === workoutDays[activeTab].exercises.length - 1}
                            >
                              <FaArrowDown />
                            </button>
                            <button 
                              className="btn btn-xs bg-red-600 hover:bg-red-700"
                              onClick={() => removeExercise(index)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4">
              {showAddExerciseForm ? (
                <div className="card bg-slate-700 shadow-lg p-4">
                  <h3 className="font-bold text-white mb-4">Add New Exercise</h3>
                  
                  <div className="form-control mb-2">
                    <label className="label">
                      <span className="label-text text-slate-300">Exercise Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bench Press"
                      className="input input-bordered bg-slate-600 text-white"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Sets</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input input-bordered bg-slate-600 text-white"
                        value={newExerciseSets}
                        onChange={(e) => setNewExerciseSets(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Reps</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input input-bordered bg-slate-600 text-white"
                        value={newExerciseReps}
                        onChange={(e) => setNewExerciseReps(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Rest (seconds)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        className="input input-bordered bg-slate-600 text-white"
                        value={newExerciseRest}
                        onChange={(e) => setNewExerciseRest(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text text-slate-300">Notes</span>
                    </label>
                    <textarea
                      placeholder="Optional notes about the exercise"
                      className="textarea textarea-bordered bg-slate-600 text-white"
                      value={newExerciseNotes}
                      onChange={(e) => setNewExerciseNotes(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button 
                      className="btn bg-slate-600 hover:bg-slate-500 text-white"
                      onClick={() => setShowAddExerciseForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={addExercise}
                    >
                      Add Exercise
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn bg-teal-600 hover:bg-teal-700 text-white w-full"
                  onClick={() => setShowAddExerciseForm(true)}
                >
                  <FaPlus className="mr-2" /> Add Exercise
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No workout days added yet. Add your first workout day!</p>
        </div>
      )}
    </div>
  );
} 
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import BodyStatsChart from '../components/BodyStatsChart';
import { FaPlus, FaTrash } from 'react-icons/fa';

type BodyStat = {
  id: string;
  stat_date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  created_at: string;
};

export default function Measurements() {
  const [bodyStats, setBodyStats] = useState<BodyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    stat_date: new Date().toISOString().split('T')[0],
    weight: '',
    body_fat: '',
    muscle_mass: ''
  });

  useEffect(() => {
    fetchBodyStats();
  }, []);

  async function fetchBodyStats() {
    setLoading(true);
    const { data, error } = await supabase
      .from('body_stats')
      .select('*')
      .order('stat_date', { ascending: false });

    if (error) {
      console.error('Error fetching body stats:', error);
    } else {
      setBodyStats(data || []);
    }
    setLoading(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMeasurement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const measurement = {
      stat_date: newMeasurement.stat_date,
      weight: newMeasurement.weight ? parseFloat(newMeasurement.weight) : null,
      body_fat: newMeasurement.body_fat ? parseFloat(newMeasurement.body_fat) : null,
      muscle_mass: newMeasurement.muscle_mass ? parseFloat(newMeasurement.muscle_mass) : null
    };
    
    const { error } = await supabase
      .from('body_stats')
      .insert(measurement);
    
    if (error) {
      console.error('Error adding measurement:', error);
      alert('Failed to add measurement');
    } else {
      setIsAddModalOpen(false);
      setNewMeasurement({
        stat_date: new Date().toISOString().split('T')[0],
        weight: '',
        body_fat: '',
        muscle_mass: ''
      });
      fetchBodyStats();
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (confirm('Are you sure you want to delete this measurement?')) {
      const { error } = await supabase
        .from('body_stats')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting measurement:', error);
        alert('Failed to delete measurement');
      } else {
        fetchBodyStats();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Body Measurements</h1>
        <button 
          className="btn btn-teal bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => setIsAddModalOpen(true)}
        >
          <FaPlus className="mr-2" /> Add Measurement
        </button>
      </div>
      
      <div className="card bg-slate-800 shadow-xl p-4">
        <BodyStatsChart />
      </div>
      
      <div className="card bg-slate-800 shadow-xl overflow-hidden">
        <div className="card-body p-4">
          <h2 className="card-title text-white mb-4">Measurement History</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : bodyStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No measurements recorded yet.</p>
              <button 
                className="btn btn-teal bg-teal-600 hover:bg-teal-700 text-white mt-4"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Your First Measurement
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-slate-700">Date</th>
                    <th className="bg-slate-700">Weight (kg)</th>
                    <th className="bg-slate-700">Body Fat (%)</th>
                    <th className="bg-slate-700">Muscle Mass (kg)</th>
                    <th className="bg-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyStats.map(stat => (
                    <tr key={stat.id} className="hover:bg-slate-700">
                      <td>{new Date(stat.stat_date).toLocaleDateString()}</td>
                      <td>{stat.weight !== null ? stat.weight : '-'}</td>
                      <td>{stat.body_fat !== null ? stat.body_fat : '-'}</td>
                      <td>{stat.muscle_mass !== null ? stat.muscle_mass : '-'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-ghost text-red-400"
                          onClick={() => handleDeleteMeasurement(stat.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Measurement Modal */}
      {isAddModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-800">
            <h3 className="font-bold text-lg text-white mb-4">Add New Measurement</h3>
            <form onSubmit={handleAddMeasurement}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-white">Date</span>
                </label>
                <input 
                  type="date" 
                  name="stat_date"
                  value={newMeasurement.stat_date}
                  onChange={handleInputChange}
                  className="input input-bordered bg-slate-700 text-white"
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-white">Weight (kg)</span>
                </label>
                <input 
                  type="number" 
                  name="weight"
                  value={newMeasurement.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="input input-bordered bg-slate-700 text-white"
                  placeholder="Enter weight in kg"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-white">Body Fat (%)</span>
                </label>
                <input 
                  type="number" 
                  name="body_fat"
                  value={newMeasurement.body_fat}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="100"
                  className="input input-bordered bg-slate-700 text-white"
                  placeholder="Enter body fat percentage"
                />
              </div>
              
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text text-white">Muscle Mass (kg)</span>
                </label>
                <input 
                  type="number" 
                  name="muscle_mass"
                  value={newMeasurement.muscle_mass}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="input input-bordered bg-slate-700 text-white"
                  placeholder="Enter muscle mass in kg"
                />
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white">
                  Save Measurement
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
} 
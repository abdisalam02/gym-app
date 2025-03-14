"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaTrophy, FaArrowUp, FaSearch } from 'react-icons/fa';

type PersonalRecord = {
  id: string;
  exercise_id: string;
  record_value: number;
  record_type: 'weight' | 'reps' | 'duration';
  achieved_date: string;
  notes: string | null;
  exercises: {
    name: string;
    description: string | null;
  };
};

export default function PersonalRecords() {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recordType, setRecordType] = useState<'weight' | 'reps' | 'duration' | 'all'>('all');

  useEffect(() => {
    async function fetchPersonalRecords() {
      setLoading(true);
      
      let query = supabase
        .from('personal_records')
        .select(`
          *,
          exercises (
            name,
            description
          )
        `)
        .order('achieved_date', { ascending: false });
      
      if (recordType !== 'all') {
        query = query.eq('record_type', recordType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching personal records:', error);
      } else {
        setPersonalRecords(data || []);
      }
      
      setLoading(false);
    }
    
    fetchPersonalRecords();
  }, [recordType]);

  // Filter records based on search term
  const filteredRecords = personalRecords.filter(record => 
    record.exercises.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group records by exercise
  const groupedRecords: { [key: string]: PersonalRecord[] } = {};
  
  filteredRecords.forEach(record => {
    const exerciseName = record.exercises.name;
    if (!groupedRecords[exerciseName]) {
      groupedRecords[exerciseName] = [];
    }
    groupedRecords[exerciseName].push(record);
  });

  // Format record value based on type
  const formatRecordValue = (record: PersonalRecord) => {
    switch (record.record_type) {
      case 'weight':
        return `${record.record_value} kg`;
      case 'reps':
        return `${record.record_value} reps`;
      case 'duration':
        return `${record.record_value} sec`;
      default:
        return record.record_value;
    }
  };

  return (
    <div className="card bg-slate-800 shadow-xl p-4">
      <div className="card-title flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Personal Records</h2>
        <div className="flex space-x-2">
          <select 
            className="select select-sm select-bordered bg-slate-700"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="weight">Weight</option>
            <option value="reps">Reps</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>
      
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search exercises..."
          className="input input-bordered w-full pl-10 bg-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {searchTerm 
              ? "No records found matching your search." 
              : "No personal records yet. Start logging your workouts to track your PRs!"}
          </p>
          {!searchTerm && (
            <button className="btn bg-teal-600 hover:bg-teal-700 text-white mt-4">Log a Workout</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([exerciseName, records]) => {
            // Sort records by value (highest first) for each type
            const weightRecord = records
              .filter(r => r.record_type === 'weight')
              .sort((a, b) => b.record_value - a.record_value)[0];
              
            const repsRecord = records
              .filter(r => r.record_type === 'reps')
              .sort((a, b) => b.record_value - a.record_value)[0];
              
            const durationRecord = records
              .filter(r => r.record_type === 'duration')
              .sort((a, b) => b.record_value - a.record_value)[0];
            
            return (
              <div key={exerciseName} className="card bg-slate-700 shadow-md">
                <div className="card-body p-4">
                  <h3 className="card-title text-lg text-white">
                    <FaTrophy className="text-amber-400 mr-2" />
                    {exerciseName}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {weightRecord && (
                      <div className="stat bg-slate-800 rounded-lg p-2">
                        <div className="stat-title text-xs text-slate-400">Max Weight</div>
                        <div className="stat-value text-lg text-white">{weightRecord.record_value} kg</div>
                        <div className="stat-desc text-xs text-slate-500">
                          {new Date(weightRecord.achieved_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {repsRecord && (
                      <div className="stat bg-slate-800 rounded-lg p-2">
                        <div className="stat-title text-xs text-slate-400">Max Reps</div>
                        <div className="stat-value text-lg text-white">{repsRecord.record_value}</div>
                        <div className="stat-desc text-xs text-slate-500">
                          {new Date(repsRecord.achieved_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {durationRecord && (
                      <div className="stat bg-slate-800 rounded-lg p-2">
                        <div className="stat-title text-xs text-slate-400">Max Duration</div>
                        <div className="stat-value text-lg text-white">{durationRecord.record_value} sec</div>
                        <div className="stat-desc text-xs text-slate-500">
                          {new Date(durationRecord.achieved_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
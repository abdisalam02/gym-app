"use client";
import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import WorkoutTabs from "../components/WorkoutTabs";
import BodyStatsChart from "../components/BodyStatsChart";
import WorkoutStreak from "../components/WorkoutStreak";
import PersonalRecords from "../components/PersonalRecords";
import { FaDumbbell, FaChartLine, FaCalendar, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'workout' | 'stats' | 'records'>('workout');
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      setLoading(true);
      
      // Fetch total workouts logged this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: thisMonthCount, error: thisMonthError } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .gte('workout_date', startOfMonth.toISOString());
      
      if (thisMonthError) {
        console.error('Error fetching workouts:', thisMonthError);
      } else {
        setTotalWorkouts(thisMonthCount || 0);
      }
      
      // Calculate progress vs. last month
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);
      
      const endOfLastMonth = new Date(startOfMonth);
      endOfLastMonth.setDate(0); // Last day of previous month
      endOfLastMonth.setHours(23, 59, 59, 999);
      
      const { count: lastMonthCount, error: lastMonthError } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .gte('workout_date', startOfLastMonth.toISOString())
        .lte('workout_date', endOfLastMonth.toISOString());
      
      if (!lastMonthError && lastMonthCount !== null) {
        // Calculate percentage increase
        if (lastMonthCount === 0) {
          setProgressPercentage(thisMonthCount !== null && thisMonthCount > 0 ? 100 : 0);
        } else if (thisMonthCount !== null) {
          const percentChange = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
          setProgressPercentage(Math.round(percentChange));
        }
      }
      
      // Fetch current streak
      const { data: workoutLogs, error: workoutLogsError } = await supabase
        .from('workout_logs')
        .select('workout_date')
        .order('workout_date', { ascending: false });
        
      if (!workoutLogsError && workoutLogs) {
        // Calculate current streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get unique dates
        const uniqueDates = [...new Set(workoutLogs.map(log => log.workout_date.split('T')[0]))];
        
        let streak = 0;
        let checkDate = new Date(today);
        
        // Check if worked out today
        const workedOutToday = uniqueDates.includes(checkDate.toISOString().split('T')[0]);
        
        // If not worked out today, start checking from yesterday
        if (!workedOutToday) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Count consecutive days with workouts
        while (uniqueDates.includes(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        setCurrentStreak(streak);
      }
      
      setLoading(false);
    }
    
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat bg-base-300 rounded-xl shadow-lg p-4">
          <div className="stat-figure text-primary">
            <FaDumbbell size={24} />
          </div>
          <div className="stat-title text-base-content/70">Total Workouts</div>
          {loading ? (
            <div className="stat-value text-base-content h-8 flex items-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : (
            <>
              <div className="stat-value text-base-content">{totalWorkouts}</div>
              <div className="stat-desc text-base-content/60">This month</div>
            </>
          )}
        </div>
        
        <div className="stat bg-base-300 rounded-xl shadow-lg p-4">
          <div className="stat-figure text-secondary">
            <FaChartLine size={24} />
          </div>
          <div className="stat-title text-base-content/70">Progress</div>
          {loading ? (
            <div className="stat-value text-base-content h-8 flex items-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : (
            <>
              <div className="stat-value text-base-content">
                {progressPercentage > 0 ? `+${progressPercentage}%` : `${progressPercentage}%`}
              </div>
              <div className="stat-desc text-base-content/60">vs last month</div>
            </>
          )}
        </div>
        
        <div className="stat bg-base-300 rounded-xl shadow-lg p-4">
          <div className="stat-figure text-accent">
            <FaCalendar size={24} />
          </div>
          <div className="stat-title text-base-content/70">Streak</div>
          {loading ? (
            <div className="stat-value text-base-content h-8 flex items-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : (
            <>
              <div className="stat-value text-base-content">{currentStreak} days</div>
              <div className="stat-desc text-base-content/60">Current streak</div>
            </>
          )}
        </div>
      </div>

      {/* Workout Streak and Body Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <div className="card bg-base-300 shadow-xl p-4">
            <WorkoutStreak />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="card bg-base-300 shadow-xl p-4">
            <BodyStatsChart />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed bg-base-300 p-1">
        <button 
          className={`tab tab-lg flex-1 ${activeTab === 'workout' ? 'bg-primary text-primary-content' : 'text-base-content/70'}`}
          onClick={() => setActiveTab('workout')}
        >
          Workout Plan
        </button>
        <button 
          className={`tab tab-lg flex-1 ${activeTab === 'stats' ? 'bg-primary text-primary-content' : 'text-base-content/70'}`}
          onClick={() => setActiveTab('stats')}
        >
          Body Stats
        </button>
        <button 
          className={`tab tab-lg flex-1 ${activeTab === 'records' ? 'bg-primary text-primary-content' : 'text-base-content/70'}`}
          onClick={() => setActiveTab('records')}
        >
          Personal Records
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-0">
        {activeTab === 'workout' && (
          <div>
            <WorkoutTabs />
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="card bg-base-300 shadow-xl p-4">
            <BodyStatsChart />
          </div>
        )}
        {activeTab === 'records' && <PersonalRecords />}
      </div>
    </div>
  );
} 
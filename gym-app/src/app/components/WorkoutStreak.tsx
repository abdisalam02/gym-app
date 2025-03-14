"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaFire, FaTrophy, FaMedal, FaBed } from 'react-icons/fa';

// Note: This type is used in the TypeScript interface but not directly in the component
// Keeping it for type safety and future reference
// type WorkoutLog = {
//   id: string;
//   workout_date: string;
//   is_rest_day?: boolean;
// };

export default function WorkoutStreak() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [restDates, setRestDates] = useState<string[]>([]);

  useEffect(() => {
    async function fetchWorkoutLogs() {
      setLoading(true);
      
      // Get all workout dates
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, workout_date, is_rest_day')
        .order('workout_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching workout logs:', error);
        setLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique dates and separate workout days from rest days
      const uniqueDates = [...new Set(data.map(log => log.workout_date.split('T')[0]))];
      const restDayDates = data
        .filter(log => log.is_rest_day)
        .map(log => log.workout_date.split('T')[0]);
      
      setStreakDates(uniqueDates);
      setRestDates(restDayDates);
      
      // Calculate current streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let streak = 0;
      const checkDate = new Date(today);
      
      // Check if worked out today
      const workedOutToday = uniqueDates.includes(checkDate.toISOString().split('T')[0]);
      
      // If not worked out today, start checking from yesterday
      if (!workedOutToday) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Count consecutive days with workouts or rest days
      while (uniqueDates.includes(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      setCurrentStreak(streak);
      
      // Calculate longest streak
      let maxStreak = 0;
      let currentMaxStreak = 0;
      let prevDate: Date | null = null;
      
      // Sort dates in ascending order for streak calculation
      const sortedDates = [...uniqueDates].sort();
      
      for (const dateStr of sortedDates) {
        const currentDate = new Date(dateStr);
        
        if (prevDate === null) {
          currentMaxStreak = 1;
        } else {
          const diffTime = currentDate.getTime() - prevDate.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          
          if (diffDays === 1) {
            // Consecutive day
            currentMaxStreak++;
          } else if (diffDays > 1) {
            // Streak broken
            currentMaxStreak = 1;
          }
        }
        
        maxStreak = Math.max(maxStreak, currentMaxStreak);
        prevDate = currentDate;
      }
      
      setLongestStreak(maxStreak);
      setLoading(false);
    }
    
    fetchWorkoutLogs();
  }, []);

  // Get streak message based on current streak
  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak < 3) return "Keep it going!";
    if (currentStreak < 7) return "You're on fire!";
    if (currentStreak < 14) return "Incredible dedication!";
    if (currentStreak < 30) return "Unstoppable!";
    return "Legendary status!";
  };

  // Get streak icon based on current streak
  const getStreakIcon = () => {
    if (currentStreak < 3) return <FaFire className="text-warning" size={24} />;
    if (currentStreak < 7) return <FaFire className="text-warning" size={28} />;
    if (currentStreak < 14) return <FaMedal className="text-warning" size={28} />;
    return <FaTrophy className="text-warning" size={32} />;
  };

  return (
    <div>
      <div className="card-title mb-4">
        <h2 className="text-xl font-bold text-base-content">Workout Streak</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-4">
            {getStreakIcon()}
            <span className="text-4xl font-bold ml-2 text-base-content">{currentStreak}</span>
            <span className="text-sm text-base-content/60 ml-2">days</span>
          </div>
          
          <p className="text-center text-base-content/80 mb-4">{getStreakMessage()}</p>
          
          <div className="stats shadow w-full bg-base-300">
            <div className="stat">
              <div className="stat-title text-base-content/70">Current Streak</div>
              <div className="stat-value text-xl text-base-content">{currentStreak} days</div>
            </div>
            
            <div className="stat">
              <div className="stat-title text-base-content/70">Longest Streak</div>
              <div className="stat-value text-xl text-base-content">{longestStreak} days</div>
            </div>
          </div>
          
          <div className="mt-6 w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-base-content/70">Last 7 days</span>
            </div>
            
            <div className="flex justify-between">
              {/* Display days from left (oldest) to right (today) */}
              {Array.from({ length: 7 }).map((_, i) => {
                // Calculate the date for this position
                const date = new Date();
                date.setDate(date.getDate() - (6 - i)); // i=0 is 6 days ago, i=6 is today
                const dateStr = date.toISOString().split('T')[0];
                const hasWorkout = streakDates.includes(dateStr);
                const isRestDay = restDates.includes(dateStr);
                const isToday = i === 6; // The last item (i=6) is today
                
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isRestDay ? 'bg-blue-500' : hasWorkout ? 'bg-primary' : 'bg-base-200'}
                        ${isToday ? 'ring-2 ring-offset-2 ring-accent ring-offset-base-100 scale-110' : ''}
                        transition-all duration-200
                      `}
                    >
                      {hasWorkout && !isRestDay && <FaFire className="text-primary-content" size={14} />}
                      {isRestDay && <FaBed className="text-white" size={14} />}
                    </div>
                    <span className={`text-xs mt-1 ${isToday ? 'font-bold text-accent' : 'text-base-content/70'}`}>
                      {isToday ? 'Today' : i === 5 ? 'Yest' : date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
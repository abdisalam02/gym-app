"use client";
import WorkoutTabs from "../components/WorkoutTabs";
import { FaDumbbell, FaChartLine, FaCalendar } from 'react-icons/fa';

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-zinc-800 rounded-xl shadow-lg p-4">
          <div className="stat-figure text-red-500">
            <FaDumbbell size={24} />
          </div>
          <div className="stat-title text-zinc-400">Total Workouts</div>
          <div className="stat-value text-white">31</div>
          <div className="stat-desc text-zinc-500">This month</div>
        </div>
        
        <div className="stat bg-zinc-800 rounded-xl shadow-lg p-4">
          <div className="stat-figure text-red-500">
            <FaChartLine size={24} />
          </div>
          <div className="stat-title text-zinc-400">Progress</div>
          <div className="stat-value text-white">+15%</div>
          <div className="stat-desc text-zinc-500">vs last month</div>
        </div>
        
        <div className="stat bg-zinc-800 rounded-xl shadow-lg p-4">
          <div className="stat-figure text-red-500">
            <FaCalendar size={24} />
          </div>
          <div className="stat-title text-zinc-400">Streak</div>
          <div className="stat-value text-white">7 days</div>
          <div className="stat-desc text-zinc-500">Current streak</div>
        </div>
      </div>

      {/* Workout Schedule */}
      <section className="px-2 sm:px-0">
        <WorkoutTabs />
      </section>
    </div>
  );
} 
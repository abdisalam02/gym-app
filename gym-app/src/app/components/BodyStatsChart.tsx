"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart, Bar, ReferenceLine
} from 'recharts';
import { FaWeight, FaChartLine, FaRunning, FaCalendarAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';

type BodyStat = {
  id: string;
  stat_date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
};

export default function BodyStatsChart() {
  const [bodyStats, setBodyStats] = useState<BodyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'weight' | 'body_fat' | 'muscle_mass'>('weight');
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('3m');
  const [chartType, setChartType] = useState<'line' | 'area' | 'composed'>('area');
  const [showGoalLine, setShowGoalLine] = useState(false);
  const [goalValue, setGoalValue] = useState<number | null>(null);
  const [chartHeight, setChartHeight] = useState(300);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setChartHeight(window.innerWidth < 768 ? 220 : 300);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    async function fetchBodyStats() {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }

      const { data, error } = await supabase
        .from('body_stats')
        .select('*')
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .lte('stat_date', endDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: true });

      if (error) {
        console.error('Error fetching body stats:', error);
      } else {
        setBodyStats(data || []);
        
        // Set default goal values based on the data
        if (data && data.length > 0 && !goalValue) {
          const latestStat = data[data.length - 1];
          switch (activeMetric) {
            case 'weight':
              setGoalValue(latestStat.weight ? latestStat.weight * 0.9 : null); // 10% weight loss goal
              break;
            case 'body_fat':
              setGoalValue(latestStat.body_fat ? latestStat.body_fat * 0.8 : null); // 20% body fat reduction
              break;
            case 'muscle_mass':
              setGoalValue(latestStat.muscle_mass ? latestStat.muscle_mass * 1.1 : null); // 10% muscle gain
              break;
          }
        }
      }
      setLoading(false);
    }

    fetchBodyStats();
  }, [timeRange]);

  // Update goal when active metric changes
  useEffect(() => {
    if (bodyStats.length > 0) {
      const latestStat = bodyStats[bodyStats.length - 1];
      switch (activeMetric) {
        case 'weight':
          setGoalValue(latestStat.weight ? Math.round(latestStat.weight * 0.9) : null);
          break;
        case 'body_fat':
          setGoalValue(latestStat.body_fat ? Math.round(latestStat.body_fat * 0.8 * 10) / 10 : null);
          break;
        case 'muscle_mass':
          setGoalValue(latestStat.muscle_mass ? Math.round(latestStat.muscle_mass * 1.1) : null);
          break;
      }
    }
  }, [activeMetric, bodyStats]);

  // Format data for the chart
  const chartData = bodyStats.map(stat => ({
    date: new Date(stat.stat_date).toLocaleDateString(undefined, 
      isMobile ? { month: 'numeric', day: 'numeric' } : { month: 'short', day: 'numeric' }
    ),
    fullDate: stat.stat_date,
    weight: stat.weight,
    body_fat: stat.body_fat,
    muscle_mass: stat.muscle_mass,
    // Calculate change from previous
    weightChange: bodyStats.indexOf(stat) > 0 ? 
      (stat.weight || 0) - (bodyStats[bodyStats.indexOf(stat) - 1].weight || 0) : 0,
    body_fatChange: bodyStats.indexOf(stat) > 0 ? 
      (stat.body_fat || 0) - (bodyStats[bodyStats.indexOf(stat) - 1].body_fat || 0) : 0,
    muscle_massChange: bodyStats.indexOf(stat) > 0 ? 
      (stat.muscle_mass || 0) - (bodyStats[bodyStats.indexOf(stat) - 1].muscle_mass || 0) : 0,
  }));

  // Calculate progress metrics
  const calculateProgress = () => {
    if (bodyStats.length < 2) return { change: 0, percentage: 0, trend: 'neutral' };
    
    const latest = bodyStats[bodyStats.length - 1];
    const earliest = bodyStats[0];
    
    const latestValue = latest[activeMetric];
    const earliestValue = earliest[activeMetric];
    
    if (latestValue === null || earliestValue === null) return { change: 0, percentage: 0, trend: 'neutral' };
    
    const change = latestValue - earliestValue;
    const percentage = (change / earliestValue) * 100;
    
    // Calculate trend based on last 3 entries
    let trend = 'neutral';
    if (bodyStats.length >= 3) {
      const lastThree = bodyStats.slice(-3).map(stat => stat[activeMetric]);
      if (lastThree[2] !== null && lastThree[1] !== null && lastThree[0] !== null) {
        if (lastThree[2] > lastThree[1] && lastThree[1] > lastThree[0]) {
          trend = 'increasing';
        } else if (lastThree[2] < lastThree[1] && lastThree[1] < lastThree[0]) {
          trend = 'decreasing';
        }
      }
    }
    
    return { change, percentage, trend };
  };

  const progress = calculateProgress();
  const isPositiveChange = activeMetric === 'muscle_mass' ? progress.change > 0 : progress.change < 0;
  const isPositiveTrend = activeMetric === 'muscle_mass' ? progress.trend === 'increasing' : progress.trend === 'decreasing';

  // Get color for the active metric
  const getMetricColor = () => {
    switch (activeMetric) {
      case 'weight':
        return '#3b82f6'; // blue-500
      case 'body_fat':
        return '#f59e0b'; // amber-500
      case 'muscle_mass':
        return '#10b981'; // emerald-500
      default:
        return '#3b82f6';
    }
  };

  // Get icon for the active metric
  const getMetricIcon = () => {
    switch (activeMetric) {
      case 'weight':
        return <FaWeight className="mr-2" />;
      case 'body_fat':
        return <FaChartLine className="mr-2" />;
      case 'muscle_mass':
        return <FaRunning className="mr-2" />;
      default:
        return <FaWeight className="mr-2" />;
    }
  };

  // Calculate min and max values for Y axis
  const getYAxisDomain = () => {
    const values = bodyStats
      .map(stat => stat[activeMetric])
      .filter(val => val !== null) as number[];
    
    if (values.length === 0) return [0, 100];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return [Math.max(0, min - padding), max + padding];
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-700">
          <p className="text-slate-300 font-semibold">{label}</p>
          <p className="text-white font-bold">
            {activeMetric === 'weight' ? 'Weight: ' : 
             activeMetric === 'body_fat' ? 'Body Fat: ' : 'Muscle Mass: '}
            <span style={{ color: getMetricColor() }}>
              {data[activeMetric]}
              {activeMetric === 'weight' ? ' kg' : activeMetric === 'body_fat' ? '%' : ' kg'}
            </span>
          </p>
          {bodyStats.indexOf(data) > 0 && (
            <p className={`text-sm ${data[`${activeMetric}Change`] > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {data[`${activeMetric}Change`] > 0 ? '↑' : '↓'} 
              {Math.abs(data[`${activeMetric}Change`]).toFixed(1)}
              {activeMetric === 'weight' ? ' kg' : activeMetric === 'body_fat' ? '%' : ' kg'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card bg-slate-800 shadow-xl">
      <div className="card-body p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-bold text-white flex items-center">
            {getMetricIcon()} Body Stats Tracker
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="join">
              <button 
                className={`join-item btn btn-sm ${activeMetric === 'weight' ? 'btn-active bg-blue-600' : 'bg-slate-700'}`}
                onClick={() => setActiveMetric('weight')}
              >
                <FaWeight className={isMobile ? "mr-0" : "mr-1"} /> {!isMobile && "Weight"}
              </button>
              <button 
                className={`join-item btn btn-sm ${activeMetric === 'body_fat' ? 'btn-active bg-amber-600' : 'bg-slate-700'}`}
                onClick={() => setActiveMetric('body_fat')}
              >
                <FaChartLine className={isMobile ? "mr-0" : "mr-1"} /> {!isMobile && "Body Fat"}
              </button>
              <button 
                className={`join-item btn btn-sm ${activeMetric === 'muscle_mass' ? 'btn-active bg-emerald-600' : 'bg-slate-700'}`}
                onClick={() => setActiveMetric('muscle_mass')}
              >
                <FaRunning className={isMobile ? "mr-0" : "mr-1"} /> {!isMobile && "Muscle"}
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="stats shadow bg-slate-700">
            <div className="stat p-2 sm:p-4">
              <div className="stat-title text-slate-400">Current</div>
              <div className="stat-value text-white">
                {bodyStats.length > 0 
                  ? bodyStats[bodyStats.length - 1][activeMetric] || 'N/A'
                  : 'N/A'
                }
                <span className="text-lg ml-1">
                  {activeMetric === 'weight' ? 'kg' : activeMetric === 'body_fat' ? '%' : 'kg'}
                </span>
              </div>
              <div className="stat-desc text-slate-400">
                Last updated: {bodyStats.length > 0 
                  ? new Date(bodyStats[bodyStats.length - 1].stat_date).toLocaleDateString()
                  : 'N/A'
                }
              </div>
            </div>
          </div>
          
          <div className="stats shadow bg-slate-700">
            <div className="stat p-2 sm:p-4">
              <div className="stat-title text-slate-400">Change</div>
              <div className={`stat-value ${isPositiveChange ? 'text-emerald-400' : 'text-red-400'}`}>
                {progress.change.toFixed(1)}
                <span className="text-lg ml-1">
                  {activeMetric === 'weight' ? 'kg' : activeMetric === 'body_fat' ? '%' : 'kg'}
                </span>
              </div>
              <div className="stat-desc flex items-center">
                {isPositiveChange 
                  ? <FaArrowDown className="text-emerald-400 mr-1" /> 
                  : <FaArrowUp className="text-red-400 mr-1" />
                }
                {Math.abs(progress.percentage).toFixed(1)}% from start
              </div>
            </div>
          </div>
          
          <div className="stats shadow bg-slate-700">
            <div className="stat p-2 sm:p-4">
              <div className="stat-title text-slate-400">Goal</div>
              <div className="stat-value text-white">
                {goalValue?.toFixed(1) || 'N/A'}
                <span className="text-lg ml-1">
                  {activeMetric === 'weight' ? 'kg' : activeMetric === 'body_fat' ? '%' : 'kg'}
                </span>
              </div>
              <div className="stat-desc flex items-center justify-between">
                <div>
                  {bodyStats.length > 0 && goalValue 
                    ? `${Math.abs(((bodyStats[bodyStats.length - 1][activeMetric] || 0) - goalValue) / goalValue * 100).toFixed(1)}% to go`
                    : 'Set a goal'
                  }
                </div>
                <label className="cursor-pointer flex items-center">
                  <input 
                    type="checkbox" 
                    className="toggle toggle-sm toggle-success" 
                    checked={showGoalLine}
                    onChange={() => setShowGoalLine(!showGoalLine)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div className="flex flex-wrap gap-1 mb-2">
            <button 
              className={`btn btn-xs ${timeRange === '1m' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setTimeRange('1m')}
            >
              1M
            </button>
            <button 
              className={`btn btn-xs ${timeRange === '3m' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setTimeRange('3m')}
            >
              3M
            </button>
            <button 
              className={`btn btn-xs ${timeRange === '6m' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setTimeRange('6m')}
            >
              6M
            </button>
            <button 
              className={`btn btn-xs ${timeRange === '1y' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setTimeRange('1y')}
            >
              1Y
            </button>
            <button 
              className={`btn btn-xs ${timeRange === 'all' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setTimeRange('all')}
            >
              All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-1">
            <button 
              className={`btn btn-xs ${chartType === 'line' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button 
              className={`btn btn-xs ${chartType === 'area' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setChartType('area')}
            >
              Area
            </button>
            <button 
              className={`btn btn-xs ${chartType === 'composed' ? 'bg-teal-600' : 'bg-slate-700'}`}
              onClick={() => setChartType('composed')}
            >
              Composed
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : bodyStats.length === 0 ? (
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-400">No body stats data available</p>
            <button className="btn btn-sm bg-teal-600 mt-2">Add Measurement</button>
          </div>
        ) : (
          <div className="bg-slate-700 rounded-lg p-2 sm:p-4">
            <ResponsiveContainer width="100%" height={chartHeight}>
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: isMobile ? 0 : 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#999' }} 
                    tickMargin={8}
                    tickFormatter={(value, index) => {
                      // Show fewer ticks on mobile
                      return isMobile && chartData.length > 10 
                        ? index % 3 === 0 ? value : ''
                        : value;
                    }}
                  />
                  <YAxis 
                    domain={getYAxisDomain()} 
                    tick={{ fill: '#999' }} 
                    tickMargin={8}
                    width={isMobile ? 30 : 40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke={getMetricColor()} 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: getMetricColor() }} 
                    activeDot={{ r: 5 }}
                  />
                  {showGoalLine && goalValue && (
                    <ReferenceLine y={goalValue} stroke="#10b981" strokeDasharray="3 3" />
                  )}
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: isMobile ? 0 : 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#999' }} 
                    tickMargin={8}
                    tickFormatter={(value, index) => {
                      // Show fewer ticks on mobile
                      return isMobile && chartData.length > 10 
                        ? index % 3 === 0 ? value : ''
                        : value;
                    }}
                  />
                  <YAxis 
                    domain={getYAxisDomain()} 
                    tick={{ fill: '#999' }} 
                    tickMargin={8}
                    width={isMobile ? 30 : 40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke={getMetricColor()} 
                    fill={getMetricColor()} 
                    fillOpacity={0.2}
                  />
                  {showGoalLine && goalValue && (
                    <ReferenceLine y={goalValue} stroke="#10b981" strokeDasharray="3 3" />
                  )}
                </AreaChart>
              ) : (
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: isMobile ? 0 : 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#999' }} 
                    tickMargin={8}
                    tickFormatter={(value, index) => {
                      // Show fewer ticks on mobile
                      return isMobile && chartData.length > 10 
                        ? index % 3 === 0 ? value : ''
                        : value;
                    }}
                  />
                  <YAxis 
                    domain={getYAxisDomain()} 
                    tick={{ fill: '#999' }} 
                    tickMargin={8}
                    width={isMobile ? 30 : 40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke={getMetricColor()} 
                    fill={getMetricColor()} 
                    fillOpacity={0.2}
                  />
                  <Bar dataKey={`${activeMetric}Change`} barSize={20} fill="#64748b" />
                  {showGoalLine && goalValue && (
                    <ReferenceLine y={goalValue} stroke="#10b981" strokeDasharray="3 3" />
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
} 
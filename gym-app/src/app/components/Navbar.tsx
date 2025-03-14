"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaDumbbell, FaHistory, FaChartLine, FaCog, FaHome, FaCalendarAlt, FaRunning, FaSun, FaMoon, FaBars, FaTimes, FaPalette } from 'react-icons/fa';

// Available themes
const THEMES = [
  { id: 'dark', name: 'Dark', icon: <FaMoon className="text-slate-300" /> },
  { id: 'light', name: 'Light', icon: <FaSun className="text-yellow-400" /> },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: <FaPalette className="text-pink-500" /> },
  { id: 'synthwave', name: 'Synthwave', icon: <FaPalette className="text-purple-500" /> },
  { id: 'forest', name: 'Forest', icon: <FaPalette className="text-green-500" /> },
  { id: 'aqua', name: 'Aqua', icon: <FaPalette className="text-blue-500" /> },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const pathname = usePathname();
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Close drawer when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setThemeDropdownOpen(false);
  }, [pathname]);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Apply theme-specific body background
    applyThemeBackground(savedTheme);
  }, []);

  const applyThemeBackground = (themeName: string) => {
    // Apply different body background colors based on theme
    const bodyEl = document.body;
    
    // Remove all theme-specific classes first
    bodyEl.classList.remove(
      'bg-slate-900', // dark
      'bg-gray-100',  // light
      'bg-black',     // cyberpunk
      'bg-purple-950', // synthwave
      'bg-emerald-950', // forest
      'bg-sky-950'    // aqua
    );
    
    // Apply new background based on theme
    switch (themeName) {
      case 'light':
        bodyEl.classList.add('bg-gray-100');
        break;
      case 'cyberpunk':
        bodyEl.classList.add('bg-black');
        break;
      case 'synthwave':
        bodyEl.classList.add('bg-purple-950');
        break;
      case 'forest':
        bodyEl.classList.add('bg-emerald-950');
        break;
      case 'aqua':
        bodyEl.classList.add('bg-sky-950');
        break;
      default: // dark
        bodyEl.classList.add('bg-slate-900');
        break;
    }
  };

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setThemeDropdownOpen(false);
    
    // Apply theme background
    applyThemeBackground(newTheme);
  };

  const getCurrentThemeIcon = () => {
    const currentTheme = THEMES.find(t => t.id === theme);
    return currentTheme?.icon || <FaPalette />;
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <div className="navbar bg-base-300 text-base-content sticky top-0 z-30 shadow-lg">
          <div className="navbar-start">
            <Link href="/dashboard" className="btn btn-ghost normal-case text-xl font-bold tracking-wide">
              💪 MyGym
            </Link>
          </div>
          <div className="navbar-end flex items-center">
            {/* Mobile theme dropdown button */}
            <div className="relative mr-1">
              <button 
                className="btn btn-circle btn-ghost"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent body clicks from closing this
                  setThemeDropdownOpen(!themeDropdownOpen);
                }}
              >
                {getCurrentThemeIcon()}
              </button>
            </div>
            
            <button 
              className="btn btn-circle btn-ghost ml-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
        
        {/* Theme Dropdown - Now Positioned Below Navbar for Mobile */}
        {themeDropdownOpen && (
          <div className="fixed top-16 right-0 w-48 rounded-md shadow-lg z-50 bg-base-200 border border-base-300">
            <div className="py-1">
              {THEMES.map((themeOption) => (
                <button
                  key={themeOption.id}
                  className={`flex items-center w-full px-4 py-3 text-left ${theme === themeOption.id ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => {
                    changeTheme(themeOption.id);
                    setThemeDropdownOpen(false);
                  }}
                >
                  <span className="mr-2 text-lg">{themeOption.icon}</span>
                  <span>{themeOption.name}</span>
                  {theme === themeOption.id && (
                    <span className="ml-auto">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Mobile Drawer Backdrop */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Mobile Drawer */}
        <div className={`fixed top-0 right-0 w-64 h-full overflow-y-auto bg-base-200 z-50 transform transition-transform duration-300 ease-in-out shadow-lg ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-base-300">
              <span className="font-bold text-xl">💪 MyGym</span>
              <button 
                className="btn btn-circle btn-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/dashboard') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaHome className="mr-3" /> Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/workouts" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/workouts') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaDumbbell className="mr-3" /> Workouts
                </Link>
              </li>
              <li>
                <Link 
                  href="/exercises" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/exercises') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaRunning className="mr-3" /> Exercises
                </Link>
              </li>
              <li>
                <Link 
                  href="/workouts/history" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/workouts/history') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaHistory className="mr-3" /> History
                </Link>
              </li>
              <li>
                <Link 
                  href="/measurements" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/measurements') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaChartLine className="mr-3" /> Measurements
                </Link>
              </li>
              <li>
                <Link 
                  href="/workouts/planner" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/workouts/planner') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaCalendarAlt className="mr-3" /> Planner
                </Link>
              </li>
            </ul>
            
            {/* Theme Section - Updated to be larger and more touch-friendly */}
            <div className="mt-6 mb-8">
              <h3 className="font-semibold p-3 flex items-center border-t border-base-300 pt-4">
                <FaPalette className="mr-3 text-primary" /> Theme
              </h3>
              <div className="grid grid-cols-2 gap-3 p-3">
                {THEMES.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                      theme === themeOption.id ? 'bg-primary text-primary-content' : 'bg-base-300 hover:bg-base-100'
                    }`}
                    onClick={() => changeTheme(themeOption.id)}
                  >
                    <span className="text-xl mb-2">{themeOption.icon}</span>
                    <span className="text-sm font-medium">{themeOption.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navbar */}
      <div className="navbar bg-base-300 text-base-content sticky top-0 z-30 shadow-lg hidden lg:flex">
        <div className="navbar-start">
          <Link href="/dashboard" className="btn btn-ghost normal-case text-xl font-bold tracking-wide">
            💪 MyGym
          </Link>
        </div>
        
        <div className="navbar-center">
          <ul className="menu menu-horizontal px-1 text-lg">
            <li>
              <Link 
                href="/dashboard" 
                className={`flex items-center ${isActive('/dashboard') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
              >
                <FaHome className="mr-2" /> Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/workouts" 
                className={`flex items-center ${isActive('/workouts') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
              >
                <FaDumbbell className="mr-2" /> Workouts
              </Link>
            </li>
            <li>
              <Link 
                href="/exercises" 
                className={`flex items-center ${isActive('/exercises') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
              >
                <FaRunning className="mr-2" /> Exercises
              </Link>
            </li>
            <li>
              <Link 
                href="/workouts/history" 
                className={`flex items-center ${isActive('/workouts/history') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
              >
                <FaHistory className="mr-2" /> History
              </Link>
            </li>
            <li>
              <Link 
                href="/measurements" 
                className={`flex items-center ${isActive('/measurements') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
              >
                <FaChartLine className="mr-2" /> Measurements
              </Link>
            </li>
            <li>
              <Link 
                href="/workouts/planner" 
                className={`flex items-center ${isActive('/workouts/planner') ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
              >
                <FaCalendarAlt className="mr-2" /> Planner
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="navbar-end">
          <div ref={themeDropdownRef} className="dropdown dropdown-end relative">
            <button 
              className="btn btn-ghost btn-circle"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            >
              {getCurrentThemeIcon()}
            </button>
            {themeDropdownOpen && (
              <ul className="menu dropdown-content shadow bg-base-200 rounded-box w-52 absolute right-0 mt-2 z-10">
                {THEMES.map((themeOption) => (
                  <li key={themeOption.id}>
                    <button 
                      className={`flex items-center ${theme === themeOption.id ? 'bg-base-300' : ''}`}
                      onClick={() => changeTheme(themeOption.id)}
                    >
                      <span className="mr-2">{themeOption.icon}</span>
                      {themeOption.name}
                      {theme === themeOption.id && (
                        <span className="ml-auto">✓</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 
"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="navbar bg-zinc-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <label 
            tabIndex={0} 
            className="btn btn-ghost lg:hidden hover:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-zinc-900 rounded-box w-52 text-white">
            <li><Link href="/dashboard" className="hover:bg-zinc-800">Dashboard</Link></li>
            <li><Link href="/workouts" className="hover:bg-zinc-800">Workouts</Link></li>
            <li><Link href="/workouts/history" className="hover:bg-zinc-800">History</Link></li>
            <li><Link href="/settings" className="hover:bg-zinc-800">Settings</Link></li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost normal-case text-xl font-bold tracking-wide">
          💪 MyGym
        </Link>
      </div>
      
      {/* Desktop menu */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-lg">
          <li><Link href="/" className="hover:bg-zinc-800">Dashboard</Link></li>
          <li><Link href="/workouts" className="hover:bg-zinc-800">Workouts</Link></li>
          <li><Link href="/workouts/history" className="hover:bg-zinc-800">History</Link></li>
          <li><Link href="/settings" className="hover:bg-zinc-800">Settings</Link></li>
        </ul>
      </div>
      
      <div className="navbar-end">
        <button className="btn btn-ghost btn-circle hover:bg-zinc-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
} 
'use client';

import { useEffect } from 'react';
import { logComponent, useComponentLogger } from '../lib/componentLogger';
import AppNavigation from '../components/AppNavigation';
import LeaderboardTable from '../components/LeaderboardTable';
import Link from 'next/link';

export default function LeaderboardPage() {
  useEffect(() => {
    logComponent('LeaderboardPage');
  }, []);
  
  // Use the hook for component lifecycle logging
  useComponentLogger('LeaderboardPage');

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Leaderboard</h1>
              <p className="text-gray-600">Track player rankings and scores</p>
            </div>
            <Link 
              href="/players" 
              className="inline-flex items-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Players
            </Link>
          </div>
          
          <LeaderboardTable />
        </div>
      </div>
    </main>
  );
} 
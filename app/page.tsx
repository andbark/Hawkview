'use client';

import { useEffect, useState } from 'react';
import { logComponent, useComponentLogger } from './lib/componentLogger';
import RecentWinners from './components/RecentWinners';
import AppNavigation from './components/AppNavigation';
import Link from 'next/link';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    logComponent('Home');
    
    // Collect diagnostic information about our environment
    if (typeof window !== 'undefined') {
      const info = {
        url: window.location.href,
        userAgent: window.navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      };
      setDebugInfo(info);
    }
    
  }, []);
  
  // Use the hook for component lifecycle logging
  useComponentLogger('Home');

  // Check if we're in development mode and show debug info
  const isDebug = process.env.NODE_ENV === 'development' && 
                 typeof window !== 'undefined' && 
                 window.location.search.includes('debug=true');

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main feature area - 2/3 width on md screens */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Bachelor Party Casino</h1>
              <p className="text-gray-600 mb-6">Track games, manage players, and see who's winning!</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/games" 
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <TrophyIcon className="h-8 w-8 text-navy mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800">Games</h3>
                    <p className="text-sm text-gray-500">Create and manage games</p>
                  </div>
                </Link>
                
                <Link 
                  href="/players" 
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <UserGroupIcon className="h-8 w-8 text-navy mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800">Players</h3>
                    <p className="text-sm text-gray-500">Add and track players</p>
                  </div>
                </Link>
                
                <Link 
                  href="/leaderboard" 
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <ChartBarIcon className="h-8 w-8 text-navy mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800">Leaderboard</h3>
                    <p className="text-sm text-gray-500">See who's winning</p>
                  </div>
                </Link>
                
                <Link 
                  href="/game-history" 
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <ClockIcon className="h-8 w-8 text-navy mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800">History</h3>
                    <p className="text-sm text-gray-500">View past games</p>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Additional content sections can go here */}
          </div>
          
          {/* Sidebar - 1/3 width on md screens */}
          <div className="space-y-6">
            <RecentWinners />
            
            {/* Additional sidebar widgets can go here */}
          </div>
        </div>
        
        {/* Debug information */}
        {isDebug && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-auto">
            <h3 className="text-sm font-bold mb-2">Debug Information:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
} 
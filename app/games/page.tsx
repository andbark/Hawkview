'use client';

import { useState, useEffect } from 'react';
import { logComponent, useComponentLogger } from '../lib/componentLogger';
import AppNavigation from '../components/AppNavigation';
import GameList from '../components/GameList';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function GamesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    logComponent('GamesPage');
  }, []);
  
  // Use the hook for component lifecycle logging
  useComponentLogger('GamesPage');

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Games</h1>
              <p className="text-gray-600">Create and manage your games</p>
            </div>
            <Link 
              href="/games/new" 
              className="inline-flex items-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Game
            </Link>
          </div>
          
          {/* Game list */}
          <GameList key={refreshKey} />
        </div>
      </div>
    </main>
  );
} 
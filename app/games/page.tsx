'use client';

import { useState, useEffect } from 'react';
import { logComponent, useComponentLogger } from '../lib/componentLogger';
import AppNavigation from '../components/AppNavigation';
import GameList from '../components/GameList';
import CreateGameForm from '../components/CreateGameForm';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function GamesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    logComponent('GamesPage');
  }, []);
  
  // Use the hook for component lifecycle logging
  useComponentLogger('GamesPage');

  // Force refresh game list after adding a new game
  const handleGameCreated = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Games</h1>
          <p className="text-gray-600 mb-6">Create and manage your games</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Game list - takes 2/3 of the width on md screens */}
            <div className="md:col-span-2">
              <GameList key={refreshKey} />
            </div>
            
            {/* Add game form - takes 1/3 of the width on md screens */}
            <div>
              <CreateGameForm onSuccess={handleGameCreated} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
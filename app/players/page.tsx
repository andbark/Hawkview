'use client';

import { useEffect, useState } from 'react';
import { logComponent, useComponentLogger } from '../lib/componentLogger';
import AppNavigation from '../components/AppNavigation';
import PlayerList from '../components/PlayerList';
import CreatePlayerForm from '../components/CreatePlayerForm';
import Link from 'next/link';

export default function PlayersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    logComponent('PlayersPage');
  }, []);
  
  // Use the hook for component lifecycle logging
  useComponentLogger('PlayersPage');

  // Force refresh player list after adding a new player
  const handlePlayerCreated = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Players</h1>
          <p className="text-gray-600 mb-6">Manage player profiles and track balances</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Player list - takes 2/3 of the width on md screens */}
            <div className="md:col-span-2">
              <PlayerList key={refreshKey} />
            </div>
            
            {/* Add player form - takes 1/3 of the width on md screens */}
            <div>
              <CreatePlayerForm onSuccess={handlePlayerCreated} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
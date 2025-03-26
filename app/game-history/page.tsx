'use client';

import { useEffect } from 'react';
import { logComponent, useComponentLogger } from '../lib/componentLogger';
import AppNavigation from '../components/AppNavigation';
import GameHistoryList from '../components/GameHistoryList';
import Link from 'next/link';

export default function GameHistoryPage() {
  useEffect(() => {
    logComponent('GameHistoryPage');
  }, []);
  
  // Use the hook for component lifecycle logging
  useComponentLogger('GameHistoryPage');

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Game History</h1>
              <p className="text-gray-600">View past games and results</p>
            </div>
            <Link 
              href="/games" 
              className="inline-flex items-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Game
            </Link>
          </div>
          
          <GameHistoryList />
        </div>
      </div>
    </main>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { logComponent, useComponentLogger } from '../lib/componentLogger';
import AppNavigation from '../components/AppNavigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrophyIcon } from '@heroicons/react/24/outline';

// Use dynamic import to handle potential errors
const Games = dynamic(() => import('./games'), {
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-white">
      <LoadingSpinner />
    </div>
  ),
  ssr: false
});

export default function GamesPage() {
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Games</h1>
          <p className="text-gray-600 mb-6">Create and manage your games</p>
          
          <div className="bg-white p-8 rounded-lg border shadow-sm">
            <div className="text-center py-12">
              <TrophyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-medium mb-2">No Games Yet</h2>
              <p className="text-gray-500 mb-6">Games will appear here once created</p>
              
              <button className="bg-navy text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block mr-4">
                Create Game
              </button>
              
              <Link href="/" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-block">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
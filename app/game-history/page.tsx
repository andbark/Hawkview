'use client';

import Link from 'next/link';

export default function GameHistoryPage() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">Game History</h1>
      <p className="text-xl mb-8">View past games and results</p>
      
      <div className="bg-white p-8 rounded-lg border shadow-sm">
        <div className="text-center py-12">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-medium mb-2">No Game History Yet</h2>
          <p className="text-gray-500 mb-6">Game history will appear here once games are played</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
} 
'use client';

import Link from 'next/link';

export default function PlayersPage() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">Players</h1>
      <p className="text-xl mb-8">Manage player profiles and balances</p>
      
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <h2 className="text-2xl font-medium mb-2">No Players Yet</h2>
          <p className="text-gray-500 mb-6">Players will appear here once created</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
} 
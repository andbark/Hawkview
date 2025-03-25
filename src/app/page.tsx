'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [balance, setBalance] = useState(300);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-blue-600">
          Bachelor Party Tracker
        </h1>
      </header>

      {/* Player Card */}
      <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-medium">Player Name</h3>
          <span className="text-2xl font-bold text-green-600">${balance}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Games Played:</span>
            <span>0</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Games Won:</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-center space-x-4">
        <Link 
          href="/games" 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Games
        </Link>
        <Link 
          href="/transactions" 
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Transactions
        </Link>
      </div>
    </div>
  );
} 
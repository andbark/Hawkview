'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center mb-6">
          <Link 
            href="/"
            className="mr-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-white">
          <p>Transactions coming soon...</p>
        </div>
      </div>
    </div>
  );
} 
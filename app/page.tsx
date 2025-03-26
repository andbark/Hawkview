'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logComponent, useComponentLogger } from './lib/componentLogger';

export default function Home() {
  logComponent('HomePage');
  useComponentLogger('HomePage');
  
  const [debugInfo, setDebugInfo] = useState<any>({
    hydrated: false,
    nextInfo: {},
    windowSize: {}
  });
  
  // Collect diagnostic information when running in the browser
  useEffect(() => {
    const buildInfo = {
      hydrated: true,
      nextInfo: {
        version: (window as any).__NEXT_DATA__?.buildId || 'unknown',
        runtime: (window as any).__NEXT_RUNTIME || 'unknown'
      },
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    setDebugInfo(buildInfo);
    
    // Log connectivity to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('🔌 Supabase URL configured:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + '...');
    } else {
      console.error('❌ Supabase URL not configured');
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Bachelor Party Dashboard</h1>
      <p className="text-xl mb-8">Track games, bets, and player performance</p>
      
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Link href="/games" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Games</h2>
          <p>Manage poker, blackjack, and other games</p>
        </Link>
        <Link href="/players" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Players</h2>
          <p>Track player balances and statistics</p>
        </Link>
        <Link href="/leaderboard" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
          <p>See who's winning and losing the most</p>
        </Link>
        <Link href="/game-history" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">History</h2>
          <p>View past games and transactions</p>
        </Link>
      </div>
      
      {/* Diagnostic information (hidden in production unless debug param is present) */}
      {(process.env.NODE_ENV !== 'production' || window?.location?.search.includes('debug=true')) && (
        <div className="w-full max-w-4xl p-4 bg-gray-100 rounded-lg text-xs font-mono mt-8">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <div className="mt-4">
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>Supabase URL Configured: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </main>
  );
} 
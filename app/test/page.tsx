'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Initializing...');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    async function testConnection() {
      setMessage('Checking Supabase client...');
      
      // Check if supabase client exists
      if (!supabase) {
        setStatus('error');
        setMessage('Supabase client is not initialized');
        return;
      }
      
      // Check if supabase client has from method
      if (!supabase.from) {
        setStatus('error');
        setMessage('Supabase client is missing from method');
        return;
      }
      
      try {
        setMessage('Testing players table query...');
        console.log('Testing Supabase connection on client side...');
        
        // Test query to players table
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('*')
          .limit(5);
          
        if (playersError) {
          console.error('Players query error:', playersError);
          setStatus('error');
          setMessage(`Error querying players: ${playersError.message}`);
          setResults({ playersError });
          return;
        }
        
        setMessage('Testing games table query...');
        
        // Test query to games table
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .limit(5);
          
        if (gamesError) {
          console.error('Games query error:', gamesError);
          setStatus('error');
          setMessage(`Error querying games: ${gamesError.message}`);
          setResults({ players, gamesError });
          return;
        }
        
        // Success
        setStatus('success');
        setMessage('Supabase connection successful');
        setResults({
          players,
          games,
          clientInfo: {
            exists: !!supabase,
            hasFrom: !!supabase.from,
          },
          env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL 
              ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + '...'
              : null
          }
        });
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        setResults({ error });
      }
    }
    
    testConnection();
  }, []);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className={`p-4 rounded-md mb-6 ${
        status === 'loading' ? 'bg-blue-50 text-blue-700' :
        status === 'success' ? 'bg-green-50 text-green-700' : 
        'bg-red-50 text-red-700'
      }`}>
        <div className="font-bold">{status.toUpperCase()}</div>
        <div>{message}</div>
      </div>
      
      {results && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Results</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Environment</h2>
        <ul className="list-disc pl-5">
          <li>
            NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL 
              ? '✅ Set' + ' (starts with: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + '...)' 
              : '❌ Not set'}
          </li>
          <li>
            NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
              ? '✅ Set (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' 
              : '❌ Not set'}
          </li>
        </ul>
      </div>
      
      <div className="mt-6">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

// Simplified Game interface
interface Game {
  id: string;
  name: string;
  status: string;
  createdat: string;
}

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For direct debugging
  console.log('GameList component mounted');

  useEffect(() => {
    console.log('GameList useEffect running');
    fetchGames();
  }, []);

  const fetchGames = async () => {
    console.log('fetchGames function called');
    try {
      setLoading(true);

      // Log Supabase client state
      console.log('Supabase client:', {
        exists: !!supabase,
        hasFrom: !!supabase?.from,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...'
      });

      // Direct check via log statement
      if (!supabase || !supabase.from) {
        console.error('⛔ Supabase client not properly initialized');
        setError('Database connection not available');
        return;
      }
      
      console.log('⏳ Starting games fetch...');
      
      // Most basic query possible without joins
      const { data, error } = await supabase
        .from('games')
        .select('id, name, status, createdat');
      
      console.log('📊 Query response:', { hasData: !!data, hasError: !!error, count: data?.length });
      
      if (error) {
        console.error('🔴 Games fetch error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('ℹ️ No games found');
        setGames([]);
        return;
      }
      
      console.log('✅ Successfully fetched games:', data.length);
      
      setGames(data);
      setError(null);
    } catch (error) {
      console.error('🔴 Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <LoadingSpinner />
        <p className="mt-2">Loading games...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded text-red-600">
        <h3 className="font-bold">Error loading games</h3>
        <p>{error}</p>
        <button 
          onClick={fetchGames}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Retry Now
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return <div className="p-4">No games found. Create a game to get started.</div>;
  }

  // Ultra simple rendering
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Game List</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Name</th>
            <th className="text-left">Status</th>
            <th className="text-right">Created</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id} className="border-t">
              <td className="py-2">{game.name}</td>
              <td>{game.status}</td>
              <td className="text-right">
                {new Date(game.createdat).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
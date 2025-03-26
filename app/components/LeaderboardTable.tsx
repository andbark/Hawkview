'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

// Simplified player interface
interface Player {
  id: string;
  name: string;
  balance: number;
}

export default function LeaderboardTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For direct debugging
  console.log('LeaderboardTable component mounted');

  useEffect(() => {
    console.log('LeaderboardTable useEffect running');
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    console.log('fetchPlayers function called');
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
      
      console.log('⏳ Starting player fetch...');
      
      // Most basic query possible
      const { data, error } = await supabase
        .from('players')
        .select('id, name, balance');
      
      console.log('📊 Query response:', { hasData: !!data, hasError: !!error, count: data?.length });
      
      if (error) {
        console.error('🔴 Player fetch error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('ℹ️ No players found');
        setPlayers([]);
        return;
      }
      
      console.log('✅ Successfully fetched players:', data.length);
      
      setPlayers(data);
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
        <p className="mt-2">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded text-red-600">
        <h3 className="font-bold">Error loading leaderboard</h3>
        <p>{error}</p>
        <button 
          onClick={fetchPlayers}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Retry Now
        </button>
      </div>
    );
  }

  if (players.length === 0) {
    return <div className="p-4">No players found. Add players to see the leaderboard.</div>;
  }

  // Ultra simple rendering
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Player Rankings</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Rank</th>
            <th className="text-left">Player</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.id} className="border-t">
              <td className="py-2">{index + 1}</td>
              <td>{player.name}</td>
              <td className="text-right">
                ${player.balance.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
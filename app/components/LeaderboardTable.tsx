'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

// Simplified player interface with only essential properties
interface Player {
  id: string;
  name: string;
  colorScheme: string;
  balance: number;
}

export default function LeaderboardTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        
        // Simple query to just get player data
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('id, name, colorScheme, balance')
          .order('balance', { ascending: false });
          
        if (playerError) {
          console.error('Player query error:', playerError);
          throw playerError;
        }
        
        if (!playerData) {
          setPlayers([]);
          return;
        }
        
        // Map the data with safe defaults
        const safePlayers = playerData.map(player => ({
          id: player.id,
          name: player.name || 'Unnamed Player',
          colorScheme: player.colorScheme || 'blue',
          balance: typeof player.balance === 'number' ? player.balance : 0
        }));
        
        setPlayers(safePlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch player data with a retry mechanism
    const fetchWithRetry = async (retries = 1) => {
      try {
        await fetchPlayers();
      } catch (error) {
        console.error(`Fetch attempt failed, retries left: ${retries}`);
        if (retries > 0) {
          setTimeout(() => fetchWithRetry(retries - 1), 2000);
        } else {
          setError('Failed to load players after multiple attempts.');
          setLoading(false);
        }
      }
    };
    
    fetchWithRetry();
    
    // Set up subscription for player data changes
    const playerChanges = supabase
      .channel('leaderboard_players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchPlayers();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(playerChanges);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Helper to get color class based on colorScheme
  const getColorClass = (colorScheme: string) => {
    const validColors = ['blue', 'red', 'green', 'yellow', 'purple', 'pink', 'indigo', 'gray'];
    const defaultColor = 'blue';
    
    const color = validColors.includes(colorScheme) ? colorScheme : defaultColor;
    return `bg-${color}-500`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-medium mb-2">No Leaderboard Data Yet</h2>
        <p className="text-gray-500 mb-6">Add players and play games to see the leaderboard</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-800">Player Rankings</h2>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg mb-6">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Rank
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Player
              </th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {players.map((player, index) => (
              <tr key={player.id} className={index === 0 ? 'bg-yellow-50' : ''}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <span className={index === 0 ? 'font-bold' : ''}>{index + 1}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <div className={`w-2 h-10 mr-3 ${getColorClass(player.colorScheme)} rounded-full`}></div>
                    <Link href={`/players/${player.id}`} className="hover:underline">
                      {player.name}
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                  <span className={player.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(player.balance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">How the leaderboard works</h3>
            <p className="text-sm text-blue-700">
              Players are ranked by their total balance. Balances update in real-time as games are played and completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
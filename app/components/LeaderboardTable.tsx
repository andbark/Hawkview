'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChartBarIcon, TrophyIcon, ArrowSmallUpIcon, ArrowSmallDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  colorScheme: string;
  balance: number;
  wins: number;
  losses: number;
  totalGames: number;
}

interface Transaction {
  playerId: string;
  type: string;
  count: string;
}

export default function LeaderboardTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        
        // Get players with their balances
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .order('balance', { ascending: false });
          
        if (playerError) throw playerError;
        
        if (playerData) {
          // Get win/loss counts for each player
          const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .select('playerId, type, count(*)')
            .in('type', ['win', 'loss'])
            .groupBy('playerId, type');
            
          if (transactionError) throw transactionError;
          
          // Process and combine the data
          const enhancedPlayers = playerData.map(player => {
            const wins = transactionData?.filter((t: Transaction) => t.playerId === player.id && t.type === 'win') || [];
            const losses = transactionData?.filter((t: Transaction) => t.playerId === player.id && t.type === 'loss') || [];
            
            return {
              id: player.id,
              name: player.name,
              colorScheme: player.colorScheme,
              balance: player.balance,
              wins: wins.length > 0 ? parseInt(wins[0].count) : 0,
              losses: losses.length > 0 ? parseInt(losses[0].count) : 0,
              totalGames: (wins.length > 0 ? parseInt(wins[0].count) : 0) + 
                          (losses.length > 0 ? parseInt(losses[0].count) : 0)
            };
          });
          
          setPlayers(enhancedPlayers);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
    
    // Set up subscription to refresh when player or transaction data changes
    const playerChanges = supabase
      .channel('leaderboard_players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, payload => {
        fetchLeaderboard();
      })
      .subscribe();
      
    const transactionChanges = supabase
      .channel('leaderboard_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        fetchLeaderboard();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(playerChanges);
      supabase.removeChannel(transactionChanges);
    };
  }, []);

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
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
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
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
              Wins
            </th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
              Losses
            </th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:pr-6">
              Win Rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {players.map((player, index) => (
            <tr key={player.id} className={index === 0 ? 'bg-yellow-50' : ''}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="flex items-center">
                  {index === 0 && <TrophyIcon className="h-5 w-5 text-amber-500 mr-1" />}
                  <span className={index === 0 ? 'font-bold' : ''}>{index + 1}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                <div className="flex items-center">
                  <div className={`w-2 h-10 mr-3 bg-${player.colorScheme}-500 rounded-full`}></div>
                  <div>{player.name}</div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                <span 
                  className={`font-medium ${
                    player.balance > 0 
                      ? 'text-green-600' 
                      : player.balance < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}
                >
                  ${player.balance.toFixed(2)}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-green-600">
                {player.wins}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-red-600">
                {player.losses}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right sm:pr-6">
                {player.totalGames > 0 ? (
                  <div className="flex items-center justify-end">
                    <span>{((player.wins / player.totalGames) * 100).toFixed(1)}%</span>
                    {player.wins > player.losses ? (
                      <ArrowSmallUpIcon className="h-4 w-4 ml-1 text-green-500" />
                    ) : player.losses > player.wins ? (
                      <ArrowSmallDownIcon className="h-4 w-4 ml-1 text-red-500" />
                    ) : null}
                  </div>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
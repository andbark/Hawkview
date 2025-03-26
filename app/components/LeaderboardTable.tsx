'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChartBarIcon, TrophyIcon, ArrowSmallUpIcon, ArrowSmallDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
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
  biggestWin: number;
  biggestLoss: number;
  gamesPlayed: number;
  gameTypes: { [key: string]: number };
}

interface Transaction {
  playerId: string;
  type: string;
  amount: number;
  count: string;
  gameType?: string;
}

export default function LeaderboardTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtendedStats, setShowExtendedStats] = useState(false);

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
        
        if (!playerData) {
          setPlayers([]);
          return;
        }
        
        // Get all transactions to calculate statistics
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            playerId, 
            type, 
            amount,
            games(type)
          `)
          .in('type', ['win', 'loss', 'bet']);
          
        if (transactionError) throw transactionError;
        
        // Get game participation data
        const { data: participationData, error: participationError } = await supabase
          .from('game_participants')
          .select(`
            playerId,
            games(id, type)
          `);
          
        if (participationError) throw participationError;
        
        // Process and combine the data
        const enhancedPlayers = playerData.map(player => {
          // Filter transactions for this player
          const playerTransactions = transactionData?.filter(t => t.playerId === player.id) || [];
          
          // Calculate wins and losses
          const wins = playerTransactions.filter(t => t.type === 'win');
          const losses = playerTransactions.filter(t => t.type === 'loss');
          
          // Find biggest win and loss
          const winAmounts = wins.map(w => w.amount || 0);
          const lossAmounts = losses.map(l => l.amount || 0);
          const biggestWin = winAmounts.length > 0 ? Math.max(...winAmounts) : 0;
          const biggestLoss = lossAmounts.length > 0 ? Math.min(...lossAmounts) : 0;
          
          // Count games played and track game types
          const playerParticipation = participationData?.filter(p => p.playerId === player.id) || [];
          const gameTypes: { [key: string]: number } = {};
          
          // Safely handle the games data without assuming its exact structure
          playerParticipation.forEach(p => {
            // Access games data in a type-safe way, extracting the game type when available
            const gameData = p.games as any;
            // Default to 'unknown' if structure isn't as expected
            const gameType = gameData && typeof gameData === 'object' && gameData.type 
              ? gameData.type 
              : 'unknown';
            
            gameTypes[gameType] = (gameTypes[gameType] || 0) + 1;
          });
          
          return {
            id: player.id,
            name: player.name,
            colorScheme: player.colorScheme || 'blue',
            balance: player.balance,
            wins: wins.length,
            losses: losses.length,
            totalGames: wins.length + losses.length,
            biggestWin,
            biggestLoss: Math.abs(biggestLoss), // Convert to positive for display
            gamesPlayed: playerParticipation.length,
            gameTypes
          };
        });
        
        // Sort by balance descending
        enhancedPlayers.sort((a, b) => b.balance - a.balance);
        
        setPlayers(enhancedPlayers);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchLeaderboard();
      })
      .subscribe();
      
    const transactionChanges = supabase
      .channel('leaderboard_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchLeaderboard();
      })
      .subscribe();
      
    const gameParticipantsChanges = supabase
      .channel('leaderboard_game_participants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_participants' }, () => {
        fetchLeaderboard();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(playerChanges);
      supabase.removeChannel(transactionChanges);
      supabase.removeChannel(gameParticipantsChanges);
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
    
    // If the color is valid, use it; otherwise use default
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Player Rankings</h2>
        <button 
          onClick={() => setShowExtendedStats(!showExtendedStats)}
          className="text-sm text-navy hover:text-blue-700"
        >
          {showExtendedStats ? 'Hide Details' : 'Show Details'}
        </button>
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
              <React.Fragment key={player.id}>
                <tr className={index === 0 ? 'bg-yellow-50' : ''}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      {index === 0 && <TrophyIcon className="h-5 w-5 text-amber-500 mr-1" />}
                      <span className={index === 0 ? 'font-bold' : ''}>{index + 1}</span>
                    </div>
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
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-green-600">
                    {player.wins}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-red-600">
                    {player.losses}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right sm:pr-6">
                    {player.totalGames > 0 
                      ? `${Math.round((player.wins / player.totalGames) * 100)}%`
                      : '0%'
                    }
                  </td>
                </tr>
                
                {/* Extended stats row, shown when showExtendedStats is true */}
                {showExtendedStats && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-3 py-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Games Played</p>
                          <p className="font-medium">{player.gamesPlayed}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Biggest Win</p>
                          <p className="font-medium text-green-600">{formatCurrency(player.biggestWin)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Biggest Loss</p>
                          <p className="font-medium text-red-600">{formatCurrency(player.biggestLoss)}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
              Win rate is calculated based on the number of wins divided by total games (wins + losses).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
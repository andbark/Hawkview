'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrophyIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsOnline(navigator.onLine);
        
        // Attempt to get player data from Supabase
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .order('balance', { ascending: false });
          
        if (playersError) throw playersError;
        
        if (playersData) {
          // Get local transaction data for adding to player stats
          const localTransactionsStr = localStorage.getItem('transactions');
          let localTransactions: any[] = [];
          
          if (localTransactionsStr) {
            try {
              localTransactions = JSON.parse(localTransactionsStr);
            } catch (e) {
              console.error('Error parsing local transactions:', e);
            }
          }
          
          // Process player stats with local data for accurate counts
          const playersWithLocalData = playersData.map(player => {
            try {
              // Ensure player.id exists
              if (!player || !player.id) return player;
              
              const playerLocalTransactions = localTransactions.filter(tx => tx.playerId === player.id);
              
              // Count local wins
              const localWins = playerLocalTransactions.filter(tx => tx.type === 'win').length;
              
              // Calculate local balance changes
              const localBalanceChange = playerLocalTransactions.reduce((sum, tx) => {
                return sum + (Number(tx.amount) || 0);
              }, 0);
              
              // Count games played (all transactions where player was involved)
              const localGameIds = new Set(playerLocalTransactions.map(tx => tx.gameId));
              const localGamesPlayed = localGameIds.size;
              
              // Calculate total balance for display
              const totalBalance = (Number(player.balance) || 0) + localBalanceChange;
              
              // Calculate net winnings (total - starting balance of 300)
              const netWinnings = totalBalance - 300;
              
              return {
                ...player,
                // Add local values to server values, with null handling
                balance: totalBalance,
                gamesWon: (Number(player.gamesWon) || 0) + localWins,
                gamesPlayed: (Number(player.gamesPlayed) || 0) + localGamesPlayed,
                // Calculate win rate with null handling
                winRate: ((Number(player.gamesWon) || 0) + localWins) / 
                          Math.max(1, (Number(player.gamesPlayed) || 0) + localGamesPlayed),
                netWinnings: netWinnings
              };
            } catch (e) {
              console.error(`Error processing local data for player ${player?.id || 'unknown'}:`, e);
              // Return the original player data if processing fails
              return player;
            }
          });
          
          // Sort by balance
          const sortedPlayers = playersWithLocalData.sort((a, b) => b.balance - a.balance);
          setPlayers(sortedPlayers);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players');
        
        // Try to get players from localStorage
        try {
          const localPlayersStr = localStorage.getItem('players');
          if (localPlayersStr) {
            setPlayers(JSON.parse(localPlayersStr));
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up online/offline listeners
    window.addEventListener('online', () => {
      setIsOnline(true);
      toast.success('You are back online');
      fetchData(); // Refresh data
    });
    
    window.addEventListener('offline', () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may be limited.');
    });
    
    // Update the event listener for data refresh
    const handleDataRefresh = (event: any) => {
      console.log('Data refresh event received in leaderboard:', event.detail?.source || 'unknown source');
      
      // Check if this is a game deletion that could affect the leaderboard
      if (event.detail?.source === 'gameDelete') {
        console.log('Game deletion detected, refreshing leaderboard data');
        fetchData(); // Reload data to update player balances
      }
      // Check if this is an admin edit that could affect the leaderboard
      else if (event.detail?.source === 'adminEdit' || 
          event.detail?.source === 'adminSync' || 
          event.detail?.source === 'gameHistoryImport') {
        console.log('Admin change detected, refreshing leaderboard');
        fetchData(); // Reload data when game results change from admin panel
      } else {
        // For other general refresh events
        fetchData();
      }
    };
    
    // Add specific listener for balance updates
    const handleBalanceUpdate = (event: any) => {
      console.log('Player balance update event received', event.detail);
      
      // For delete operations, make sure to refresh data
      if (event.detail?.operation === 'delete') {
        console.log('Deletion operation detected, refreshing player balances');
        fetchData();
      } else {
        fetchData(); // Explicitly reload when balances change
      }
    };
    
    window.addEventListener('dataRefresh', handleDataRefresh);
    window.addEventListener('playerBalanceUpdate', handleBalanceUpdate);
    window.addEventListener('leaderboardUpdate', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
      window.removeEventListener('dataRefresh', handleDataRefresh);
      window.removeEventListener('playerBalanceUpdate', handleBalanceUpdate);
      window.removeEventListener('leaderboardUpdate', handleBalanceUpdate);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-navy mb-2 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
            <h1 className="text-3xl font-medium text-gray-800">Leaderboard</h1>
          </div>
        </div>
        
        {!isOnline && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 mb-6">
            <p className="font-medium">You are currently offline. Leaderboard may not show the latest data.</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-navy p-4">
            <h2 className="text-xl font-medium text-white flex items-center">
              <TrophyIcon className="h-5 w-5 mr-2 text-amber-300" />
              Top Players
            </h2>
          </div>
          
          {players.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-block bg-gray-100 p-3 rounded-full mb-3">
                <TrophyIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Players Yet</h3>
              <p className="text-gray-500 mb-4">Add some players to see the leaderboard</p>
              <Link 
                href="/players"
                className="inline-flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                Add Players
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Rank</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Player</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Balance</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Net Winnings</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Win Rate</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Wins / Games</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {players.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            index === 0 ? 'bg-amber-400' : 
                            index === 1 ? 'bg-gray-300' : 
                            index === 2 ? 'bg-amber-600' : 
                            'bg-gray-200'
                          }`}>
                            <span className="font-bold text-white">{index + 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">{player.name}</td>
                      <td className="py-3 px-4 text-right font-medium">${player.balance.toFixed(2)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${player.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${player.netWinnings.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {player.winRate ? `${(player.winRate * 100).toFixed(1)}%` : '0%'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {player.gamesWon || 0} / {player.gamesPlayed || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-navy p-4">
              <h2 className="text-xl font-medium text-white flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-300" />
                Biggest Winners
              </h2>
            </div>
            <div className="p-4">
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No player data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {players
                    .filter(p => p.netWinnings > 0)
                    .sort((a, b) => b.netWinnings - a.netWinnings)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.id} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-800 rounded-full font-bold mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800">{player.name}</span>
                        <span className="ml-auto font-medium text-green-600">+${player.netWinnings.toFixed(2)}</span>
                      </div>
                    ))}
                  
                  {players.filter(p => p.netWinnings > 0).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No winners yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-navy p-4">
              <h2 className="text-xl font-medium text-white flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-amber-300" />
                Highest Win Rate
              </h2>
            </div>
            <div className="p-4">
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No player data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {players
                    .filter(p => p.gamesPlayed > 0)
                    .sort((a, b) => b.winRate - a.winRate)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.id} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-800 rounded-full font-bold mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium text-gray-800">{player.name}</span>
                          <div className="text-xs text-gray-500">{player.gamesWon || 0} / {player.gamesPlayed || 0} games</div>
                        </div>
                        <span className="ml-auto font-medium text-amber-600">{(player.winRate * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  
                  {players.filter(p => p.gamesPlayed > 0).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No games played yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
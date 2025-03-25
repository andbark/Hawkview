'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
// import { initialPlayers } from '../../seed-data';
import BalanceRecalculator from '../components/BalanceRecalculator';
import LoadingSpinner from '../components/LoadingSpinner';

// Initial players data
const initialPlayers = [
  { name: 'Player 1', balance: 300, gamesPlayed: 0, gamesWon: 0, colorScheme: 'blue' },
  { name: 'Player 2', balance: 300, gamesPlayed: 0, gamesWon: 0, colorScheme: 'green' },
  { name: 'Player 3', balance: 300, gamesPlayed: 0, gamesWon: 0, colorScheme: 'purple' },
  { name: 'Player 4', balance: 300, gamesPlayed: 0, gamesWon: 0, colorScheme: 'red' }
];

interface Player {
  id: string;
  name: string;
  balance: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  netWinnings: number;
  colorScheme?: string;
}

const colorGradients = {
  purple: 'bg-navy', 
  blue: 'bg-navy',
  green: 'bg-navy',
  red: 'bg-navy',
  teal: 'bg-navy',
  amber: 'bg-navy',
  slate: 'bg-navy',
  gray: 'bg-navy',
  zinc: 'bg-navy', 
  stone: 'bg-navy',
  default: 'bg-navy'
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBalance, setNewPlayerBalance] = useState('300');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get('admin') === 'true';
  const editPlayerId = searchParams.get('edit');
  
  // Load players from Supabase on component mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('players')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const formattedPlayers = data.map(player => formatPlayerData(player));
          setPlayers(formattedPlayers);
        } else {
          // If no players found, initialize with sample data
          const seedPlayers = await seedInitialPlayers();
          if (seedPlayers.length > 0) {
            setPlayers(seedPlayers);
          }
        }
      } catch (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
    
    // Subscribe to realtime changes
    const playersSubscription = supabase
      .channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, payload => {
        // Handle different event types
        if (payload.eventType === 'INSERT') {
          const newPlayer = payload.new;
          setPlayers(prevPlayers => [
            ...prevPlayers, 
            formatPlayerData(newPlayer)
          ]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedPlayer = payload.new;
          setPlayers(prevPlayers => 
            prevPlayers.map(player => 
              player.id === updatedPlayer.id ? formatPlayerData(updatedPlayer) : player
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedPlayerId = payload.old.id;
          setPlayers(prevPlayers => 
            prevPlayers.filter(player => player.id !== deletedPlayerId)
          );
        }
      })
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(playersSubscription);
    };
  }, []);

  const randomColorScheme = () => {
    const colorOptions = Object.keys(colorGradients) as Array<keyof typeof colorGradients>;
    return colorOptions[Math.floor(Math.random() * colorOptions.length)];
  };
  
  const seedInitialPlayers = async () => {
    try {
      console.log("Seeding initial players:", initialPlayers);
      const seedPromises = initialPlayers.map(async (player) => {
        const { data, error } = await supabase
          .from('players')
          .insert({
            name: player.name,
            balance: player.balance,
            gamesPlayed: player.gamesPlayed,
            gamesWon: player.gamesWon,
            colorScheme: player.colorScheme
          })
          .select();
          
        if (error) {
          console.error("Error seeding player:", error);
          throw error;
        }
        
        if (data && data[0]) {
          return formatPlayerData(data[0]);
        }
        return null;
      });
      
      const results = await Promise.all(seedPromises);
      const validResults = results.filter(Boolean) as Player[];
      console.log("Seeded players:", validResults);
      return validResults;
    } catch (error) {
      console.error('Error seeding players:', error);
      toast.error('Failed to initialize players');
      return [];
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    const balance = parseFloat(newPlayerBalance) || 300;
    const colorScheme = randomColorScheme();
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          name: newPlayerName.trim(),
          balance,
          gamesPlayed: 0,
          gamesWon: 0,
          colorScheme
        })
        .select();
        
      if (error) throw error;
      
      if (data && data[0]) {
        toast.success(`Added player ${newPlayerName}`);
        setNewPlayerName('');
        setNewPlayerBalance('300');
        setShowAddPlayer(false);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    }
  };

  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.balance !== undefined) supabaseUpdates.balance = updates.balance;
      if (updates.gamesPlayed !== undefined) supabaseUpdates.gamesPlayed = updates.gamesPlayed;
      if (updates.gamesWon !== undefined) supabaseUpdates.gamesWon = updates.gamesWon;
      if (updates.colorScheme) supabaseUpdates.colorScheme = updates.colorScheme;
      
      const { error } = await supabase
        .from('players')
        .update(supabaseUpdates)
        .eq('id', playerId);
        
      if (error) throw error;
      
      // The UI will update via the realtime subscription
      toast.success('Updated player');
      setEditingPlayerId(null);
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };

  const deletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player? This cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
        
      if (error) throw error;
      
      // The UI will update via the realtime subscription
      toast.success('Player deleted');
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    }
  };

  // Format player data from Supabase
  const formatPlayerData = (player: any) => {
    // Get local transactions to adjust player data
    let localTransactions: any[] = [];
    try {
      const localTransactionsStr = localStorage.getItem('transactions');
      if (localTransactionsStr) {
        localTransactions = JSON.parse(localTransactionsStr)
          .filter((tx: any) => tx.playerId === player.id);
      }
    } catch (e) {
      console.error('Error parsing local transactions:', e);
    }
    
    // Calculate local balance adjustments from transactions
    const localBalanceChange = localTransactions.reduce((sum: number, tx: any) => {
      return sum + (Number(tx.amount) || 0);
    }, 0);
    
    // Count local wins and games played
    const localWins = localTransactions.filter((tx: any) => tx.type === 'win').length;
    const localGameIds = new Set(localTransactions.map((tx: any) => tx.gameId));
    const localGamesPlayed = localGameIds.size;
    
    return {
      id: player.id,
      name: player.name,
      // Add local balance changes to server balance
      balance: (player.balance || 0) + localBalanceChange,
      gamesPlayed: (player.gamesPlayed || 0) + localGamesPlayed,
      gamesWon: (player.gamesWon || 0) + localWins,
      winRate: (player.gamesPlayed + localGamesPlayed) > 0 
        ? Math.round(((player.gamesWon || 0) + localWins) / ((player.gamesPlayed || 0) + localGamesPlayed) * 100) 
        : 0,
      netWinnings: ((player.balance || 0) + localBalanceChange) - 300, // Assuming starting balance is 300
      colorScheme: player.colorScheme || randomColorScheme()
    };
  };
  
  const sortedPlayers = [...players].sort((a, b) => b.netWinnings - a.netWinnings);

  // Add data refresh on events
  useEffect(() => {
    const handleDataRefresh = () => {
      // Refetch players when a game ends or data changes
      fetchPlayers();
    };
    
    window.addEventListener('dataRefresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

  // Refetch players helper function
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const formattedPlayers = data.map(player => formatPlayerData(player));
        setPlayers(formattedPlayers);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle admin actions
  const handleAdminAction = async (action: string, playerId: string) => {
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete this player? This action cannot be undone and will remove all associated transactions.`)) {
        return;
      }
      
      setLoading(true);
      try {
        // First delete related transactions
        const { error: txError } = await supabase
          .from('transactions')
          .delete()
          .eq('playerId', playerId);
        
        if (txError) throw txError;
        
        // Then delete the player
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', playerId);
        
        if (error) throw error;
        
        // Also update local storage
        const localPlayers = JSON.parse(localStorage.getItem('players') || '[]');
        const filteredPlayers = localPlayers.filter((p: any) => p.id !== playerId);
        localStorage.setItem('players', JSON.stringify(filteredPlayers));
        
        toast.success('Player deleted successfully');
        fetchPlayers();
      } catch (error) {
        console.error('Error deleting player:', error);
        toast.error('Failed to delete player');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white text-gray-800 p-4">
      <Toaster position="top-right" />
      
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-navy mb-4 md:mb-0 transition-colors duration-200">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-3xl font-medium text-gray-800 mt-2">Players</h1>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="flex items-center px-4 py-2 bg-navy text-white rounded-lg hover:bg-blue-800 transition-colors duration-200"
            >
              {showAddPlayer ? (
                <>Cancel</>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-1" />
                  <span>Add Player</span>
                </>
              )}
            </button>
            
            {isAdminMode && (
              <Link 
                href="/"
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                <ShieldCheckIcon className="h-5 w-5 mr-1" />
                <span>Exit Admin Mode</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Balance Recalculator Component */}
        <BalanceRecalculator />
        
        {/* Add Player Form */}
        {showAddPlayer && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Add New Player</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Enter player name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Starting Balance
                </label>
                <input
                  type="number"
                  value={newPlayerBalance}
                  onChange={(e) => setNewPlayerBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="300"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddPlayer(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={addPlayer}
                className="px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                Add Player
              </button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            Loading players...
          </div>
        ) : players.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <h2 className="text-2xl font-medium mb-2">No Players Yet</h2>
            <p className="text-gray-600 mb-6">Add some players to get started!</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setShowAddPlayer(true)}
                className="px-6 py-3 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                Add Players
              </button>
              <button
                onClick={seedInitialPlayers}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Load Sample Players
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Player Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {sortedPlayers.map(player => (
                <div 
                  key={player.id} 
                  className="rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className={`${colorGradients[player.colorScheme as keyof typeof colorGradients] || colorGradients.default} text-white p-6 flex justify-between items-start`}>
                    <div>
                      <h2 className="text-xl font-medium mb-1">{player.name}</h2>
                      <div className="text-3xl font-medium">${player.balance.toFixed(2)}</div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingPlayerId(player.id)}
                        className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors duration-200"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {isAdminMode && (
                        <button
                          onClick={() => handleAdminAction('delete', player.id)}
                          className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors duration-200"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm text-gray-500">Games</div>
                        <div className="font-medium text-gray-800">{player.gamesPlayed}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Wins</div>
                        <div className="font-medium text-gray-800">{player.gamesWon}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Win Rate</div>
                        <div className="font-medium text-gray-800">{player.winRate}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Winnings</div>
                      <div className={`font-medium ${player.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${player.netWinnings.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {editingPlayerId === player.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                        <h3 className="text-xl font-medium mb-4 text-gray-800">Edit Player</h3>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            defaultValue={player.name}
                            id={`name-${player.id}`}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            Balance
                          </label>
                          <input
                            type="number"
                            defaultValue={player.balance}
                            id={`balance-${player.id}`}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingPlayerId(null)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const nameInput = document.getElementById(`name-${player.id}`) as HTMLInputElement;
                              const balanceInput = document.getElementById(`balance-${player.id}`) as HTMLInputElement;
                              
                              if (nameInput && balanceInput) {
                                updatePlayer(player.id, {
                                  name: nameInput.value,
                                  balance: parseFloat(balanceInput.value) || player.balance
                                });
                              }
                            }}
                            className="px-3 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Simple Leaderboard */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-medium mb-4 text-gray-800">Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Rank</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Player</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Balance</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Winnings</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Win Rate</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-200">
                    {sortedPlayers.map((player, index) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{player.name}</td>
                        <td className="py-3 px-4 text-right">${player.balance.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right ${player.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${player.netWinnings.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">{player.winRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
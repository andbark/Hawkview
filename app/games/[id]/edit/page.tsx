'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  UserIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

interface GameEditParams {
  params: {
    id: string;
  };
}

interface Player {
  id: string;
  name: string;
  bet: number;
}

interface Game {
  id: string;
  name: string;
  type: string;
  date: string;
  startTime: number;
  endTime?: number; 
  players: Player[];
  totalPot: number;
  status: 'active' | 'completed' | 'cancelled';
  winner?: string;
  notes?: string;
  winMethod?: string;
  customData?: {
    name: string;
    wagerAmount: number;
  };
}

export default function GameEditPage({ params }: GameEditParams) {
  const { id: gameId } = params;
  const router = useRouter();
  
  const [game, setGame] = useState<Game | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [gameName, setGameName] = useState('');
  const [gameType, setGameType] = useState('custom');
  const [winner, setWinner] = useState('');
  const [winMethod, setWinMethod] = useState('declared');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'cancelled'>('active');
  
  // Load game details and all players
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        
        if (gameData) {
          const formattedGame = formatGameData(gameData);
          setGame(formattedGame);
          
          // Set form values
          setGameName(formattedGame.name);
          setGameType(formattedGame.type || 'custom');
          setWinner(formattedGame.winner || '');
          setWinMethod(formattedGame.winMethod || 'declared');
          setNotes(formattedGame.notes || '');
          setStatus(formattedGame.status || 'active');
        }
        
        // Fetch all players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*');
          
        if (playersError) throw playersError;
        
        if (playersData) {
          setAllPlayers(playersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [gameId]);
  
  // Format game data from Supabase
  const formatGameData = (game: any): Game => {
    // Parse wager amount from the game name if it follows our format
    let customData = null;
    
    if (game.name && game.name.includes('(Entry: $')) {
      try {
        const nameMatch = game.name.match(/(.*) \(Entry: \$(\d+(\.\d+)?)\)/);
        if (nameMatch) {
          const baseName = nameMatch[1];
          const wagerAmount = parseFloat(nameMatch[2]);
          
          customData = {
            name: baseName,
            wagerAmount: wagerAmount
          };
        }
      } catch (e) {
        console.error("Error parsing game name for wager:", e);
      }
    }
    
    // Convert players object to array format that the UI expects
    let players = [];
    try {
      if (game.players) {
        // If it's a string, parse it first
        const playersData = typeof game.players === 'string' 
          ? JSON.parse(game.players) 
          : game.players;
          
        if (Array.isArray(playersData)) {
          // If it's already an array (old format), use it
          players = playersData;
        } else if (typeof playersData === 'object') {
          // If it's an object (new format), convert to array
          players = Object.entries(playersData).map(([id, data]) => ({
            id,
            name: (data as any).name,
            bet: (data as any).bet
          }));
        }
      }
    } catch (e) {
      console.error("Error parsing players:", e);
      players = [];
    }
    
    return {
      id: game.id,
      name: game.name,
      type: game.type,
      date: new Date(game.startTime).toLocaleDateString(),
      startTime: game.startTime,
      endTime: game.endTime,
      players: players,
      totalPot: game.totalPot || 0,
      status: game.status || 'active',
      winner: game.winner,
      notes: game.notes,
      winMethod: game.winMethod,
      customData: customData
    };
  };
  
  // Save game changes
  const saveGameChanges = async () => {
    try {
      setSaving(true);
      
      // Check if this is a completed game and winner has changed
      const winnerChanged = game?.status === 'completed' && 
                          game?.winner !== winner && 
                          status === 'completed';
                          
      // Update game data
      const { error: updateError } = await supabase
        .from('games')
        .update({
          name: gameName,
          type: gameType,
          status: status,
          winner: winner || null,
          winMethod: winMethod || null,
          notes: notes || null
        })
        .eq('id', gameId);
        
      if (updateError) throw updateError;
      
      // Update transaction if winner has changed
      if (winnerChanged) {
        // First, check for existing win transaction
        const { data: existingTransaction, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('gameId', gameId)
          .eq('type', 'win')
          .maybeSingle();
          
        if (txError) throw txError;
        
        if (existingTransaction) {
          // Update existing transaction with new winner
          const { error: updateTxError } = await supabase
            .from('transactions')
            .update({
              playerId: winner,
              description: `Won game: ${gameName}`
            })
            .eq('id', existingTransaction.id);
            
          if (updateTxError) throw updateTxError;
          
          // Update player statistics
          // First, reduce previous winner's stats
          if (game?.winner) {
            const { error: oldWinnerError } = await supabase
              .from('players')
              .update({
                balance: supabase.rpc('decrement', { 
                  row_id: game.winner, 
                  amount: game.totalPot 
                }),
                gamesWon: supabase.rpc('decrement_games_won', { 
                  row_id: game.winner
                })
              })
              .eq('id', game.winner);
              
            if (oldWinnerError) throw oldWinnerError;
          }
          
          // Now update new winner's stats
          const { error: newWinnerError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { 
                row_id: winner, 
                amount: game.totalPot 
              }),
              gamesWon: supabase.rpc('increment_games_won', { 
                row_id: winner
              })
            })
            .eq('id', winner);
            
          if (newWinnerError) throw newWinnerError;
        } else if (status === 'completed' && winner) {
          // If no win transaction exists but we're marking a completed game, create one
          const { error: newTxError } = await supabase
            .from('transactions')
            .insert({
              gameId: gameId,
              playerId: winner,
              amount: game.totalPot,
              type: 'win',
              timestamp: Date.now(),
              description: `Won game: ${gameName}`
            });
            
          if (newTxError) throw newTxError;
          
          // Update winner's balance
          const { error: winnerUpdateError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { 
                row_id: winner, 
                amount: game.totalPot 
              }),
              gamesWon: supabase.rpc('increment_games_won', { 
                row_id: winner
              })
            })
            .eq('id', winner);
            
          if (winnerUpdateError) throw winnerUpdateError;
        }
      }
      
      toast.success('Game updated successfully');
      
      // Navigate back to game details after a short delay
      setTimeout(() => {
        router.push(`/games/${gameId}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating game:', error);
      toast.error('Failed to update game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link 
            href="/games"
            className="inline-flex items-center text-white mb-6 hover:text-purple-400 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Games
          </Link>
          
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
            <p className="text-gray-300 mb-6">The game you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/games"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              View All Games
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <Link 
            href={`/games/${gameId}`}
            className="inline-flex items-center text-white hover:text-purple-400 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Game Details
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <h1 className="text-2xl font-bold text-white">Edit Game</h1>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Game Name */}
              <div>
                <label htmlFor="gameName" className="block text-sm font-medium text-gray-300 mb-1">
                  Game Name
                </label>
                <input
                  type="text"
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Game Type */}
              <div>
                <label htmlFor="gameType" className="block text-sm font-medium text-gray-300 mb-1">
                  Game Type
                </label>
                <select
                  id="gameType"
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="custom">Custom Game</option>
                  <option value="poker">Poker</option>
                  <option value="blackjack">Blackjack</option>
                </select>
              </div>
              
              {/* Game Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                  Game Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'cancelled')}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Winner - visible only if game is completed */}
              {(status === 'completed') && (
                <div>
                  <label htmlFor="winner" className="block text-sm font-medium text-gray-300 mb-1">
                    Winner
                  </label>
                  <select
                    id="winner"
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a Winner</option>
                    {game.players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} (Bet: ${player.bet.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Win Method - visible only if game is completed */}
              {(status === 'completed' && winner) && (
                <div>
                  <label htmlFor="winMethod" className="block text-sm font-medium text-gray-300 mb-1">
                    Win Method
                  </label>
                  <select
                    id="winMethod"
                    value={winMethod}
                    onChange={(e) => setWinMethod(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="declared">Declared Winner</option>
                    <option value="random">Random Selection</option>
                  </select>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add any notes about this game..."
                />
              </div>
              
              {/* Players list (non-editable) */}
              <div>
                <h3 className="text-md font-medium text-gray-300 mb-3">Players</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {game.players.map(player => (
                    <div 
                      key={player.id} 
                      className={`bg-gray-700 rounded-lg p-3 flex items-center ${player.id === winner ? 'border-2 border-yellow-400' : ''}`}
                    >
                      <div className="flex items-center flex-1">
                        <div className="bg-gray-600 rounded-full p-2 mr-3">
                          <UserIcon className="h-4 w-4 text-gray-300" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-sm text-gray-300">Bet: ${player.bet.toFixed(2)}</div>
                        </div>
                      </div>
                      {player.id === winner && (
                        <TrophyIcon className="h-5 w-5 text-yellow-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Warning about changing winners */}
              {game.status === 'completed' && status === 'completed' && winner !== game.winner && (
                <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold mb-1">Warning: Changing Game Winner</h4>
                  <p>
                    You are changing the winner of this game. This will update all financial transactions and player statistics.
                    The previous winner will lose the pot amount and the new winner will receive it instead.
                  </p>
                </div>
              )}
              
              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Link
                  href={`/games/${gameId}`}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  onClick={saveGameChanges}
                  disabled={saving || !gameName}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
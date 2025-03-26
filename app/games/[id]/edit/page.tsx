'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import AppNavigation from '../../../components/AppNavigation';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon, TrophyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface Game {
  id: string;
  name: string;
  type: string;
  status: string;
  potAmount: number;
  createdAt: string;
  winnerId: string | null;
}

interface Player {
  id: string;
  name: string;
  balance: number;
}

interface GameParticipant {
  id: string;
  playerId: string;
  gameId: string;
  buyInAmount: number;
  joinedAt: string;
  playerName?: string;
}

export default function EditGamePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const gameId = params.id;
  
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: '',
    winnerId: '',
  });

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch game details
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        if (!gameData) throw new Error('Game not found');
        
        setGame(gameData);
        setFormData({
          name: gameData.name,
          status: gameData.status,
          winnerId: gameData.winnerId || '',
        });
        
        // Fetch game participants with player names
        const { data: participantsData, error: participantsError } = await supabase
          .from('game_participants')
          .select(`
            id,
            playerId,
            gameId,
            buyInAmount,
            joinedAt,
            players (
              name
            )
          `)
          .eq('gameId', gameId);
          
        if (participantsError) throw participantsError;
        
        // Format participants data with player names
        const formattedParticipants = participantsData.map((p: any) => ({
          id: p.id,
          playerId: p.playerId,
          gameId: p.gameId,
          buyInAmount: p.buyInAmount,
          joinedAt: p.joinedAt,
          playerName: p.players?.name
        }));
        
        setParticipants(formattedParticipants);
        
        // Fetch all players for winner selection
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, name, balance')
          .order('name');
          
        if (playersError) throw playersError;
        setPlayers(playersData || []);
        
      } catch (error) {
        console.error('Error fetching game data:', error);
        setError('Failed to load game data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);
      
      // Check if winner has changed and game status is changing to completed
      const winnerChanged = game?.winnerId !== formData.winnerId && formData.status === 'completed';
      const statusChangedToCompleted = game?.status !== 'completed' && formData.status === 'completed';
      
      // Basic validation
      if (formData.status === 'completed' && !formData.winnerId) {
        setError('Please select a winner when marking a game as completed');
        return;
      }
      
      // Update the game
      const { error: updateError } = await supabase
        .from('games')
        .update({
          name: formData.name,
          status: formData.status,
          winnerId: formData.winnerId || null,
          updatedAt: new Date().toISOString()
        })
        .eq('id', gameId);
        
      if (updateError) throw updateError;
      
      // If the game is being marked as completed and has a winner, handle the pot distribution
      if (statusChangedToCompleted && formData.winnerId && game) {
        // Get total pot amount from the game
        const potAmount = game.potAmount;
        
        // Create a win transaction for the winner
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            playerId: formData.winnerId,
            gameId: gameId,
            amount: potAmount,
            type: 'win',
            description: `Win for game: ${formData.name}`,
            timestamp: new Date().toISOString()
          });
          
        if (transactionError) throw transactionError;
        
        // Update winner's balance
        const { error: updateBalanceError } = await supabase
          .from('players')
          .update({
            balance: supabase.rpc('increment', { x: potAmount })
          })
          .eq('id', formData.winnerId);
          
        if (updateBalanceError) throw updateBalanceError;
        
        // Create loss transactions for other participants
        for (const participant of participants) {
          if (participant.playerId !== formData.winnerId) {
            const { error: lossTransactionError } = await supabase
              .from('transactions')
              .insert({
                playerId: participant.playerId,
                gameId: gameId,
                amount: -participant.buyInAmount, // Negative amount for loss
                type: 'loss',
                description: `Loss for game: ${formData.name}`,
                timestamp: new Date().toISOString()
              });
              
            if (lossTransactionError) throw lossTransactionError;
          }
        }
      }
      
      // Handle changing winners for a completed game
      if (winnerChanged && game?.winnerId && game.status === 'completed') {
        // Get total pot amount from the game
        const potAmount = game.potAmount;
        
        // Remove win from previous winner
        // 1. Delete the win transaction
        const { error: deleteTransactionError } = await supabase
          .from('transactions')
          .delete()
          .eq('gameId', gameId)
          .eq('playerId', game.winnerId)
          .eq('type', 'win');
          
        if (deleteTransactionError) throw deleteTransactionError;
        
        // 2. Update previous winner's balance (subtract pot amount)
        const { error: updateOldWinnerError } = await supabase
          .from('players')
          .update({
            balance: supabase.rpc('decrement', { x: potAmount })
          })
          .eq('id', game.winnerId);
          
        if (updateOldWinnerError) throw updateOldWinnerError;
        
        // 3. Create a win transaction for the new winner
        const { error: newWinTransactionError } = await supabase
          .from('transactions')
          .insert({
            playerId: formData.winnerId,
            gameId: gameId,
            amount: potAmount,
            type: 'win',
            description: `Win for game: ${formData.name}`,
            timestamp: new Date().toISOString()
          });
          
        if (newWinTransactionError) throw newWinTransactionError;
        
        // 4. Update new winner's balance
        const { error: updateNewWinnerError } = await supabase
          .from('players')
          .update({
            balance: supabase.rpc('increment', { x: potAmount })
          })
          .eq('id', formData.winnerId);
          
        if (updateNewWinnerError) throw updateNewWinnerError;
      }
      
      // Success!
      setSuccess(true);
      
      // Redirect back to the game page after a delay
      setTimeout(() => {
        router.push(`/games/${gameId}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating game:', error);
      setError(error.message || 'Failed to update game');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </main>
    );
  }

  if (error && !game) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-600">
            <p>{error}</p>
            <div className="mt-4">
              <Link href="/games" className="text-navy hover:underline">
                Back to Games
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <TrophyIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-green-800 mb-2">Game Updated Successfully!</h2>
            <p className="text-green-700 mb-4">Redirecting back to game details...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href={`/games/${gameId}`} 
            className="inline-flex items-center text-navy hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Game
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Edit Game</h1>
              <p className="text-sm text-gray-500">
                Update game details and status
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="max-w-2xl">
            {/* Game Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Game Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
                required
              />
            </div>
            
            {/* Game Status */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Game Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              {formData.status === 'completed' && !formData.winnerId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  Please select a winner when marking a game as completed
                </p>
              )}
            </div>
            
            {/* Winner Selection (only if status is completed) */}
            <div className={`mb-6 ${formData.status !== 'completed' ? 'opacity-50' : ''}`}>
              <label htmlFor="winnerId" className="block text-sm font-medium text-gray-700 mb-1">
                Winner
              </label>
              <select
                id="winnerId"
                name="winnerId"
                value={formData.winnerId}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy focus:border-navy"
                disabled={formData.status !== 'completed'}
              >
                <option value="">Select a winner</option>
                {participants.map((participant) => (
                  <option key={participant.playerId} value={participant.playerId}>
                    {participant.playerName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Game Participants (readonly) */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Game Participants</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md">
                {participants.length === 0 ? (
                  <div className="p-4 text-gray-500 text-sm text-center">
                    No participants in this game
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buy-in
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant) => (
                        <tr key={participant.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {participant.playerName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            {formatCurrency(participant.buyInAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-500">
                          Total Pot
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-green-600">
                          {game ? formatCurrency(game.potAmount) : '$0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
              
              {formData.status === 'completed' && formData.winnerId && (
                <p className="mt-2 text-sm text-gray-600">
                  Setting a winner will distribute the pot amount of {game ? formatCurrency(game.potAmount) : '$0.00'} to the selected player.
                </p>
              )}
            </div>
            
            {/* Warning about changing winners */}
            {game?.status === 'completed' && game.winnerId && formData.winnerId && game.winnerId !== formData.winnerId && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
                <p className="font-medium mb-1">Warning: Changing the Winner</p>
                <p>
                  You are changing the winner from a previously completed game. This will:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Remove the pot amount ({game ? formatCurrency(game.potAmount) : '$0.00'}) from the previous winner's balance</li>
                  <li>Add the pot amount to the new winner's balance</li>
                  <li>Update all related transaction records</li>
                </ul>
              </div>
            )}
            
            {/* Submit button */}
            <div className="flex items-center justify-end space-x-3">
              <Link
                href={`/games/${gameId}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 
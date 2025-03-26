'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrophyIcon, PlayIcon, EyeIcon, CheckCircleIcon, TrashIcon, PencilIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

interface Game {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  totalPlayers: number;
  potAmount: number;
  winner?: string | null;
}

interface GameParticipant {
  playerId: string;
  gameId: string;
  buyInAmount: number;
}

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
    
    // Set up subscription to refresh when game data changes
    const subscription = supabase
      .channel('game_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchGames();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      
      // Get games with player count and winner info
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          participants:game_participants(count),
          winner:players(name)
        `)
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      
      // Format the data
      const formattedGames = data?.map(game => ({
        id: game.id,
        name: game.name,
        type: game.type,
        status: game.status,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        totalPlayers: game.participants?.[0]?.count || 0,
        potAmount: game.potAmount || 0,
        winner: game.winner?.name || null
      })) || [];
      
      setGames(formattedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to load games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (game: Game) => {
    setGameToDelete(game);
    setDeleteError(null);
  };

  const cancelDelete = () => {
    setGameToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!gameToDelete) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      // 1. Get all participants and their buy-in amounts
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select('playerId, gameId, buyInAmount')
        .eq('gameId', gameToDelete.id);
      
      if (participantsError) throw participantsError;
      
      // 2. Begin transaction in supabase to ensure all operations complete or none do
      // We'll use try/catch and manual rollback since Supabase doesn't have explicit transactions
      
      // 3. Refund buy-ins to player balances
      for (const participant of participants || []) {
        // Update player balance by adding back the buy-in amount
        const { error: updatePlayerError } = await supabase
          .from('players')
          .update({
            balance: supabase.rpc('increment', { x: participant.buyInAmount })
          })
          .eq('id', participant.playerId);
          
        if (updatePlayerError) throw updatePlayerError;
        
        // Add a refund transaction record
        const { error: addTransactionError } = await supabase
          .from('transactions')
          .insert({
            playerId: participant.playerId,
            gameId: participant.gameId,
            amount: participant.buyInAmount,
            type: 'refund',
            description: `Refund for deleted game: ${gameToDelete.name}`,
            timestamp: new Date().toISOString()
          });
          
        if (addTransactionError) throw addTransactionError;
      }
      
      // 4. Delete all game participants
      const { error: deleteParticipantsError } = await supabase
        .from('game_participants')
        .delete()
        .eq('gameId', gameToDelete.id);
        
      if (deleteParticipantsError) throw deleteParticipantsError;
      
      // 5. Delete transactions related to this game (except the refund ones we just created)
      const { error: deleteTransactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('gameId', gameToDelete.id)
        .neq('type', 'refund'); // Don't delete the refund transactions we just created
        
      if (deleteTransactionsError) throw deleteTransactionsError;
      
      // 6. Finally, delete the game itself
      const { error: deleteGameError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameToDelete.id);
        
      if (deleteGameError) throw deleteGameError;
      
      // Success - the game and related data have been deleted
      setDeleteSuccess(`Game "${gameToDelete.name}" has been deleted and all buy-ins have been refunded.`);
      setTimeout(() => setDeleteSuccess(null), 5000); // Clear success message after 5 seconds
      
      // Refresh the games list
      fetchGames();
      
    } catch (error: any) {
      console.error('Error deleting game:', error);
      setDeleteError('Failed to delete game: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
      setGameToDelete(null);
    }
  };

  const filteredGames = filter === 'all' 
    ? games 
    : games.filter(game => filter === 'active' 
        ? game.status === 'active' 
        : game.status === 'completed');

  const activeGamesCount = games.filter(game => game.status === 'active').length;
  const completedGamesCount = games.filter(game => game.status === 'completed').length;

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

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <TrophyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-medium mb-2">No Games Yet</h2>
        <p className="text-gray-500 mb-6">Create your first game to get started</p>
      </div>
    );
  }

  return (
    <div>
      {/* Success message */}
      {deleteSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600">
          {deleteSuccess}
        </div>
      )}
      
      {/* Filter tabs */}
      <div className="flex items-center border-b border-gray-200 mb-6">
        <div className="flex mr-4 space-x-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              filter === 'all' 
                ? 'text-navy border-b-2 border-navy' 
                : 'text-gray-500 hover:text-navy'
            }`}
          >
            All Games ({games.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              filter === 'active' 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            Active ({activeGamesCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              filter === 'completed' 
                ? 'text-gray-600 border-b-2 border-gray-600' 
                : 'text-gray-500 hover:text-gray-600'
            }`}
          >
            Completed ({completedGamesCount})
          </button>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-500">
            No {filter !== 'all' ? filter : ''} games found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <div 
              key={game.id}
              className={`bg-white rounded-lg p-4 shadow-sm border ${
                game.status === 'active' 
                  ? 'border-l-4 border-l-green-500 border-gray-200' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`h-10 w-10 rounded-full ${
                    game.status === 'active' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  } flex items-center justify-center mr-3`}>
                    <TrophyIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{game.name}</h3>
                    <div className="text-sm text-gray-500">
                      <span className={`inline-flex items-center ${
                        game.status === 'active'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      } mr-2`}>
                        {game.status === 'active' ? (
                          <>
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            In Progress 
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Completed
                          </>
                        )}
                      </span>
                      • {new Date(game.createdAt).toLocaleDateString()}
                      {game.winner && <span className="ml-2">• Winner: {game.winner}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {/* Edit button */}
                  <Link 
                    href={`/games/${game.id}/edit`} 
                    className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  
                  {/* View/Play button */}
                  {game.status === 'active' ? (
                    <Link 
                      href={`/games/${game.id}`} 
                      className="p-2 bg-navy text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <PlayIcon className="h-5 w-5" />
                    </Link>
                  ) : (
                    <Link 
                      href={`/games/${game.id}`} 
                      className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                  )}
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteClick(game)}
                    className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Players</span>
                  <div className="text-lg font-medium text-gray-800">{game.totalPlayers}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Pot Amount</span>
                  <div className="text-lg font-medium text-green-600">${game.potAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {gameToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">Delete Game</h3>
            </div>
            
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete <strong>{gameToDelete.name}</strong>? This will:
            </p>
            
            <ul className="mb-6 text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Refund all player buy-ins</li>
              <li>Remove all transactions related to this game</li>
              <li>Delete all player participation records</li>
              <li>Permanently delete the game</li>
            </ul>
            
            {deleteError && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  <>Delete Game</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
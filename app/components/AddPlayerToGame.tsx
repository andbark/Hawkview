'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface Player {
  id: string;
  name: string;
  balance: number;
}

interface AddPlayerToGameProps {
  gameId: string;
  onPlayerAdded?: () => void;
}

export default function AddPlayerToGame({ gameId, onPlayerAdded }: AddPlayerToGameProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [buyInAmount, setBuyInAmount] = useState<string>('25');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayersLoading, setIsPlayersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load all players that are not already in this game
  useEffect(() => {
    const fetchAvailablePlayers = async () => {
      try {
        setIsPlayersLoading(true);
        
        // First get all players who are already in the game
        const { data: existingParticipants, error: participantsError } = await supabase
          .from('game_participants')
          .select('playerId')
          .eq('gameId', gameId);
          
        if (participantsError) throw participantsError;
        
        // Get the IDs of players already in the game
        const existingPlayerIds = existingParticipants.map(p => p.playerId);
        
        // Now fetch all players who are not already in the game
        let query = supabase
          .from('players')
          .select('id, name, balance');
          
        if (existingPlayerIds.length > 0) {
          query = query.not('id', 'in', existingPlayerIds);
        }
        
        const { data: availablePlayers, error: playersError } = await query;
        
        if (playersError) throw playersError;
        
        setPlayers(availablePlayers || []);
        
        // If we have available players, select the first one by default
        if (availablePlayers && availablePlayers.length > 0) {
          setSelectedPlayerId(availablePlayers[0].id);
        }
      } catch (error) {
        console.error('Error loading available players:', error);
        setError('Failed to load available players');
      } finally {
        setIsPlayersLoading(false);
      }
    };
    
    fetchAvailablePlayers();
  }, [gameId]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous messages
    setError(null);
    setSuccessMessage(null);
    
    // Validate form
    if (!selectedPlayerId) {
      setError('Please select a player');
      return;
    }
    
    const buyInValue = parseFloat(buyInAmount);
    if (isNaN(buyInValue) || buyInValue <= 0) {
      setError('Please enter a valid buy-in amount');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Find the selected player
      const selectedPlayer = players.find(p => p.id === selectedPlayerId);
      if (!selectedPlayer) {
        throw new Error('Selected player not found');
      }
      
      // Check if player has sufficient balance
      if (selectedPlayer.balance < buyInValue) {
        setError('Player does not have sufficient funds for this buy-in amount');
        return;
      }
      
      // 1. Create a game_participants record
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          gameId,
          playerId: selectedPlayerId,
          buyInAmount: buyInValue,
          joinedAt: new Date().toISOString()
        });
        
      if (participantError) throw participantError;
      
      // 2. Create a transaction record for the buy-in
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          playerId: selectedPlayerId,
          amount: -buyInValue, // Negative because player is spending money
          type: 'bet',
          gameId,
          timestamp: new Date().toISOString(),
          description: `Buy-in for game`
        });
        
      if (transactionError) throw transactionError;
      
      // 3. Update the game pot amount
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ 
          potAmount: supabase.rpc('increment', { x: buyInValue })
        })
        .eq('id', gameId);
        
      if (gameUpdateError) throw gameUpdateError;
      
      // 4. Update player balance
      const { error: playerUpdateError } = await supabase
        .from('players')
        .update({ 
          balance: supabase.rpc('decrement', { x: buyInValue })
        })
        .eq('id', selectedPlayerId);
        
      if (playerUpdateError) throw playerUpdateError;
      
      // Success! Show message and reset form
      const playerName = selectedPlayer.name;
      setSuccessMessage(`${playerName} has been added to the game with a $${buyInValue} buy-in`);
      
      // Reset form
      setSelectedPlayerId(players[0]?.id || '');
      setBuyInAmount('25');
      
      // Notify parent component
      if (onPlayerAdded) {
        onPlayerAdded();
      }
      
      // Reload available players
      const { data: refreshedPlayers, error: refreshError } = await supabase
        .from('players')
        .select('id, name, balance')
        .not('id', 'in', [...(players.filter(p => p.id === selectedPlayerId).map(p => p.id))]);
        
      if (!refreshError && refreshedPlayers) {
        setPlayers(refreshedPlayers);
        if (refreshedPlayers.length > 0) {
          setSelectedPlayerId(refreshedPlayers[0].id);
        }
      }
    } catch (error) {
      console.error('Error adding player to game:', error);
      setError('Failed to add player to the game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add Player to Game</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      
      {isPlayersLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded-md text-gray-500">
          All players are already in this game
        </div>
      ) : (
        <form onSubmit={handleAddPlayer}>
          <div className="mb-4">
            <label htmlFor="player" className="block text-sm font-medium text-gray-700 mb-1">
              Select Player
            </label>
            <select
              id="player"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} (Balance: ${player.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="buyInAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Buy-in Amount ($)
            </label>
            <input
              id="buyInAmount"
              type="number"
              min="1"
              step="0.01"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || players.length === 0}
            className="w-full flex justify-center items-center bg-navy text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Adding Player...</span>
              </>
            ) : (
              <>
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Add Player
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
} 
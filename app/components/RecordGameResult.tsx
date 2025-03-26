'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrophyIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

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
  player: Player;
}

interface RecordGameResultProps {
  gameId: string;
  onGameEnded?: () => void;
}

export default function RecordGameResult({ gameId, onGameEnded }: RecordGameResultProps) {
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [winAmount, setWinAmount] = useState<string>('');
  const [potAmount, setPotAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load game participants
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsDataLoading(true);
        
        // First get the pot amount from the game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('potAmount')
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        
        if (gameData) {
          setPotAmount(gameData.potAmount);
          // Set default win amount to pot amount
          setWinAmount(gameData.potAmount.toString());
        }
        
        // Then get all participants
        const { data: gameParticipants, error: participantsError } = await supabase
          .from('game_participants')
          .select(`
            id,
            playerId,
            gameId,
            buyInAmount,
            joinedAt,
            player:players(id, name, balance)
          `)
          .eq('gameId', gameId)
          .order('joinedAt', { ascending: true });
          
        if (participantsError) throw participantsError;
        
        if (gameParticipants && gameParticipants.length > 0) {
          // Fix for TypeScript error - ensure each participant has proper player object structure
          const formattedParticipants = gameParticipants.map(participant => ({
            ...participant,
            player: {
              id: participant.player?.[0]?.id || '',
              name: participant.player?.[0]?.name || 'Unknown Player',
              balance: participant.player?.[0]?.balance || 0
            }
          }));
          
          setParticipants(formattedParticipants);
          // Set first participant as default winner
          setSelectedWinnerId(formattedParticipants[0].playerId);
        }
      } catch (error) {
        console.error('Error loading game participants:', error);
        setError('Failed to load game participants');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchParticipants();
  }, [gameId]);

  const handleEndGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous messages
    setError(null);
    setSuccessMessage(null);
    
    // Validate form
    if (!selectedWinnerId) {
      setError('Please select a winner');
      return;
    }
    
    const winValue = parseFloat(winAmount);
    if (isNaN(winValue) || winValue <= 0) {
      setError('Please enter a valid win amount');
      return;
    }
    
    if (winValue > potAmount) {
      setError(`Win amount cannot exceed pot amount of $${potAmount.toFixed(2)}`);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Find the selected player
      const selectedParticipant = participants.find(p => p.playerId === selectedWinnerId);
      if (!selectedParticipant) {
        throw new Error('Selected winner not found');
      }
      
      // 1. Create a transaction record for the win
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          playerId: selectedWinnerId,
          amount: winValue, // Positive amount for a win
          type: 'win',
          gameId,
          timestamp: new Date().toISOString(),
          description: `Game win`
        });
        
      if (transactionError) throw transactionError;
      
      // 2. Update the game status to completed
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ 
          status: 'completed',
          winnerId: selectedWinnerId,
          winAmount: winValue,
          endedAt: new Date().toISOString()
        })
        .eq('id', gameId);
        
      if (gameUpdateError) throw gameUpdateError;
      
      // 3. Update winner's balance
      const { error: playerUpdateError } = await supabase
        .from('players')
        .update({ 
          balance: supabase.rpc('increment', { x: winValue })
        })
        .eq('id', selectedWinnerId);
        
      if (playerUpdateError) throw playerUpdateError;
      
      // Success! Show message
      const winnerName = selectedParticipant.player.name;
      setSuccessMessage(`${winnerName} has been recorded as the winner with $${winValue.toFixed(2)}`);
      
      // Notify parent component
      if (onGameEnded) {
        onGameEnded();
      }
    } catch (error) {
      console.error('Error recording game result:', error);
      setError('Failed to record game result. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">End Game & Record Winner</h3>
      
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
      
      {isDataLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded-md text-gray-500">
          No players in this game yet
        </div>
      ) : (
        <form onSubmit={handleEndGame}>
          <div className="mb-4 p-3 bg-blue-50 rounded-md text-blue-700 text-sm">
            Current pot amount: {formatCurrency(potAmount)}
          </div>
          
          <div className="mb-4">
            <label htmlFor="winner" className="block text-sm font-medium text-gray-700 mb-1">
              Select Winner
            </label>
            <select
              id="winner"
              value={selectedWinnerId}
              onChange={(e) => setSelectedWinnerId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {participants.map((participant) => (
                <option key={participant.playerId} value={participant.playerId}>
                  {participant.player.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="winAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Win Amount ($)
            </label>
            <input
              id="winAmount"
              type="number"
              min="1"
              step="0.01"
              max={potAmount}
              value={winAmount}
              onChange={(e) => setWinAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum: {formatCurrency(potAmount)}
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || participants.length === 0}
            className="w-full flex justify-center items-center bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Ending Game...</span>
              </>
            ) : (
              <>
                <TrophyIcon className="w-5 h-5 mr-2" />
                End Game & Record Winner
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
} 
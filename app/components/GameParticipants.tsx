'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface GameParticipant {
  id: string;
  playerId: string;
  gameId: string;
  buyInAmount: number;
  joinedAt: string;
  player: {
    id: string;
    name: string;
    balance: number;
  };
}

interface GameParticipantsProps {
  gameId: string;
  refreshTrigger?: number;
}

export default function GameParticipants({ gameId, refreshTrigger = 0 }: GameParticipantsProps) {
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load game participants
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        
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
        } else {
          setParticipants([]);
        }
      } catch (error) {
        console.error('Error loading game participants:', error);
        setError('Failed to load game participants. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParticipants();
  }, [gameId, refreshTrigger]);

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        {error}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <UserIcon className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-lg font-medium">No players have joined this game yet</p>
        <p className="text-sm">Add players to get started</p>
      </div>
    );
  }

  // Calculate total pot
  const totalBuyIn = participants.reduce((sum, participant) => sum + participant.buyInAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Players</h3>
        <span className="text-sm text-gray-500">
          Total pot: {formatCurrency(totalBuyIn)}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buy-in
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((participant) => (
              <tr key={participant.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{participant.player.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className="text-green-600 font-medium">
                    {formatCurrency(participant.buyInAmount)}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(participant.joinedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
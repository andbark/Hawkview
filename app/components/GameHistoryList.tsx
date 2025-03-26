'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClockIcon, TrophyIcon, EyeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

interface GameHistory {
  id: string;
  name: string;
  type: string;
  status: string;
  completedAt: string;
  winner: {
    id: string;
    name: string;
    amount: number;
  } | null;
  totalPlayers: number;
  potAmount: number;
}

export default function GameHistoryList() {
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        setLoading(true);
        
        // Get completed games
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select(`
            *,
            participants:game_participants(count)
          `)
          .eq('status', 'completed')
          .order('updatedAt', { ascending: false });
          
        if (gameError) throw gameError;
        
        if (gameData) {
          // Get winners for each game
          const gameIds = gameData.map(game => game.id);
          
          const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .select(`
              *,
              players:playerId(
                id,
                name
              )
            `)
            .in('gameId', gameIds)
            .eq('type', 'win')
            .order('timestamp', { ascending: false });
            
          if (transactionError) throw transactionError;
          
          // Process and combine the data
          const formattedGames = gameData.map(game => {
            const winnerTransaction = transactionData?.find(t => t.gameId === game.id);
            
            return {
              id: game.id,
              name: game.name,
              type: game.type,
              status: game.status,
              completedAt: game.updatedAt || game.createdAt,
              winner: winnerTransaction ? {
                id: winnerTransaction.playerId,
                name: winnerTransaction.players?.name || 'Unknown Player',
                amount: winnerTransaction.amount
              } : null,
              totalPlayers: game.participants?.[0]?.count || 0,
              potAmount: game.potAmount || 0
            };
          });
          
          setGames(formattedGames);
        }
      } catch (error) {
        console.error('Error fetching game history:', error);
        setError('Failed to load game history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameHistory();
    
    // Set up subscription to refresh when game data changes
    const subscription = supabase
      .channel('game_history_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
        fetchGameHistory();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
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

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-medium mb-2">No Game History Yet</h2>
        <p className="text-gray-500 mb-6">Completed games will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {games.map((game) => (
        <div 
          key={game.id}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <div className="mr-3">
                  {game.type === 'poker' && (
                    <span className="text-2xl">🃏</span>
                  )}
                  {game.type === 'blackjack' && (
                    <span className="text-2xl">♠️</span>
                  )}
                  {game.type === 'roulette' && (
                    <span className="text-2xl">🎰</span>
                  )}
                  {game.type === 'craps' && (
                    <span className="text-2xl">🎲</span>
                  )}
                  {game.type === 'other' && (
                    <span className="text-2xl">🎮</span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 text-lg">{game.name}</h3>
                  <div className="text-sm text-gray-500">
                    {new Date(game.completedAt).toLocaleDateString()} • {game.totalPlayers} players
                  </div>
                </div>
              </div>
              
              {game.winner && (
                <div className="mt-4 flex items-center">
                  <TrophyIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    Winner: <span className="font-medium">{game.winner.name}</span> 
                    <span className="text-green-600 ml-2">(+${game.winner.amount.toFixed(2)})</span>
                  </span>
                </div>
              )}
            </div>
            
            <Link 
              href={`/games/${game.id}`} 
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <EyeIcon className="h-5 w-5" />
            </Link>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Pot</span>
              <span className="font-medium text-navy">${game.potAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
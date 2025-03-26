'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrophyIcon, PlayIcon, EyeIcon } from '@heroicons/react/24/outline';
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
}

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        // Get games with player count
        const { data, error } = await supabase
          .from('games')
          .select(`
            *,
            participants:game_participants(count)
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
          potAmount: game.potAmount || 0
        })) || [];
        
        setGames(formattedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
        setError('Failed to load games. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
    
    // Set up subscription to refresh when game data changes
    const subscription = supabase
      .channel('game_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
        fetchGames();
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
        <TrophyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-medium mb-2">No Games Yet</h2>
        <p className="text-gray-500 mb-6">Create your first game to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {games.map((game) => (
          <div 
            key={game.id}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <TrophyIcon className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{game.name}</h3>
                  <div className="text-sm text-gray-500">
                    {game.type} • {game.status === 'active' ? 'In Progress' : 'Completed'} • {new Date(game.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {game.status === 'active' && (
                  <Link 
                    href={`/games/${game.id}`} 
                    className="p-2 bg-navy text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <PlayIcon className="h-5 w-5" />
                  </Link>
                )}
                {game.status !== 'active' && (
                  <Link 
                    href={`/games/${game.id}`} 
                    className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                )}
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
    </div>
  );
} 
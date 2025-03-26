'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserGroupIcon, UserIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  colorScheme: string;
  balance: number;
  createdAt: string;
}

const colorAccents = {
  'purple': 'border-l-4 border-purple-500',
  'blue': 'border-l-4 border-blue-500', 
  'green': 'border-l-4 border-green-500',
  'red': 'border-l-4 border-red-500',
  'amber': 'border-l-4 border-amber-500',
  'teal': 'border-l-4 border-teal-500',
  'slate': 'border-l-4 border-slate-500',
  'gray': 'border-l-4 border-gray-500',
  'zinc': 'border-l-4 border-zinc-500',
  'stone': 'border-l-4 border-stone-500',
  'default': 'border-l-4 border-navy'
};

export default function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setPlayers(data || []);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load players. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
    
    // Set up subscription to refresh when player data changes
    const subscription = supabase
      .channel('player_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, payload => {
        fetchPlayers();
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
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-medium mb-2">No Players Yet</h2>
        <p className="text-gray-500 mb-6">Create your first player to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div 
            key={player.id}
            className={`bg-white rounded-lg p-4 shadow-sm ${colorAccents[player.colorScheme as keyof typeof colorAccents] || colorAccents.default}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{player.name}</h3>
                  <div className="text-sm text-gray-500">
                    Added {new Date(player.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Link href={`/players/${player.id}`} className="text-navy hover:text-blue-700">
                <PencilSquareIcon className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">Current Balance</span>
              <span className={`text-lg font-medium ${player.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${player.balance.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
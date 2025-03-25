'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface Winner {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  amount: number;
  timestamp: number;
  colorScheme: string;
}

// Updated to more subtle, navy-based colors
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

export default function RecentWinners() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentWinners = async () => {
      try {
        setLoading(true);
        
        // Get transactions for game winners
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select(`
            *,
            games:gameId(
              id,
              name
            ),
            players:playerId(
              id,
              name,
              colorScheme
            )
          `)
          .eq('type', 'win')
          .order('timestamp', { ascending: false })
          .limit(5);
          
        if (transactionsError) throw transactionsError;
        
        if (transactionsData && transactionsData.length > 0) {
          const formattedWinners = transactionsData.map(transaction => ({
            id: transaction.playerId,
            name: transaction.players?.name || 'Unknown Player',
            gameId: transaction.gameId,
            gameName: transaction.games?.name || 'Unknown Game',
            amount: transaction.amount,
            timestamp: transaction.timestamp,
            colorScheme: transaction.players?.colorScheme || 'blue'
          }));
          
          setWinners(formattedWinners);
        }
      } catch (error) {
        console.error('Error fetching recent winners:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentWinners();
    
    // Set up subscription to refresh winners when new transactions are added
    const subscription = supabase
      .channel('recent_winners_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, payload => {
        fetchRecentWinners();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-gray-800">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Recent Winners</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-gray-800">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Recent Winners</h2>
        <div className="p-8 text-center">
          <TrophyIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No winners yet. Start playing games!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-800">Recent Winners</h2>
        <Link 
          href="/leaderboard" 
          className="text-sm text-navy hover:text-blue-700 flex items-center transition-colors duration-200"
        >
          See full leaderboard <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {winners.map((winner) => (
          <div 
            key={`${winner.gameId}-${winner.id}`}
            className={`bg-white rounded-lg p-4 shadow-sm ${colorAccents[winner.colorScheme as keyof typeof colorAccents] || colorAccents.default}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-amber-500" />
                <div>
                  <div className="font-medium text-gray-800">{winner.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(winner.timestamp).toLocaleDateString()} - {winner.gameName}
                  </div>
                </div>
              </div>
              <div className="text-xl font-medium text-navy">${winner.amount.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
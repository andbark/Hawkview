'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import AppNavigation from '../../components/AppNavigation';
import AddPlayerToGame from '../../components/AddPlayerToGame';
import GameParticipants from '../../components/GameParticipants';
import RecordGameResult from '../../components/RecordGameResult';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  TrophyIcon, 
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

interface Game {
  id: string;
  name: string;
  type: string;
  status: string;
  potAmount: number;
  createdAt: string;
  updatedAt: string | null;
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.id as string;
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load game details
  useEffect(() => {
    const loadGameDetails = async () => {
      if (!gameId) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (error) throw error;
        
        setGame(data as Game);
      } catch (error) {
        console.error('Error loading game details:', error);
        setError('Failed to load game details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadGameDetails();
  }, [gameId]);

  // Handle refresh when players are added or game is ended
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    // Reload game data to get updated pot amount, etc.
    loadGameData();
  };

  // Dedicated function to load game data
  const loadGameData = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (error) throw error;
      
      setGame(data as Game);
    } catch (error) {
      console.error('Error reloading game data:', error);
    }
  };

  // Game type emoji
  const getGameTypeEmoji = (type: string): string => {
    switch (type) {
      case 'poker':
        return '🃏';
      case 'blackjack':
        return '♠️';
      case 'roulette':
        return '🎰';
      case 'craps':
        return '🎲';
      default:
        return '🎮';
    }
  };

  if (loading) {
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

  if (error || !game) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 p-6 rounded-lg text-center text-red-600">
            <p className="text-lg mb-4">{error || 'Game not found'}</p>
            <Link 
              href="/games" 
              className="inline-flex items-center text-navy hover:text-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Games
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isActive = game.status === 'active';

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/games" 
            className="inline-flex items-center text-navy hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Games
          </Link>
        </div>
        
        {/* Game header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="text-3xl mr-4">
                {getGameTypeEmoji(game.type)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{game.name}</h1>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="capitalize">{game.type}</span>
                  <span className="mx-2">•</span>
                  <span className={`${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {isActive ? 'In Progress' : 'Completed'}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {new Date(game.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-500 mb-1">Pot Amount</div>
              <div className="text-xl font-bold text-green-600">${game.potAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players section - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <GameParticipants 
                gameId={gameId} 
                refreshTrigger={refreshTrigger} 
              />
            </div>
          </div>
          
          {/* Actions sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            {isActive ? (
              <>
                {/* Add player section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <AddPlayerToGame 
                    gameId={gameId} 
                    onPlayerAdded={handleRefresh} 
                  />
                </div>
                
                {/* End game section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <RecordGameResult 
                    gameId={gameId} 
                    onGameEnded={handleRefresh} 
                  />
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-6 text-center border border-yellow-100">
                <TrophyIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-xl font-medium text-amber-800 mb-2">Game Completed</h3>
                <p className="text-amber-700 mb-4">
                  This game has been marked as complete.
                </p>
                <Link 
                  href="/games" 
                  className="inline-flex items-center justify-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
                >
                  Start a New Game
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from './lib/supabase';
import { logComponent } from './lib/componentLogger';
import AppNavigation from './components/AppNavigation';
import { 
  UserGroupIcon, 
  TrophyIcon, 
  ChartBarSquareIcon, 
  ClockIcon,
  PlusCircleIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './components/LoadingSpinner';

interface Stats {
  totalPlayers: number;
  activeGames: number;
  totalGames: number;
  totalPot: number;
  largestPot: number;
  topPlayer: {
    name: string;
    winnings: number;
    id: string;
  } | null;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    activeGames: 0,
    totalGames: 0,
    totalPot: 0,
    largestPot: 0,
    topPlayer: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log component lifecycle for debugging
  useEffect(() => {
    logComponent('HomePage');
  }, []);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total players count
        const { count: playerCount, error: playerError } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true });
          
        if (playerError) throw playerError;
        
        // Get active games
        const { data: activeGames, error: activeGamesError } = await supabase
          .from('games')
          .select('*')
          .eq('status', 'active');
          
        if (activeGamesError) throw activeGamesError;
        
        // Get all games
        const { data: allGames, error: allGamesError } = await supabase
          .from('games')
          .select('*');
          
        if (allGamesError) throw allGamesError;
        
        // Calculate total pot across active games
        const totalPot = activeGames.reduce((sum, game) => sum + (game.potAmount || 0), 0);
        
        // Find largest pot
        const largestPot = Math.max(...allGames.map(game => game.potAmount || 0), 0);
        
        // Get top player by winnings
        const { data: topPlayer, error: topPlayerError } = await supabase
          .from('players')
          .select('id, name, balance')
          .order('balance', { ascending: false })
          .limit(1)
          .single();
          
        if (topPlayerError && topPlayerError.code !== 'PGRST116') {
          // PGRST116 is the error for no rows returned, which is fine
          throw topPlayerError;
        }
        
        setStats({
          totalPlayers: playerCount || 0,
          activeGames: activeGames.length,
          totalGames: allGames.length,
          totalPot,
          largestPot,
          topPlayer: topPlayer ? {
            name: topPlayer.name,
            winnings: topPlayer.balance,
            id: topPlayer.id
          } : null
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bachelor Party Dashboard</h1>
          <p className="text-gray-600">Manage games, players, and track winnings for your bachelor party casino night.</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Total Players</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalPlayers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <TrophyIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Active Games</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeGames}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                    <BanknotesIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Total Active Pot</h2>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalPot)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <ChartBarSquareIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Total Games</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalGames}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link 
                    href="/games/new" 
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 bg-navy rounded-md p-2">
                      <PlusCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Create New Game</h4>
                      <p className="text-sm text-gray-500">Start a new poker or casino game</p>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/players/new" 
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 bg-navy rounded-md p-2">
                      <UserGroupIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Add New Player</h4>
                      <p className="text-sm text-gray-500">Register a player for games</p>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/games" 
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 bg-navy rounded-md p-2">
                      <TrophyIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Manage Games</h4>
                      <p className="text-sm text-gray-500">View and manage all games</p>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/leaderboard" 
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 bg-navy rounded-md p-2">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">View Leaderboard</h4>
                      <p className="text-sm text-gray-500">See player rankings and stats</p>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Insights */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Insights</h3>
                
                <div className="space-y-6">
                  {stats.topPlayer && (
                    <div className="border-b border-gray-100 pb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Top Player</h4>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <Link 
                            href={`/players/${stats.topPlayer.id}`}
                            className="text-base font-medium text-gray-900 hover:text-navy transition-colors"
                          >
                            {stats.topPlayer.name}
                          </Link>
                          <p className="text-sm text-green-600 font-medium">
                            {formatCurrency(stats.topPlayer.winnings)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-b border-gray-100 pb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Largest Pot</h4>
                    <p className="text-xl font-semibold text-amber-600">
                      {formatCurrency(stats.largestPot)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Recent Activity</h4>
                    {stats.activeGames > 0 ? (
                      <div className="text-sm text-gray-700">
                        <p className="mb-2">{stats.activeGames} active games in progress</p>
                        <Link 
                          href="/games" 
                          className="text-navy hover:text-blue-700 font-medium"
                        >
                          View active games →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No active games at the moment</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
} 
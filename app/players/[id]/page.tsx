'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AppNavigation from '../../components/AppNavigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  BanknotesIcon, 
  TrophyIcon, 
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  playerId: string;
  gameId: string;
  amount: number;
  type: 'win' | 'bet' | 'refund' | 'adjustment';
  timestamp: string;
  description: string;
  game?: {
    name: string;
    id: string;
  } | null;
}

interface PlayerStats {
  totalGamesPlayed: number;
  totalWins: number;
  largestWin: number;
  totalBuyIns: number;
  netProfit: number;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.id as string;
  const router = useRouter();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PlayerStats>({
    totalGamesPlayed: 0,
    totalWins: 0,
    largestWin: 0,
    totalBuyIns: 0,
    netProfit: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        
        if (!playerId) {
          setError('No player ID provided');
          return;
        }
        
        // Get player details
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();
          
        if (playerError) throw playerError;
        
        if (!playerData) {
          setError('Player not found');
          return;
        }
        
        setPlayer(playerData);
        
        // Get player transactions with game info
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            *,
            game:games(id, name)
          `)
          .eq('playerId', playerId)
          .order('timestamp', { ascending: false });
          
        if (transactionError) throw transactionError;
        
        setTransactions(transactionData || []);
        
        // Calculate player statistics
        const gameParticipations = new Set();
        let wins = 0;
        let largestWin = 0;
        let totalBuyIns = 0;
        let totalWinnings = 0;
        
        transactionData?.forEach((transaction: Transaction) => {
          if (transaction.gameId) {
            gameParticipations.add(transaction.gameId);
          }
          
          if (transaction.type === 'win') {
            wins++;
            totalWinnings += transaction.amount;
            if (transaction.amount > largestWin) {
              largestWin = transaction.amount;
            }
          }
          
          if (transaction.type === 'bet') {
            totalBuyIns += Math.abs(transaction.amount);
          }
        });
        
        setStats({
          totalGamesPlayed: gameParticipations.size,
          totalWins: wins,
          largestWin,
          totalBuyIns,
          netProfit: playerData.balance
        });
        
      } catch (error) {
        console.error('Error loading player data:', error);
        setError('Failed to load player data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerData();
  }, [playerId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case 'win':
        return <ArrowUpCircleIcon className="h-5 w-5 text-green-500" />;
      case 'bet':
        return <ArrowDownCircleIcon className="h-5 w-5 text-red-500" />;
      case 'refund':
        return <ArrowUpCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'adjustment':
        return amount >= 0 
          ? <ArrowUpCircleIcon className="h-5 w-5 text-purple-500" />
          : <ArrowDownCircleIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BanknotesIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
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

  if (error || !player) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 p-6 rounded-lg text-center text-red-600">
            <p className="text-lg mb-4">{error || 'Player not found'}</p>
            <Link 
              href="/players" 
              className="inline-flex items-center text-navy hover:text-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Players
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/players" 
            className="inline-flex items-center text-navy hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Players
          </Link>
        </div>
        
        {/* Player header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16 bg-navy rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5">
                <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Joined {formatDate(player.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-500 mb-1">Current Balance</div>
              <div className={`text-xl font-bold ${player.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(player.balance)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BanknotesIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p className="text-sm">This player hasn't participated in any games</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Game
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTransactionIcon(transaction.type, transaction.amount)}
                              <span className="ml-2 capitalize text-sm">
                                {transaction.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            {transaction.game ? (
                              <Link 
                                href={`/games/${transaction.gameId}`}
                                className="text-navy hover:text-blue-700"
                              >
                                {transaction.game.name}
                              </Link>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700">
                            {transaction.description || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.timestamp)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-right font-medium">
                            <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Player Statistics</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <TrophyIcon className="h-5 w-5 text-amber-500 mr-3" />
                    <span className="text-gray-700">Games Played</span>
                  </div>
                  <span className="font-medium">{stats.totalGamesPlayed}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <TrophyIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Total Wins</span>
                  </div>
                  <span className="font-medium">{stats.totalWins}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-5 w-5 text-amber-500 mr-3" />
                    <span className="text-gray-700">Largest Win</span>
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(stats.largestWin)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <ArrowDownCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-gray-700">Total Buy-ins</span>
                  </div>
                  <span className="font-medium text-red-600">{formatCurrency(stats.totalBuyIns)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-5 w-5 text-navy mr-3" />
                    <span className="text-gray-700">Net Profit</span>
                  </div>
                  <span className={`font-medium ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netProfit)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <Link 
                  href={`/players/${playerId}/add-funds`}
                  className="flex items-center justify-center bg-navy text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Add Funds
                </Link>
                
                <Link 
                  href={`/games/new?playerId=${playerId}`}
                  className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors w-full"
                >
                  <TrophyIcon className="h-5 w-5 mr-2" />
                  Create Game
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Link from 'next/link';
import { TrophyIcon, CurrencyDollarIcon, ArrowRightIcon, SignalIcon, SignalSlashIcon, FlagIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster, toast } from 'react-hot-toast';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import AdminLoginModal from './components/AdminLoginModal';

export default function Home() {
  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Function to check if we're online
  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };
  
  // Load players and recent winners
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        checkOnlineStatus(); // Initial check
        
        // Fetch active games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('status', 'active');
          
        if (!gamesError && gamesData) {
          setActiveGames(gamesData);
        } else if (gamesError) {
          console.error('Error fetching active games:', gamesError);
        }
        
        // Also get active games from localStorage
        try {
          const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
          if (localGamesStr) {
            const localGames = JSON.parse(localGamesStr);
            const localActiveGames = localGames.filter((g: any) => g.status === 'active');
            
            // Combine with server games, removing duplicates by ID
            const existingIds = new Set(gamesData?.map((g: any) => g.id) || []);
            const filteredLocalGames = localActiveGames.filter((g: any) => !existingIds.has(g.id));
            
            setActiveGames(prev => [...(prev || []), ...filteredLocalGames]);
          }
        } catch (e) {
          console.error('Error loading active games from localStorage:', e);
        }
        
        // Fetch players from Supabase
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .order('balance', { ascending: false });
          
        if (playersError) throw playersError;
        
        if (playersData) {
          // Get local transactions to calculate up-to-date balances
          const localTransactionsStr = localStorage.getItem('transactions');
          let localTransactions: any[] = [];
          
          if (localTransactionsStr) {
            try {
              localTransactions = JSON.parse(localTransactionsStr);
            } catch (e) {
              console.error('Error parsing local transactions:', e);
            }
          }
          
          // Process players with local transactions data
          const formattedPlayers = playersData.map(player => {
            try {
              if (!player.id) return player;
              
              // Get transactions for this player
              const playerTransactions = localTransactions.filter(tx => tx.playerId === player.id);
              
              // Calculate local balance adjustment
              const balanceAdjustment = playerTransactions.reduce((sum, tx) => {
                return sum + (Number(tx.amount) || 0);
              }, 0);
              
              // Return player with adjusted balance
              return {
                ...player,
                balance: (Number(player.balance) || 0) + balanceAdjustment
              };
            } catch (e) {
              console.error(`Error processing local data for player ${player?.id}:`, e);
              return player;
            }
          });
          
          // Sort players by balance
          const sortedPlayers = formattedPlayers.sort((a, b) => b.balance - a.balance);
          setPlayers(sortedPlayers);
        }
        
        // Fetch recent winners from Supabase
        let winnersData = [];
        let winnersError = null;
        
        try {
          // First, just fetch the transaction data without relational queries
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('type', 'win')
            .order('timestamp', { ascending: false })
            .limit(5);
            
          if (transactionsError) {
            throw transactionsError;
          }
          
          // Process winners if we have transaction data
          if (transactionsData && transactionsData.length > 0) {
            winnersData = await Promise.all(
              transactionsData.map(async (transaction) => {
                // Get player name
                let playerName = 'Unknown';
                try {
                  const { data: playerData } = await supabase
                    .from('players')
                    .select('name')
                    .eq('id', transaction.playerId)
                    .single();
                    
                  if (playerData) {
                    playerName = playerData.name;
                  }
                } catch (e) {
                  console.error('Error fetching player data:', e);
                }
                
                // Get game name
                let gameName = 'Unknown Game';
                try {
                  const { data: gameData } = await supabase
                    .from('games')
                    .select('name')
                    .eq('id', transaction.gameId)
                    .single();
                    
                  if (gameData) {
                    gameName = gameData.name;
                  }
                } catch (e) {
                  console.error('Error fetching game data:', e);
                }
                
                return {
                  ...transaction,
                  playerName,
                  gameName
                };
              })
            );
          }
        } catch (error) {
          console.error('Error fetching winners:', error);
          winnersError = error;
        }
        
        // Also fetch local transactions from localStorage
        const localTransactionsStr = localStorage.getItem('transactions');
        let localWinners: any[] = [];
        
        if (localTransactionsStr) {
          try {
            const localTransactions = JSON.parse(localTransactionsStr);
            // Filter for win transactions and sort by timestamp (newest first)
            localWinners = localTransactions
              .filter((tx: any) => tx.type === 'win')
              .sort((a: any, b: any) => b.timestamp - a.timestamp)
              .slice(0, 5);
          } catch (e) {
            console.error('Error parsing local transactions:', e);
          }
        }
        
        // Combine Supabase and localStorage winners
        let combinedWinners = [];
        
        if (winnersError) {
          console.error('Error fetching winners from Supabase:', winnersError);
          toast.error('Failed to load recent winners from server');
          combinedWinners = localWinners;
        } else if (winnersData) {
          // Combine and sort by timestamp
          combinedWinners = [...winnersData, ...localWinners]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
        } else {
          combinedWinners = localWinners;
        }
        
        // Format dates for display
        combinedWinners = combinedWinners.map(winner => {
          let formattedDate = 'Unknown date';
          try {
            if (winner.timestamp) {
              const date = new Date(winner.timestamp);
              formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
          
          return {
            ...winner,
            formattedDate
          };
        });
        
        setRecentWinners(combinedWinners);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
        
        // Try to load players from localStorage
        try {
          const localPlayersStr = localStorage.getItem('players');
          if (localPlayersStr) {
            setPlayers(JSON.parse(localPlayersStr));
          }
          
          // Load local transactions for winners
          const localTransactionsStr = localStorage.getItem('transactions');
          if (localTransactionsStr) {
            const localTransactions = JSON.parse(localTransactionsStr);
            const localWinners = localTransactions
              .filter((tx: any) => tx.type === 'win')
              .sort((a: any, b: any) => b.timestamp - a.timestamp)
              .slice(0, 5);
            setRecentWinners(localWinners);
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up online/offline listeners
    window.addEventListener('online', () => {
      setIsOnline(true);
      toast.success('You are back online');
      fetchData(); // Refresh data when coming back online
    });
    
    window.addEventListener('offline', () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may be limited.');
    });
    
    // Add listener for dataRefresh events
    const handleDataRefresh = (event: any) => {
      console.log('Data refresh event received in home page', event.detail);
      fetchData(); // Reload data when a refresh event is triggered
    };
    
    window.addEventListener('dataRefresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);
  
  // Add a function to handle admin login button click
  const handleAdminAccess = () => {
    setShowAdminLogin(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-white p-4">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-medium text-gray-800">Bachelor Party</h1>
          
          <div className="flex items-center text-sm">
            {isOnline ? (
              <div className="flex items-center text-green-600">
                <SignalIcon className="h-4 w-4 mr-1" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600">
                <SignalSlashIcon className="h-4 w-4 mr-1" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Games and Players */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-navy p-4 flex justify-between items-center">
                <h2 className="text-xl font-medium text-white flex items-center">
                  <TrophyIcon className="h-5 w-5 mr-2 text-amber-300" />
                  Recent Winners
                </h2>
                <Link 
                  href="/game-history" 
                  className="text-sm text-gray-100 hover:text-white flex items-center transition-colors duration-200"
                >
                  <span>View Game History</span>
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="p-4">
                {recentWinners.length > 0 ? (
                  <div className="space-y-4">
                    {recentWinners.map(winner => (
                      <div key={winner.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center">
                          <div className="bg-amber-100 p-2 rounded-full mr-4">
                            <TrophyIcon className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">{winner.playerName}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{winner.gameName || 'Game'}</span>
                              <span className="mx-2">•</span>
                              <span>{winner.formattedDate}</span>
                            </div>
                          </div>
                          <div className="ml-auto text-xl font-medium text-green-600">${winner.amount?.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    
                    <Link
                      href="/game-history"
                      className="inline-flex items-center justify-center w-full py-3 bg-navy text-white rounded-lg hover:bg-blue-800 transition-colors duration-200"
                    >
                      View Game History
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-block bg-gray-100 p-3 rounded-full mb-3">
                      <TrophyIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">No Recent Wins</h3>
                    <p className="text-gray-500 mb-4">Complete games will show winners here</p>
                    <Link
                      href="/games"
                      className="inline-flex items-center justify-center px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
                    >
                      Play Games
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-navy p-4">
                <h2 className="text-xl font-medium text-white">Quick Access</h2>
              </div>
              
              <div className="p-4 grid grid-cols-2 gap-4">
                <Link
                  href="/games"
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-blue-50 p-3 rounded-full mb-3">
                    <svg className="h-6 w-6 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">Games</span>
                </Link>
                
                <Link
                  href="/players"
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-blue-50 p-3 rounded-full mb-3">
                    <svg className="h-6 w-6 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">Players</span>
                </Link>
                
                <Link
                  href="/game-history"
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-blue-50 p-3 rounded-full mb-3">
                    <svg className="h-6 w-6 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">Game History</span>
                </Link>
                
                <Link
                  href="/leaderboard"
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-blue-50 p-3 rounded-full mb-3">
                    <svg className="h-6 w-6 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">Leaderboard</span>
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
              <div className="bg-navy p-4 flex justify-between items-center">
                <h2 className="text-xl font-medium text-white flex items-center">
                  <FlagIcon className="h-5 w-5 mr-2" />
                  Active Games
                </h2>
                <Link 
                  href="/games" 
                  className="text-sm text-gray-100 hover:text-white flex items-center transition-colors duration-200"
                >
                  <span>View All Games</span>
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="p-4">
                {activeGames && activeGames.length > 0 ? (
                  <div className="space-y-3">
                    {activeGames.map(game => (
                      <Link 
                        href={`/games?gameId=${game.id}`} 
                        key={game.id} 
                        className="block bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center">
                          <div className="bg-blue-50 p-2 rounded-full mr-4">
                            <FlagIcon className="h-5 w-5 text-navy" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-800">{game.name}</h3>
                            <div className="text-sm text-gray-500">
                              {game.players?.length || 0} players • ${game.totalPot?.toFixed(2) || '0.00'} pot
                            </div>
                          </div>
                          <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                            Active
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    <Link
                      href="/games"
                      className="inline-flex items-center justify-center w-full py-3 bg-navy text-white rounded-lg hover:bg-blue-800 transition-colors duration-200"
                    >
                      Manage Games
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-block bg-gray-100 p-3 rounded-full mb-3">
                      <FlagIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">No Active Games</h3>
                    <p className="text-gray-500 mb-4">Start a new game to see it here</p>
                    <Link
                      href="/games"
                      className="inline-flex items-center justify-center px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
                    >
                      Start Game
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - Leaderboard */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="bg-navy p-4">
                <h2 className="text-xl font-medium text-white">Player Balances</h2>
              </div>
              
              <div className="p-4">
                {players.length > 0 ? (
                  <div className="space-y-3">
                    {players.slice(0, 5).map((player, index) => (
                      <div key={player.id} className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          index === 0 ? 'bg-amber-400' : 
                          index === 1 ? 'bg-gray-300' : 
                          index === 2 ? 'bg-amber-600' : 
                          'bg-gray-200'
                        }`}>
                          <span className="font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="font-medium text-gray-800">{player.name}</div>
                        <div className={`ml-auto font-medium ${player.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${player.balance?.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    
                    <Link
                      href="/leaderboard"
                      className="inline-flex items-center text-navy hover:text-blue-700 transition-colors duration-200"
                    >
                      View Leaderboard
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-block bg-gray-100 p-3 rounded-full mb-3">
                      <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">No Players Yet</h3>
                    <p className="text-gray-500 mb-4">Create players to start tracking stats</p>
                    <Link
                      href="/players"
                      className="inline-flex items-center justify-center px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
                    >
                      Create Players
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add an admin button in the top-right corner */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleAdminAccess}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          title="Admin Access"
        >
          <ShieldCheckIcon className="h-5 w-5 text-navy" />
        </button>
      </div>
      
      {/* Admin login modal */}
      <AdminLoginModal 
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
      />
    </main>
  );
} 
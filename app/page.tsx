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
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Bachelor Party Dashboard</h1>
      <p className="text-xl mb-8">Track games, bets, and player performance</p>
      <div className="grid gap-4 md:grid-cols-2">
        <a href="/games" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Games</h2>
          <p>Manage poker, blackjack, and other games</p>
        </a>
        <a href="/players" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Players</h2>
          <p>Track player balances and statistics</p>
        </a>
        <a href="/leaderboard" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
          <p>See who's winning and losing the most</p>
        </a>
        <a href="/game-history" className="p-6 border rounded-lg hover:bg-gray-100">
          <h2 className="text-2xl font-bold mb-2">History</h2>
          <p>View past games and transactions</p>
        </a>
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
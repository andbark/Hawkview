'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { TrophyIcon, ArrowLeftIcon, CalendarIcon, ClockIcon, ArrowRightIcon, ShieldCheckIcon, CogIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { getComprehensiveGameHistory } from '../lib/gameHistoryService';

export default function GameHistoryPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isRepairing, setIsRepairing] = useState(false);
  
  useEffect(() => {
    // Check online status before fetching data
    checkOnlineStatus().then(isOnline => {
      fetchGameHistory();
    });
    
    // Add browser online/offline event listeners
    const handleOnline = () => {
      console.log('Browser reports online status');
      checkOnlineStatus();
    };
    
    const handleOffline = () => {
      console.log('Browser reports offline status');
      setIsOnline(false);
      toast.error('You are offline. Working in offline mode.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for data refresh events
    const handleDataRefresh = (event: any) => {
      console.log('Data refresh event detected:', event.detail?.source || 'unknown source');
      
      // Handle different event sources appropriately
      if (event.detail?.source === 'gameDelete') {
        console.log('Game deletion detected, removing game from UI');
        // Handle deletion specifically - remove the game from state if it exists
        if (event.detail?.gameId) {
          setGames(prevGames => prevGames.filter(g => g.id !== event.detail.gameId));
        } else {
          // If no specific game ID, reload all data
          fetchGameHistory();
        }
      } else if (event.detail?.source === 'adminEdit') {
        console.log('Admin edit detected, reloading game history');
        fetchGameHistory();
      } else if (event.detail?.source === 'gameHistoryImport') {
        console.log('Game history import detected, reloading game history');
        fetchGameHistory();
      } else if (event.detail?.source === 'adminSync') {
        console.log('Admin sync detected, reloading game history');
        fetchGameHistory();
      } else {
        // For other general refresh events
        fetchGameHistory();
      }
    };
    
    // Listen for specific game history updates
    const handleGameHistoryUpdate = (event: any) => {
      console.log('Game history update event detected', event.detail);
      
      // Check if this is a deletion operation
      if (event.detail?.operation === 'delete' && event.detail?.gameId) {
        console.log(`Removing deleted game ${event.detail.gameId} from game history`);
        // Remove the game from state without full reload
        setGames(prevGames => prevGames.filter(g => g.id !== event.detail.gameId));
      } else {
        // For other operations, reload all data
        fetchGameHistory();
      }
    };
    
    window.addEventListener('dataRefresh', handleDataRefresh);
    window.addEventListener('gameHistoryUpdate', handleGameHistoryUpdate);
    
    // Add a periodic check for online status every 30 seconds
    const intervalId = setInterval(() => {
      checkOnlineStatus();
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('dataRefresh', handleDataRefresh);
      window.removeEventListener('gameHistoryUpdate', handleGameHistoryUpdate);
      clearInterval(intervalId);
    };
  }, []);
  
  const checkOnlineStatus = async () => {
    try {
      // Test connection with a simple ping query
      const { data, error } = await supabase.from('games').select('count', { count: 'exact', head: true });
      
      // If we get here without error, we're online
      if (!error) {
        setIsOnline(true);
        return true;
      } else {
        console.error('Supabase connection error:', error);
        setIsOnline(false);
        return false;
      }
    } catch (e) {
      console.error('Network error checking online status:', e);
      setIsOnline(false);
      return false;
    }
  };
  
  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      
      // Check online status first
      const isConnected = await checkOnlineStatus();
      
      // Use our comprehensive game history service
      const gamesData = await getComprehensiveGameHistory();
      
      if (gamesData && gamesData.length > 0) {
        console.log(`Loaded ${gamesData.length} games from comprehensive history service`);
        setGames(gamesData);
        
        // Only show online status message when transitioning from offline to online
        if (isConnected && !isOnline) {
          toast.success('Connected to server. Data synchronized.');
        }
      } else {
        console.log('No games found in history');
        setGames([]);
        
        // Check connection status again only if we have no games
        if (!isConnected) {
          toast.error('Unable to connect to server. Working in offline mode.');
        }
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
      toast.error('Failed to load game history. Working in offline mode.');
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to repair/recover games data
  const repairGamesData = async () => {
    try {
      setIsRepairing(true);
      console.log('Starting games data repair...');
      
      // First check if we have any data in completedGames
      const completedGamesStr = localStorage.getItem('completedGames');
      if (!completedGamesStr) {
        toast.error('No completed games data found to recover');
        return;
      }
      
      // Parse completed games
      const completedGames = JSON.parse(completedGamesStr);
      if (!Array.isArray(completedGames) || completedGames.length === 0) {
        toast.error('No completed games found to recover');
        return;
      }
      
      console.log(`Found ${completedGames.length} completed games to recover`);
      
      // Get the current localGames and games
      const localGames = JSON.parse(localStorage.getItem('localGames') || localStorage.getItem('games') || '[]');
      const localGameIds = new Set(localGames.map((g: any) => g.id));
      
      // Check for games that exist in completedGames but not in localGames
      const missingGames = completedGames.filter(game => !localGameIds.has(game.id));
      
      if (missingGames.length === 0) {
        toast('No missing games found to recover', {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        // Add the missing games to localGames
        console.log(`Adding ${missingGames.length} missing games to localGames`);
        const updatedGames = [...localGames, ...missingGames];
        localStorage.setItem('localGames', JSON.stringify(updatedGames));
        localStorage.setItem('games', JSON.stringify(updatedGames));
        
        // Log the missing games
        missingGames.forEach(game => {
          console.log(`Recovered game: ${game.id} - ${game.name}`);
        });
        
        // Also check transactions to ensure they all have valid gameIds
        const transactionsStr = localStorage.getItem('transactions');
        if (transactionsStr) {
          const transactions = JSON.parse(transactionsStr);
          let fixedCount = 0;
          
          const updatedTransactions = transactions.map((tx: any) => {
            // Fix transactions with missing or undefined gameIds
            if ((tx.type === 'win' || tx.type === 'bet' || tx.type === 'refund') && 
                (!tx.gameId || tx.gameId === 'undefined' || tx.gameId === undefined || tx.gameId === 'null')) {
              
              // Try to find a matching game by timestamp for the transaction
              const matchingGame = completedGames.find(g => 
                Math.abs((g.endTime || g.timestamp || 0) - tx.timestamp) < 60000
              );
              
              if (matchingGame) {
                fixedCount++;
                return { ...tx, gameId: matchingGame.id, gameName: matchingGame.name };
              }
            }
            return tx;
          });
          
          if (fixedCount > 0) {
            console.log(`Fixed ${fixedCount} transactions with missing gameIds`);
            localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
          }
        }
        
        toast.success(`Recovered ${missingGames.length} games successfully`);
      }
      
      // Reload the data
      await fetchGameHistory();
      
    } catch (error) {
      console.error('Error repairing games data:', error);
      toast.error('Failed to repair games data');
    } finally {
      setIsRepairing(false);
    }
  };
  
  // Add a more advanced emergency recovery function
  const performDeepRecovery = async () => {
    console.log('PERFORMING DEEP RECOVERY');
    setIsRepairing(true);
    
    try {
      // First check for transactions with missing or incomplete game records
      const transactionsStr = localStorage.getItem('transactions');
      if (!transactionsStr) {
        toast.error('No transactions found for recovery');
        return;
      }
      
      const transactions = JSON.parse(transactionsStr);
      const winTransactions = transactions.filter((tx: any) => tx.type === 'win');
      
      if (winTransactions.length === 0) {
        toast.error('No win transactions found for recovery');
        return;
      }
      
      // Get all game IDs from various sources
      const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
      const completedGamesStr = localStorage.getItem('completedGames');
      
      const localGames = localGamesStr ? JSON.parse(localGamesStr) : [];
      const completedGames = completedGamesStr ? JSON.parse(completedGamesStr) : [];
      
      // Get all game IDs
      const localGameIds = new Set(localGames.map((g: any) => g.id));
      const completedGameIds = new Set(completedGames.map((g: any) => g.id));
      
      // Find win transactions that don't have associated games
      let recoveredCount = 0;
      const uniqueGameIds = new Set<string>();
      
      // First we'll generate synthetic games from win transactions
      for (const tx of winTransactions) {
        if (!tx.gameId) continue;
        
        uniqueGameIds.add(tx.gameId);
        
        // Generate a synthetic game structure if this game doesn't exist in one of our sources
        if (!localGameIds.has(tx.gameId) || !completedGameIds.has(tx.gameId)) {
          console.log(`Transaction has gameId ${tx.gameId} that needs recovery`);
          
          // Find all transactions for this game
          const gameTransactions = transactions.filter((t: any) => t.gameId === tx.gameId);
          const betTransactions = gameTransactions.filter((t: any) => t.type === 'bet');
          
          // Calculate total pot
          const totalPot = betTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);
          
          // Build player list
          const playerMap = new Map<string, any>();
          for (const betTx of betTransactions) {
            if (betTx.playerId && betTx.playerName) {
              playerMap.set(betTx.playerId, {
                id: betTx.playerId,
                name: betTx.playerName,
                bet: Math.abs(betTx.amount || 0)
              });
            }
          }
          
          // Create a synthetic game
          const syntheticGame = {
            id: tx.gameId,
            name: tx.gameName || 'Recovered Game',
            type: 'Reconstructed',
            date: new Date(tx.timestamp).toISOString().split('T')[0],
            startTime: Math.min(...gameTransactions.map((t: any) => t.timestamp)),
            endTime: tx.timestamp,
            totalPot: totalPot,
            status: 'completed',
            winner: tx.playerName || '',
            players: Array.from(playerMap.values())
          };
          
          // Save to local games if needed
          if (!localGameIds.has(tx.gameId)) {
            localGames.push(syntheticGame);
            localGameIds.add(tx.gameId);
          }
          
          // Save to completed games if needed
          if (!completedGameIds.has(tx.gameId)) {
            completedGames.push(syntheticGame);
            completedGameIds.add(tx.gameId);
          }
          
          recoveredCount++;
        }
      }
      
      // Save the updated lists back to localStorage
      if (recoveredCount > 0) {
        localStorage.setItem('localGames', JSON.stringify(localGames));
        localStorage.setItem('games', JSON.stringify(localGames));
        localStorage.setItem('completedGames', JSON.stringify(completedGames));
        
        toast.success(`Recovered ${recoveredCount} games from transactions`);
      } else {
        toast('No new games to recover from transactions', {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
      
      // Reload data after the recovery
      await fetchGameHistory();
      
    } catch (error) {
      console.error('Error in deep recovery:', error);
      toast.error('Recovery failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRepairing(false);
    }
  };
  
  // Add a debug function to check game IDs
  useEffect(() => {
    const debugGameIdsAndTransactions = () => {
      console.log('---------- DEBUG: GAME IDS VS WINNER TRANSACTIONS ----------');
      try {
        // Log all game IDs from various sources
        const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
        let gameIds = new Set();
        
        if (localGamesStr) {
          const allGames = JSON.parse(localGamesStr);
          console.log('All games:', allGames.length);
          
          const completedGames = allGames.filter((g: any) => g.status === 'completed');
          console.log('Completed games:', completedGames.length);
          
          allGames.forEach((g: any) => {
            console.log(`Game ID: ${g.id} - Name: ${g.name} - Status: ${g.status}`);
            gameIds.add(g.id);
          });
        } else {
          console.log('No local games found in localStorage');
        }
        
        // Log all transactions with type 'win'
        const transactionsStr = localStorage.getItem('transactions');
        if (transactionsStr) {
          const transactions = JSON.parse(transactionsStr);
          const winTransactions = transactions.filter((tx: any) => tx.type === 'win');
          
          console.log('Win transactions:', winTransactions.length);
          
          winTransactions.forEach((tx: any) => {
            console.log(`Transaction - Game ID: ${tx.gameId} - Player: ${tx.playerName} - Amount: ${tx.amount}`);
            
            // Check if this game ID exists in our games 
            const exists = gameIds.has(tx.gameId);
            console.log(`Game ID ${tx.gameId} exists in games list: ${exists}`);
          });
        } else {
          console.log('No transactions found in localStorage');
        }
        
        // Log completedGames as well
        const completedGamesStr = localStorage.getItem('completedGames');
        if (completedGamesStr) {
          const completedGames = JSON.parse(completedGamesStr);
          console.log('completedGames in localStorage:', completedGames.length);
          completedGames.forEach((g: any) => {
            console.log(`Completed Game ID: ${g.id} - Name: ${g.name}`);
          });
        } else {
          console.log('No completedGames found in localStorage');
        }
        
        console.log('---------- END DEBUG ----------');
      } catch (e) {
        console.error('Error in debug function:', e);
      }
    };
    
    // Run the debug function
    debugGameIdsAndTransactions();
  }, []);
  
  // Add this function to delete games from the game history page
  const handleDeleteGame = async (gameId: string, gameName: string) => {
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete the game "${gameName || 'Unnamed Game'}"? This action cannot be undone and will remove all related data.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // First, remove the game from the UI immediately for better UX
      setGames(prevGames => prevGames.filter(g => g.id !== gameId));
      
      // Find all transactions related to this game
      const localTransactionsStr = localStorage.getItem('transactions');
      let transactionsUpdated = false;
      
      if (localTransactionsStr) {
        const localTransactions = JSON.parse(localTransactionsStr);
        // Filter out transactions related to this game
        const updatedTransactions = localTransactions.filter((tx: any) => tx.gameId !== gameId);
        
        if (updatedTransactions.length !== localTransactions.length) {
          // Update localStorage with filtered transactions
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
          transactionsUpdated = true;
        }
      }

      // Handle Supabase deletion if online
      if (isOnline) {
        try {
          // First delete related transactions
          const { error: txError } = await supabase
            .from('transactions')
            .delete()
            .eq('gameId', gameId);
          
          if (txError) {
            console.error('Error deleting related transactions:', txError);
            // Don't show error to user as this is not critical and will still work with local deletion
          }
          
          // Then delete the game
          const { error: gameError } = await supabase
            .from('games')
            .delete()
            .eq('id', gameId);
          
          if (gameError) {
            console.error('Error deleting game from server:', gameError);
            // Only show a warning for debugging purposes, but don't show it to the user
            // because we've already removed it from local storage and UI
          } else {
            console.log('Game successfully deleted from server');
          }
        } catch (e) {
          // Handle any network or unexpected errors
          console.error('Network or server error during deletion:', e);
          // Don't show error to the user as local deletion still worked
        }
      }
      
      // Update all localStorage copies
      
      // 1. Remove from localGames / games
      const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
      if (localGamesStr) {
        const localGames = JSON.parse(localGamesStr);
        const filteredGames = localGames.filter((g: any) => g.id !== gameId);
        
        localStorage.setItem('localGames', JSON.stringify(filteredGames));
        localStorage.setItem('games', JSON.stringify(filteredGames));
      }
      
      // 2. Remove from completedGames
      const completedGamesStr = localStorage.getItem('completedGames');
      if (completedGamesStr) {
        const completedGames = JSON.parse(completedGamesStr);
        const filteredCompletedGames = completedGames.filter((g: any) => g.id !== gameId);
        
        localStorage.setItem('completedGames', JSON.stringify(filteredCompletedGames));
      }
      
      // Show success message
      toast.success('Game deleted successfully');
      
      // CRUCIAL: Dispatch events to update all parts of the application
      
      // 1. General data refresh event
      window.dispatchEvent(new CustomEvent('dataRefresh', { 
        detail: { 
          source: 'gameDelete', 
          gameId: gameId,
          timestamp: Date.now() 
        } 
      }));
      
      // 2. Specific events for different app sections
      // Update leaderboard if transactions were affected
      if (transactionsUpdated) {
        window.dispatchEvent(new CustomEvent('playerBalanceUpdate', {
          detail: { operation: 'delete', gameId: gameId }
        }));
        
        window.dispatchEvent(new CustomEvent('leaderboardUpdate', {
          detail: { operation: 'delete', gameId: gameId }
        }));
      }
      
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game');
      
      // Reload data if there was an error to restore the game to the UI
      fetchGameHistory();
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white text-gray-800 p-4">
      <Toaster position="top-right" />
      
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-navy transition-colors duration-200">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Data repair buttons */}
            <div className="flex space-x-2">
              <button
                onClick={repairGamesData}
                disabled={isRepairing}
                className="flex items-center text-sm text-navy hover:text-blue-700 disabled:text-gray-400 transition-colors duration-200"
              >
                {isRepairing ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-1">Repairing...</span>
                  </>
                ) : (
                  <>
                    <CogIcon className="h-4 w-4 mr-1" />
                    <span>Repair Data</span>
                  </>
                )}
              </button>
              
              <button
                onClick={performDeepRecovery}
                disabled={isRepairing}
                className="flex items-center text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:bg-gray-300 transition-colors duration-200"
              >
                {isRepairing ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-1">Emergency Recovery...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    <span>Emergency Recovery</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  const gameId = prompt('Enter the specific game ID to recover:');
                  if (!gameId) return;
                  
                  try {
                    // Look for transactions with this gameId
                    const transactionsStr = localStorage.getItem('transactions');
                    if (!transactionsStr) {
                      toast.error('No transactions found');
                      return;
                    }
                    
                    const transactions = JSON.parse(transactionsStr);
                    const gameTransactions = transactions.filter((tx: any) => tx.gameId === gameId);
                    
                    if (gameTransactions.length === 0) {
                      toast.error(`No transactions found for game ID: ${gameId}`);
                      return;
                    }
                    
                    console.log(`Found ${gameTransactions.length} transactions for game ID: ${gameId}`);
                    
                    // Get win transaction if available
                    const winTx = gameTransactions.find((tx: any) => tx.type === 'win');
                    
                    // Build player list from bet transactions
                    const betTransactions = gameTransactions.filter((tx: any) => tx.type === 'bet');
                    const playerMap = new Map<string, any>();
                    
                    betTransactions.forEach((tx: any) => {
                      if (tx.playerId && tx.playerName) {
                        playerMap.set(tx.playerId, {
                          id: tx.playerId,
                          name: tx.playerName,
                          bet: Math.abs(tx.amount || 0)
                        });
                      }
                    });
                    
                    // Create synthetic game
                    const syntheticGame = {
                      id: gameId,
                      name: (winTx?.gameName || 'Direct Recovery Game'),
                      type: 'DirectRecovery',
                      date: new Date().toISOString().split('T')[0],
                      startTime: Math.min(...gameTransactions.map((tx: any) => tx.timestamp || 0)),
                      endTime: winTx ? winTx.timestamp : Math.max(...gameTransactions.map((tx: any) => tx.timestamp || 0)),
                      totalPot: betTransactions.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0),
                      status: 'completed',
                      winner: winTx?.playerName || '',
                      players: Array.from(playerMap.values())
                    };
                    
                    // Add to all storage locations
                    const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
                    const completedGamesStr = localStorage.getItem('completedGames');
                    
                    if (localGamesStr) {
                      const localGames = JSON.parse(localGamesStr);
                      // Remove existing game with this ID if any
                      const filteredGames = localGames.filter((g: any) => g.id !== gameId);
                      // Add new synthetic game
                      filteredGames.push(syntheticGame);
                      localStorage.setItem('localGames', JSON.stringify(filteredGames));
                      localStorage.setItem('games', JSON.stringify(filteredGames));
                    } else {
                      localStorage.setItem('localGames', JSON.stringify([syntheticGame]));
                      localStorage.setItem('games', JSON.stringify([syntheticGame]));
                    }
                    
                    let completedGames = [];
                    if (completedGamesStr) {
                      completedGames = JSON.parse(completedGamesStr);
                      // Remove existing game with this ID if any
                      completedGames = completedGames.filter((g: any) => g.id !== gameId);
                    }
                    
                    // Add to completed games
                    completedGames.push(syntheticGame);
                    localStorage.setItem('completedGames', JSON.stringify(completedGames));
                    
                    toast.success(`Game ID ${gameId} successfully recovered`);
                    
                    // Reload the data
                    fetchGameHistory();
                    
                    // Navigate to the recovered game
                    window.location.href = `/games/${gameId}`;
                  } catch (e) {
                    console.error('Error recovering specific game:', e);
                    toast.error('Error recovering game');
                  }
                }}
                className="flex items-center text-sm bg-navy text-white px-2 py-1 rounded hover:bg-blue-800 transition-colors duration-200"
              >
                Recover Specific ID
              </button>
            </div>
            
            {/* Online status indicator */}
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>
            
            <Link href="/admin" className="text-sm text-navy hover:text-blue-700 flex items-center transition-colors duration-200">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              Admin Panel
            </Link>
          </div>
        </div>
        
        <h1 className="text-3xl font-medium mb-6 flex items-center text-gray-800">
          <TrophyIcon className="h-8 w-8 mr-3 text-navy" />
          Game History
        </h1>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {games.map((game) => {
              // Format dates for display
              const endDate = game.endTime ? new Date(game.endTime) : new Date();
              const formattedDate = endDate.toLocaleDateString();
              const formattedTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Handle different formats of player data
              let players = [];
              try {
                if (typeof game.players === 'string') {
                  players = JSON.parse(game.players);
                } else if (game.players && typeof game.players === 'object') {
                  if (Array.isArray(game.players)) {
                    players = game.players;
                  } else {
                    // Convert object format to array
                    players = Object.entries(game.players).map(([id, data]: [string, any]) => ({
                      id,
                      name: data.name || 'Unknown Player',
                      bet: data.bet || 0
                    }));
                  }
                }
              } catch (e) {
                console.error('Error parsing players for game:', game.id, e);
                players = [];
              }
              
              // Determine the winner name
              let winnerName = 'Unknown';
              let winnerClass = '';
              
              if (game.winner) {
                if (typeof game.winner === 'string') {
                  winnerName = game.winner;
                } else if (typeof game.winner === 'object') {
                  winnerName = game.winner.name || 'Unknown';
                }
                winnerClass = 'text-green-600 font-medium';
              }
              
              return (
                <div key={game.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="bg-navy p-5 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-xl font-medium text-white">{game.name || 'Unnamed Game'}</h2>
                      <span className="bg-blue-200 text-navy px-3 py-1 rounded-full text-xs uppercase">
                        {game.type || 'Custom Game'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
                      <div className="flex items-center text-gray-100 mb-2 sm:mb-0">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span className="mr-4">{formattedDate}</span>
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{formattedTime}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Total Pot:</span>
                        <span className="font-bold text-purple-300">${
                          typeof game.totalPot === 'number' 
                            ? game.totalPot.toFixed(2) 
                            : (players.reduce((sum: number, p: any) => sum + (parseFloat(p.bet) || 0), 0)).toFixed(2)
                        }</span>
                        
                        {/* Add delete button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault(); // Prevent any link navigation
                            e.stopPropagation(); // Prevent event bubbling
                            handleDeleteGame(game.id, game.name);
                          }}
                          className="ml-4 p-1 text-red-400 hover:text-red-300 rounded"
                          title="Delete Game"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    {/* Game Winner */}
                    <div className="bg-white p-4 rounded-lg mb-4 flex items-center border border-gray-200">
                      <div className="p-2 bg-amber-100 rounded-full mr-3">
                        <TrophyIcon className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Winner</div>
                        <div className={winnerClass || "text-gray-500"}>{winnerName}</div>
                      </div>
                      <div className="ml-auto font-medium text-green-600">${game.totalPot?.toFixed(2) || '0.00'}</div>
                    </div>

                    {/* Players List */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">Players</h3>
                      <ul className="space-y-2">
                        {players && players.length > 0 ? players.map((player: any, index: number) => (
                          <li key={player.id || index} className="flex justify-between items-center p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-gray-600">${player.bet?.toFixed(2) || '0.00'}</span>
                          </li>
                        )) : (
                          <li className="text-gray-500 italic">No player data available</li>
                        )}
                      </ul>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDeleteGame(game.id, game.name || 'this game')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                      >
                        Delete Game
                      </button>
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4 opacity-20">🎮</div>
            <h2 className="text-2xl font-medium text-gray-800 mb-2">No Game History</h2>
            <p className="text-gray-600 mb-6">You haven't completed any games yet. Start playing to see your history!</p>
            <div className="flex justify-center">
              <Link 
                href="/games"
                className="inline-flex items-center px-8 py-3 bg-navy text-white rounded-lg hover:bg-blue-800 transition-colors duration-200 font-medium"
              >
                <TrophyIcon className="h-5 w-5 mr-2" />
                <span>Start Playing</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
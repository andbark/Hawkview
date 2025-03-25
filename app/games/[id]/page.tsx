'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon, PencilIcon, ArrowPathIcon, BugAntIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import GameDetails from '../../components/GameDetails';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fixTransactionGameIds } from '../../lib/gameHistoryService';

interface GameDetailParams {
  params: {
    id: string;
  };
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showRawData, setShowRawData] = useState(false);
  const [rawGameData, setRawGameData] = useState<any>(null);
  
  // Debug game ID on mount
  useEffect(() => {
    console.log('Game detail page mounted with ID:', gameId);
    
    // Check if this ID is potentially a local ID
    const isLocalId = typeof gameId === 'string' && gameId.startsWith('local_');
    console.log('Is local game ID?', isLocalId);
    
    // Check if the game exists in localStorage and collect debug info
    if (typeof window !== 'undefined') {
      // Start collecting debug info
      const debug: any = {
        gameId,
        isLocalId,
        localStorageItems: {},
        localGameExists: false,
        completedGamesCount: 0,
        transactions: {
          total: 0,
          withThisGameId: 0
        }
      };
      
      // Collect raw game data
      let rawGame = null;
      
      try {
        // Check local storage for games
        const localGames = JSON.parse(localStorage.getItem('localGames') || localStorage.getItem('games') || '[]');
        debug.localStorageItems.games = localGames.length;
        
        const gameExists = localGames.some((g: any) => g.id === gameId);
        debug.localGameExists = gameExists;
        
        if (gameExists) {
          rawGame = localGames.find((g: any) => g.id === gameId);
          debug.rawGameData = rawGame;
        }
        
        if (!gameExists) {
          console.log('Game not found in localGames, checking completedGames');
          const completedGamesStr = localStorage.getItem('completedGames');
          if (completedGamesStr) {
            const completedGames = JSON.parse(completedGamesStr);
            debug.completedGamesCount = completedGames.length;
            const gameInCompleted = completedGames.some((g: any) => g.id === gameId);
            debug.gameExistsInCompletedGames = gameInCompleted;
            
            if (gameInCompleted) {
              rawGame = completedGames.find((g: any) => g.id === gameId);
              debug.rawGameDataFromCompleted = rawGame;
            }
            
            // If game exists in completedGames but not in localGames, add it
            if (gameInCompleted && !gameExists) {
              const gameToAdd = completedGames.find((g: any) => g.id === gameId);
              if (gameToAdd) {
                console.log('Found game in completedGames, adding to localGames');
                localGames.push(gameToAdd);
                localStorage.setItem('localGames', JSON.stringify(localGames));
                localStorage.setItem('games', JSON.stringify(localGames));
              }
            }
          }
        }
        
        // Check transactions
        const transactionsStr = localStorage.getItem('transactions');
        if (transactionsStr) {
          const transactions = JSON.parse(transactionsStr);
          debug.transactions.total = transactions.length;
          const gameTransactions = transactions.filter((tx: any) => tx.gameId === gameId);
          debug.transactions.withThisGameId = gameTransactions.length;
          debug.allTransactionsWithGameId = gameTransactions;
          
          // List win transactions with this gameId
          const winTransactions = gameTransactions.filter((tx: any) => tx.type === 'win');
          debug.transactions.winTransactions = winTransactions.length;
          debug.transactions.winTransactionIds = winTransactions.map((tx: any) => tx.id);
        }
        
        // Store raw game data for display
        setRawGameData(rawGame);
      } catch (e) {
        console.error('Error in debug data collection:', e);
        debug.error = String(e);
      }
      
      // Save the debug info
      setDebugInfo(debug);
    }
    
    if (!gameId) {
      setError('Game ID is missing');
      toast.error('Invalid game ID');
      setLoadingGame(false);
    }
  }, [gameId]);
  
  // Call the transaction sync function when the page loads
  useEffect(() => {
    if (gameId) {
      // Use the new service function instead of our local one
      fixTransactionGameIds();
      
      // Also do a game-specific sync to ensure this game's transactions are properly linked
      syncTransactionsWithGameId(gameId);
    }
  }, [gameId]);
  
  const handleGameLoaded = (status: string) => {
    console.log('Game loaded with status:', status);
    setIsActive(status === 'active');
    setLoadingGame(false);
  };
  
  // Function to handle game deletion
  const handleDeleteGame = async () => {
    try {
      setLoading(true);
      const isLocalGame = typeof gameId === 'string' && gameId.startsWith('local_');
      
      if (isLocalGame) {
        // Handle local game deletion
        const localGamesStr = localStorage.getItem('games') || localStorage.getItem('localGames');
        if (localGamesStr) {
          const localGames = JSON.parse(localGamesStr);
          const updatedGames = localGames.filter((g: any) => g.id !== gameId);
          localStorage.setItem('games', JSON.stringify(updatedGames));
          localStorage.setItem('localGames', JSON.stringify(updatedGames));
        }
        
        // Remove completed games cache
        const completedGamesStr = localStorage.getItem('completedGames');
        if (completedGamesStr) {
          const completedGames = JSON.parse(completedGamesStr);
          const updatedCompletedGames = completedGames.filter((g: any) => g.id !== gameId);
          localStorage.setItem('completedGames', JSON.stringify(updatedCompletedGames));
        }
        
        // Remove local transactions for this game
        const localTransactionsStr = localStorage.getItem('transactions');
        if (localTransactionsStr) {
          const localTransactions = JSON.parse(localTransactionsStr);
          const updatedTransactions = localTransactions.filter((tx: any) => tx.gameId !== gameId);
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        }
      } else {
        // Handle server game deletion
        // First check if there are transactions related to this game
        const { count, error: countError } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('gameId', gameId);
          
        if (countError) throw countError;
        
        // If there are transactions, delete them first
        if (count && count > 0) {
          const { error: transactionDeleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('gameId', gameId);
            
          if (transactionDeleteError) throw transactionDeleteError;
        }
        
        // Now delete the game
        const { error: gameDeleteError } = await supabase
          .from('games')
          .delete()
          .eq('id', gameId);
          
        if (gameDeleteError) throw gameDeleteError;
      }
      
      // Trigger a data refresh event
      window.dispatchEvent(new CustomEvent('dataRefresh', { 
        detail: { 
          timestamp: Date.now(),
          source: 'gameDelete'
        } 
      }));
      
      toast.success('Game deleted successfully');
      router.push('/game-history');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game');
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
    }
  };
  
  // Function to refresh game details
  const refreshGameDetails = () => {
    setLoadingGame(true);
    // Force refresh of both localStorage and GameDetails component
    if (typeof window !== 'undefined') {
      // First try to update localStorage from completedGames
      try {
        const completedGamesStr = localStorage.getItem('completedGames');
        if (completedGamesStr) {
          const completedGames = JSON.parse(completedGamesStr);
          const gameInCompleted = completedGames.find((g: any) => g.id === gameId);
          
          if (gameInCompleted) {
            const localGames = JSON.parse(localStorage.getItem('localGames') || localStorage.getItem('games') || '[]');
            const gameIndex = localGames.findIndex((g: any) => g.id === gameId);
            
            if (gameIndex >= 0) {
              // Update the existing game
              localGames[gameIndex] = { ...localGames[gameIndex], ...gameInCompleted };
            } else {
              // Add the game
              localGames.push(gameInCompleted);
            }
            
            localStorage.setItem('localGames', JSON.stringify(localGames));
            localStorage.setItem('games', JSON.stringify(localGames));
            console.log('Updated local game from completedGames');
          }
        }
      } catch (e) {
        console.error('Error refreshing from localStorage:', e);
      }
      
      // Dispatch the refresh event
      window.dispatchEvent(new CustomEvent('dataRefresh', { 
        detail: { timestamp: Date.now(), source: 'manualRefresh' } 
      }));
      
      // After a short delay, reload the page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };
  
  // Add a function to ensure transaction gameIds match the actual game ID
  const syncTransactionsWithGameId = (gameId: string) => {
    try {
      // First ensure the game is properly stored in local storage
      const completedGamesStr = localStorage.getItem('completedGames');
      const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
      
      if (completedGamesStr && localGamesStr) {
        const completedGames = JSON.parse(completedGamesStr);
        const localGames = JSON.parse(localGamesStr);
        
        // Check if game exists in completedGames but not in localGames
        const gameInCompleted = completedGames.find((g: any) => g.id === gameId);
        const gameExistsLocally = localGames.some((g: any) => g.id === gameId);
        
        if (gameInCompleted && !gameExistsLocally) {
          console.log(`Game ${gameId} exists in completedGames but not in localGames. Adding it now.`);
          localGames.push(gameInCompleted);
          localStorage.setItem('localGames', JSON.stringify(localGames));
          localStorage.setItem('games', JSON.stringify(localGames));
        }
      }
      
      // Now handle transactions
      const transactionsStr = localStorage.getItem('transactions');
      if (!transactionsStr) return;
      
      const transactions = JSON.parse(transactionsStr);
      
      // Check if any transactions related to this game are missing the gameId
      let hasChanges = false;
      const updatedTransactions = transactions.map((tx: any) => {
        // If this is a transaction related to this game but missing the gameId or has undefined gameId
        if ((tx.type === 'win' || tx.type === 'bet' || tx.type === 'refund') && 
            (!tx.gameId || tx.gameId === 'undefined' || tx.gameId === undefined)) {
          console.log(`Found transaction missing gameId: ${tx.id}, type: ${tx.type}`);
          hasChanges = true;
          return {
            ...tx,
            gameId // Set the proper gameId
          };
        }
        
        // Fix any malformed gameIds (e.g., "undefined" string)
        if (tx.gameId === "undefined" || tx.gameId === "null") {
          console.log(`Found transaction with invalid gameId: ${tx.id}, type: ${tx.type}`);
          hasChanges = true;
          return {
            ...tx,
            gameId // Set the proper gameId
          };
        }
        
        return tx;
      });
      
      // Save back to localStorage if changes were made
      if (hasChanges) {
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        console.log(`Updated transactions with proper gameId: ${gameId}`);
        
        // Dispatch a refresh event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dataRefresh', { 
            detail: { source: 'gameDetailsSync', timestamp: Date.now() } 
          }));
        }
      }
    } catch (e) {
      console.error('Error syncing transactions with gameId:', e);
    }
  };
  
  // Debug info renderer
  const renderDebugInfo = () => {
    if (!showDebug) return null;
    
    return (
      <div className="bg-gray-700 p-4 rounded-lg mt-6 overflow-auto max-h-[500px]">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    );
  };
  
  // Render the debug data or error page
  if (loadingGame) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 flex justify-center items-center">
        <LoadingSpinner />
        <span className="ml-3 text-gray-300">Loading game details...</span>
      </div>
    );
  } else if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center text-red-400 mb-4">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white mr-2"
            onClick={refreshGameDetails}
          >
            Retry Loading Game
          </button>
          <button 
            className="mt-4 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 text-white"
            onClick={() => setShowRawData(!showRawData)}
          >
            {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
          </button>
        </div>
        
        {showRawData && rawGameData && (
          <div className="mt-6 bg-gray-700 p-4 rounded-lg overflow-auto max-h-[500px]">
            <h3 className="text-lg font-semibold mb-2 text-white">Raw Game Data</h3>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(rawGameData, null, 2)}
            </pre>
          </div>
        )}
        
        {showRawData && debugInfo && (
          <div className="mt-6 bg-gray-700 p-4 rounded-lg overflow-auto max-h-[500px]">
            <h3 className="text-lg font-semibold mb-2 text-white">Debug Information</h3>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/game-history" 
            className="inline-flex items-center text-purple-400 hover:text-purple-300"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Back to Game History</span>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <Toaster position="top-right" />
      
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/game-history"
            className="inline-flex items-center text-purple-400 hover:text-purple-300"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Back to Game History</span>
          </Link>
          
          <div className="flex space-x-2">
            <button
              onClick={refreshGameDetails}
              className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="inline-flex items-center text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded"
            >
              <BugAntIcon className="h-4 w-4 mr-1" />
              <span>{showDebug ? 'Hide Debug' : 'Debug'}</span>
            </button>
            
            <button
              onClick={() => {
                try {
                  // Emergency recovery function
                  console.log('Starting emergency recovery for game:', gameId);
                  
                  // Look for transactions with this gameId
                  const transactionsStr = localStorage.getItem('transactions');
                  if (transactionsStr) {
                    const transactions = JSON.parse(transactionsStr);
                    const relevantTxs = transactions.filter((tx: any) => tx.gameId === gameId);
                    
                    if (relevantTxs.length > 0) {
                      console.log(`Found ${relevantTxs.length} transactions for this game`);
                      
                      // Get a win transaction if available
                      const winTx = relevantTxs.find((tx: any) => tx.type === 'win');
                      
                      // Create a synthetic game object
                      const syntheticGame = {
                        id: gameId,
                        name: (winTx?.gameName || 'Emergency Recovered Game'),
                        status: 'completed',
                        type: 'Recovered',
                        date: new Date().toISOString().split('T')[0],
                        startTime: Math.min(...relevantTxs.map((tx: any) => tx.timestamp)),
                        endTime: winTx ? winTx.timestamp : Math.max(...relevantTxs.map((tx: any) => tx.timestamp)),
                        totalPot: relevantTxs.filter((tx: any) => tx.type === 'bet').reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0),
                        winner: winTx?.playerName || '',
                        players: []
                      };
                      
                      // Add this to local games and completed games
                      const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
                      const completedGamesStr = localStorage.getItem('completedGames');
                      
                      if (localGamesStr) {
                        const localGames = JSON.parse(localGamesStr);
                        // Remove any existing game with this ID
                        const filteredGames = localGames.filter((g: any) => g.id !== gameId);
                        // Add our synthetic game
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
                        // Remove any existing game with this ID
                        completedGames = completedGames.filter((g: any) => g.id !== gameId);
                      }
                      // Add our synthetic game to completed games
                      completedGames.push(syntheticGame);
                      localStorage.setItem('completedGames', JSON.stringify(completedGames));
                      
                      toast.success('Game data recovered successfully');
                      
                      // Force refresh the page
                      window.location.reload();
                    } else {
                      toast.error('No transactions found for this game ID');
                    }
                  } else {
                    toast.error('No transactions found in localStorage');
                  }
                } catch (e) {
                  console.error('Error in emergency recovery:', e);
                  toast.error('Error recovering game data');
                }
              }}
              className="inline-flex items-center text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              <span>Force Recover</span>
            </button>
            
            {isActive && (
              <Link
                href={`/games/${gameId}/edit`}
                className="inline-flex items-center text-white bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                <span>Edit</span>
              </Link>
            )}
            
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="inline-flex items-center text-white bg-red-700 hover:bg-red-800 px-3 py-1 rounded"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              <span>Delete</span>
            </button>
          </div>
        </div>
        
        <GameDetails 
          gameId={gameId}
          onGameLoaded={handleGameLoaded}
          onSynced={() => {
            // Trigger refresh
            window.dispatchEvent(new CustomEvent('dataRefresh', { 
              detail: { timestamp: Date.now() } 
            }));
          }}
        />
          
        {renderDebugInfo()}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Game</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this game? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGame}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Deleting...</span>
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
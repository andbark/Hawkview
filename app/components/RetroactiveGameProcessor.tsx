'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { fixTransactionGameIds, getComprehensiveGameHistory } from '@/lib/gameHistoryService';

interface RetroactiveGameProcessorProps {
  gameId: string;
  gameName: string;
  isButtonOnly?: boolean;
  onProcessed?: () => void;
}

const RetroactiveGameProcessor = ({ 
  gameId, 
  gameName, 
  isButtonOnly = false,
  onProcessed
}: RetroactiveGameProcessorProps) => {
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  const processGame = async () => {
    try {
      setProcessing(true);
      
      // Check if this is a local game ID (starts with "local_")
      const isLocalGame = typeof gameId === 'string' && gameId.startsWith('local_');
      
      let result;
      if (isLocalGame) {
        // Process locally first
        result = await processLocalGame(gameId);
      } else {
        // Try server processing
        try {
          result = await processServerGame(gameId);
          
          // If the API tells us this is a local game, handle it client-side
          if (result.isLocalGame) {
            result = await processLocalGame(gameId);
          }
        } catch (error) {
          console.error('Server processing failed, trying local:', error);
          // If server processing fails (maybe due to UUID format), try local
          if (error instanceof Error && error.message.includes('uuid')) {
            result = await processLocalGame(gameId);
          } else {
            throw error; // Re-throw if it's another type of error
          }
        }
      }
      
      // Fix any transaction gameId issues
      fixTransactionGameIds();
      
      // Get comprehensive game history to ensure everything is in sync
      await getComprehensiveGameHistory();
      
      // Force refresh data regardless of the processing source
      await refreshData();
      
      setProcessed(true);
      toast.success(`Game "${gameName}" successfully processed`);
      
      // Broadcast a data update event for other components
      window.dispatchEvent(new CustomEvent('dataRefresh', { 
        detail: { 
          timestamp: Date.now(),
          source: 'retroactiveProcessor'
        } 
      }));
      
      // Call the callback if provided
      if (onProcessed) {
        onProcessed();
      }
    } catch (error) {
      console.error('Error processing game:', error);
      toast.error(`Failed to process game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const processServerGame = async (gameId: string) => {
    const response = await fetch('/api/retroactive-game-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId }),
    });
    
    if (!response.ok && response.status !== 200) {
      const errorText = await response.text();
      let errorMessage = 'Failed to process game';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Check for specific error types
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  };
  
  const refreshData = async () => {
    try {
      // Reload player data
      await supabase
        .from('players')
        .select('*');
      
      // Reload transactions
      await supabase
        .from('transactions')
        .select('*');
      
      // Reload games
      await supabase
        .from('games')
        .select('*');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };
  
  const processLocalGame = async (localGameId: string) => {
    // Get the game from localStorage - check both localGames and games for consistency
    console.log('Starting local game processing for game ID:', localGameId);
    const gamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
    if (!gamesStr) {
      console.error('No games found in localStorage. Keys available:', Object.keys(localStorage));
      throw new Error('No games found in localStorage');
    }
    
    const localGames = JSON.parse(gamesStr);
    console.log(`Found ${localGames.length} games in localStorage`);
    
    if (localGames.length > 0) {
      console.log('Available game IDs:', localGames.map((g: any) => g.id));
    }
    
    const game = localGames.find((g: any) => g.id === localGameId);
    
    if (!game) {
      console.error(`Game with ID ${localGameId} not found in localStorage games`);
      throw new Error(`Local game with ID ${localGameId} not found`);
    }
    
    console.log('Found game to process:', game);
    
    if (game.status !== 'completed') {
      throw new Error('Cannot process an active game');
    }
    
    if (!game.winner) {
      throw new Error('Game has no winner');
    }
    
    // Check if we already have a transaction for this game
    const transactionsStr = localStorage.getItem('transactions');
    const transactions = transactionsStr ? JSON.parse(transactionsStr) : [];
    
    const hasWinTransaction = transactions.some(
      (tx: any) => tx.gameId === localGameId && tx.type === 'win'
    );
    
    if (hasWinTransaction) {
      // Already processed
      return { alreadyProcessed: true };
    }
    
    // Generate a timestamp for all transactions
    const timestamp = Date.now();
    
    // Parse players data to get all participants
    let playersList = [];
    try {
      if (game.players) {
        const playersData = typeof game.players === 'string' 
          ? JSON.parse(game.players) 
          : game.players;
          
        if (Array.isArray(playersData)) {
          playersList = playersData;
        } else if (typeof playersData === 'object') {
          playersList = Object.entries(playersData).map(([id, data]) => ({
            id,
            name: (data as any).name,
            bet: (data as any).bet
          }));
        }
      }
    } catch (e) {
      console.error("Error parsing players:", e);
      playersList = [];
    }
    
    // Process all involved players
    const newTransactions = [];
    
    // Create the win transaction for the winner
    const winnerTxId = `local_tx_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    const winner = playersList.find(p => p.id === game.winner);
    
    if (winner) {
      // Create win transaction
      newTransactions.push({
        id: winnerTxId,
        gameId: localGameId,
        playerId: winner.id,
        playerName: winner.name,
        amount: game.totalPot,
        type: 'win',
        timestamp: timestamp,
        description: `Won game: ${game.name}`
      });
      
      // Create bet transaction for winner
      newTransactions.push({
        id: `local_tx_${timestamp}_${Math.random().toString(36).substring(2, 10)}`,
        gameId: localGameId,
        playerId: winner.id,
        playerName: winner.name,
        amount: -winner.bet,
        type: 'bet',
        timestamp: timestamp - 1,
        description: `Bet in game: ${game.name}`
      });
    }
    
    // Create bet transactions for all other players
    for (const player of playersList) {
      if (player.id === game.winner) continue; // Skip winner, already handled
      
      newTransactions.push({
        id: `local_tx_${timestamp}_${Math.random().toString(36).substring(2, 10)}`,
        gameId: localGameId,
        playerId: player.id,
        playerName: player.name,
        amount: -player.bet,
        type: 'bet',
        timestamp: timestamp - 1,
        description: `Bet in game: ${game.name}`
      });
    }
    
    // Add all new transactions to the local storage
    transactions.push(...newTransactions);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update player stats in Supabase
    for (const player of playersList) {
      try {
        // Skip players without a valid ID
        if (!player.id) continue;
        
        // Get player details from Supabase
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', player.id)
          .single();
          
        if (playerError) {
          console.error(`Error fetching player ${player.id}:`, playerError);
          continue;
        }
        
        const isWinner = player.id === game.winner;
        
        if (isWinner) {
          // Update winner stats (account for bet as well)
          const netWinnings = game.totalPot - player.bet;
          
          const { error: winnerError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { 
                row_id: player.id, 
                amount: netWinnings
              }),
              gamesWon: supabase.rpc('increment_games_won', { 
                row_id: player.id
              }),
              gamesPlayed: supabase.rpc('increment_games_played', { 
                row_id: player.id
              })
            })
            .eq('id', player.id);
            
          if (winnerError) {
            console.error(`Error updating winner stats for ${player.id}:`, winnerError);
          }
        } else {
          // Update regular player stats
          const { error: playerUpdateError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { 
                row_id: player.id, 
                amount: -player.bet
              }),
              gamesPlayed: supabase.rpc('increment_games_played', { 
                row_id: player.id
              })
            })
            .eq('id', player.id);
            
          if (playerUpdateError) {
            console.error(`Error updating player stats for ${player.id}:`, playerUpdateError);
          }
        }
      } catch (err) {
        console.error(`Error processing player ${player.id}:`, err);
      }
    }
    
    return { 
      success: true,
      localProcessing: true,
      transactionsCreated: newTransactions.length
    };
  };
  
  useEffect(() => {
    try {
      // Handle potential MutationObserver errors from browser extensions
      if (isBrowser) {
        // Only run DOM-related code in the browser
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in RetroactiveGameProcessor effect:', error);
    }
    
    return () => {
      // Cleanup
    };
  }, []);
  
  if (isButtonOnly) {
    return (
      <button
        onClick={processGame}
        disabled={processing || processed}
        className={`w-full flex items-center justify-center p-3 rounded-lg font-medium transition-colors ${
          processed
            ? 'bg-green-600 text-white cursor-default'
            : processing
            ? 'bg-purple-700 text-white cursor-wait'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {processing ? (
          <>
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : processed ? (
          'Game Processed ✓'
        ) : (
          'Sync Game Data'
        )}
      </button>
    );
  }
  
  return (
    <div className="bg-indigo-900 bg-opacity-50 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Game Needs Processing</h3>
        <p className="text-gray-300 mt-1">
          This completed game needs to be synchronized to update player balances and the leaderboard.
        </p>
      </div>
      
      <button
        onClick={processGame}
        disabled={processing || processed}
        className={`w-full flex items-center justify-center p-3 rounded-lg font-medium transition-colors ${
          processed
            ? 'bg-green-600 text-white cursor-default'
            : processing
            ? 'bg-purple-700 text-white cursor-wait'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {processing ? (
          <>
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            Processing Game...
          </>
        ) : processed ? (
          'Game Processed Successfully ✓'
        ) : (
          'Sync Game Data'
        )}
      </button>
    </div>
  );
};

export default RetroactiveGameProcessor; 
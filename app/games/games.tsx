'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';
import { PlusIcon, TrophyIcon, XMarkIcon, ChartBarIcon, FlagIcon, ArrowRightIcon, ListBulletIcon, UsersIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import EnhancedGameCreation from '@/components/EnhancedGameCreation';
import GameDetails from '@/components/GameDetails';
import GameDetailModal from '@/components/GameDetailModal';
import { gameTypes } from '@/components/GameTypeCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import RetroactiveGameProcessor from '@/components/RetroactiveGameProcessor';

interface Player {
  id: string;
  name: string;
  balance: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  winnings: number;
  colorScheme: 'purple' | 'blue' | 'green' | 'red' | 'teal' | 'amber' | 'slate' | 'gray' | 'zinc' | 'stone';
}

interface GamePlayer {
  id: string;
  name: string;
  bet: number;
}

interface Game {
  id: string;
  name: string;
  type: string;
  date: string;
  startTime: number; // Unix timestamp
  endTime?: number; // Unix timestamp
  players: GamePlayer[];
  totalPot: number;
  status: 'active' | 'completed' | 'cancelled';
  winner?: string;
  notes?: string;
  winMethod?: string;
  customData?: {
    name: string;
    wagerAmount: number;
  };
}

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsMode, setStatsMode] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  // Track games that need synchronization
  const [gamesNeedingSync, setGamesNeedingSync] = useState<Record<string, boolean>>({});
  
  // Load players and games from Supabase
  useEffect(() => {
    // Add error handling for potential browser extension conflicts (like Solana wallet extensions)
    // This prevents the TypeErrors with MutationObserver
    const originalObserve = window.MutationObserver.prototype.observe;
    try {
      window.MutationObserver.prototype.observe = function (target, options) {
        if (target) {
          return originalObserve.call(this, target, options);
        }
        console.warn('Prevented MutationObserver error with null target');
        return undefined;
      };
    } catch (e) {
      console.warn('Could not patch MutationObserver', e);
    }
    
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Always load from localStorage first as a fallback
        const loadLocalGames = () => {
          try {
            const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
            if (localGamesStr) {
              const localGames = JSON.parse(localGamesStr);
              
              // Format the games data before setting state
              const formattedGames = localGames.map((game: any) => formatGameData(game));
              
              // Sort by startTime (newest first)
              formattedGames.sort((a: Game, b: Game) => b.startTime - a.startTime);
              
              setGames(formattedGames);
              toast.success('Loaded games from local storage');
              
              return formattedGames.length > 0; // Return true if we found games
            }
          } catch (e) {
            console.error('Error loading local games:', e);
          }
          return false;
        };
        
        // Fetch players
        try {
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*');
            
          if (playersError) throw playersError;
          
          if (playersData) {
            // Get local transactions to adjust player balances
            const localTransactionsStr = localStorage.getItem('transactions');
            let localTransactions: any[] = [];
            
            if (localTransactionsStr) {
              try {
                localTransactions = JSON.parse(localTransactionsStr);
              } catch (e) {
                console.error('Error parsing local transactions:', e);
              }
            }
            
            // Process player data with local transaction adjustments
            const formattedPlayers = playersData.map(player => {
              try {
                if (!player.id) return {
                  id: player.id,
                  name: player.name,
                  balance: player.balance || 0,
                  gamesPlayed: player.gamesPlayed || 0,
                  wins: player.gamesWon || 0,
                  winRate: player.gamesPlayed ? (player.gamesWon / player.gamesPlayed) * 100 : 0,
                  winnings: (player.balance || 0) - 300,
                  colorScheme: player.colorScheme || 'blue',
                };
                
                // Filter transactions for this player
                const playerTransactions = localTransactions.filter(tx => tx.playerId === player.id);
                
                // Calculate balance adjustment from all transactions
                const balanceAdjustment = playerTransactions.reduce((sum, tx) => {
                  return sum + (Number(tx.amount) || 0);
                }, 0);
                
                // Count wins from win transactions
                const localWins = playerTransactions.filter(tx => tx.type === 'win').length;
                
                // Count games played from unique game IDs
                const localGameIds = new Set(playerTransactions.map(tx => tx.gameId));
                const localGamesPlayed = localGameIds.size;
                
                // Calculate total balance including local transactions
                const totalBalance = (player.balance || 0) + balanceAdjustment;
                
                // Return the formatted player data with adjustments
                return {
                  id: player.id,
                  name: player.name,
                  balance: totalBalance,
                  gamesPlayed: (player.gamesPlayed || 0) + localGamesPlayed,
                  wins: (player.gamesWon || 0) + localWins,
                  winRate: ((player.gamesWon || 0) + localWins) / 
                          Math.max(1, (player.gamesPlayed || 0) + localGamesPlayed) * 100,
                  winnings: totalBalance - 300, // Assuming starting balance is 300
                  colorScheme: player.colorScheme || 'blue',
                };
              } catch (e) {
                console.error(`Error processing local data for player ${player?.id}:`, e);
                // Fallback to base data if error occurs
                return {
                  id: player.id,
                  name: player.name,
                  balance: player.balance || 0,
                  gamesPlayed: player.gamesPlayed || 0,
                  wins: player.gamesWon || 0,
                  winRate: player.gamesPlayed ? (player.gamesWon / player.gamesPlayed) * 100 : 0,
                  winnings: (player.balance || 0) - 300,
                  colorScheme: player.colorScheme || 'blue',
                };
              }
            });
            
            setPlayers(formattedPlayers);
          }
        } catch (playerError) {
          console.error('Error fetching players:', playerError);
          toast.error('Failed to load player data');
        }
        
        // Get games
        try {
          // Use the loadLocalGames function to load from localStorage first as fallback
          const hasLocalGames = loadLocalGames();
          
          // Try to fetch from Supabase, using different column naming patterns to handle mismatches
          try {
            // First try with camelCase (startTime)
            const { data: gamesData, error: gamesError } = await supabase
              .from('games')
              .select('*')
              .order('startTime', { ascending: false });
            
            if (gamesError) {
              // If that fails, try with lowercase (starttime)
              console.log('Trying alternative column name format...');
              const { data: altGamesData, error: altError } = await supabase
                .from('games')
                .select('*')
                .order('starttime', { ascending: false });
                
              if (altError) {
                throw altError;
              }
              
              if (altGamesData && altGamesData.length > 0) {
                // Process the data and normalize column names (convert starttime to startTime)
                const normalizedData = altGamesData.map((game: any) => {
                  // Normalize keys from lowercase to camelCase
                  const normalized: Record<string, any> = {};
                  Object.keys(game).forEach(key => {
                    const camelKey = key.replace(/(_[a-z])/g, (group) => 
                      group.toUpperCase().replace('_', '')
                    );
                    normalized[camelKey || key] = game[key];
                  });
                  
                  // Handle specific key normalizations
                  if (game.starttime && !normalized.startTime) {
                    normalized.startTime = game.starttime;
                  }
                  if (game.endtime && !normalized.endTime) {
                    normalized.endTime = game.endtime;
                  }
                  
                  return normalized;
                });
                
                // Format and process games
                const formattedGames = normalizedData.map((game: any) => formatGameData(game));
                setGames(formattedGames);
                
                // Save to localStorage for future fallback
                localStorage.setItem('localGames', JSON.stringify(normalizedData));
                localStorage.setItem('games', JSON.stringify(normalizedData));
              } else if (!hasLocalGames) {
                setGames([]); // No games found in either database format
              }
            } else if (gamesData && gamesData.length > 0) {
              // Process normally
              const formattedGames = gamesData.map((game: any) => formatGameData(game));
              setGames(formattedGames);
              
              // Save to localStorage for future fallback
              localStorage.setItem('localGames', JSON.stringify(gamesData));
              localStorage.setItem('games', JSON.stringify(gamesData));
            } else if (!hasLocalGames) {
              setGames([]); // No games found
            }
          } catch (fetchError) {
            console.error('Error fetching games from Supabase:', fetchError);
            
            // If we couldn't load from localStorage earlier, show error
            if (!hasLocalGames) {
              toast.error('Failed to load games data. Check your connection and try again.');
            }
          }
        } catch (e) {
          console.error('Error in games fetching process:', e);
          // Let the user know we're using offline mode
          if (!isOnline) {
            toast.error('Connection issues - working in offline mode');
            setIsOnline(false);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Failed to load application data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    checkGamesSyncStatus();
    
    // Set up online/offline event listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online');
      fetchData();
      syncPendingData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Game actions will be saved locally.');
    };
    
    // Add listener for dataRefresh events
    const handleDataRefresh = (event: any) => {
      console.log('Data refresh event received in games page', event.detail);
      fetchData(); // Reload games data
      
      // Wait for games to load before checking sync status
      setTimeout(() => {
        checkGamesSyncStatus();
      }, 1000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('dataRefresh', handleDataRefresh);
    
    // Check for pending data to sync when component mounts
    if (isOnline) {
      setTimeout(() => {
        syncPendingData();
      }, 3000);
    }
    
    // Set up subscriptions for real-time updates
    const playersSubscription = supabase
      .channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, payload => {
        // Update players in real-time
        if (payload.eventType === 'UPDATE') {
          const updatedPlayer = payload.new;
          setPlayers(prevPlayers => 
            prevPlayers.map(player => 
              player.id === updatedPlayer.id ? {
                ...player,
                name: updatedPlayer.name,
                balance: updatedPlayer.balance,
                gamesPlayed: updatedPlayer.gamesPlayed || 0,
                wins: updatedPlayer.gamesWon || 0,
                winRate: updatedPlayer.gamesPlayed ? (updatedPlayer.gamesWon / updatedPlayer.gamesPlayed) * 100 : 0,
                winnings: updatedPlayer.balance - 300
              } : player
            )
          );
        } else if (payload.eventType === 'INSERT') {
          // Add new player to the state
          const newPlayer = payload.new;
          setPlayers(prevPlayers => [
            ...prevPlayers,
            {
              id: newPlayer.id,
              name: newPlayer.name,
              balance: newPlayer.balance,
              gamesPlayed: newPlayer.gamesPlayed || 0,
              wins: newPlayer.gamesWon || 0,
              winRate: newPlayer.gamesPlayed ? (newPlayer.gamesWon / newPlayer.gamesPlayed) * 100 : 0,
              winnings: newPlayer.balance - 300,
              colorScheme: newPlayer.colorScheme || 'blue'
            }
          ]);
        }
      })
      .subscribe();
      
    const gamesSubscription = supabase
      .channel('public:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
        // Handle game changes
        if (payload.eventType === 'INSERT') {
          const newGame = payload.new;
          setGames(prevGames => [...prevGames, formatGameData(newGame)]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedGame = payload.new;
          setGames(prevGames => 
            prevGames.map(game => 
              game.id === updatedGame.id ? formatGameData(updatedGame) : game
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedGameId = payload.old.id;
          setGames(prevGames => prevGames.filter(game => game.id !== deletedGameId));
        }
      })
      .subscribe();
    
    // Add subscription for transactions to update player balances in real-time
    const transactionsSubscription = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, async payload => {
        // When a new transaction is added, refresh player data to ensure balances are up-to-date
        try {
          console.log('Transaction detected, refreshing player data');
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*');
            
          if (playersError) throw playersError;
          
          if (playersData) {
            const formattedPlayers = playersData.map(player => ({
              id: player.id,
              name: player.name,
              balance: player.balance,
              gamesPlayed: player.gamesPlayed || 0,
              wins: player.gamesWon || 0,
              winRate: player.gamesPlayed ? (player.gamesWon / player.gamesPlayed) * 100 : 0,
              winnings: player.balance - 300, // Assuming starting balance is 300
              colorScheme: player.colorScheme || 'blue',
            }));
            setPlayers(formattedPlayers);
          }
        } catch (error) {
          console.error('Error refreshing player data after transaction:', error);
        }
      })
      .subscribe();
    
    // Cleanup subscriptions
    return () => {
      try {
        supabase.removeChannel(playersSubscription);
        supabase.removeChannel(gamesSubscription);
        supabase.removeChannel(transactionsSubscription);
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);
  
  // Check which completed games need synchronization
  const checkGamesSyncStatus = async () => {
    console.log('Checking games sync status with', games.length, 'games');
    try {
      // Make sure we have games to check
      if (!games || games.length === 0) {
        console.log('No games to check for sync status');
        return;
      }
      
      const completedGames = games.filter(game => game.status === 'completed');
      if (completedGames.length === 0) {
        console.log('No completed games to check for sync status');
        return;
      }
      
      console.log(`Checking sync status for ${completedGames.length} completed games`);
      const newGamesNeedingSync: Record<string, boolean> = {};
      
      // Check each completed game to see if it has associated transactions
      for (const game of completedGames) {
        try {
          let hasTransactions = false;
          
          // If it's a local game, check local storage
          if (typeof game.id === 'string' && game.id.startsWith('local_')) {
            hasTransactions = await checkLocalGameHasTransaction(game.id);
            console.log(`Local game ${game.id} has transactions: ${hasTransactions}`);
          } else {
            // For server games, check Supabase
            hasTransactions = await checkGameHasTransaction(game.id);
            console.log(`Server game ${game.id} has transactions: ${hasTransactions}`);
          }
          
          if (!hasTransactions && game.winner) {
            console.log(`Game ${game.id} needs sync (has winner but no transactions)`);
            newGamesNeedingSync[game.id] = true;
          }
        } catch (e) {
          console.error(`Error checking transactions for game ${game.id}:`, e);
          // If error checking, don't assume it needs sync automatically
        }
      }
      
      const syncCount = Object.keys(newGamesNeedingSync).length;
      console.log(`Found ${syncCount} games needing sync:`, Object.keys(newGamesNeedingSync));
      setGamesNeedingSync(newGamesNeedingSync);
    } catch (error) {
      console.error('Error checking games sync status:', error);
    }
  };
  
  // Mark a game as synced (no longer needing synchronization)
  const markGameAsSynced = (gameId: string) => {
    console.log(`Marking game ${gameId} as synced`);
    setGamesNeedingSync(prev => {
      const updated = { ...prev };
      delete updated[gameId];
      return updated;
    });
    
    // Trigger a data refresh event to update UI across components
    window.dispatchEvent(new CustomEvent('dataRefresh', { 
      detail: { 
        timestamp: Date.now(),
        source: 'gameSynced',
        gameId
      } 
    }));
  };
  
  // Check if a local game has associated win transaction
  const checkLocalGameHasTransaction = async (gameId: string): Promise<boolean> => {
    try {
      const transactionsStr = localStorage.getItem('transactions');
      if (!transactionsStr) return false;
      
      const transactions = JSON.parse(transactionsStr);
      const winTransaction = transactions.find(
        (tx: any) => tx.gameId === gameId && tx.type === 'win'
      );
      
      return !!winTransaction;
    } catch (e) {
      console.error('Error checking local game transactions:', e);
      return false;
    }
  };
  
  // Function to check if a game has associated win transaction
  const checkGameHasTransaction = async (gameId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('gameId', gameId)
        .eq('type', 'win')
        .maybeSingle();
        
      if (error) {
        console.error('Error checking game transaction:', error);
        
        // If there's an error with Supabase, fallback to checking local storage
        return await checkLocalGameHasTransaction(gameId);
      }
      
      return data !== null;
    } catch (e) {
      console.error('Error in checkGameHasTransaction:', e);
      return false;
    }
  };
  
  // Create a new game
  const createGame = async (gameFormData: {
    name: string;
    type: string;
    players: GamePlayer[];
    totalPot: number;
    customData?: {
      name: string;
      wagerAmount: number;
    };
  }) => {
    try {
      console.log("Creating game with data:", JSON.stringify(gameFormData));
      
      // Validate required fields
      if (!gameFormData.name || !gameFormData.type || !gameFormData.players || gameFormData.players.length < 2) {
        toast.error('Missing required game information');
        return;
      }
      
      // Extract data from customData before inserting
      const gameName = gameFormData.customData ? 
        `${gameFormData.customData.name} (Entry: $${gameFormData.customData.wagerAmount})` : 
        gameFormData.name;

      // Convert players array to JSONB object with player IDs as keys
      const playersObject = {};
      gameFormData.players.forEach(player => {
        playersObject[player.id] = {
          name: player.name,
          bet: player.bet
        };
      });

      let gameId;
      let createdGameData;
      let createdLocally = false;

      // Try to create in Supabase
      try {
        const result = await supabase
          .from('games')
          .insert({
            name: gameName,
            type: gameFormData.type,
            status: 'active',
            startTime: Date.now(),
            totalPot: gameFormData.totalPot,
            players: playersObject,
          })
          .select();
        
        if (result.error) throw result.error;
        
        if (!result.data || result.data.length === 0) {
          throw new Error("No game data returned after creation");
        }
        
        createdGameData = result.data[0];
        gameId = createdGameData.id;
        console.log("Game created with ID:", gameId);
      } catch (supabaseError) {
        console.error("Failed to create game via Supabase client:", supabaseError);
        
        // Try direct API insert as first fallback
        try {
          console.log("Attempting direct API insert...");
          createdGameData = await directInsertGame({
            name: gameName,
            type: gameFormData.type,
            totalPot: gameFormData.totalPot,
            players: playersObject
          });
          
          gameId = createdGameData.id;
          console.log("Game created via direct API with ID:", gameId);
          toast.success('Game created successfully (via direct API)');
        } catch (directApiError) {
          console.error("Failed to create game via direct API:", directApiError);
          
          // Fallback to localStorage as last resort
          try {
            // Generate a local ID
            gameId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            // Convert the players object back to an array for localStorage
            // This ensures consistency with the UI expectations
            const playersArray = gameFormData.players.map(player => ({
              id: player.id,
              name: player.name,
              bet: player.bet
            }));
            
            createdGameData = {
              id: gameId,
              name: gameName,
              type: gameFormData.type,
              status: 'active',
              startTime: Date.now(),
              totalPot: gameFormData.totalPot,
              players: playersArray, // Store as array, not as object
              createdLocally: true,
              date: new Date().toISOString() // Add date for consistent formatting
            };
            
            // Always save to 'localGames' for consistency
            const localGames = JSON.parse(localStorage.getItem('localGames') || '[]');
            localGames.push(createdGameData);
            localStorage.setItem('localGames', JSON.stringify(localGames));
            
            // Add to games state
            const formattedGame = formatGameData(createdGameData);
            setGames(prevGames => [...prevGames, formattedGame]);
            
            createdLocally = true;
            console.log("Game created locally with ID:", gameId);
            toast.success('Game created locally (offline mode)');
          } catch (localErr) {
            console.error("Failed to create game locally:", localErr);
            toast.error("Game creation failed completely");
            return;
          }
        }
      }
      
      // If game was created locally, don't try to update the database
      if (createdLocally) {
        // Reset UI state
        setShowCreateGame(false);
        return;
      }
      
      // Create transactions for each player's bet
      let transactionSuccess = true;
      for (const player of gameFormData.players) {
        try {
          // Create transaction record
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              gameId: gameId,
              playerId: player.id,
              amount: -player.bet, // Negative because they're betting/spending
              type: 'bet',
              timestamp: Date.now(),
              description: `Bet on ${gameFormData.customData?.name || gameFormData.name}`
            });
            
          if (transactionError) {
            console.error("Transaction error:", transactionError);
            transactionSuccess = false;
          }
          
          // Update player balance
          const { error: playerError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('decrement', { row_id: player.id, amount: player.bet }),
              gamesPlayed: supabase.rpc('increment_games_played', { row_id: player.id })
            })
            .eq('id', player.id);
            
          if (playerError) {
            console.error("Player update error:", playerError);
          }
        } catch (err) {
          console.error(`Failed to process bet for player ${player.id}:`, err);
          transactionSuccess = false;
          // Continue with other players even if one fails
        }
      }
      
      // Reset UI state
      setShowCreateGame(false);
      
      if (transactionSuccess) {
        toast.success('Game created successfully');
      } else {
        toast.success('Game created but some player transactions failed');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Handle managing a game - either viewing or editing based on status
  const handleManageGame = (gameId: string) => {
    setActiveGameId(gameId);
  };

  // End an active game and declare a winner
  const endGame = async (gameId: string, winnerId: string, method: string) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) {
        toast.error('Game not found');
        return;
      }
      
      const winningPlayer = game.players.find(p => p.id === winnerId);
      if (!winningPlayer) {
        toast.error('Winning player not found in game');
        return;
      }
      
      // Check if this is a local game (created when database was offline)
      const isLocalGame = gameId.startsWith('local_');
      
      // Create the updated game object for UI updating
      const updatedGame = {
        ...game,
        status: 'completed' as const,
        endTime: Date.now(),
        winner: winnerId,
        winMethod: method
      };
      
      let updateSuccess = false;
      
      // If not a local game, try to update in Supabase
      if (!isLocalGame) {
        try {
          console.log("Updating game status in database:", gameId);
          const { error: gameError } = await supabase
            .from('games')
            .update({
              status: 'completed',
              endTime: Date.now(),
              winner: winnerId,
              winMethod: method
            })
            .eq('id', gameId);
            
          if (gameError) {
            console.error('Database error updating game status:', gameError);
            throw gameError;
          }
          
          updateSuccess = true;
        } catch (err) {
          console.error('Error updating game status:', err);
          
          // Try direct API update as fallback
          try {
            console.log("Attempting direct API update...");
            await directUpdateGame(gameId, {
              status: 'completed',
              endTime: Date.now(),
              winner: winnerId,
              winMethod: method
            });
            
            updateSuccess = true;
            console.log("Game updated via direct API");
          } catch (directApiError) {
            console.error('Failed to update game via direct API:', directApiError);
            
            // Fall back to local storage update for database-created games
            try {
              // Just update UI and warn user that backend update failed
              toast.error('Failed to update game in database. Results will update locally only.');
              
              // Create a record of failed updates to retry later
              const failedUpdates = JSON.parse(localStorage.getItem('failedGameUpdates') || '[]');
              failedUpdates.push({
                gameId,
                update: {
                  status: 'completed',
                  endTime: Date.now(),
                  winner: winnerId,
                  winMethod: method
                },
                timestamp: Date.now()
              });
              localStorage.setItem('failedGameUpdates', JSON.stringify(failedUpdates));
              
              // We'll still update the UI
              updateSuccess = true;
            } catch (localStorageError) {
              console.error('Error saving failed update to localStorage:', localStorageError);
            }
          }
        }
      } else {
        // For local games, update directly in localStorage
        try {
          const localGames = JSON.parse(localStorage.getItem('localGames') || '[]');
          const updatedLocalGames = localGames.map(g => 
            g.id === gameId ? {
              ...g,
              status: 'completed',
              endTime: Date.now(),
              winner: winnerId,
              winMethod: method
            } : g
          );
          localStorage.setItem('localGames', JSON.stringify(updatedLocalGames));
          updateSuccess = true;
          console.log("Local game updated in localStorage");
        } catch (localErr) {
          console.error('Error updating local game:', localErr);
          toast.error('Failed to update local game');
        }
      }
      
      // Process winner's winnings
      let transactionSuccess = false;
      if (updateSuccess && !isLocalGame) {
        try {
          // Create transaction for winner's winnings
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              gameId,
              playerId: winnerId,
              amount: game.totalPot,
              type: 'win',
              timestamp: Date.now(),
              description: `Won game: ${game.name}`
            });
            
          if (transactionError) {
            console.error('Transaction creation error:', transactionError);
            // Continue despite error - we'll try to update player balance anyway
          } else {
            transactionSuccess = true;
          }
          
          // Update winner's balance and win count
          const { error: playerError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { row_id: winnerId, amount: game.totalPot }),
              gamesWon: supabase.rpc('increment_games_won', { row_id: winnerId })
            })
            .eq('id', winnerId);
            
          if (playerError) {
            console.error('Player update error:', playerError);
            toast.error('Failed to update winner stats');
          } else {
            // Immediately update the player in the local state to reflect changes
            setPlayers(prevPlayers => 
              prevPlayers.map(player => 
                player.id === winnerId ? {
                  ...player,
                  balance: player.balance + game.totalPot,
                  wins: player.wins + 1,
                  winRate: (player.wins + 1) / (player.gamesPlayed) * 100,
                  winnings: player.winnings + game.totalPot
                } : player
              )
            );
          }
        } catch (err) {
          console.error('Error processing winner transaction:', err);
          
          // Store failed transaction in localStorage for retry
          const failedTransactions = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
          failedTransactions.push({
            type: 'win',
            gameId,
            playerId: winnerId,
            amount: game.totalPot,
            timestamp: Date.now(),
            description: `Won game: ${game.name}`
          });
          localStorage.setItem('failedTransactions', JSON.stringify(failedTransactions));
          
          toast.error('Game ended but transaction failed. Will retry when online.');
        }
      } else if (updateSuccess && isLocalGame) {
        // Update player stats locally
        const localPlayers = JSON.parse(localStorage.getItem('localPlayerStats') || '{}');
        if (!localPlayers[winnerId]) {
          localPlayers[winnerId] = { 
            winsAdded: 0, 
            balanceAdjustment: 0 
          };
        }
        
        localPlayers[winnerId].winsAdded += 1;
        localPlayers[winnerId].balanceAdjustment += game.totalPot;
        
        localStorage.setItem('localPlayerStats', JSON.stringify(localPlayers));
        
        // Also update the UI player state
        setPlayers(prevPlayers => 
          prevPlayers.map(player => 
            player.id === winnerId ? {
              ...player,
              balance: player.balance + game.totalPot,
              wins: player.wins + 1,
              winRate: (player.wins + 1) / (player.gamesPlayed) * 100,
              winnings: player.winnings + game.totalPot
            } : player
          )
        );
        
        toast.success('Local player stats updated');
      }
      
      // Close the game details view
      setActiveGameId(null);
      
      // Update UI for the completed game
      setGames(prevGames => 
        prevGames.map(g => g.id === gameId ? updatedGame : g)
      );
      
      if (updateSuccess) {
        toast.success(`Game ended. ${winningPlayer.name} won $${game.totalPot.toFixed(2)}!`);
      }
    } catch (error) {
      console.error('Error ending game:', error);
      toast.error('Failed to end game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Get filtered and sorted games
  const activeGames = games.filter(game => game.status === 'active');
  const completedGames = games.filter(game => game.status === 'completed').sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activeGame = activeGameId ? games.find(g => g.id === activeGameId) : null;
  
  // Format game data from Supabase
  const formatGameData = (game: any) => {
    // Parse wager amount from the game name if it follows our format
    let customData: { name: string; wagerAmount: number; } | undefined = undefined;
    
    if (game.name && game.name.includes('(Entry: $')) {
      try {
        const nameMatch = game.name.match(/(.*) \(Entry: \$(\d+(\.\d+)?)\)/);
        if (nameMatch) {
          const baseName = nameMatch[1];
          const wagerAmount = parseFloat(nameMatch[2]);
          
          customData = {
            name: baseName,
            wagerAmount: wagerAmount
          };
        }
      } catch (e) {
        console.error("Error parsing game name for wager:", e);
      }
    }
    
    // Convert players object to array format that the UI expects
    let players = [];
    try {
      if (game.players) {
        // Handle different player formats
        if (typeof game.players === 'string') {
          // If it's a string, parse it first
          try {
            const parsedData = JSON.parse(game.players);
            if (Array.isArray(parsedData)) {
              players = parsedData;
            } else if (typeof parsedData === 'object') {
              // Convert object format to array format
              players = Object.entries(parsedData).map(([id, data]) => ({
                id,
                name: (data as any).name,
                bet: (data as any).bet
              }));
            }
          } catch (e) {
            console.error("Error parsing players string:", e);
            players = []; // Reset to empty array on error
          }
        } else if (Array.isArray(game.players)) {
          // If it's already an array, use it directly
          players = game.players;
        } else if (typeof game.players === 'object' && game.players !== null) {
          // If it's an object (new format), convert to array
          players = Object.entries(game.players).map(([id, data]) => ({
            id,
            name: (data as any).name,
            bet: (data as any).bet
          }));
        }
      }
      
      // Ensure each player has id, name, and bet properties
      players = players.map((player: any) => ({
        id: player.id || `player-${Math.random().toString(36).substring(2, 9)}`,
        name: player.name || 'Unknown Player',
        bet: typeof player.bet === 'number' ? player.bet : 0
      }));
    } catch (e) {
      console.error("Error processing players:", e);
      players = [];
    }
    
    return {
      id: game.id,
      name: game.name,
      type: game.type,
      date: new Date(game.startTime).toLocaleDateString(),
      startTime: game.startTime,
      endTime: game.endTime,
      players: players, // This is now guaranteed to be an array
      totalPot: game.totalPot || 0,
      status: game.status || 'active',
      winner: game.winner,
      notes: game.notes,
      winMethod: game.winMethod,
      customData
    };
  };
  
  // Calculate game statistics for each type
  const gameStats = [{
    type: 'custom',
    name: 'Custom Games',
    icon: gameTypes[0].icon,
    bgClass: gameTypes[0].bgClass,
    count: games.length,
    totalPot: games.reduce((sum, game) => sum + game.totalPot, 0),
    avgPot: games.length > 0 ? games.reduce((sum, game) => sum + game.totalPot, 0) / games.length : 0,
    avgPlayers: games.length > 0 
      ? games.reduce((sum, game) => sum + game.players.length, 0) / games.length 
      : 0
  }];
  
  // Add this function below the createGame function
  const directInsertGame = async (gameData: any) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      // Create a minimal record with only essential fields
      const minimalGameData = {
        name: gameData.name,
        type: gameData.type || 'custom',
        status: 'active',
        startTime: Date.now(),
        totalPot: gameData.totalPot || 0,
        // Convert players to string to avoid any potential JSONB validation issues
        players: JSON.stringify(gameData.players)
      };
      
      // Make a direct POST request to Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(minimalGameData)
      });
      
      if (!response.ok) {
        console.error(`Error response from Supabase: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        throw new Error(`Failed to create game: ${response.statusText}`);
      }
      
      const createdGame = await response.json();
      return createdGame[0]; // Return the created game object
    } catch (error) {
      console.error('Direct insert error:', error);
      throw error;
    }
  };
  
  // Function to directly update a game via REST API
  const directUpdateGame = async (gameId: string, updateData: any) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      // Make a direct PATCH request to Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/games?id=eq.${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        console.error(`Error response from Supabase: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        throw new Error(`Failed to update game: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Direct update error:', error);
      throw error;
    }
  };
  
  // Sync pending local storage data with the server
  const syncPendingData = async () => {
    const failedGameUpdates = JSON.parse(localStorage.getItem('failedGameUpdates') || '[]');
    const failedTransactions = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
    
    // If there are no pending updates, notify and exit
    if (failedGameUpdates.length === 0 && failedTransactions.length === 0) {
      toast.success('No pending updates to sync');
      return;
    }
    
    console.log(`Attempting to sync ${failedGameUpdates.length} game updates and ${failedTransactions.length} transactions`);
    toast.success(`Syncing ${failedGameUpdates.length + failedTransactions.length} pending updates...`);
    
    // Process failed game updates
    const successfulGameUpdates = [];
    for (const update of failedGameUpdates) {
      try {
        // Attempt to update in Supabase
        const { data, error } = await supabase
          .from('games')
          .update(update.update)  // Use 'update' instead of 'updateData' to match existing format
          .eq('id', update.gameId);
        
        if (error) {
          console.error('Failed to sync game update:', error);
          // Try direct API update as fallback
          try {
            await directUpdateGame(update.gameId, update.update);  // Use 'update' instead of 'updateData'
            successfulGameUpdates.push(update);
            console.log(`Successfully synced game update for game ${update.gameId} via direct API`);
          } catch (directError) {
            console.error('Failed to sync game update via direct API:', directError);
          }
        } else {
          successfulGameUpdates.push(update);
          console.log(`Successfully synced game update for game ${update.gameId}`);
        }
      } catch (e) {
        console.error('Error during game update sync:', e);
      }
    }
    
    // Process failed transactions
    const successfulTransactions = [];
    for (const transaction of failedTransactions) {
      try {
        // Attempt to insert transaction in Supabase
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            gameId: transaction.gameId,
            playerId: transaction.playerId,
            amount: transaction.amount,
            type: transaction.type,
            timestamp: transaction.timestamp,
            description: transaction.description
          });
        
        if (error) {
          console.error('Failed to sync transaction:', error);
        } else {
          successfulTransactions.push(transaction);
          console.log(`Successfully synced transaction for player ${transaction.playerId}`);
          
          // Update player balance for win transactions
          if (transaction.type === 'win') {
            // Update player balance using Supabase
            await supabase
              .from('players')
              .update({
                balance: supabase.rpc('increment', { 
                  row_id: transaction.playerId, 
                  amount: transaction.amount 
                }),
                wins: supabase.rpc('increment', { 
                  row_id: transaction.playerId,
                  amount: 1
                })
              })
              .eq('id', transaction.playerId);
          }
        }
      } catch (e) {
        console.error('Error during transaction sync:', e);
      }
    }
    
    // Remove successful updates from local storage
    if (successfulGameUpdates.length > 0) {
      const remainingGameUpdates = failedGameUpdates.filter(
        update => !successfulGameUpdates.includes(update)
      );
      localStorage.setItem('failedGameUpdates', JSON.stringify(remainingGameUpdates));
    }
    
    if (successfulTransactions.length > 0) {
      const remainingTransactions = failedTransactions.filter(
        transaction => !successfulTransactions.includes(transaction)
      );
      localStorage.setItem('failedTransactions', JSON.stringify(remainingTransactions));
    }
    
    // Notify user of successful syncs
    const totalSuccessful = successfulGameUpdates.length + successfulTransactions.length;
    const totalRemaining = (failedGameUpdates.length - successfulGameUpdates.length) + 
                          (failedTransactions.length - successfulTransactions.length);
    
    if (totalSuccessful > 0) {
      toast.success(`Successfully synced ${totalSuccessful} updates`);
      if (totalRemaining > 0) {
        toast.error(`${totalRemaining} updates could not be synced and will be retried later`);
      }
      
      // Refresh data to reflect changes
      const fetchData = async () => {
        try {
          // Fetch players
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*');
            
          if (playersError) throw playersError;
          
          if (playersData) {
            const formattedPlayers = playersData.map(player => ({
              id: player.id,
              name: player.name,
              balance: player.balance,
              gamesPlayed: player.gamesPlayed || 0,
              wins: player.gamesWon || 0,
              winRate: player.gamesPlayed ? (player.gamesWon / player.gamesPlayed) * 100 : 0,
              winnings: player.balance - 300,
              colorScheme: player.colorScheme || 'blue',
            }));
            setPlayers(formattedPlayers);
          }
          
          // Fetch games
          const { data: gamesData, error: gamesError } = await supabase
            .from('games')
            .select('*');
            
          if (gamesError) throw gamesError;
          
          if (gamesData) {
            const formattedGames = gamesData.map(game => formatGameData(game));
            setGames(formattedGames);
          }
        } catch (error) {
          console.error('Error refreshing data after sync:', error);
        }
      };
      
      fetchData();
    }
  };
  
  // Function to check if there are pending updates
  const hasPendingUpdates = () => {
    const failedGameUpdates = JSON.parse(localStorage.getItem('failedGameUpdates') || '[]');
    const failedTransactions = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
    return failedGameUpdates.length > 0 || failedTransactions.length > 0;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-medium text-gray-800 flex items-center">
              <span className="bg-navy p-2 rounded-lg mr-2">
                <TrophyIcon className="h-6 w-6 text-white" />
              </span>
              Casino Games
              {/* Online status indicator */}
              <span 
                className={`ml-3 flex items-center text-xs px-2 py-1 rounded-full
                  ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                title={isOnline ? 'Connected to database' : 'Offline mode - changes saved locally'}
              >
                <span className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </h1>
            
            <div className="flex space-x-2">
              {/* Sync button - only shown if we have pending data */}
              {isOnline && hasPendingUpdates() && (
                <button
                  onClick={() => syncPendingData()}
                  className="px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
                  title="Sync local changes with server"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              
              <div>
                <button
                  className={`flex items-center px-4 py-2 rounded-md mr-2 ${
                    !statsMode ? 'bg-navy text-white' : 'bg-white text-navy border border-gray-200'
                  }`}
                  onClick={() => setStatsMode(false)}
                >
                  <ListBulletIcon className="h-5 w-5 mr-2" />
                  Games
                </button>
              </div>
              <div>
                <button
                  className={`flex items-center px-4 py-2 rounded-md ${
                    statsMode ? 'bg-navy text-white' : 'bg-white text-navy border border-gray-200'
                  }`}
                  onClick={() => setStatsMode(true)}
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Statistics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Game Creation */}
        {showCreateGame && (
          <div className="mb-8">
            <EnhancedGameCreation 
              players={players}
              onCreateGame={createGame}
              onCancel={() => setShowCreateGame(false)}
            />
          </div>
        )}
        
        {/* Game Details */}
        {activeGameId && activeGame && (
          <GameDetailModal
            gameId={activeGameId}
            onClose={() => setActiveGameId(null)}
          />
        )}
        
        {/* Game Statistics */}
        {statsMode && !showCreateGame && !activeGameId && (
          <div className="mb-8">
            <h2 className="text-2xl font-medium mb-6 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-navy" />
              Game Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameStats.map(stat => (
                <div 
                  key={stat.type} 
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-50 p-2 rounded-lg mr-3">
                        <div className="text-navy">{stat.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-gray-800">{stat.name}</h3>
                        <div className="text-gray-600">{stat.count} games played</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Avg. Pot Size</div>
                        <div className="text-lg font-medium text-gray-800">${stat.avgPot.toFixed(2)}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Avg. Players</div>
                        <div className="text-lg font-medium text-gray-800">{stat.avgPlayers.toFixed(1)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500">Total Money Wagered</div>
                      <div className="text-lg font-medium text-gray-800">${stat.totalPot.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Active and Completed Games */}
        {!showCreateGame && !activeGameId && !statsMode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Games */}
            <div>
              <h2 className="text-2xl font-medium mb-6 flex items-center">
                <FlagIcon className="h-6 w-6 mr-2 text-navy" />
                Active Games
              </h2>
              
              {activeGames.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="text-6xl mb-4 opacity-30">🎲</div>
                  <p className="text-gray-500 mb-4">No active games at the moment.</p>
                  <button 
                    onClick={() => setShowCreateGame(true)}
                    className="px-6 py-3 bg-navy text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
                  >
                    Start Your First Game
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGames.map(game => {
                    const gameType = gameTypes[0]; // Only have custom games now
                    
                    return (
                      <div 
                        key={game.id} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all transform hover:scale-[1.01] duration-200"
                        onClick={() => handleManageGame(game.id)}
                      >
                        <div className="bg-navy p-4">
                          <div className="flex items-center">
                            <div className="bg-blue-800 bg-opacity-50 p-2 rounded-lg mr-3">
                              {gameType.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-xl text-white">{game.name}</h3>
                              <div className="text-blue-100">
                                {game.customData ? game.customData.name : 'Custom Game'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center text-gray-600">
                              <UsersIcon className="h-5 w-5 mr-1" />
                              <span>{game.players.length} players</span>
                            </div>
                            <div className="text-green-600 font-medium">
                              ${game.totalPot.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {game.players.slice(0, 3).map(player => (
                              <span key={player.id} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">
                                {player.name}
                              </span>
                            ))}
                            {game.players.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">
                                +{game.players.length - 3} more
                              </span>
                            )}
                          </div>
                          
                          <div className="text-gray-500 text-sm">
                            {new Date(game.startTime).toLocaleDateString()} at {new Date(game.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setShowCreateGame(true)}
          className="px-4 py-2 bg-navy text-white rounded-md hover:bg-blue-900 transition-colors duration-200 flex items-center"
          disabled={showCreateGame}
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          New Game
        </button>
        
        <Link 
          href="/"
          className="px-4 py-2 bg-white text-navy rounded-md hover:bg-gray-50 transition-colors duration-200 border border-gray-200"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
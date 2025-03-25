'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrophyIcon, 
  UserIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import RetroactiveGameProcessor from './RetroactiveGameProcessor';
import LoadingSpinner from './LoadingSpinner';
import EndGameModal from './EndGameModal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  bet: number;
}

interface Game {
  id: string;
  name: string;
  type: string;
  date: string;
  startTime: number;
  endTime?: number; 
  players: Player[];
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

interface Transaction {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  type: string;
  timestamp: number;
  description: string;
  gameId: string;
}

interface GameDetailsProps {
  gameId?: string;
  onSynced?: () => void;
  onGameLoaded?: (status: string) => void;
  hideTitle?: boolean;
  
  // Legacy props for backward compatibility
  game?: Game;
  onClose?: () => void;
  onEndGame?: (gameId: string, winnerId: string) => Promise<void>;
  allPlayers?: Player[];
}

export default function GameDetails({ 
  gameId, 
  onSynced,
  onGameLoaded,
  hideTitle = false,
  game: propGame,
  onClose,
  onEndGame,
  allPlayers
}: GameDetailsProps) {
  const [game, setGame] = useState<Game | null>(propGame || null);
  const [winner, setWinner] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(!propGame);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get('admin') === 'true';
  
  // Load game details only if game prop is not provided
  useEffect(() => {
    // If game is passed directly as prop, no need to load
    if (propGame) {
      setGame(propGame);
      if (onGameLoaded) {
        onGameLoaded(propGame.status);
      }
      return;
    }
    
    loadGameDetails();
  }, [gameId, propGame, onGameLoaded]);
  
  // Add event listener for game updates from admin panel
  useEffect(() => {
    // Listen for specific game updates
    const handleGameUpdate = (event: any) => {
      if (event.detail && event.detail.gameId === gameId) {
        console.log('Game details received update event for this game');
        // Reload game data
        loadGameDetails();
      }
    };
    
    // Listen for general data refresh events
    const handleDataRefresh = (event: any) => {
      // Handle game deletion events
      if (event.detail && event.detail.source === 'gameDelete') {
        // Check if the deleted game is the current game
        if (event.detail.gameId === gameId) {
          console.log('Current game has been deleted');
          setError('This game has been deleted');
          
          // Notify the parent if available
          if (onClose) {
            onClose();
          } else {
            // Redirect to game history after a short delay
            setTimeout(() => {
              router.push('/game-history');
            }, 2000);
          }
          return;
        }
      }
      
      // Handle edit events
      if (event.detail && event.detail.source === 'adminEdit') {
        if (!event.detail.gameId || event.detail.gameId === gameId) {
          console.log('Game details received general data refresh from admin edit');
          // Reload game data
          loadGameDetails();
          // Also reload transactions in case they were updated
          if (gameId) {
            loadTransactions(gameId);
          }
        }
      }
    };
    
    // Listen for game history update events
    const handleGameHistoryUpdate = (event: any) => {
      // Check if this is a deletion
      if (event.detail && event.detail.operation === 'delete') {
        // If the deleted game is the current game
        if (event.detail.gameId === gameId) {
          console.log('Current game has been deleted via gameHistoryUpdate event');
          setError('This game has been deleted');
          
          // Notify the parent if available
          if (onClose) {
            onClose();
          } else {
            // Redirect to game history after a short delay
            setTimeout(() => {
              router.push('/game-history');
            }, 2000);
          }
          return;
        }
      } 
      // For other updates to the current game
      else if (event.detail && event.detail.gameId === gameId) {
        console.log('Game details received update event for this game');
        // Reload game data
        loadGameDetails();
      }
    };
    
    window.addEventListener('gameHistoryUpdate', handleGameHistoryUpdate);
    window.addEventListener('dataRefresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('gameHistoryUpdate', handleGameHistoryUpdate);
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, [gameId, onClose, router]);
  
  // Notify parent when game is loaded
  useEffect(() => {
    if (game && onGameLoaded) {
      onGameLoaded(game.status);
      
      // Debug player data
      if (game.players) {
        console.log('Game has players:', 
          Array.isArray(game.players) ? game.players.length : 'Not an array');
        console.log('Player data sample:', 
          Array.isArray(game.players) && game.players.length > 0 ? game.players[0] : 'No players');
      } else {
        console.warn('Game has no players array');
      }
    }
  }, [game, onGameLoaded]);
  
  // If propGame changes, update the state
  useEffect(() => {
    if (propGame) {
      setGame(propGame);
      setLoading(false);
      
      // If we have allPlayers and a winner ID, find the winner
      if (allPlayers && propGame.winner) {
        const gameWinner = allPlayers.find(p => p.id === propGame.winner);
        if (gameWinner) {
          setWinner(gameWinner);
        }
      }
      
      // Load transactions for the game
      loadTransactions(propGame.id);
    }
  }, [propGame, allPlayers]);
  
  // Load game from localStorage
  const loadLocalGame = async (): Promise<boolean> => {
    try {
      console.log('Attempting to load game from localStorage');
      
      // First check in completedGames, which is most likely to have the latest data for a completed game
      const completedGamesStr = localStorage.getItem('completedGames');
      if (completedGamesStr) {
        const completedGames = JSON.parse(completedGamesStr);
        const gameFromCompleted = completedGames.find((g: any) => g.id === gameId);
        
        if (gameFromCompleted) {
          console.log('Found game in completedGames cache');
          
          // Ensure players are properly formatted
          if (gameFromCompleted.players) {
            try {
              // Handle string-formatted players
              if (typeof gameFromCompleted.players === 'string') {
                gameFromCompleted.players = JSON.parse(gameFromCompleted.players);
              }
              
              // Handle object-formatted players (convert to array)
              if (!Array.isArray(gameFromCompleted.players) && typeof gameFromCompleted.players === 'object') {
                gameFromCompleted.players = Object.entries(gameFromCompleted.players).map(([id, data]: [string, any]) => ({
                  id,
                  name: data.name || 'Unknown',
                  bet: data.bet || 0
                }));
              }
              
              // Ensure all player objects have proper structure
              gameFromCompleted.players = gameFromCompleted.players.map((player: any) => ({
                id: player.id || `player_${Math.random().toString(36).substring(2, 9)}`,
                name: player.name || 'Unknown Player',
                bet: typeof player.bet === 'number' ? player.bet : parseFloat(player.bet) || 0
              }));
            } catch (e) {
              console.error('Error formatting players:', e);
              gameFromCompleted.players = [];
            }
          } else {
            gameFromCompleted.players = [];
          }
          
          setGame(gameFromCompleted);
          
          // Make sure this game also exists in the main games lists
          const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
          if (localGamesStr) {
            const localGames = JSON.parse(localGamesStr);
            const existsInLocalGames = localGames.some((g: any) => g.id === gameId);
            
            if (!existsInLocalGames) {
              console.log('Adding game to localGames for consistency');
              localGames.push(gameFromCompleted);
              localStorage.setItem('localGames', JSON.stringify(localGames));
              localStorage.setItem('games', JSON.stringify(localGames));
            } else {
              // Update the existing game with the latest data from completedGames
              const updatedGames = localGames.map((g: any) => 
                g.id === gameId ? { ...g, ...gameFromCompleted } : g
              );
              localStorage.setItem('localGames', JSON.stringify(updatedGames));
              localStorage.setItem('games', JSON.stringify(updatedGames));
              console.log('Updated existing game in localGames with latest data');
            }
          }
          
          // Load transactions for this game
          await loadTransactions(gameId || '');
          
          return true;
        }
      }
      
      // If not found in completedGames, check normal game storage
      const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
      if (localGamesStr) {
        const localGames = JSON.parse(localGamesStr);
        const gameFromLocal = localGames.find((g: any) => g.id === gameId);
        
        if (gameFromLocal) {
          console.log('Found game in localGames');
          
          // Ensure players are properly formatted
          if (gameFromLocal.players) {
            try {
              // Handle string-formatted players
              if (typeof gameFromLocal.players === 'string') {
                gameFromLocal.players = JSON.parse(gameFromLocal.players);
              }
              
              // Handle object-formatted players (convert to array)
              if (!Array.isArray(gameFromLocal.players) && typeof gameFromLocal.players === 'object') {
                gameFromLocal.players = Object.entries(gameFromLocal.players).map(([id, data]: [string, any]) => ({
                  id,
                  name: data.name || 'Unknown',
                  bet: data.bet || 0
                }));
              }
              
              // Ensure all player objects have proper structure
              gameFromLocal.players = gameFromLocal.players.map((player: any) => ({
                id: player.id || `player_${Math.random().toString(36).substring(2, 9)}`,
                name: player.name || 'Unknown Player',
                bet: typeof player.bet === 'number' ? player.bet : parseFloat(player.bet) || 0
              }));
            } catch (e) {
              console.error('Error formatting players:', e);
              gameFromLocal.players = [];
            }
          } else {
            gameFromLocal.players = [];
          }
          
          setGame(gameFromLocal);
          
          // Also make sure the game is in completedGames if it's completed
          if (gameFromLocal.status === 'completed') {
            const completedGamesStr = localStorage.getItem('completedGames');
            if (completedGamesStr) {
              try {
                const completedGames = JSON.parse(completedGamesStr);
                const existsInCompleted = completedGames.some((g: any) => g.id === gameId);
                if (!existsInCompleted) {
                  console.log('Adding game to completedGames for consistency');
                  completedGames.push(gameFromLocal);
                  localStorage.setItem('completedGames', JSON.stringify(completedGames));
                }
              } catch (e) {
                console.error('Error updating completedGames:', e);
              }
            } else {
              localStorage.setItem('completedGames', JSON.stringify([gameFromLocal]));
            }
          }
          
          // Load transactions for this game
          await loadTransactions(gameId || '');
          
          return true;
        }
      }
      
      // If we still haven't found the game, check if we can reconstruct it from transactions
      const transactionsStr = localStorage.getItem('transactions');
      if (transactionsStr) {
        const transactions = JSON.parse(transactionsStr);
        const gameTransactions = transactions.filter((tx: any) => tx.gameId === gameId);
        
        if (gameTransactions.length > 0) {
          console.log(`Found ${gameTransactions.length} transactions for game ${gameId}`);
          
          // Try to reconstruct the game from win transaction
          const winTx = gameTransactions.find((tx: any) => tx.type === 'win');
          if (winTx) {
            const syntheticGame: Game = {
              id: gameId || '',
              name: winTx.gameName || 'Reconstructed Game',
              status: 'completed',
              type: 'Synthetic',
              date: new Date(winTx.timestamp).toISOString().split('T')[0],
              endTime: winTx.timestamp,
              startTime: winTx.timestamp - 3600000, // Assume 1 hour before
              totalPot: winTx.amount || 0,
              winner: winTx.playerId || '',
              players: [] as Player[]
            };
            
            // Try to reconstruct players from bet transactions
            const betTxs = gameTransactions.filter((tx: any) => tx.type === 'bet');
            if (betTxs.length > 0) {
              const players = new Map<string, Player>();
              
              betTxs.forEach((tx: any) => {
                if (tx.playerId && tx.playerName) {
                  players.set(tx.playerId, {
                    id: tx.playerId,
                    name: tx.playerName,
                    bet: Math.abs(tx.amount)
                  });
                }
              });
              
              syntheticGame.players = Array.from(players.values());
            }
            
            console.log('Created synthetic game from transactions:', syntheticGame);
            setGame(syntheticGame);
            
            // Save this to both localGames and completedGames
            try {
              const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
              if (localGamesStr) {
                const localGames = JSON.parse(localGamesStr);
                
                // Check if game already exists
                const existingGameIndex = localGames.findIndex((g: any) => g.id === gameId);
                if (existingGameIndex >= 0) {
                  // Update existing game
                  localGames[existingGameIndex] = syntheticGame;
                } else {
                  // Add new game
                  localGames.push(syntheticGame);
                }
                
                localStorage.setItem('localGames', JSON.stringify(localGames));
                localStorage.setItem('games', JSON.stringify(localGames));
              } else {
                localStorage.setItem('localGames', JSON.stringify([syntheticGame]));
                localStorage.setItem('games', JSON.stringify([syntheticGame]));
              }
              
              // Also update completedGames
              const completedGamesStr = localStorage.getItem('completedGames');
              if (completedGamesStr) {
                const completedGames = JSON.parse(completedGamesStr);
                
                // Check if game already exists
                const existingGameIndex = completedGames.findIndex((g: any) => g.id === gameId);
                if (existingGameIndex >= 0) {
                  // Update existing game
                  completedGames[existingGameIndex] = syntheticGame;
                } else {
                  // Add new game
                  completedGames.push(syntheticGame);
                }
                
                localStorage.setItem('completedGames', JSON.stringify(completedGames));
              } else {
                localStorage.setItem('completedGames', JSON.stringify([syntheticGame]));
              }
              
              console.log('Saved synthetic game to localStorage');
            } catch (e) {
              console.error('Error saving synthetic game:', e);
            }
            
            return true;
          }
        }
      }
      
      console.log(`Game with ID ${gameId} not found in localStorage`);
      return false;
    } catch (e) {
      console.error('Error loading game from localStorage:', e);
      return false;
    }
  };
  
  // Load transactions for a game
  const loadTransactions = async (gameId: string) => {
    try {
      console.log('Loading transactions for game:', gameId);
      setTransactionsLoading(true);
      
      // Check for local transactions first
      const localTransactionsStr = localStorage.getItem('transactions');
      let localTransactions: Transaction[] = [];
      
      if (localTransactionsStr) {
        try {
          const parsedTransactions = JSON.parse(localTransactionsStr);
          localTransactions = parsedTransactions.filter((tx: any) => tx.gameId === gameId);
          console.log(`Found ${localTransactions.length} local transactions for game ${gameId}`);
          
          // Fix any transactions with missing data
          localTransactions = localTransactions.map((tx: any) => ({
            id: tx.id || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            playerId: tx.playerId || '',
            playerName: tx.playerName || 'Unknown Player',
            amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
            type: tx.type || 'unknown',
            timestamp: tx.timestamp || Date.now(),
            description: tx.description || `${tx.type || 'Unknown'} transaction`,
            gameId: tx.gameId || gameId
          }));
        } catch (e) {
          console.error('Error parsing local transactions:', e);
        }
      }
      
      // If we have a non-local game ID, also try to get server transactions
      if (!gameId.startsWith('local_')) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('gameId', gameId)
            .order('timestamp', { ascending: false });
            
          if (error) {
            console.error('Error fetching transactions from server:', error);
          } else if (data && data.length > 0) {
            console.log(`Found ${data.length} server transactions for game ${gameId}`);
            
            // Combine with local transactions, preferring server transactions if IDs conflict
            const serverTxIds = new Set(data.map((tx: any) => tx.id));
            const uniqueLocalTxs = localTransactions.filter((tx) => !serverTxIds.has(tx.id));
            
            setTransactions([...data, ...uniqueLocalTxs]);
            setTransactionsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error fetching server transactions:', e);
        }
      }
      
      // If we reach here, only use local transactions
      setTransactions(localTransactions);
      
      // Check if a completed game has no transactions, might need syncing
      if (game && game.status === 'completed' && localTransactions.length === 0) {
        console.log('Completed game has no transactions, setting needsSync flag');
        setNeedsSync(true);
      }
    } catch (error) {
      console.error('Error in loadTransactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };
  
  // Format game data from either Supabase or localStorage
  const formatGameData = (gameData: any): Game => {
    // Format the game data
    // Parse players if they're stored as a string
    let parsedPlayers: Player[] = [];
    
    // Ensure players is always an array
    try {
      if (typeof gameData.players === 'string') {
        try {
          parsedPlayers = JSON.parse(gameData.players);
          // Validate that we have an array after parsing
          if (!Array.isArray(parsedPlayers)) {
            console.warn('Players field parsed but is not an array:', parsedPlayers);
            parsedPlayers = [];
          }
        } catch (e) {
          console.error('Error parsing players string:', e);
          parsedPlayers = [];
        }
      } else if (Array.isArray(gameData.players)) {
        parsedPlayers = gameData.players;
      } else if (gameData.players && typeof gameData.players === 'object' && !Array.isArray(gameData.players)) {
        // If players is an object but not an array, convert to array
        parsedPlayers = Object.entries(gameData.players).map(([id, data]: [string, any]) => ({
          id,
          name: data.name || 'Unknown Player',
          bet: data.bet || 0
        }));
      } else {
        console.warn('Game has no valid players field:', gameData.id);
        parsedPlayers = [];
      }
    } catch (e) {
      console.error('Error processing players:', e);
      parsedPlayers = [];
    }
    
    // Ensure each player has the required fields
    parsedPlayers = parsedPlayers.map((player: any) => ({
      id: player.id || 'unknown_id',
      name: player.name || 'Unknown Player',
      bet: typeof player.bet === 'number' ? player.bet : 0
    }));
    
    // Format the date 
    let formattedDate = gameData.date;
    if (gameData.startTime && !formattedDate) {
      try {
        const date = new Date(gameData.startTime);
        formattedDate = date.toISOString().split('T')[0];
      } catch (e) {
        formattedDate = 'Unknown Date';
      }
    }
    
    // Return formatted game
    return {
      id: gameData.id || '',
      name: gameData.name || 'Unnamed Game',
      type: gameData.type || 'Custom Game',
      date: formattedDate || 'Unknown Date',
      startTime: gameData.startTime || Date.now(),
      endTime: gameData.endTime || undefined,
      players: parsedPlayers,
      totalPot: gameData.totalPot || parsedPlayers.reduce((sum: number, p: Player) => sum + (p.bet || 0), 0),
      status: gameData.status || 'active',
      winner: gameData.winner || undefined,
      notes: gameData.notes || '',
      winMethod: gameData.winMethod || undefined,
      customData: gameData.customData || undefined
    };
  };
  
  // Handle game sync completion
  const handleGameSynced = () => {
    setNeedsSync(false);
    loadTransactions(gameId || (game ? game.id : ''));
    
    // Also trigger a data refresh event so other pages (like leaderboard) get updated
    window.dispatchEvent(new CustomEvent('dataRefresh', { 
      detail: { 
        timestamp: Date.now(),
        source: 'gameDetails'
      } 
    }));
    
    if (onSynced) {
      onSynced();
    }
  };
  
  // Handle end game request
  const handleEndGame = async (winnerId: string, method?: string) => {
    try {
      console.log(`Ending game with winner ID: ${winnerId}`);
      if (!game) {
        toast.error('No game data found');
        return;
      }
      
      // First get the selected winner from the players list
      const winningPlayer = game.players.find(p => p.id === winnerId);
      if (!winningPlayer) {
        toast.error('Selected winner not found in players list');
        return;
      }
      
      console.log(`Winner: ${winningPlayer.name}`);
      
      // Update game data
      const updatedGame: Game = {
        ...game,
        status: 'completed',
        endTime: Date.now(),
        winner: winnerId,
        winMethod: method || 'Standard'
      };
      
      // Call parent onEndGame if available (legacy)
      if (onEndGame) {
        await onEndGame(game.id, winnerId);
      }
      
      // Handle local game
      const isLocalGame = game.id.startsWith('local_');
      if (isLocalGame) {
        console.log('Ending local game');
        
        // Update the game in localStorage
        const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
        if (localGamesStr) {
          try {
            const localGames = JSON.parse(localGamesStr);
            
            // Find and update the game
            const updatedGames = localGames.map((g: any) => 
              g.id === game.id ? updatedGame : g
            );
            
            localStorage.setItem('localGames', JSON.stringify(updatedGames));
            localStorage.setItem('games', JSON.stringify(updatedGames));
            
            console.log('Updated game in localGames');
          } catch (e) {
            console.error('Error updating game in localStorage:', e);
          }
        }
        
        // Add to completedGames
        const completedGamesStr = localStorage.getItem('completedGames');
        if (completedGamesStr) {
          try {
            const completedGames = JSON.parse(completedGamesStr);
            
            // Remove existing entry if it exists
            const filteredGames = completedGames.filter((g: any) => g.id !== game.id);
            
            // Add the updated game
            localStorage.setItem('completedGames', JSON.stringify([...filteredGames, updatedGame]));
            
            console.log('Updated game in completedGames');
          } catch (e) {
            console.error('Error updating completedGames:', e);
          }
        } else {
          // If no completedGames exists yet, create it
          localStorage.setItem('completedGames', JSON.stringify([updatedGame]));
        }
        
        // Create transactions for this game
        await createTransactionsForGame(updatedGame, winningPlayer);
      } else {
        // Handle server game
        try {
          const { error } = await supabase
            .from('games')
            .update({
              status: 'completed',
              endTime: Date.now(),
              winner: winnerId,
              winMethod: method || 'Standard'
            })
            .eq('id', game.id);
            
          if (error) throw error;
          console.log('Updated game on server successfully');
          
          // Create transactions on server
          const winTxId = `server_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const { error: txError } = await supabase
            .from('transactions')
            .insert([
              {
                id: winTxId,
                gameId: game.id,
                playerId: winnerId,
                playerName: winningPlayer.name,
                amount: game.totalPot,
                type: 'win',
                timestamp: Date.now(),
                description: `Won game: ${game.name}`
              }
            ]);
            
          if (txError) throw txError;
          
          // Create bet transactions for all players
          const betTransactions = game.players.map(player => ({
            id: `server_tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
            gameId: game.id,
            playerId: player.id,
            playerName: player.name,
            amount: -player.bet,
            type: 'bet',
            timestamp: Date.now() - 1,
            description: `Bet in game: ${game.name}`
          }));
          
          // Insert bet transactions in batches
          for (let i = 0; i < betTransactions.length; i += 10) {
            const batch = betTransactions.slice(i, i + 10);
            const { error: batchError } = await supabase
              .from('transactions')
              .insert(batch);
              
            if (batchError) {
              console.error('Error inserting batch of bet transactions:', batchError);
            }
          }
        } catch (e) {
          console.error('Error updating game on server:', e);
          toast.error('Failed to update game on server. Will try to save locally.');
          
          // Fallback to local storage
          const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
          if (localGamesStr) {
            try {
              const localGames = JSON.parse(localGamesStr);
              const updatedGames = localGames.map((g: any) => 
                g.id === game.id ? updatedGame : g
              );
              localStorage.setItem('localGames', JSON.stringify(updatedGames));
              localStorage.setItem('games', JSON.stringify(updatedGames));
            } catch (e) {
              console.error('Error updating game in localStorage:', e);
            }
          }
          
          // Create local transactions
          await createTransactionsForGame(updatedGame, winningPlayer);
        }
      }
      
      // Update the UI state
      setGame(updatedGame);
      setWinner(winningPlayer);
      
      // Trigger data refresh event
      window.dispatchEvent(new CustomEvent('dataRefresh', { 
        detail: { 
          timestamp: Date.now(),
          source: 'gameEnd',
          gameId: game.id
        } 
      }));
      
      // Refresh transactions
      await loadTransactions(game.id);
      
      // Check if we need to run a sync operation
      setNeedsSync(true);
      
      toast.success(`Game ended. Winner: ${winningPlayer.name}`);
      
      // Close the modal if it was shown
      setShowEndGameModal(false);
    } catch (error) {
      console.error('Error ending game:', error);
      toast.error('Failed to end game');
    }
  };
  
  // Helper function to create transactions for a game
  const createTransactionsForGame = async (game: Game, winningPlayer: Player) => {
    try {
      const now = Date.now();
      const transactions: Transaction[] = [];
      
      // Create the win transaction
      transactions.push({
        id: `local_tx_${now}_${Math.random().toString(36).substring(2, 7)}`,
        playerId: winningPlayer.id,
        playerName: winningPlayer.name,
        amount: game.totalPot,
        type: 'win',
        timestamp: now,
        description: `Won game: ${game.name}`,
        gameId: game.id
      });
      
      // Create bet transactions for all players
      game.players.forEach(player => {
        transactions.push({
          id: `local_tx_${now}_${Math.random().toString(36).substring(2, 10)}`,
          playerId: player.id,
          playerName: player.name,
          amount: -player.bet,
          type: 'bet',
          timestamp: now - 1,
          description: `Bet in game: ${game.name}`,
          gameId: game.id
        });
      });
      
      // Append to existing transactions
      const existingTransactionsStr = localStorage.getItem('transactions');
      let allTransactions = transactions;
      
      if (existingTransactionsStr) {
        try {
          const existingTransactions = JSON.parse(existingTransactionsStr);
          // Filter out any existing transactions for this game to avoid duplicates
          const filteredTransactions = existingTransactions.filter(
            (tx: Transaction) => tx.gameId !== game.id
          );
          allTransactions = [...filteredTransactions, ...transactions];
        } catch (e) {
          console.error('Error parsing existing transactions:', e);
        }
      }
      
      // Save back to localStorage
      localStorage.setItem('transactions', JSON.stringify(allTransactions));
      console.log(`Created ${transactions.length} transactions for game ${game.id}`);
      
      return transactions;
    } catch (e) {
      console.error('Error creating transactions:', e);
      return [];
    }
  };
  
  // Handle manual sync
  const handleManualSync = () => {
    if (gameId && typeof gameId === 'string') {
      loadTransactions(gameId);
    } else if (game && game.id) {
      loadTransactions(game.id);
    }
  };

  // Function to load game details
  const loadGameDetails = async () => {
    try {
      console.log(`Loading game details for ID: ${gameId}`);
      setLoading(true);
      setError(null);

      // Try loading from server first
      let serverSuccess = false;
      try {
        serverSuccess = await loadFromServer();
      } catch (error) {
        console.error('Error loading from server:', error);
      }

      // If server load fails, try local
      if (!serverSuccess) {
        const localSuccess = await loadLocalGame();
        if (!localSuccess) {
          // If that also fails, try emergency recovery
          const emergencySuccess = await emergencyRecovery();
          if (!emergencySuccess) {
            setError('Game not found. It may have been deleted or could not be loaded.');
          }
        }
      }
    } catch (error) {
      console.error('Error loading game details:', error);
      setError('Failed to load game details. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  // Emergency recovery function that creates a game from transactions
  const emergencyRecovery = async (): Promise<boolean> => {
    console.log('EMERGENCY RECOVERY: Attempting to reconstruct game from transactions');
    
    try {
      // Try direct access to localStorage first
      if (typeof window !== 'undefined') {
        // Try all possible localStorage keys that might contain the game
        const possibleKeys = ['localGames', 'games', 'completedGames'];
        let foundGame = null;
        
        for (const key of possibleKeys) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            try {
              const items = JSON.parse(itemStr);
              if (Array.isArray(items)) {
                const game = items.find((g: any) => g.id === gameId);
                if (game) {
                  console.log(`Found game in localStorage key: ${key}`);
                  foundGame = game;
                  break;
                }
              }
            } catch (e) {
              console.error(`Error parsing localStorage key ${key}:`, e);
            }
          }
        }
        
        if (foundGame) {
          console.log('Formatting found game from localStorage:', foundGame);
          
          // Fix player data
          let players: Player[] = [];
          try {
            if (typeof foundGame.players === 'string') {
              players = JSON.parse(foundGame.players);
            } else if (Array.isArray(foundGame.players)) {
              players = foundGame.players;
            } else if (typeof foundGame.players === 'object' && foundGame.players !== null) {
              players = Object.entries(foundGame.players).map(([id, data]: [string, any]) => ({
                id,
                name: data.name || 'Unknown Player',
                bet: data.bet || 0
              }));
            }
          } catch (e) {
            console.error('Error parsing player data:', e);
            players = [];
          }
          
          // Fix players data to ensure it's valid
          players = players.map((p: any) => ({
            id: p.id || `recovered_${Math.random().toString(36).substring(2, 9)}`,
            name: p.name || 'Unknown Player',
            bet: typeof p.bet === 'number' ? p.bet : parseFloat(p.bet) || 0
          }));
          
          // Calculate total pot if missing
          const totalPot = foundGame.totalPot || players.reduce((sum: number, p: any) => sum + (p.bet || 0), 0) || 0;
          
          // Create a valid game object
          const reconstructedGame: Game = {
            id: foundGame.id,
            name: foundGame.name || 'Recovered Game',
            type: foundGame.type || 'Recovered',
            date: foundGame.date || new Date().toISOString().split('T')[0],
            startTime: foundGame.startTime || Date.now() - 3600000,
            endTime: foundGame.endTime || (foundGame.status === 'completed' ? Date.now() : undefined),
            players: players,
            totalPot: totalPot,
            status: foundGame.status || 'completed',
            winner: foundGame.winner || '',
            notes: foundGame.notes || 'This game was recovered from localStorage.'
          };
          
          console.log('Reconstructed game from localStorage:', reconstructedGame);
          setGame(reconstructedGame);
          
          // Set winner if available
          if (reconstructedGame.winner) {
            const winningPlayer = players.find(p => p.id === reconstructedGame.winner);
            if (winningPlayer) {
              setWinner(winningPlayer);
            }
          }
          
          // Load transactions
          await loadTransactions(gameId || '');
          
          return true;
        }
      }
      
      // If direct localStorage access failed, try reconstructing from transactions
      const transactionsStr = localStorage.getItem('transactions');
      if (!transactionsStr) {
        console.log('No transactions found for emergency recovery');
        return false;
      }
      
      const transactions = JSON.parse(transactionsStr);
      const gameTransactions = transactions.filter((tx: any) => tx.gameId === gameId);
      
      if (gameTransactions.length === 0) {
        console.log('No transactions found for this game ID');
        return false;
      }
      
      console.log(`Found ${gameTransactions.length} transactions for emergency recovery`);
      
      // Get the win transaction
      const winTx = gameTransactions.find((tx: any) => tx.type === 'win');
      
      if (!winTx) {
        console.log('No win transaction found for this game');
        // We can still try to create a game without a win transaction
      }
      
      // Get bet transactions to identify players
      const betTxs = gameTransactions.filter((tx: any) => tx.type === 'bet');
      const players: Player[] = [];
      
      // Create a map to deduplicate players
      const playerMap = new Map<string, Player>();
      
      betTxs.forEach((tx: any) => {
        if (tx.playerId && tx.playerName) {
          playerMap.set(tx.playerId, {
            id: tx.playerId,
            name: tx.playerName,
            bet: Math.abs(tx.amount || 0)
          });
        }
      });
      
      // Convert to array
      Array.from(playerMap.values()).forEach(player => {
        players.push(player);
      });
      
      // If no players were found but we have a winner, add them as a player
      if (players.length === 0 && winTx?.playerId && winTx?.playerName) {
        players.push({
          id: winTx.playerId,
          name: winTx.playerName,
          bet: 0
        });
      }
      
      // Determine timestamp for the game
      const timestamps = gameTransactions.map((tx: any) => tx.timestamp);
      const oldestTimestamp = Math.min(...timestamps);
      const newestTimestamp = Math.max(...timestamps);
      
      // Calculate total pot
      const totalPot = betTxs.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
      
      // Create the reconstructed game
      const reconstructedGame: Game = {
        id: gameId || '',
        name: (winTx?.gameName || gameTransactions[0]?.gameName || 'Reconstructed Game') + ' (Recovered)',
        type: 'Reconstructed',
        date: new Date(oldestTimestamp).toISOString().split('T')[0],
        startTime: oldestTimestamp,
        endTime: winTx ? winTx.timestamp : newestTimestamp,
        players: players,
        totalPot: totalPot,
        status: winTx ? 'completed' : 'active',
        winner: winTx?.playerId || ''
      };
      
      console.log('Reconstructed game from transactions:', reconstructedGame);
      setGame(reconstructedGame);
      
      // Set winner if available
      if (winTx) {
        setWinner({
          id: winTx.playerId,
          name: winTx.playerName,
          bet: players.find(p => p.id === winTx.playerId)?.bet || 0
        });
      }
      
      // Add this game to the appropriate caches
      try {
        // Add to localGames
        const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
        if (localGamesStr) {
          const localGames = JSON.parse(localGamesStr);
          // Check if game already exists
          const existingIndex = localGames.findIndex((g: any) => g.id === gameId);
          
          // Ensure reconstructedGame has players as an array before saving
          if (!Array.isArray(reconstructedGame.players)) {
            console.warn('Players is not an array before saving, converting to array');
            if (reconstructedGame.players && typeof reconstructedGame.players === 'object') {
              // Convert object to array if needed
              reconstructedGame.players = Object.entries(reconstructedGame.players).map(([id, data]: [string, any]) => ({
                id,
                name: data.name || 'Unknown Player',
                bet: data.bet || 0
              }));
            } else {
              reconstructedGame.players = [];
            }
          }
          
          if (existingIndex >= 0) {
            // Update existing game
            localGames[existingIndex] = reconstructedGame;
          } else {
            // Add new game
            localGames.push(reconstructedGame);
          }
          
          localStorage.setItem('localGames', JSON.stringify(localGames));
          localStorage.setItem('games', JSON.stringify(localGames));
        } else {
          // Create new localGames array
          localStorage.setItem('localGames', JSON.stringify([reconstructedGame]));
          localStorage.setItem('games', JSON.stringify([reconstructedGame]));
        }
        
        // If game is completed, add to completedGames
        if (reconstructedGame.status === 'completed') {
          const completedGamesStr = localStorage.getItem('completedGames');
          let completedGames = [];
          
          if (completedGamesStr) {
            completedGames = JSON.parse(completedGamesStr);
            // Check if game already exists
            const existingIndex = completedGames.findIndex((g: any) => g.id === gameId);
            
            // Ensure reconstructedGame has players as an array before saving to completedGames
            if (!Array.isArray(reconstructedGame.players)) {
              console.warn('Players is not an array before saving to completedGames, converting to array');
              if (reconstructedGame.players && typeof reconstructedGame.players === 'object') {
                // Convert object to array if needed
                reconstructedGame.players = Object.entries(reconstructedGame.players).map(([id, data]: [string, any]) => ({
                  id,
                  name: data.name || 'Unknown Player',
                  bet: data.bet || 0
                }));
              } else {
                reconstructedGame.players = [];
              }
            }
            
            if (existingIndex >= 0) {
              // Update existing game
              completedGames[existingIndex] = reconstructedGame;
            } else {
              // Add new game
              completedGames.push(reconstructedGame);
            }
          } else {
            // Create new completedGames array
            completedGames = [reconstructedGame];
          }
          
          localStorage.setItem('completedGames', JSON.stringify(completedGames));
        }
        
        console.log('Successfully saved reconstructed game to localStorage');
      } catch (e) {
        console.error('Error saving reconstructed game:', e);
      }
      
      // Load transactions again to ensure they display correctly
      await loadTransactions(gameId || '');
      
      return true;
    } catch (e) {
      console.error('Error in emergency recovery:', e);
      return false;
    }
  };

  // Load game from server (Supabase)
  const loadFromServer = async (): Promise<boolean> => {
    console.log('Attempting to load from Supabase');
    // Skip for local game IDs
    if (gameId && gameId.startsWith('local_')) {
      console.log('Local game ID detected, skipping server load');
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId as string)
        .single();
        
      if (error) {
        console.error('Error fetching game from Supabase:', error);
        return false;
      }
      
      if (data) {
        console.log('Successfully loaded game from Supabase', data);
        
        // Format the game data
        const formattedGame = formatGameData(data);
        setGame(formattedGame);
        
        // Fetch winner details if there is one
        if (formattedGame.winner) {
          try {
            const { data: winnerData, error: winnerError } = await supabase
              .from('players')
              .select('*')
              .eq('id', formattedGame.winner)
              .single();
              
            if (!winnerError && winnerData) {
              setWinner(winnerData);
            }
          } catch (winnerErr) {
            console.error('Error fetching winner details:', winnerErr);
          }
        }
        
        // Load transactions
        await loadTransactions(formattedGame.id);
        return true;
      }
    } catch (e) {
      console.error('Error in Supabase fetch:', e);
    }
    
    return false;
  };

  // Helper function to delete a game
  const deleteGame = async (gameId: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return false;
    }
    
    try {
      // First delete related transactions
      const { error: delTxError } = await supabase
        .from('transactions')
        .delete()
        .eq('gameId', gameId);
      
      if (delTxError) throw delTxError;
      
      // Then delete the game
      const { error: delError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);
      
      if (delError) throw delError;
      
      // Also remove from local storage
      const localGames = JSON.parse(localStorage.getItem('localGames') || localStorage.getItem('games') || '[]');
      const filteredGames = localGames.filter((g: any) => g.id !== gameId);
      localStorage.setItem('localGames', JSON.stringify(filteredGames));
      localStorage.setItem('games', JSON.stringify(filteredGames));
      
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  };
  
  // Helper function to force end a game
  const handleForceEndGame = async (): Promise<boolean> => {
    if (!game || !gameId) return false;
    
    if (!confirm('Are you sure you want to force end this game? This will mark it as completed without determining winners.')) {
      return false;
    }
    
    try {
      // Update game in Supabase
      const { error: updateError } = await supabase
        .from('games')
        .update({
          status: 'completed',
          endTime: Date.now(),
          winMethod: 'admin_forced'
        })
        .eq('id', gameId);
      
      if (updateError) throw updateError;
      
      // Update local games
      const localGames = JSON.parse(localStorage.getItem('localGames') || localStorage.getItem('games') || '[]');
      const updatedGames = localGames.map((g: any) => {
        if (g.id === gameId) {
          return {
            ...g,
            status: 'completed',
            endTime: Date.now(),
            winMethod: 'admin_forced'
          };
        }
        return g;
      });
      
      localStorage.setItem('localGames', JSON.stringify(updatedGames));
      localStorage.setItem('games', JSON.stringify(updatedGames));
      
      loadGameDetails();
      return true;
    } catch (error) {
      console.error('Error force ending game:', error);
      return false;
    }
  };
  
  // Helper function to reactivate a completed game
  const handleReactivateGame = async (): Promise<boolean> => {
    if (!game || !gameId) return false;
    
    if (!confirm('Are you sure you want to reactivate this game? This will change its status back to active.')) {
      return false;
    }
    
    try {
      // Update game in Supabase
      const { error: reactivateError } = await supabase
        .from('games')
        .update({
          status: 'active',
          endTime: null,
          winner: null,
          winMethod: null
        })
        .eq('id', gameId);
      
      if (reactivateError) throw reactivateError;
      
      // Also delete any win transactions
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('gameId', gameId)
        .in('type', ['win', 'payout']);
      
      if (txError) throw txError;
      
      // Update local games
      const localGames = JSON.parse(localStorage.getItem('localGames') || localStorage.getItem('games') || '[]');
      const updatedGames = localGames.map((g: any) => {
        if (g.id === gameId) {
          return {
            ...g,
            status: 'active',
            endTime: null,
            winner: null,
            winMethod: null
          };
        }
        return g;
      });
      
      localStorage.setItem('localGames', JSON.stringify(updatedGames));
      localStorage.setItem('games', JSON.stringify(updatedGames));
      
      loadGameDetails();
      return true;
    } catch (error) {
      console.error('Error reactivating game:', error);
      return false;
    }
  };

  const handleAdminAction = async (action: 'forceEnd' | 'reactivate' | 'delete') => {
    if (!game) return;
    
    try {
      setLoading(true);
      
      switch (action) {
        case 'forceEnd':
          // Force end the game
          await handleForceEndGame();
          toast.success('Game ended successfully');
          break;
          
        case 'reactivate':
          // Reactivate the game
          await handleReactivateGame();
          toast.success('Game reactivated successfully');
          break;
          
        case 'delete':
          // Delete the game
          const success = await deleteGame(game.id);
          if (!success) {
            throw new Error('Failed to delete game');
          }
          
          toast.success('Game deleted successfully');
          router.push('/games');
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing admin action:', error);
      toast.error('Failed to perform admin action');
    } finally {
      setLoading(false);
    }
  };
  
  // Show end game modal dialog
  const renderEndGameModal = () => {
    if (!showEndGameModal || !game) return null;
    
    return (
      <EndGameModal 
        players={game.players} 
        onClose={() => setShowEndGameModal(false)}
        onEndGame={handleEndGame}
        totalPot={game.totalPot}
      />
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !game) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Unable to Load Game</h3>
        <p className="text-gray-300 mb-4">
          {error || "The game you're looking for doesn't exist or has been removed."}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const isActive = game.status === 'active';
  const isLocalGame = typeof game.id === 'string' && game.id.startsWith('local_');
  
  // Add admin controls to the UI
  const renderAdminControls = () => {
    if (!isAdminMode || !game) return null;
    
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-6">
        <h3 className="text-xl font-bold text-white mb-4">Admin Controls</h3>
        
        <div className="flex flex-wrap gap-3">
          {game.status === 'active' && (
            <button
              onClick={() => handleAdminAction('forceEnd')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
            >
              Force End Game
            </button>
          )}
          
          {game.status === 'completed' && (
            <button
              onClick={() => handleAdminAction('reactivate')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Reactivate Game
            </button>
          )}
          
          <button
            onClick={() => handleAdminAction('delete')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Delete Game
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {!hideTitle && (
        <div className="bg-navy p-4">
          <h2 className="text-2xl font-bold text-white">{game?.name || 'Game Details'}</h2>
        </div>
      )}
      
      <div className="p-4">
        {/* Game Status Banner */}
        <div className={`mb-4 p-3 rounded-lg ${
          game?.status === 'active' ? 'bg-blue-100 text-navy' :
          game?.status === 'completed' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium">Status: {game?.status ? game.status.charAt(0).toUpperCase() + game.status.slice(1) : 'Unknown'}</span>
            </div>
            
            <div className="text-sm opacity-75">
              {isLocalGame ? '(Local Game)' : '(Online Game)'}
            </div>
          </div>
        </div>
        
        {/* Add prominent End Game button for active games */}
        {game.status === 'active' && (
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowEndGameModal(true)}
              className="flex items-center justify-center mx-auto px-8 py-4 bg-navy hover:bg-blue-800 text-white rounded-lg shadow-lg text-xl font-medium transition-all hover:scale-105"
            >
              <FlagIcon className="h-6 w-6 mr-3" />
              <span>End This Game</span>
            </button>
          </div>
        )}
        
        {/* Game Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Started</span>
            </div>
            <div className="text-gray-800">
              {new Date(game.startTime).toLocaleDateString()}, {new Date(game.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            
            {game.endTime && (
              <>
                <div className="flex items-center mt-3 mb-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Ended</span>
                </div>
                <div className="text-gray-800">
                  {new Date(game.endTime).toLocaleDateString()}, {new Date(game.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
            <CurrencyDollarIcon className="h-10 w-10 text-green-500 mr-4" />
            <div>
              <div className="text-sm text-gray-600">Total Pot</div>
              <div className="text-2xl font-bold text-gray-800">${game.totalPot.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mt-1">
                {game.players.length} Player{game.players.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          {game.status === 'completed' && winner && (
            <div className="bg-navy p-4 rounded-lg flex-1 flex items-center text-white">
              <TrophyIcon className="h-10 w-10 text-yellow-400 mr-4" />
              <div>
                <div className="text-sm text-gray-200">Winner</div>
                <div className="text-xl font-bold text-white">{winner.name}</div>
              </div>
              <div className="ml-auto">
                <div className="text-sm text-gray-200">Winnings</div>
                <div className="text-2xl font-bold text-green-400">${game.totalPot.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Players List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Players</h3>
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            {Array.isArray(game?.players) && game.players.length > 0 ? (
              game.players.map((player, index) => {
                // Handle potential missing or invalid data
                if (!player) {
                  console.warn(`Null or undefined player at index ${index}`);
                  return null;
                }
                
                // Ensure player has all required properties
                const displayPlayer = {
                  id: player.id || `player_${index}`,
                  name: player.name || 'Unknown Player',
                  bet: typeof player.bet === 'number' ? player.bet : parseFloat(player.bet) || 0
                };
                
                // Determine if this player is the winner
                const isWinner = game.winner === displayPlayer.id;
                
                return (
                  <div
                    key={displayPlayer.id}
                    className={`flex items-center p-3 border-t first:border-t-0 ${
                      isWinner ? 'bg-blue-50' : 
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center mr-3 rounded-full ${
                      isWinner ? 'bg-yellow-500 text-white' : 'bg-navy text-white'
                    }`}>
                      {displayPlayer.name ? displayPlayer.name.charAt(0).toUpperCase() : '#'}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isWinner ? 'text-navy' : 'text-gray-800'}`}>
                        {displayPlayer.name}
                        {isWinner && (
                          <span className="ml-2 text-yellow-600 text-sm font-bold">
                            Winner
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`rounded px-3 py-1 ${
                      isWinner ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-navy'
                    }`}>
                      ${displayPlayer.bet.toFixed(2)}
                    </div>
                  </div>
                );
              }).filter(Boolean) // Filter out null entries
            ) : (
              <div className="p-4 text-center text-gray-500 italic">
                No player data available
              </div>
            )}
          </div>
        </div>
        
        {/* Retroactive Processing - always show for completed games with no transactions */}
        {game.status === 'completed' && needsSync && (
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-navy">Game Needs Processing</h3>
                <p className="text-gray-700 mt-1">
                  This completed game needs to be synchronized to update player balances and the leaderboard.
                </p>
              </div>
              
              <RetroactiveGameProcessor 
                gameId={game.id} 
                gameName={game.name}
                onProcessed={handleGameSynced}
              />
            </div>
          </div>
        )}
        
        {/* Transactions */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">Transactions</h3>
            
            {game.status === 'completed' && transactions.length > 0 && (
              <button
                onClick={handleManualSync}
                className="inline-flex items-center text-sm text-gray-300 hover:text-white"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            )}
          </div>
          
          {transactionsLoading ? (
            <div className="flex justify-center p-6">
              <LoadingSpinner size="small" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-gray-600">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-3">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium text-white">
                        {transaction.playerName}
                      </div>
                      <div className={`font-bold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      {transaction.description} • {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <div className="text-gray-400 mb-2">No transactions found for this game.</div>
              {game.status === 'completed' && (
                <div className="text-sm text-gray-500">
                  {needsSync ? 
                    "Use the 'Sync Game Data' button above to create transactions." :
                    "This game has been completed but no transactions were recorded."
                  }
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Game Notes */}
        {game.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 whitespace-pre-line">{game.notes}</p>
            </div>
          </div>
        )}
        
        {/* Add manual sync option even if not needed */}
        {game.status === 'completed' && !needsSync && (
          <div className="mt-8 mb-4">
            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Manual Synchronization</h3>
              <p className="text-gray-400 text-sm mb-4">
                If the game data is not showing up correctly in player totals or the leaderboard, 
                you can manually trigger a sync.
              </p>
              <RetroactiveGameProcessor 
                gameId={game.id} 
                gameName={game.name}
                isButtonOnly={true}
                onProcessed={handleGameSynced}
              />
            </div>
          </div>
        )}
        
        {game.status === 'completed' && (
          <div className="mt-4 text-right">
            <Link 
              href="/game-history" 
              className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm"
            >
              <span>View Game History</span>
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
      
      {/* End Game Modal */}
      {renderEndGameModal()}
      
      {game && game.status === 'active' && game.id && (
        <RetroactiveGameProcessor
          gameId={game.id}
          gameName={game.name}
        />
      )}
      
      {renderAdminControls()}
    </div>
  );
} 
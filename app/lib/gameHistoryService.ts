import { supabase } from './supabase';

interface Transaction {
  id: string;
  playerId?: string;
  playerName?: string;
  amount: number;
  type: string;
  timestamp: number;
  description?: string;
  gameId?: string;
  gameName?: string;
}

interface Player {
  id: string;
  name: string;
  balance?: number;
  bet?: number;
}

interface Game {
  id: string;
  name: string;
  type?: string;
  date?: string;
  startTime?: number;
  endTime?: number;
  timestamp?: number;
  players?: Player[];
  totalPot?: number;
  status: 'active' | 'completed' | 'cancelled';
  winner?: string;
  notes?: string;
  customData?: {
    name?: string;
    wagerAmount?: number;
    [key: string]: any;
  };
  winMethod?: string;
}

/**
 * Load completed games from localStorage with various fallbacks
 */
export const loadLocalCompletedGames = (): Game[] => {
  try {
    // Start with an empty array
    let completedGames: Game[] = [];
    
    // First try directly from completedGames cache
    const completedGamesStr = localStorage.getItem('completedGames');
    if (completedGamesStr) {
      try {
        const parsedCompletedGames = JSON.parse(completedGamesStr);
        if (Array.isArray(parsedCompletedGames) && parsedCompletedGames.length > 0) {
          completedGames = parsedCompletedGames;
          console.log(`Loaded ${completedGames.length} games from completedGames cache`);
        }
      } catch (e) {
        console.error('Error parsing completedGames:', e);
      }
    }
    
    // Try loading from localGames or games as well (might have newer data)
    const localGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
    if (localGamesStr) {
      try {
        const localGames = JSON.parse(localGamesStr);
        const localCompletedGames = localGames.filter((game: Game) => game.status === 'completed');
        
        // Merge with previously loaded games, preferring existing records
        // (since completedGames is more likely to have the latest state)
        const existingIds = new Set(completedGames.map((g: Game) => g.id));
        const newGames = localCompletedGames.filter((g: Game) => !existingIds.has(g.id));
        
        // Add any new games found
        if (newGames.length > 0) {
          completedGames = [...completedGames, ...newGames];
          console.log(`Added ${newGames.length} more games from localGames`);
        }
      } catch (e) {
        console.error('Error loading games from localGames:', e);
      }
    }
    
    // If we found games in completedGames but not in localGames, update localGames
    if (completedGames.length > 0 && localGamesStr) {
      try {
        const localGames = JSON.parse(localGamesStr);
        const localGameIds = new Set(localGames.map((g: Game) => g.id));
        
        let hasNewGames = false;
        completedGames.forEach(game => {
          if (!localGameIds.has(game.id)) {
            console.log(`Adding game ${game.id} to localGames`);
            localGames.push(game);
            hasNewGames = true;
          }
        });
        
        if (hasNewGames) {
          localStorage.setItem('localGames', JSON.stringify(localGames));
          localStorage.setItem('games', JSON.stringify(localGames));
          console.log('Updated localGames with games from completedGames');
        }
      } catch (e) {
        console.error('Error updating localGames:', e);
      }
    }
    
    return completedGames;
  } catch (e) {
    console.error('Error loading completed games from localStorage:', e);
    return [];
  }
};

/**
 * Create synthetic games from win transactions that don't have corresponding games
 */
export const createSyntheticGamesFromTransactions = (): Game[] => {
  try {
    const transactionsStr = localStorage.getItem('transactions');
    if (!transactionsStr) return [];
    
    const transactions: Transaction[] = JSON.parse(transactionsStr);
    const winTransactions = transactions.filter((tx: Transaction) => 
      tx.type === 'win' && tx.gameId && tx.amount > 0);
    
    // Get existing game IDs to avoid duplicates
    const existingGames = loadLocalCompletedGames();
    const existingIds = new Set(existingGames.map(g => g.id));
    
    const syntheticGames: Game[] = [];
    
    // Find unique game IDs from win transactions
    const winGameIds = new Set<string>(winTransactions
      .filter((tx: Transaction) => tx.gameId)
      .map((tx: Transaction) => tx.gameId as string));
    
    winGameIds.forEach(gameId => {
      // Skip if we already have this game
      if (existingIds.has(gameId)) return;
      
      // Get all transactions for this game
      const gameTransactions = transactions.filter((tx: Transaction) => tx.gameId === gameId);
      const winTransaction = gameTransactions.find((tx: Transaction) => tx.type === 'win');
      
      if (winTransaction) {
        const syntheticGame: Game = {
          id: gameId,
          name: winTransaction.gameName || `Game from ${new Date(winTransaction.timestamp).toLocaleDateString()}`,
          status: 'completed',
          timestamp: winTransaction.timestamp,
          endTime: winTransaction.timestamp,
          startTime: winTransaction.timestamp - 3600000, // Assume game started 1 hour before
          totalPot: winTransaction.amount,
          winner: winTransaction.playerName || 'Unknown Player',
          winMethod: 'Standard',
          type: 'Synthetic',
          players: []
        };
        
        // Try to reconstruct player list from bet transactions
        const betTransactions = gameTransactions.filter((tx: Transaction) => tx.type === 'bet');
        if (betTransactions.length > 0) {
          const players = new Map<string, Player>();
          
          betTransactions.forEach((tx: Transaction) => {
            if (tx.playerId && tx.playerName) {
              players.set(tx.playerId, {
                id: tx.playerId,
                name: tx.playerName,
                bet: tx.amount
              });
            }
          });
          
          syntheticGame.players = Array.from(players.values());
        }
        
        syntheticGames.push(syntheticGame);
        console.log(`Created synthetic game from transaction: ${gameId} - ${syntheticGame.name}`);
      }
    });
    
    return syntheticGames;
  } catch (e) {
    console.error('Error creating synthetic games:', e);
    return [];
  }
};

/**
 * Ensure transactions have correct game IDs
 */
export const fixTransactionGameIds = () => {
  try {
    const transactionsStr = localStorage.getItem('transactions');
    if (!transactionsStr) return;
    
    const transactions: Transaction[] = JSON.parse(transactionsStr);
    let hasChanges = false;
    
    // Load all games to match transactions to
    const allGamesStr = localStorage.getItem('localGames') || localStorage.getItem('games');
    if (!allGamesStr) return;
    
    const allGames: Game[] = JSON.parse(allGamesStr);
    
    // Fix transactions with missing or invalid gameIds
    const updatedTransactions = transactions.map((tx: Transaction) => {
      // Skip transactions that already have valid gameIds
      if (tx.gameId && tx.gameId !== 'undefined' && tx.gameId !== 'null') return tx;
      
      // Skip transactions that aren't game-related
      if (tx.type !== 'win' && tx.type !== 'bet' && tx.type !== 'refund') return tx;
      
      // Try to find a matching game by timestamp
      // For win transactions, find games completed around the same time
      if (tx.type === 'win') {
        const matchingGame = allGames.find(game => 
          game.status === 'completed' && 
          game.endTime && 
          Math.abs(game.endTime - tx.timestamp) < 60000); // Within 1 minute
        
        if (matchingGame) {
          console.log(`Fixing win transaction ${tx.id} with game ${matchingGame.id}`);
          hasChanges = true;
          return { ...tx, gameId: matchingGame.id, gameName: matchingGame.name };
        }
      }
      
      return tx;
    });
    
    if (hasChanges) {
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      console.log('Fixed transaction gameIds');
    }
  } catch (e) {
    console.error('Error fixing transaction gameIds:', e);
  }
};

/**
 * Get comprehensive game history from all sources
 */
export const getComprehensiveGameHistory = async (): Promise<Game[]> => {
  try {
    // First fix any transaction issues
    fixTransactionGameIds();
    
    // Start with local completed games
    let games = loadLocalCompletedGames();
    
    // Create synthetic games from transactions if needed
    const syntheticGames = createSyntheticGamesFromTransactions();
    if (syntheticGames.length > 0) {
      // Merge with existing games, avoiding duplicates
      const existingIds = new Set(games.map((g: Game) => g.id));
      const newSyntheticGames = syntheticGames.filter((g: Game) => !existingIds.has(g.id));
      
      if (newSyntheticGames.length > 0) {
        games = [...games, ...newSyntheticGames];
        
        // Also update completedGames in localStorage for persistence
        localStorage.setItem('completedGames', JSON.stringify(games));
      }
    }
    
    // Attempt to fetch from Supabase if we have games locally
    try {
      // Only attempt to fetch from server if we have a completed game stored
      // This ensures we prioritize local data in offline mode
      if (games.length > 0) {
        const { data: supabaseGames, error } = await supabase
          .from('games')
          .select('*')
          .eq('status', 'completed')
          .order('endTime', { ascending: false });
        
        if (!error && supabaseGames && supabaseGames.length > 0) {
          // Create a map of existing games by ID for quick lookups
          const gameMap = new Map<string, Game>();
          games.forEach(game => gameMap.set(game.id, game));
          
          // Add or update games from Supabase
          supabaseGames.forEach((serverGame: any) => {
            // If we already have this game locally, prefer local version
            // as it might have more up-to-date data from localStorage
            if (!gameMap.has(serverGame.id)) {
              // Format players if needed
              if (serverGame.players && typeof serverGame.players === 'string') {
                try {
                  serverGame.players = JSON.parse(serverGame.players);
                } catch (e) {
                  console.error(`Error parsing players for game ${serverGame.id}:`, e);
                  serverGame.players = [];
                }
              }
              
              // Add new game from server
              games.push(serverGame as Game);
              gameMap.set(serverGame.id, serverGame as Game);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error fetching games from Supabase:', e);
      // Continue with local data
    }
    
    // Sort games by end time (newest first)
    games.sort((a, b) => {
      const aTime = a.endTime || a.timestamp || 0;
      const bTime = b.endTime || b.timestamp || 0;
      return bTime - aTime;
    });
    
    // Ensure all games have required fields
    games = games.map(game => ({
      ...game,
      name: game.name || 'Unnamed Game',
      totalPot: game.totalPot || 0,
      winner: game.winner || 'Unknown',
      status: game.status || 'completed'
    }));
    
    // Update completedGames in localStorage for consistency
    localStorage.setItem('completedGames', JSON.stringify(games));
    
    return games;
  } catch (e) {
    console.error('Error in getComprehensiveGameHistory:', e);
    
    // Fallback to local completed games only in case of error
    try {
      return loadLocalCompletedGames();
    } catch (err) {
      console.error('Fatal error loading game history:', err);
      return [];
    }
  }
};
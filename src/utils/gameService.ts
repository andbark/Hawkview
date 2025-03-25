import { supabase } from '@/lib/supabase';
import { Game, Transaction } from '@/types';

export const gameService = {
  async createGame(gameData: Omit<Game, 'id' | 'startTime' | 'status'>): Promise<string> {
    const newGame = {
      ...gameData,
      startTime: Date.now(),
      status: 'active',
      players: gameData.players || {},
      totalPot: 0,
    };

    const { data, error } = await supabase
      .from('games')
      .insert(newGame)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async addPlayerToGame(gameId: string, playerId: string, bet: number): Promise<void> {
    // Get current game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    // Update the game with the new player
    const updatedPlayers = {
      ...game.players,
      [playerId]: { initialBet: bet },
    };

    const updatedTotalPot = game.totalPot + bet;

    // Update game in transaction
    const { error: updateError } = await supabase.rpc('add_player_to_game', {
      p_game_id: gameId,
      p_player_id: playerId,
      p_bet: bet,
      p_updated_players: updatedPlayers,
      p_updated_total_pot: updatedTotalPot
    });

    if (updateError) throw updateError;

    // Create transaction record
    const transaction: Omit<Transaction, 'id'> = {
      gameId,
      playerId,
      amount: -bet,
      type: 'bet',
      timestamp: Date.now(),
      description: `Bet placed in game ${gameId}`,
    };

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transaction);

    if (transactionError) throw transactionError;
  },

  async endGame(gameId: string, winnerId: string): Promise<void> {
    // Get current game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;
    if (!game || game.status !== 'active') {
      throw new Error('Game not found or already ended');
    }

    // Update game status
    const { error: updateError } = await supabase
      .from('games')
      .update({
        status: 'completed',
        winner: winnerId,
        endTime: Date.now()
      })
      .eq('id', gameId);

    if (updateError) throw updateError;

    // Create winning transaction
    const transaction: Omit<Transaction, 'id'> = {
      gameId,
      playerId: winnerId,
      amount: game.totalPot,
      type: 'win',
      timestamp: Date.now(),
      description: `Won game ${gameId}`,
    };

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transaction);

    if (transactionError) throw transactionError;
  },

  async getGame(gameId: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateGameDetails(gameId: string, updates: Partial<Game>): Promise<void> {
    const allowedUpdates = ['name', 'type'];
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => allowedUpdates.includes(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const { error } = await supabase
      .from('games')
      .update(filteredUpdates)
      .eq('id', gameId);

    if (error) throw error;
  }
}; 
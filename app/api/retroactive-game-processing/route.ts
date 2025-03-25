import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gameId = body.gameId;
    const forceMigration = body.forceMigration || false;
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    console.log('Processing game:', gameId);
    
    // Check if this is a local game ID (starts with "local_")
    const isLocalGame = typeof gameId === 'string' && gameId.startsWith('local_');
    
    let gameData;
    
    if (isLocalGame) {
      // For local games, we'll respond with instructions for the client to process
      return NextResponse.json(
        { 
          isLocalGame: true, 
          message: "This is a local game. It needs to be processed client-side.",
        },
        { status: 200 }
      );
    } else {
      try {
        // Fetch game details from Supabase
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
        
        if (gameError) {
          console.error('Error fetching game:', gameError);
          
          // If it's a UUID format error, we'll respond with a specific error
          if (gameError.message && gameError.message.includes('invalid input syntax for type uuid')) {
            return NextResponse.json(
              { 
                isLocalGame: true,
                error: "This appears to be a local game ID which must be processed client-side.",
                code: "INVALID_UUID"
              },
              { status: 200 }
            );
          }
          
          return NextResponse.json(
            { error: `Failed to fetch game: ${gameError.message}` },
            { status: 404 }
          );
        }
        
        gameData = game;
      } catch (error) {
        console.error('Error in game fetch:', error);
        return NextResponse.json(
          { error: 'Failed to process game data' },
          { status: 500 }
        );
      }
    }
    
    // Check if the game is completed
    if (gameData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed games can be processed' },
        { status: 400 }
      );
    }
    
    // Check if the game has a winner
    if (!gameData.winner) {
      return NextResponse.json(
        { error: 'Game does not have a winner' },
        { status: 400 }
      );
    }
    
    // Check if the game already has any transactions
    const { data: existingTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('gameId', gameId);
      
    if (txError) {
      console.error('Error checking transactions:', txError);
      return NextResponse.json(
        { error: `Failed to check transactions: ${txError.message}` },
        { status: 500 }
      );
    }
    
    // If transactions already exist, don't process again
    if (existingTransactions && existingTransactions.length > 0) {
      const winTransaction = existingTransactions.find(tx => tx.type === 'win');
      if (winTransaction) {
        return NextResponse.json(
          { message: 'Game already has transactions', alreadyProcessed: true },
          { status: 200 }
        );
      }
    }
    
    // Parse the players data to create transactions for all players
    let players = [];
    try {
      const playersData = typeof gameData.players === 'string' 
        ? JSON.parse(gameData.players) 
        : gameData.players;
        
      if (Array.isArray(playersData)) {
        players = playersData;
      } else if (typeof playersData === 'object') {
        players = Object.entries(playersData).map(([id, data]) => ({
          id,
          name: (data as any).name,
          bet: (data as any).bet
        }));
      }
    } catch (e) {
      console.error('Error parsing players:', e);
      return NextResponse.json(
        { error: 'Failed to parse players data' },
        { status: 500 }
      );
    }
    
    // Create transactions for all players
    const transactions = [];
    const timestamp = Date.now();
    
    // First, create the winning transaction
    transactions.push({
      gameId: gameId,
      playerId: gameData.winner,
      amount: gameData.totalPot,
      type: 'win',
      timestamp: timestamp,
      description: `Won game: ${gameData.name}`
    });
    
    // Next, create bet transactions for all players
    for (const player of players) {
      // For the winner, we already created a win transaction
      // For other players, create negative bet transactions
      if (player.id !== gameData.winner) {
        transactions.push({
          gameId: gameId,
          playerId: player.id,
          amount: -player.bet, // Negative amount for bets
          type: 'bet',
          timestamp: timestamp - 1, // Slightly earlier timestamp for bets
          description: `Bet in game: ${gameData.name}`
        });
      } else {
        // For the winner, create an additional bet transaction to show their entry
        transactions.push({
          gameId: gameId,
          playerId: player.id,
          amount: -player.bet, // Negative amount for bets
          type: 'bet',
          timestamp: timestamp - 1, // Slightly earlier timestamp for bets
          description: `Bet in game: ${gameData.name}`
        });
      }
    }
    
    // Insert all transactions
    const { error: createTxError } = await supabase
      .from('transactions')
      .insert(transactions);
      
    if (createTxError) {
      console.error('Error creating transactions:', createTxError);
      return NextResponse.json(
        { error: `Failed to create transactions: ${createTxError.message}` },
        { status: 500 }
      );
    }
    
    // Update player stats for all players
    for (const player of players) {
      try {
        if (player.id === gameData.winner) {
          // Update winner's stats (including the bet they placed)
          const netWinnings = gameData.totalPot - player.bet;
          const { error: winnerUpdateError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { 
                row_id: player.id, 
                amount: netWinnings // Net winnings (total pot minus their bet)
              }),
              gamesWon: supabase.rpc('increment_games_won', { 
                row_id: player.id
              }),
              gamesPlayed: supabase.rpc('increment_games_played', { 
                row_id: player.id
              })
            })
            .eq('id', player.id);
            
          if (winnerUpdateError) {
            console.error(`Error updating winner stats for ${player.id}:`, winnerUpdateError);
          }
        } else {
          // Update other players' stats
          const { error: playerUpdateError } = await supabase
            .from('players')
            .update({
              balance: supabase.rpc('increment', { 
                row_id: player.id, 
                amount: -player.bet // Negative amount for bets
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
      } catch (e) {
        console.error(`Error processing player ${player.id}:`, e);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game processed successfully',
      gameId: gameId,
      transactionsCreated: transactions.length
    });
    
  } catch (error) {
    console.error('Error processing game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
} 
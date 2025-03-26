import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get data from request
    const data = await request.json();
    const { name, type, initialPlayers } = data;
    
    console.log('Direct API received game creation request:', { name, type, playerCount: initialPlayers?.length });
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate total pot
    const totalPot = initialPlayers.reduce((sum: number, p: any) => sum + p.buyIn, 0);
    const startTime = Date.now();
    
    // Use direct insert to games table with snake_case column names
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        name,
        type: type || 'other',
        status: 'active',
        start_time: startTime,  // Changed to snake_case
        total_pot: totalPot,    // Changed to snake_case
        players: JSON.stringify({})
      })
      .select();
    
    if (gameError) {
      console.error('Game creation error:', gameError);
      return NextResponse.json({ error: `Failed to create game: ${gameError.message}` }, { status: 500 });
    }
    
    if (!gameData || gameData.length === 0) {
      return NextResponse.json({ error: 'Game created but no ID returned' }, { status: 500 });
    }
    
    console.log('Game created successfully:', gameData[0]);
    const gameId = gameData[0].id;
    
    // Process players
    const playerResults = [];
    
    for (const player of initialPlayers) {
      try {
        // Debug: Log the player data we're processing
        console.log(`Processing player:`, player);
        
        // 1. Add player to game_participants
        const { error: participantError } = await supabase
          .from('game_participants')
          .insert({
            game_id: gameId,           // Changed to snake_case
            player_id: player.playerId, // Changed to snake_case
            buy_in_amount: player.buyIn, // Changed to snake_case
            joined_at: new Date().toISOString() // Changed to snake_case
          });
          
        if (participantError) {
          console.error(`Error adding player ${player.playerId} to game:`, participantError);
          playerResults.push({ playerId: player.playerId, success: false, error: participantError.message });
          continue;
        }
        
        // 2. Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            game_id: gameId,           // Changed to snake_case
            player_id: player.playerId, // Changed to snake_case
            amount: -player.buyIn,
            type: 'bet',
            timestamp: Date.now(),
            description: `Buy-in for ${name}`
          });
          
        if (transactionError) {
          console.error(`Error creating transaction for player ${player.playerId}:`, transactionError);
          playerResults.push({ playerId: player.playerId, success: false, error: transactionError.message });
          continue;
        }
        
        // 3. Update player balance directly
        const { data: playerData, error: playerFetchError } = await supabase
          .from('players')
          .select('balance')
          .eq('id', player.playerId)
          .single();
          
        if (playerFetchError) {
          console.error(`Error fetching player ${player.playerId}:`, playerFetchError);
          playerResults.push({ playerId: player.playerId, success: false, error: playerFetchError.message });
          continue;
        }
        
        const newBalance = playerData.balance - player.buyIn;
        const { error: balanceError } = await supabase
          .from('players')
          .update({ balance: newBalance })
          .eq('id', player.playerId);
          
        if (balanceError) {
          console.error(`Error updating balance for player ${player.playerId}:`, balanceError);
          playerResults.push({ playerId: player.playerId, success: false, error: balanceError.message });
          continue;
        }
        
        playerResults.push({ playerId: player.playerId, success: true });
      } catch (playerError) {
        console.error(`Unexpected error processing player:`, playerError);
        playerResults.push({ 
          playerId: player.playerId, 
          success: false, 
          error: playerError instanceof Error ? playerError.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      gameId,
      playerResults
    });
  } catch (error) {
    console.error('Unexpected error creating game:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get data from request
    const data = await request.json();
    const { name, type, initialPlayers } = data;
    
    console.log('API received game creation request:', { name, type, playerCount: initialPlayers?.length });
    
    // Initialize Supabase with direct credentials to avoid caching issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate total pot
    const totalPot = initialPlayers.reduce((sum: number, p: any) => sum + p.buyIn, 0);
    
    // Try a direct insertion with snake_case column names
    console.log('Inserting game with snake_case column names...');
    
    // Log database schema for debugging
    console.log('Attempting to check games table schema...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('games')
      .select('*')
      .limit(1);
      
    if (tableInfo) {
      console.log('Sample game record schema:', Object.keys(tableInfo[0] || {}));
    } else if (tableError) {
      console.error('Error fetching table schema:', tableError);
    }
    
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        name: name,
        type: type || 'other',
        status: 'active',
        start_time: Date.now(), // Using snake_case
        total_pot: totalPot,    // Using snake_case
        players: {}
      })
      .select();
    
    if (gameError) {
      console.error('Game creation SQL error:', gameError);
      return NextResponse.json({ error: `Failed to create game: ${gameError.message}` }, { status: 500 });
    }
    
    if (!gameData || gameData.length === 0) {
      return NextResponse.json({ error: 'Game created but no ID returned' }, { status: 500 });
    }
    
    console.log('Game created successfully via direct insert:', gameData[0]);
    
    // Get the game ID
    const gameId = gameData[0].id;
    
    // Process players
    const playerResults = [];
    
    for (const player of initialPlayers) {
      try {
        // 1. Add player to game_participants
        console.log(`Adding player ${player.playerId} to game...`);
        const { error: participantError } = await supabase
          .from('game_participants')
          .insert({
            game_id: gameId,           // snake_case
            player_id: player.playerId, // snake_case
            buy_in_amount: player.buyIn, // snake_case
            joined_at: new Date().toISOString() // snake_case
          });
        
        if (participantError) {
          console.error(`Error adding player ${player.playerId}:`, participantError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: participantError.message 
          });
          continue;
        }
        
        // 2. Create transaction record
        console.log(`Creating transaction for player ${player.playerId}...`);
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            game_id: gameId,  // snake_case
            player_id: player.playerId, // snake_case
            amount: -player.buyIn,
            type: 'bet',
            timestamp: Date.now(),
            description: `Buy-in for ${name}`
          });
        
        if (transactionError) {
          console.error(`Error creating transaction:`, transactionError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: transactionError.message 
          });
          continue;
        }
        
        // 3. Update player balance directly (avoid using functions)
        console.log(`Updating balance for player ${player.playerId}...`);
        
        // First get the current balance
        const { data: playerData, error: fetchError } = await supabase
          .from('players')
          .select('balance')
          .eq('id', player.playerId)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching player balance:`, fetchError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: fetchError.message 
          });
          continue;
        }
        
        // Then update with new balance value
        const newBalance = playerData.balance - player.buyIn;
        const { error: balanceError } = await supabase
          .from('players')
          .update({ balance: newBalance })
          .eq('id', player.playerId);
        
        if (balanceError) {
          console.error(`Error updating balance:`, balanceError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: balanceError.message 
          });
          continue;
        }
        
        playerResults.push({ 
          playerId: player.playerId, 
          success: true 
        });
      } catch (playerError) {
        console.error(`Unexpected error processing player ${player.playerId}:`, playerError);
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
    console.error('Unexpected error in create-game API:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get data from request
    const data = await request.json();
    const { name, type, initialPlayers } = data;
    
    console.log('SQL API received game creation request:', { name, type, playerCount: initialPlayers?.length });
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for existing game IDs to verify connection
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('games')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    if (testError) {
      console.error('DB connection test error:', testError);
      return NextResponse.json({ error: `Database connection issue: ${testError.message}` }, { status: 500 });
    }
    
    console.log('DB connection successful, test result:', testData);

    // Calculate total pot
    const totalPot = initialPlayers.reduce((sum: number, p: any) => sum + p.buyIn, 0);
    const startTime = Date.now();
    
    // Try to create a game using direct SQL with snake_case column names
    console.log('Trying to insert game with direct approach...');
    const { data: gameData, error: insertError } = await supabase
      .from('games')
      .insert({
        name: name,
        type: type || 'other',
        status: 'active',
        start_time: startTime,
        total_pot: totalPot,
        players: {}
      })
      .select();

    if (insertError) {
      console.error('Direct insert error:', insertError);
      return NextResponse.json({ error: `Failed to create game: ${insertError.message}` }, { status: 500 });
    }
    
    if (!gameData || gameData.length === 0) {
      return NextResponse.json({ error: 'Game created but no ID returned' }, { status: 500 });
    }
    
    const gameId = gameData[0].id;
    console.log('Game created successfully with ID:', gameId);
    
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
            game_id: gameId,         // snake_case
            player_id: player.playerId, // snake_case
            amount: -player.buyIn,
            type: 'bet',
            timestamp: Date.now(),
            description: `Buy-in for ${name}`
          });
        
        if (transactionError) {
          console.error(`Error creating transaction for player ${player.playerId}:`, transactionError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: transactionError.message 
          });
          continue;
        }
        
        // 3. Update player balance directly
        console.log(`Updating balance for player ${player.playerId}...`);
        
        // First get the current balance
        const { data: playerData, error: fetchError } = await supabase
          .from('players')
          .select('balance')
          .eq('id', player.playerId)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching player ${player.playerId}:`, fetchError);
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
          console.error(`Error updating balance for player ${player.playerId}:`, balanceError);
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
    console.error('Unexpected error in create-game-sql API:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get data from request
    const data = await request.json();
    const { name, type, initialPlayers } = data;
    
    console.log('API received direct game creation request:', { name, type, playerCount: initialPlayers?.length });
    
    // Initialize Supabase with direct credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate total pot
    const totalPot = initialPlayers.reduce((sum: number, p: any) => sum + p.buyIn, 0);
    
    // 1. INSERT directly into games table
    console.log('Inserting game record...');
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        name: name,
        type: type || 'other',
        status: 'active',
        totalPot: totalPot,
        startTime: Date.now(),
        players: {},
      })
      .select();
    
    if (gameError) {
      console.error('Direct game creation error:', gameError);
      return NextResponse.json({ 
        error: `Failed to create game: ${gameError.message}`,
        details: gameError 
      }, { status: 500 });
    }
    
    if (!gameData || gameData.length === 0) {
      return NextResponse.json({ error: 'No game data returned after creation' }, { status: 500 });
    }
    
    console.log('Game created successfully via direct SQL:', gameData[0]);
    
    // Get the game ID
    const gameId = gameData[0].id;
    
    // Process players
    const playerResults = [];
    
    for (const player of initialPlayers) {
      try {
        // 2. Add player to game_participants
        console.log(`Adding player ${player.playerId} to game_participants...`);
        const { error: participantError } = await supabase
          .from('game_participants')
          .insert({
            gameId: gameId,
            playerId: player.playerId,
            buyInAmount: player.buyIn,
            joinedAt: new Date().toISOString()
          });
        
        if (participantError) {
          console.error(`Error adding player ${player.playerId} to game_participants:`, participantError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: `Participant error: ${participantError.message}` 
          });
          continue;
        }
        
        // 3. Create transaction record
        console.log(`Creating transaction for player ${player.playerId}...`);
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            gameId: gameId,
            playerId: player.playerId,
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
            error: `Transaction error: ${transactionError.message}` 
          });
          continue;
        }
        
        // 4. Update player balance using direct update
        console.log(`Updating balance for player ${player.playerId}...`);
        const { error: balanceError } = await supabase
          .from('players')
          .update({ balance: supabase.rpc('decrement', { row_id: player.playerId, amount: player.buyIn }) })
          .eq('id', player.playerId);
        
        if (balanceError) {
          console.error(`Error updating balance for player ${player.playerId}:`, balanceError);
          playerResults.push({ 
            playerId: player.playerId, 
            success: false, 
            error: `Balance update error: ${balanceError.message}` 
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
    console.error('Unexpected error in create-game-direct API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get data from request
    const data = await request.json();
    const { name, type, initialPlayers } = data;
    
    console.log('Rebuild API received game creation request:', { name, type, playerCount: initialPlayers?.length });
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate total pot
    const totalPot = initialPlayers.reduce((sum: number, p: any) => sum + p.buyIn, 0);
    
    // Insert game using lower case column names based on our debug findings
    console.log('Using exact column names from database schema...');
    
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert({
        name: name,
        type: type || 'other',
        status: 'active',
        // Using lowercase column names found in previous debugging
        starttime: Date.now(),
        totalpot: totalPot,
        players: {}
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
        // For transactions, no additional table needed based on debug output
        console.log(`Processing player ${player.playerId}...`);
        
        // Get current player balance
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
        
        // Update player balance
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
        
        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            // Using lowercase or appropriate case based on our debugging
            gameid: gameId,
            playerid: player.playerId,
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
    console.error('Unexpected error in create-game-rebuild API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
} 
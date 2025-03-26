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
    
    // Use raw SQL to insert game (bypassing schema cache issues)
    const { data: insertedGame, error: gameError } = await supabase.rpc('create_new_game', {
      p_name: name,
      p_type: type || 'other',
      p_pot: totalPot,
      p_start_time: Date.now()
    });
    
    if (gameError) {
      console.error('Game creation SQL error:', gameError);
      return NextResponse.json({ error: `Failed to create game: ${gameError.message}` }, { status: 500 });
    }
    
    console.log('Game created successfully via SQL:', insertedGame);
    
    // Get the game ID
    const gameId = insertedGame;
    
    // Process players
    const playerResults = [];
    
    for (const player of initialPlayers) {
      // Add player to game via RPC (stored procedure)
      const { data: playerResult, error: playerError } = await supabase.rpc('add_player_to_game_complete', {
        p_game_id: gameId,
        p_player_id: player.playerId,
        p_buy_in: player.buyIn,
        p_description: `Buy-in for ${name}`
      });
      
      if (playerError) {
        console.error(`Error adding player ${player.playerId}:`, playerError);
        playerResults.push({ 
          playerId: player.playerId, 
          success: false, 
          error: playerError.message 
        });
      } else {
        playerResults.push({ 
          playerId: player.playerId, 
          success: true 
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
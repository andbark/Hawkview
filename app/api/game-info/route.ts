import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const gameId = url.searchParams.get('id');
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Fetching game with ID: ${gameId}`);
    
    // Main game query - with all variations of the column names we might have
    const { data: gameResult, error: gameError } = await supabase
      .from('games')
      .select(`
        id, 
        name, 
        type, 
        status,
        starttime, 
        startTime,
        start_time,
        totalpot,
        totalPot,
        total_pot,
        players
      `)
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      console.error('Error fetching game:', gameError);
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }
    
    // Use type assertion to fix TypeScript error
    const gameData = gameResult as Record<string, any>;
    
    return NextResponse.json({
      game: gameResult,
      columns: gameData ? Object.keys(gameData).filter(key => gameData[key] !== null) : []
    });
  } catch (error) {
    console.error('Error in game-info endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get schema information
    console.log('Fetching database information...');
    
    // Try different queries to understand the database structure
    
    // 1. Get games sample with camelCase names
    const { data: gamesCamel, error: gamesCamelError } = await supabase
      .from('games')
      .select('id, name, type, status, startTime, totalPot, players')
      .limit(1);
      
    // 2. Get games sample with snake_case names
    const { data: gamesSnake, error: gamesSnakeError } = await supabase
      .from('games')
      .select('id, name, type, status, start_time, total_pot, players')
      .limit(1);
      
    // 3. Get all game columns
    const { data: gamesAll, error: gamesAllError } = await supabase
      .from('games')
      .select('*')
      .limit(1);
    
    // 4. Get a list of game participants
    const { data: participants, error: participantsError } = await supabase
      .from('game_participants')
      .select('*')
      .limit(1);
    
    // Compile results
    const result = {
      connection: {
        success: true,
        url: supabaseUrl
      },
      camelCase: {
        data: gamesCamel,
        error: gamesCamelError ? gamesCamelError.message : null,
        columns: gamesCamel && gamesCamel.length > 0 ? Object.keys(gamesCamel[0]) : []
      },
      snakeCase: {
        data: gamesSnake,
        error: gamesSnakeError ? gamesSnakeError.message : null,
        columns: gamesSnake && gamesSnake.length > 0 ? Object.keys(gamesSnake[0]) : []
      },
      allColumns: {
        data: gamesAll,
        error: gamesAllError ? gamesAllError.message : null,
        columns: gamesAll && gamesAll.length > 0 ? Object.keys(gamesAll[0]) : []
      },
      participants: {
        data: participants,
        error: participantsError ? participantsError.message : null,
        columns: participants && participants.length > 0 ? Object.keys(participants[0]) : []
      }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in debug-schema endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
} 
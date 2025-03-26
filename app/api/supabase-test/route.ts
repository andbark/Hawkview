import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  console.log('Supabase test API called');
  
  // Check if supabase client is available
  if (!supabase) {
    console.error('⛔ Supabase client is not defined');
    return NextResponse.json({ 
      error: 'Supabase client not available', 
      supabaseExists: false,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    }, { status: 500 });
  }

  try {
    console.log('Supabase client exists, testing connection...');
    console.log('URL prefix:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...');

    // Test query to players table
    const playersResult = await supabase.from('players').select('count').single();
    
    // Test query to games table
    const gamesResult = await supabase.from('games').select('count').single();
    
    return NextResponse.json({
      status: 'success',
      players: {
        data: playersResult.data,
        error: playersResult.error ? playersResult.error.message : null,
      },
      games: {
        data: gamesResult.data,
        error: gamesResult.error ? gamesResult.error.message : null,
      },
      supabase: {
        exists: !!supabase,
        hasFrom: !!supabase?.from,
      },
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 
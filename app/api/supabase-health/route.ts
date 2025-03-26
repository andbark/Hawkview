import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // First check if supabase client is initialized properly
    if (!supabase || !supabase.from) {
      console.error('Supabase client not properly initialized', supabase);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Supabase client not properly initialized',
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    }
    
    // Simple query to test connection
    const { data, error, status } = await supabase
      .from('players')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Supabase query error', 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          httpStatus: status,
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    }
    
    // Check if we can query the games table too
    const { error: gamesError } = await supabase
      .from('games')
      .select('count', { count: 'exact', head: true });
      
    // Return success response with connection info
    return NextResponse.json(
      { 
        status: 'connected', 
        playerTableAccessible: !error,
        gamesTableAccessible: !gamesError,
        gamesError: gamesError ? {
          message: gamesError.message,
          code: gamesError.code
        } : null,
        env: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Unexpected error testing Supabase connection',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 
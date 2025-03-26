import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  console.log('Players data API called');
  
  if (!supabase) {
    console.error('⛔ Supabase client is not defined');
    return NextResponse.json({ 
      error: 'Supabase client not available'
    }, { status: 500 });
  }

  try {
    console.log('Fetching players data...');
    
    // Get players with detailed information
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching players:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      playerCount: data?.length || 0,
      players: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
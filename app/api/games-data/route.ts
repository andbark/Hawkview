import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  console.log('Games data API called');
  
  if (!supabase) {
    console.error('⛔ Supabase client is not defined');
    return NextResponse.json({ 
      error: 'Supabase client not available'
    }, { status: 500 });
  }

  try {
    console.log('Fetching games data...');
    
    // Get table names that are accessible
    let tableNames: string[] = [];
    try {
      // We've already checked that supabase is not null above
      const supabaseClient = supabase!;
      
      // This is a type-safe way to get available tables
      tableNames = Object.keys(supabaseClient.from).filter(
        key => typeof (supabaseClient.from as any)[key] === 'function'
      );
    } catch (e) {
      console.error('Error getting table names:', e);
    }
    
    // Get games with detailed information
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching games:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        tables: tableNames
      }, { status: 500 });
    }
    
    // Also try a RPC call to see if functions are accessible
    let rpcResult = null;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_timestamp');
      rpcResult = { data: rpcData, error: rpcError ? rpcError.message : null };
    } catch (rpcErr) {
      rpcResult = { error: 'RPC call failed', details: String(rpcErr) };
    }
    
    return NextResponse.json({
      status: 'success',
      gameCount: data?.length || 0,
      games: data,
      rpcTest: rpcResult,
      tableNames: tableNames,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 
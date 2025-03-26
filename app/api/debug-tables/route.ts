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
    
    // Try some known table names with basic select queries
    const tableNames = [
      // Snake case options
      'games', 'game_participants', 'transactions', 'players',
      // Camel case options 
      'Games', 'GameParticipants', 'Transactions', 'Players'
    ];
    
    // Define the type for table results
    type TableResult = {
      exists: boolean;
      error: string | null;
      sample: any | null;
      columns: string[];
    };
    
    // Initialize with proper typing
    const tableResults: Record<string, TableResult> = {};
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        tableResults[tableName] = {
          exists: error ? false : true,
          error: error ? error.message : null,
          sample: data && data.length > 0 ? data[0] : null,
          columns: data && data.length > 0 ? Object.keys(data[0]) : []
        };
      } catch (error) {
        tableResults[tableName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          sample: null,
          columns: []
        };
      }
    }
    
    return NextResponse.json({
      tableResults
    });
  } catch (error) {
    console.error('Error in debug-tables endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
} 
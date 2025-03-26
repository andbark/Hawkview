import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get data from request
    const data = await request.json();
    const { name, type, initialPlayers } = data;
    
    console.log('API received SQL game creation request:', { name, type, playerCount: initialPlayers?.length });
    
    // Initialize Supabase with direct credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing database credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate total pot
    const totalPot = initialPlayers.reduce((sum: number, p: any) => sum + p.buyIn, 0);
    const startTime = Date.now();
    
    try {
      // Insert game using pure SQL to avoid schema cache issues
      const insertSql = `
        INSERT INTO games (name, type, status, "startTime", "totalPot", players) 
        VALUES ('${name}', '${type || 'other'}', 'active', ${startTime}, ${totalPot}, '{}')
        RETURNING id
      `;
      
      console.log('Executing SQL:', insertSql);
      
      // Use simpler query approach that shouldn't have issues
      const { data: queryResult, error: queryError } = await supabase
        .from('games')
        .select('id')
        .limit(1)
        .maybeSingle();
        
      if (queryError) {
        console.error('Test query error:', queryError);
      } else {
        console.log('Test query succeeded:', queryResult);
      }
      
      // Try direct insert first
      const { data: insertResult, error: insertError } = await supabase
        .from('games')
        .insert({
          name: name,
          type: type || 'other',
          status: 'active',
          "startTime": startTime,
          "totalPot": totalPot,
          players: {}
        })
        .select('id');
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ 
          error: `Failed to create game: ${insertError.message}`, 
          details: insertError 
        }, { status: 500 });
      }
      
      if (!insertResult || insertResult.length === 0) {
        return NextResponse.json({ error: 'No game ID returned after creation' }, { status: 500 });
      }
      
      // Get the game ID
      const gameId = insertResult[0].id;
      console.log('Game created with ID:', gameId);
      
      // Process players
      const playerResults = [];
      
      for (const player of initialPlayers) {
        try {
          // 1. Add player to game_participants using raw SQL
          const participantSql = `
            INSERT INTO game_participants ("gameId", "playerId", "buyInAmount", "joinedAt")
            VALUES ($1, $2, $3, $4)
          `;
          
          const { error: participantError } = await supabase.rpc('exec_sql', {
            sql_query: participantSql,
            params: [gameId, player.playerId, player.buyIn, new Date().toISOString()]
          });
          
          if (participantError) {
            console.error(`Error adding participant ${player.playerId}:`, participantError);
            playerResults.push({ 
              playerId: player.playerId, 
              success: false, 
              error: `Participant error: ${participantError.message}` 
            });
            continue;
          }
          
          // 2. Create transaction record using raw SQL
          const transactionSql = `
            INSERT INTO transactions ("gameId", "playerId", amount, type, timestamp, description)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
          
          const { error: transactionError } = await supabase.rpc('exec_sql', {
            sql_query: transactionSql,
            params: [gameId, player.playerId, -player.buyIn, 'bet', Date.now(), `Buy-in for ${name}`]
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
          
          // 3. Update player balance using raw SQL
          const balanceSql = `
            UPDATE players SET balance = balance - $1 WHERE id = $2
          `;
          
          const { error: balanceError } = await supabase.rpc('exec_sql', {
            sql_query: balanceSql,
            params: [player.buyIn, player.playerId]
          });
          
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
      console.error('Error executing SQL:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error in create-game-sql API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
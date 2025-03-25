// Script to seed players into Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const playerNames = [
  'Freebs',
  'Mike A',
  'Mike S',
  'Matt M',
  'Chris',
  'Adam',
  'Donnie',
  'Stephen',
  'Sam',
  'Skibicki',
  'Davis',
  'Avas',
  'Luke',
  'Chris Barks',
  'Perugini',
  'Dorey'
];

async function seedPlayers() {
  console.log('Starting to seed players...');

  try {
    // Check which columns exist
    console.log('Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('players')
      .select()
      .limit(1);
      
    if (tableError) {
      console.error('Error getting table structure:', tableError);
      console.log('Attempting to insert with basic structure (name and balance)...');
    }
    
    // Create players with just names and balance
    const simplePlayers = playerNames.map(name => ({
      name,
      balance: 300
    }));
    
    // Insert players
    console.log('Inserting players...');
    const { data, error } = await supabase
      .from('players')
      .insert(simplePlayers)
      .select();
    
    if (error) {
      console.error('Error inserting players:', error);
    } else {
      console.log(`Successfully added ${data.length} players:`);
      data.forEach(player => {
        console.log(`- ${player.name} (ID: ${player.id})`);
      });
      console.log('Seeding complete!');
    }
  } catch (error) {
    console.error('Error in seed process:', error);
  }
}

// Run the seed function
seedPlayers(); 
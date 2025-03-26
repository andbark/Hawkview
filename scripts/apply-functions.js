const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('Reading SQL functions...');
    const functionsFilePath = path.join(__dirname, '..', 'supabase', 'functions.sql');
    const sqlContent = fs.readFileSync(functionsFilePath, 'utf8');
    
    // Split SQL by semicolons and keep only CREATE OR REPLACE FUNCTION statements
    const functionStatements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim().toUpperCase().startsWith('CREATE OR REPLACE FUNCTION'))
      .map(stmt => stmt.trim() + ';');
    
    console.log(`Found ${functionStatements.length} function statements to apply`);
    
    // Execute each function statement
    for (const [index, stmt] of functionStatements.entries()) {
      console.log(`\nExecuting function statement ${index + 1}/${functionStatements.length}...`);
      console.log('Statement:', stmt.substring(0, 100) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing function statement ${index + 1}:`, error);
        console.error('Statement:', stmt);
      } else {
        console.log(`Successfully executed function statement ${index + 1}`);
      }
    }
    
    console.log('\nAll function statements have been processed');
  } catch (error) {
    console.error('Error applying functions:', error);
    process.exit(1);
  }
}

main(); 
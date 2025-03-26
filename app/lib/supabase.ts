import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Add more robust environment variable validation with detailed logging
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing or empty');
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL is set (starts with: ${supabaseUrl.substring(0, 10)}...)`);
}

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty');
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set (length: ${supabaseKey.length})`);
}

// Create a simple client for server-side usage (synchronous)
let supabaseClient = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    console.log('Supabase client initialized (initial)');
  } else {
    console.error('⛔ Cannot initialize Supabase client due to missing environment variables');
  }
} catch (error) {
  console.error('⛔ Error initializing Supabase client:', error);
}

// Create a connection retry function for client-side
const createClientWithRetry = async (
  url: string, 
  key: string, 
  maxRetries = 3,
  retryDelay = 1000
) => {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} to initialize Supabase client...`);
      
      // Create Supabase client
      const client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      
      // Test the connection with a simple query
      const { data, error } = await client.from('players').select('count').single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Supabase connection established successfully:', data);
      return client;
    } catch (error) {
      lastError = error;
      retries++;
      console.warn(`❌ Supabase connection attempt ${retries} failed:`, error);
      console.log(`Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      // Increase delay for next retry (exponential backoff)
      retryDelay *= 2;
    }
  }
  
  console.error('⛔ Failed to connect to Supabase after multiple attempts');
  throw lastError;
};

// In client-side code, set up the retry mechanism
if (typeof window !== 'undefined') {
  // This runs only on the client side
  console.log('Browser environment detected, initializing Supabase client with retry...');
  
  if (supabaseUrl && supabaseKey) {
    createClientWithRetry(supabaseUrl, supabaseKey)
      .then(client => {
        supabaseClient = client;
        console.log('✅ Supabase client successfully replaced with retry-enabled version');
      })
      .catch(error => {
        console.error('⛔ Failed to initialize retry-enabled Supabase client:', error);
      });
  } else {
    console.error('⛔ Cannot initialize retry-enabled Supabase client due to missing environment variables');
  }
}

// Export the client
export const supabase = supabaseClient; 
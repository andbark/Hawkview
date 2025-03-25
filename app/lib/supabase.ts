import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a connection retry function
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
      // Create Supabase client
      const client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      
      // Test the connection with a simple query
      await client.from('games').select('id').limit(1);
      
      console.log('Supabase connection established successfully');
      return client;
    } catch (error) {
      lastError = error;
      retries++;
      console.warn(`Supabase connection attempt ${retries} failed, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      // Increase delay for next retry (exponential backoff)
      retryDelay *= 2;
    }
  }
  
  console.error('Failed to connect to Supabase after multiple attempts', lastError);
  // Return a client anyway, but it might not work
  return createClient(url, key);
};

// For server-side usage, we need a synchronous export
// But we'll make the client retry connections when used
let supabaseClient = createClient(supabaseUrl, supabaseKey);

// In client-side code, this will be replaced with a retry-enabled client
if (typeof window !== 'undefined') {
  // This runs only on the client side
  createClientWithRetry(supabaseUrl, supabaseKey)
    .then(client => {
      supabaseClient = client;
    })
    .catch(error => {
      console.error('Failed to initialize Supabase client:', error);
    });
}

export const supabase = supabaseClient; 
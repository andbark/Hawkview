# Supabase Setup Guide

This guide will help you set up your Bachelor Party app with Supabase instead of Firebase.

## 1. Create a Supabase Account

If you don't already have a Supabase account:
1. Go to [https://supabase.com/](https://supabase.com/)
2. Sign up for an account
3. Create a new project

## 2. Set Up Your Project

1. Give your project a name (e.g., "Bachelor Party Tracker")
2. Set a secure database password
3. Choose a region closest to your users
4. Wait for your project to be initialized (this could take a few minutes)

## 3. Set Up Database Schema

1. In your Supabase project dashboard, go to the "SQL Editor" tab
2. Create a new query
3. Copy and paste the contents of `supabase/schema.sql` into the SQL editor
4. Run the query to create all the necessary tables and functions

## 4. Enable Realtime Functionality

1. Go to "Database" → "Replication"
2. Under "Realtime", make sure it's enabled
3. Add the three tables (players, games, transactions) to the publication
   - If the ALTER PUBLICATION commands from the schema.sql file didn't work, you can do this manually

## 5. Update Environment Variables

Create a `.env.local` file in your project root with these values:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase dashboard under "Settings" → "API"

## 6. Install Required Dependencies

```bash
npm install @supabase/supabase-js
npm install react-hot-toast # If not already installed
```

## 7. Run the Application

```bash
npm run dev
```

## 8. Test the Application

1. Create a new player
2. Create a new game
3. Verify real-time updates work
4. End a game and verify the winner is recorded correctly

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Check Supabase logs in the dashboard under "Database" → "Logs"
4. Verify that real-time functionality is enabled
5. Make sure all tables have the correct structure 
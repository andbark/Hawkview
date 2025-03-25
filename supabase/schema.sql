-- Enable the PostgreSQL extensions we need
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  gamesPlayed INTEGER DEFAULT 0 NOT NULL,
  gamesWon INTEGER DEFAULT 0 NOT NULL,
  colorScheme TEXT DEFAULT 'blue' NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Games table with JSONB for players data
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  startTime BIGINT NOT NULL,
  endTime BIGINT,
  totalPot DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  winner UUID REFERENCES players(id),
  players JSONB DEFAULT '{}'::JSONB NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gameId UUID REFERENCES games(id),
  playerId UUID REFERENCES players(id),
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bet', 'win', 'refund')),
  timestamp BIGINT NOT NULL,
  description TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS games_status_idx ON games(status);
CREATE INDEX IF NOT EXISTS transactions_player_id_idx ON transactions(playerId);
CREATE INDEX IF NOT EXISTS transactions_game_id_idx ON transactions(gameId);

-- RLS (Row Level Security) Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- For public access during development (remove in production)
CREATE POLICY "Allow full access to players" ON players FOR ALL USING (true);
CREATE POLICY "Allow full access to games" ON games FOR ALL USING (true);
CREATE POLICY "Allow full access to transactions" ON transactions FOR ALL USING (true);

-- Function to add a player to a game (handles transaction)
CREATE OR REPLACE FUNCTION add_player_to_game(
  p_game_id UUID,
  p_player_id UUID,
  p_bet DECIMAL,
  p_updated_players JSONB,
  p_updated_total_pot DECIMAL
) RETURNS void AS $$
BEGIN
  -- Update the game with the new player and total pot
  UPDATE games
  SET 
    players = p_updated_players,
    totalPot = p_updated_total_pot
  WHERE id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime subscriptions for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions; 
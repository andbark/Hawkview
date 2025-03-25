-- Function to increment a numeric value
CREATE OR REPLACE FUNCTION increment(row_id UUID, amount DECIMAL)
RETURNS DECIMAL
LANGUAGE SQL
AS $$
  UPDATE players
  SET balance = balance + amount
  WHERE id = row_id
  RETURNING balance;
$$;

-- Function to decrement a numeric value
CREATE OR REPLACE FUNCTION decrement(row_id UUID, amount DECIMAL)
RETURNS DECIMAL
LANGUAGE SQL
AS $$
  UPDATE players
  SET balance = balance - amount
  WHERE id = row_id
  RETURNING balance;
$$;

-- Function to increment games played
CREATE OR REPLACE FUNCTION increment_games_played(row_id UUID)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE players
  SET gamesPlayed = gamesPlayed + 1
  WHERE id = row_id
  RETURNING gamesPlayed;
$$;

-- Function to increment games won
CREATE OR REPLACE FUNCTION increment_games_won(row_id UUID)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE players
  SET gamesWon = gamesWon + 1
  WHERE id = row_id
  RETURNING gamesWon;
$$; 
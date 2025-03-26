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

-- Function to create a new game using raw SQL to avoid schema cache issues
CREATE OR REPLACE FUNCTION create_new_game(
  p_name TEXT,
  p_type TEXT,
  p_pot DECIMAL,
  p_start_time BIGINT
) RETURNS UUID AS $$
DECLARE
  v_game_id UUID;
BEGIN
  -- Insert the game with basic required fields
  INSERT INTO games (
    name, 
    type, 
    status, 
    "startTime", 
    "totalPot", 
    players
  ) VALUES (
    p_name,
    p_type,
    'active',
    p_start_time,
    p_pot,
    '{}'::jsonb
  ) RETURNING id INTO v_game_id;
  
  RETURN v_game_id;
END;
$$ LANGUAGE plpgsql;

-- Function to completely handle adding a player to a game
-- Including transactions and balance updates
CREATE OR REPLACE FUNCTION add_player_to_game_complete(
  p_game_id UUID,
  p_player_id UUID,
  p_buy_in DECIMAL,
  p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := TRUE;
BEGIN
  -- 1. Add player to game_participants
  BEGIN
    INSERT INTO game_participants (
      "gameId",
      "playerId",
      "buyInAmount",
      "joinedAt"
    ) VALUES (
      p_game_id,
      p_player_id,
      p_buy_in,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding player to game_participants: %', SQLERRM;
    v_success := FALSE;
  END;

  -- 2. Create transaction record
  IF v_success THEN
    BEGIN
      INSERT INTO transactions (
        "gameId",
        "playerId",
        amount,
        type,
        timestamp,
        description
      ) VALUES (
        p_game_id,
        p_player_id,
        -p_buy_in,  -- Negative for buy-in
        'bet',
        EXTRACT(EPOCH FROM NOW()) * 1000,
        p_description
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating transaction: %', SQLERRM;
      v_success := FALSE;
    END;
  END IF;

  -- 3. Update player balance
  IF v_success THEN
    BEGIN
      UPDATE players
      SET balance = balance - p_buy_in
      WHERE id = p_player_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating player balance: %', SQLERRM;
      v_success := FALSE;
    END;
  END IF;

  RETURN v_success;
END;
$$ LANGUAGE plpgsql; 
-- Add colorScheme column to players table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'players'
    AND column_name = 'colorScheme'
  ) THEN
    ALTER TABLE players ADD COLUMN colorScheme TEXT DEFAULT 'blue' NOT NULL;
  END IF;
END
$$; 
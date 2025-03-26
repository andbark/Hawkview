-- This function allows executing arbitrary SQL
-- Requires admin privileges to create
CREATE OR REPLACE FUNCTION exec_sql(sql_query text) RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function allows executing parameterized SQL
-- Requires admin privileges to create
CREATE OR REPLACE FUNCTION exec_sql(sql_query text, params text[]) RETURNS void AS $$
BEGIN
  EXECUTE sql_query USING params;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function allows executing SQL that returns values
-- Requires admin privileges to create
CREATE OR REPLACE FUNCTION exec_sql_with_return(sql_query text, params text[]) RETURNS SETOF RECORD AS $$
BEGIN
  RETURN QUERY EXECUTE sql_query USING params;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
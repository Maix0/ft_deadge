-- this file will make sure that the database is always up to date with the correct schema
-- when editing this file, make sure to always include stuff like `IF NOT EXISTS` such as to not throw error
-- NEVER DROP ANYTHING IN THIS FILE
CREATE TABLE IF NOT EXISTS users (
  id STRING UNIQUE PRIMARY KEY, -- UUIDv7 as a string
  name STRING UNIQUE, -- name of the user
  token STRING UNIQUE, -- the token of the user (aka the cookie)
);


-- this file will make sure that the database is always up to date with the correct schema
-- when editing this file, make sure to always include stuff like `IF NOT EXISTS` such as to not throw error
-- NEVER DROP ANYTHING IN THIS FILE
CREATE TABLE IF NOT EXISTS users (name STRING);

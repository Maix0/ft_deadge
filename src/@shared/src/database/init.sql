----------------
--    AUTH    --
----------------

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  login TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  password TEXT,
  otp TEXT,
  guest INTEGER NOT NULL DEFAULT 0,
  oauth2 TEXT DEFAULT NULL,
  desc TEXT NOT NULL DEFAULT "What a good day to be reviewing this project :D",
  allow_guest_message INTEGER NOT NULL DEFAULT 1
);

----------------
--    CHAT    --
----------------

CREATE TABLE IF NOT EXISTS blocked (
  id INTEGER PRIMARY KEY NOT NULL,
  user TEXT NOT NULL,
  blocked TEXT NOT NULL,
  FOREIGN KEY (user) REFERENCES user (id) FOREIGN KEY (blocked) REFERENCES user (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_user_pair ON blocked (user, blocked);

----------------
--  TICTACTOE --
----------------

CREATE TABLE IF NOT EXISTS tictactoe (
  id TEXT PRIMARY KEY NOT NULL,
  time TEXT NOT NULL default (datetime ('now')),
  playerX TEXT NOT NULL,
  playerO TEXT NOT NULL,
  outcome TEXT NOT NULL,
  FOREIGN KEY (playerX) REFERENCES user (id),
  FOREIGN KEY (playerO) REFERENCES user (id)
);

----------------
--    PONG    --
----------------

CREATE TABLE IF NOT EXISTS pong (
  id TEXT PRIMARY KEY NOT NULL,
  time TEXT NOT NULL default (datetime ('now')),
  playerL TEXT NOT NULL,
  playerR TEXT NOT NULL,
  scoreL INTEGER NOT NULL,
  scoreR INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  local INTEGER NOT NULL,
  FOREIGN KEY (playerL) REFERENCES user (id),
  FOREIGN KEY (playerR) REFERENCES user (id)
);

----------------
-- TOURNAMENT --
----------------

CREATE TABLE IF NOT EXISTS tournament (
  id TEXT PRIMARY KEY NOT NULL,
  time TEXT NOT NULL default (datetime ('now')),
  owner TEXT NOT NULL,
  FOREIGN KEY (owner) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS tour_user (
  id INTEGER PRIMARY KEY NOT NULL,
  user TEXT NOT NULL,
  tournament TEXT NOT NULL,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  FOREIGN KEY (user) REFERENCES user (id),
  FOREIGN KEY (tournament) REFERENCES tournament (id)
);

CREATE TABLE IF NOT EXISTS tour_game (
  id INTEGER PRIMARY KEY NOT NULL,
  tournament TEXT NOT NULL,
  game TEXT NOT NULL,
  FOREIGN KEY (game) REFERENCES pong (id),
  FOREIGN KEY (tournament) REFERENCES tournament (id)
);

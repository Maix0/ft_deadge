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


CREATE TABLE IF NOT EXISTS blocked (
  id INTEGER PRIMARY KEY NOT NULL,
  user TEXT NOT NULL,
  blocked TEXT NOT NULL,

  FOREIGN KEY(user) REFERENCES user(id)
  FOREIGN KEY(blocked) REFERENCES user(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_user_pair
    ON blocked(user, blocked);

CREATE TABLE IF NOT EXISTS tictactoe (
    id TEXT PRIMARY KEY NOT NULL,
    player1 TEXT NOT NULL,
    player2 TEXT NOT NULL,
    outcome TEXT NOT NULL

--     FOREIGN KEY(player1) REFERENCES user(id)
--     FOREIGN KEY(player2) REFERENCES user(id)
);

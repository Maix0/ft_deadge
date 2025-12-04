CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  login TEXT UNIQUE,
  name TEXT NOT NULL,
  password TEXT,
  otp TEXT,
  guest INTEGER NOT NULL DEFAULT 0,
  oauth2 TEXT DEFAULT NULL
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


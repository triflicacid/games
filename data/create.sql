-- Setup database `users.db'
CREATE TABLE Users (
  ID integer PRIMARY KEY AUTOINCREMENT,
  -- Username
  Username text,
  -- Password
  Password text,
  -- Date created (JS Date())
  Created text
);

-- MAD: games
CREATE TABLE MAD_Games (
    ID text PRIMARY KEY, -- result from uuid()
    Name text, -- Game name
    Owner integer -- ID of owner
);
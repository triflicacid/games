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
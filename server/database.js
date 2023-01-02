import { SQLiteDatabase } from './lib/SQLiteDatabase.js';

export var db = new SQLiteDatabase('data/data.db');

/** Get array of all users with the given username (if undefined, returns all users) */
export async function getUsers(username = undefined) {
  return await (username ? db.all("SELECT * FROM Users WHERE Username = ?", [username]) : db.all("SELECT * FROM Users"));
}

/** Get user by ID */
export async function getUser(id) {
  return await db.get("SELECT * FROM Users WHERE ID = ?", [id]);
}

/** Attempt to log on as a user. Either return user object or NULL. */
export async function userLogIn(username, password) {
  const user = await db.get("SELECT * FROM Users WHERE Username = ?", [username]);
  if (user) {
    if (user.Password === password)
      return user; // TODO: encrypt/hash password
  }
  return null;
}

/** Create user. Return ID. */
export async function createUser(username, password) {
  return await db.run("INSERT INTO Users (Username, Password, Created) VALUES (?, ?, ?)", [username, password, Date.now().toString()]);
}

/** Delete user */
export async function deleteUser(uid) {
  return await db.run("DELETE FROM Users WHERE ID = ?", [uid]);
}

/** Change a user's username */
export async function changeUsername(uid, username) {
  return await db.run("UPDATE Users SET Username = ? WHERE ID = ?", [username, uid]);
}

/** Change a user's password */
export async function changePassword(uid, password) {
  return await db.run("UPDATE Users SET Password = ? WHERE ID = ?", [password, uid]);
}
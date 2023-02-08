import { v4 as uuidv4 } from "uuid";
import { db } from "../../database.js";

const GAMES_TABLE = "MAD_Games";

/** Get list of all games */
export function getAllGames() {
    return db.all("SELECT * FROM " + GAMES_TABLE);
}

/** Get game by ID */
export function getGameByID(id) {
    return db.get(`SELECT * FROM ${GAMES_TABLE} WHERE ID = ?`, [id]);
}

/** Get all games which User.ID is the owner */
export function getGamesWhereOwner(userID) {
    return db.all(`SELECT ${GAMES_TABLE}.* FROM ${GAMES_TABLE} JOIN Users ON ${GAMES_TABLE}.Owner = Users.ID WHERE Users.ID = ?`, [userID]);
}

/** Create a new game, given the owner ID and game name. Return the game ID. */
export async function createNewGame(ownerID, name) {
    const id = uuidv4();
    await db.run(`INSERT INTO ${GAMES_TABLE} (ID, Owner, Name) VALUES (?, ?, ?)`, [id, ownerID, name]);
    return id;
}

/** Delete a given game */
export function deleteGame(id) {
    return db.run(`DELETE FROM ${GAMES_TABLE} WHERE ID = ?`, [id]);
}
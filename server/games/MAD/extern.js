import { Game } from "./Game.js";
import { createNewGame, getGameByID, deleteGame as dbDeleteGame, getAllGames } from "./database.js";
import { deleteGame as deleteGameFile, saveGame } from "../../games.js";

export const ID = "MAD";

export const CREATE_NEW_FIELDS = {
    region: {
        text: "Region",
        type: "select",
        values: [
          { text:"Random", value: "rnd" },
          { text: "Russia", value: "ru" },
          { text: "USA", value: "us" },
        ],
    },
};

export const GAME_HEADERS = {};

export async function init() {
  const games = await getAllGames();
  for (const game of games) {
    const obj = new Game(game);
    Game.all.set(game.ID, obj);
  }
}

export async function close() {
  // Save any active games
  for (const [id, game] of Game.all.entries()) {
    if (game.data) {
       await saveGame(ID, id, JSON.stringify(game.data));
       game.data = undefined;
    }
  }
  Game.all.clear();
}

/** Get game with given ID. */
export function getGame(id) {
  return Game.all.get(id);
}

export function getMyGames(id) {
  return Array.from(Game.all.entries()).filter(([, game]) => game.owner === id).map(([id, game]) => {
    return {
      id,
      name: game.name,
    };
  });
}

/** Create new game. Return ID. */
export async function createGame(owner, name, params) {
  const id = await createNewGame(owner, name);
  const dbEntry = await getGameByID(id);
  const game = new Game(dbEntry);
  game.initNew(params.region === "rnd" ? undefined : params.region); // Initialise new game.
  Game.all.set(id, game);
  await saveGame(ID, id, JSON.stringify(game.data));
  return id;
}


/** Delete game. */
export async function deleteGame(id) {
  const dbEntry = await getGameByID(id);
  if (dbEntry) {
    Game.all.delete(id);
    deleteGameFile(ID, id);
    await dbDeleteGame(id);
    return true;
  }
  return false;
}
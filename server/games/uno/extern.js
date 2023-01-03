import { Game } from "./Game.js";
import { generateId, saveGame, deleteGame as deleteGameFile, readGame, getGameIDs } from "../../games.js";

export const ID = "uno";
export const GAME_HEADERS = {
  capacity: "Players",
};

export const CREATE_NEW_FIELDS = {
  players: {
    text: "Player Count",
    type: "select",
    values: [
      { text: "2", value: 2 },
      { text: "3", value: 3 },
      { text: "4", value: 4 },
      { text: "5", value: 5 },
      { text: "6", value: 6 },
    ]
  },
};

export async function init() {
  // Load every game
  const ids = await getGameIDs(ID);
  for (const id of ids) {
    const fdata = await readGame(ID, id);
    const obj = JSON.parse(fdata);
    const game = new Game(obj.players.length);
    game.initFromSaved(obj);
    Game.all.set(id, game);
  }
}

/** Get game with given ID. */
export function getGame(id) {
  return Game.all.get(id);
}

export function getMyGames(id) {
  return Array.from(Game.all.entries()).filter(([, game]) => game.owner === id).map(([id, game]) => {
    const total = game.players.length, free = game.getPlayerSlots().length, active = total - free;
    return {
      id,
      name: game.name,
      players: active,
      max: total,
      capacity: active.toString() + "/" + total.toString(),
    };
  });
}

/** Create new game. Return ID. */
export async function createGame(owner, name, params) {
  const playerCount = +params.players;
  const id = generateId();
  const game = new Game(playerCount);
  game.id = id;
  game.name = name;
  game.owner = owner;
  game.initNew(); // Initialise new game.
  Game.all.set(id, game);
  const data = game.toObject();
  await saveGame(ID, id, JSON.stringify(data));
  return id;
}


/** Delete game. */
export function deleteGame(id) {
  if (Game.all.has(id)) {
    deleteGameFile(ID, id);
    Game.all.delete(id);
    return true;
  }
  return false;
}
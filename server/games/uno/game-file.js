import { Game, games } from "./Game.js";
import { uuid } from "../../utils.js";
import fs from "fs";
import path from "path";

const GAMES_PATH = "data/uno/"; // Path where game files are stored

/** Get array of game IDs */
export async function getGameIDs() {
  return (await new Promise(resolve => fs.readdir(GAMES_PATH, (_, files) => resolve(files))))
    .map(file => path.basename(file, path.extname(file)));
}

/** Populate given `map` with `game.id => Game` @async */
export async function loadGames(map) {
  const ids = await getGameIDs();
  for (const id of ids) {
    const fpath = GAMES_PATH + id + ".json";
    const fdata = await new Promise(resolve => fs.readFile(fpath, (_, data) => resolve(data)));
    const obj = JSON.parse(fdata);
    const game = new Game(obj.players.length);
    game.init(obj);
    map.set(id, game);
  }
  return map;
}

/** Create new game file. Return ID. */
export async function createGameFile(owner, name, playerCount) {
  const id = uuid();
  const game = new Game(playerCount);
  game.id = id;
  game.name = name;
  game.owner = owner;
  game.init(); // Initialise new game.
  games.set(id, game);
  const fpath = GAMES_PATH + id + ".json";
  const data = game.toObject();
  await new Promise(resolve => fs.writeFile(fpath, JSON.stringify(data), resolve));
  return id;
}

/** Delete game file */
export function deleteGameFile(id) {
  const fpath = GAMES_PATH + id + ".json";
  fs.unlinkSync(fpath);
  games.delete(id);
}

/** Save game data */
export function saveGameFile(id, data) {
  const fpath = GAMES_PATH + id + ".json";
  fs.writeFileSync(fpath, JSON.stringify(data));
}
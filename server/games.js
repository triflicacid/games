import * as fs from 'fs';
import { uuid } from './utils.js';
import { extname, basename } from "path";

const INFO_PATH = "public/assets/games.json"; // Games list
const DATA_PATH = "data/"; // Where game data is stored

var json; // Cached data from INFO_PATH

/** Return or get cached game data from INFO_PATH */
export function getInfo() {
  if (json) return json; // If cached, return
  const buffer = fs.readFileSync(INFO_PATH);
  return (json = JSON.parse(buffer.toString()));
};

/** Generate new game ID */
export function generateId() {
  return uuid();
}

/** Is the provided argument a valid game name? */
export function isValidGameName(name) {
  return typeof name === "string" && getInfo().hasOwnProperty(name);
}

/** Get list of all saved game IDs for a game @async */
export async function getGameIDs(gameName) {
  const path = DATA_PATH + gameName + "/"

  return (await new Promise(resolve => fs.readdir(path, (_, files) => resolve(files))))
    .map(file => basename(file, extname(file)));
}

/** Get game data (as string) @async */
export async function readGame(gameName, gameId) {
  const fpath = DATA_PATH + gameName + "/" + gameId + ".json";
  const fdata = await new Promise(resolve => fs.readFile(fpath, (_, data) => resolve(data)));
  return fdata;
}

/** Save a game (write string data to save file). Return file path. @async */
export async function saveGame(gameName, gameId, data) {
  const path = DATA_PATH + gameName + "/" + gameId + ".json";
  await new Promise(resolve => fs.writeFile(path, data, resolve));
  return path;
}

/** Delete a game. Return deleted file path. */
export function deleteGame(gameName, gameId) {
  const path = DATA_PATH + gameName + "/" + gameId + ".json";
  fs.unlinkSync(path);
  return path;
}
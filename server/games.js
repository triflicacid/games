import { readFileSync } from 'fs';

var json;

// Return or get cached game data from 'games.json'
export default function () {
  if (json) return json; // If cached, return
  const buffer = readFileSync("public/assets/games.json");
  return (json = JSON.parse(buffer.toString()));
};
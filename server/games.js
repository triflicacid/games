const fs = require('fs');

var json;

// Return or get cached game data from 'games.json'
module.exports = function () {
  if (json) return json; // If cached, return
  const buffer = fs.readFileSync("public/assets/games.json");
  return (json = JSON.parse(buffer.toString()));
};
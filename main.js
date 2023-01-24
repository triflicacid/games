import startApp from "./server/index.js";

// Extract necessary command line arguments
const numbers = process.argv.slice(1).map(n => +n).filter(n => !isNaN(n))
const port = numbers.length === 0 ? 3000 : numbers[0];
const initMultiplayer = !process.argv.includes("--no-mult");

startApp(port, initMultiplayer);
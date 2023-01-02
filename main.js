import startApp from "./server/index.js";

const port = process.argv[2] === undefined ? 3000 : parseInt(process.argv[2]);
startApp(port);
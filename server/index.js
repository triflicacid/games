const express = require('express');
const socketio = require('socket.io');
const router = require('./router.js');

const PORT = 3000;

const app = express();
const server = app.listen(PORT, () => {
  console.log(`Listening on port :${PORT}`);
});
const io = socketio(server);

app.use('/', router);
app.use(express.static("public/"));
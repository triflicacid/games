This repository holds (small) games that I have created.

Both single- and multi-player games are included.

# Execution
- Clone repo
- Run `npm install`
- To start the server, run `node main.js [port] [--no-mult]` where
  - `port` is the port to be hosted on;
  - `--no-mult` skips the initialisation of multiplayer game data;

# Core Structure
This section explains how games are structured on the server.

## Client
The public root is located at `public/`.

- Games are listed in `/assets/games.json`
  - The key is a url-safe ID of the game
  - It has the following properties. Unless otherwise states, they are optional.
    - [**required**] `name` -- human-readable name of the game. The game title, if you will.
    - `external` -- if the game is hosted externally, this contains the URL. When clicked, the user will be redirected here.
    - `icon` -- the custom path to the icon, `/games/<name>/<icon>`. If ommited, `<icon> = icon.png`.
    - `singleplayer` -- is the game singleplayer? If ommited, it is assumed `true`. When clicked:
      - If `true`, the user is taken to `/games/<name>/<target>`.
      - If `false`, the user is taken to the lobby at `/games/join.html`.
    - `target` -- the landing page for the *singleplayer* game. Default is `index.html`.
- Client-side game source code goes into `/games/<name>/`.
  - Each page must connect to the server using `createSocket` with a source path that points to a server-side Connection object, and extract the authentication token using `getToken`. This will send a request to the server, and identify the user.
- Game help files are written in MarkDown and available at `/help/<name>`. Their MarkDown source is available at `/games/<name>/README.md`.

## Server
The server root is located at `server/`.

- Server-side game saves are located in `/data/<name>/<game ID>.json`.
- Server-side source code for **multiplayer** games is located at `/games/<name>/`.
  - Connection object(s) - their location(s) depend on the client-sent `src` property in the socket handshake payload.
    - If the source is `top/sub`, object must be `/games/<top>/connections/<sub>.js`.
    - If the source is `top` only, object must be `/games/<top>/Connection.js`.

    In any case, the connection object should be the **default** export and extend `UserSocket`.
  - Exists `./extern.js`, which exposes function which are used externally to the game:
    - `ID: string` -- Game ID
    - `CREATE_NEW_FIELDS: object` -- Object describing the fields needed to create a new game - used by client in `join.html`.

    Object containing pairs `<param-name>: object`, where object has
    - `text` - text to display next to the field.
    - `type` - input type, one of below:
      - `"select"`. Select from a variety of options, as listed in `values` property, where `values: { value: any, text: string }[]`
      - `"text"`. Text input box, with placeholder `placeholder` and default value `value`.
    - `GAME_HEADERS: object` -- Object mapping game property to table header text.
    - `async init(): void` -- Called when server is started; initialise game.
    - `async close(): void` -- Called when server is closing; close game.
    - `async createGame(owner: number, name: string, params: { [name: string]: any }): id` -- Creates a new game file with given parameters (from `CREATE_NEW_FIELDS`).
    - `async deleteGame(id: string): boolean` -- Delete a game, return if success.
    - `getGame(id: string): object` -- Get game with given ID. Return object depends on implementation, but must satisfy the requirements of a `GameObject` (described below).
    - `getMyGames(uid: number): object[]` -- Returns array of all games owned by a user ID. Object **must** contain `id: string` (the game ID) and `name: string` (the game name).
  - Each game object must extend `/games/Game.js`.
    

# TODO
Make game multiplayer game listing & joining a common behaviour

Games:
- Chase the Ace (multiplayer)
- Sevens (multiplayer)
- Normal and reverse Knock-Out Wist (multiplayer)
- Rummy (multiplayer)
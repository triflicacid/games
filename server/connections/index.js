import { userLogIn, getUsers, createUser, deleteUser, getUser, changeUsername, changePassword } from "../database.js";
import { isValidGameName } from "../games.js";
import UserSocket from "../lib/UserSocket.js";

export class Connection extends UserSocket {
  constructor(sock) {
    super(sock);
    this._setup();
  }

  /** Setup events */
  _setup() {
    // Request to login. req: { username: string; password: string; when: string; }
    this.onEvent("user-login", async (req) => {
      const user = await userLogIn(req.username, req.password);
      this.log((user ? "Successful" : "Attempted") + ` login at ${Date.now()} with username='${req.username}'`);
      this.user = user;
      this.emit("user-login", this.getSafeUser());
    });

    // Request to create an account. req: { username: string; password: string; when: string; }
    this.onEvent("user-create", async (req) => {
      if (req.password.length === 0) {
        this.emit("user-create", {
          error: true,
          message: "A password is required.",
        });
      } else {
        let users = await getUsers(req.username);
        if (users.length === 0) {
          const uid = await createUser(req.username, req.password);
          this.user = await getUser(uid);
          this.emit("user-create", {
            error: false,
            user: this.getSafeUser(),
          });
        } else {
          this.emit("user-create", {
            error: true,
            message: "User already exists.",
          });
        }
      }
    });

    // Request to change username
    this.onEvent("change-username", async (username) => {
      if (this.user) {
        const users = await getUsers(username);
        if (users.length === 0) {
          await changeUsername(this.user.ID, username);
          this.user.Username = username;
          this.emit("get-user-info", this.getSafeUser());
        } else {
          this.emit("popup", { title: 'Cannot Change Username', message: `Username '${username}' is already taken.` });
        }
      }
    });

    // Request to change username
    this.onEvent("change-password", async (password) => {
      if (this.user) {
        if (password !== this.user.Password) {
          await changePassword(this.user.ID, password);
          this.user.Password = password;
        }
      }
    });

    // Request to log user out
    this.onEvent("user-logout", () => {
      this.user = null;
    });

    // Request to delete account
    this.onEvent("user-delete", async (id) => {
      if (this.user && this.user.ID === id) {
        this.log(`Deleted account ID=${this.user.ID}`);
        await deleteUser(id);
        this.user = null;
      } else {
        this.log(`Failed to delete account`);
      }
    });
  }

  /** @override Check that payload is a valid game name */
  _checkTokenPayload(payload) {
    return isValidGameName(payload);
  }

  /** @override */
  getDataToCache(gameName) {
    return {
      ...super.getDataToCache(),
      game: gameName,
    };
  }
}

export default Connection;
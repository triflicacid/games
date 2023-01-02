import { userLogIn, getUsers, createUser, getUser } from "../database.js";
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

    // Request to log user out
    this.onEvent("user-logout", () => {
      this.user = null;
    });
  }
}

export default Connection;
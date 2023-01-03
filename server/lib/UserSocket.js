import SocketManager from "./SocketManager.js";
import Auth from "./Auth.js";
import { getUser } from "../database.js";

export class UserSocket extends SocketManager {
  constructor(socket) {
    super(socket);
    this.user = null; // Entry from table `Users`

    // Basic event to get current user's information
    this.onEvent("get-user-info", () => {
      this.emit("get-user-info", this.getSafeUser());
    });

    // Create auth token
    this.onEvent("gen-token", (payload) => {
      if (this.user) {
        if (this._checkTokenPayload(payload)) {
          const token = UserSocket.auth.create(this.getDataToCache(payload));
          this.log(`Created auth token for ID=${this.user.ID}, valid for ${UserSocket.auth.removeTimeout}ms :: ${token}`);
          this.emit("gen-token", token); // Send them the token
        } else {
          const message = `Failed to create auth token -- payload check failed.`;
          this.log(message);
          this.emit("html-error", { title: "HTTP 400 - Bad Request", message });
        }
      } else {
        const message = `Failed to create auth token -- not signed in.`;
        this.log(message);
        this.emit("html-error", { title: "HTTP 401 - Unauthorised", message });
      }
    });

    // Log in and return user from a token
    this.onEvent("redeem-token", async (token) => {
      if (UserSocket.auth.exists(token)) {
        const data = UserSocket.auth.get(token), uid = data.UID;
        this.log(`Redeemed token - ID=${uid}, ${token}`);
        await this._onRedeemedToken(token, data);
        this.emit("redeem-token", {
          ok: true,
          token,
          data,
        });
      } else {
        this.log(`Failed to redeem token, ${token}`);
        this.emit("redeem-token", {
          ok: false,
          token,
        });
      }
    });
  }

  disconnect() {
    this.user = null; // Log user out
    super.disconnect();
  }

  /** Used to check the payload of 'gen-token' -- must be overriden */
  _checkTokenPayload(payload) {
    return payload == undefined;
  }

  /** Called when client redeems a valid token. Super **MUST** be called. @async */
  async _onRedeemedToken(token, data) {
    this.user = await getUser(data.UID);
  }

  /** Data to save in the token. MUST have a `UID` field containing the user id. */
  getDataToCache() {
    return { UID: this.user.ID };
  }

  /** Strip sensitive data from this.user */
  getSafeUser() {
    if (this.user) {
      let user = { ...this.user };
      delete user.Password;
      return user;
    } else {
      return this.user;
    }
  }
}

// Authenticator
UserSocket.auth = new Auth();

export default UserSocket;
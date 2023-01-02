import { uuid } from '../utils.js';

export class Auth {
  constructor(removeTimeout = 5000) {
    this.tokens = new Map();
    this.removeTimeout = removeTimeout;
  }

  exists(id) {
    return this.tokens.has(id);
  }

  /** Create auth token and store some data against it. NOTE, token is invalidated automatically after 5 seconds. */
  create(data = null) {
    let id = uuid();
    this.tokens.set(id, data);
    if (isFinite(this.removeTimeout)) setTimeout(() => this.remove(id), this.removeTimeout);
    return id;
  }

  /** Return data associated with given id, or return undefined. Invalidates token once used. */
  get(id) {
    if (!this.exists(id)) return undefined;
    let data = this.tokens.get(id);
    this.remove(id);
    return data;
  }

  remove(id) {
    this.tokens.delete(id);
  }
}

export default Auth;
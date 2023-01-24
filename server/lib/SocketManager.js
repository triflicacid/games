/** Manages a socket connection */
export class SocketManager {
  constructor(sock) {
    this.flag = 0;
    this._callbacks = {};
    this._eventPromises = {};
    this.sock = sock;
    this.sock.on("disconnect", () => this.disconnect());
    SocketManager.all.set(this.sock.id, this);
  }
  /** Get socket ID */
  get id() { return this.sock.id; }
  /** Called when socket is disconnected / called to disconnect the socket */
  disconnect() {
    SocketManager.all.delete(this.sock.id);
    this.sock.disconnect(true);
  }
  /** Emit event to server */
  emit(event, ...args) {
    // if (!(event in this._callbacks)) console.warn(`<SocketManager>: emitted event '%s' does not have a registered callback`, event);
    this.sock.emit(event, ...args);
  }
  /** Emit event, resolve when response recieved. Nothing is returned; callback should still be used. */
  emitWait(event, ...args) {
    if (this._eventPromises[event]) throw new Error(`Event '${event}' is already being awaited upon.`);
    return new Promise((res) => {
      this._eventPromises[event] = res;
    });
  }
  /** Set a callback for an event. Only one callback per event. */
  onEvent(name, cb, requiredFlag) {
    this._callbacks[name] = cb;
    this.sock.on(name, (arg) => {
      if (requiredFlag === undefined || (this.flag & requiredFlag) === requiredFlag) {
        if (this._callbacks[name]) {
          this._callbacks[name](arg);
        }
        if (this._eventPromises[name]) {
          this._eventPromises[name](arg);
          delete this._eventPromises[name];
        }
      }
    });
  }
  /** Invoke event unto oneself (NB only awaits if this._callbacks[name] returns Promise. */
  async invokeEvent(name, arg) {
    if (this._callbacks[name])
      await this._callbacks[name](arg);
  }
  /** Is an event registered in this name? */
  hasEvent(ev) {
    return ev in this._callbacks;
  }
  /** Log message to console */
  log(...args) {
    console.log(`<${this.sock.id}>`, ...args);
  }
}
/** Map sock IDs to their class */
SocketManager.all = new Map();

export default SocketManager;
/** Manages a socket connection */
export class SocketManager {
  constructor(sock) {
    this.flag = 0;
    this._callbacks = {};
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
  /** Set a callback for an event. Only one callback per event. */
  onEvent(name, cb, requiredFlag) {
    this._callbacks[name] = cb;
    this.sock.on(name, (arg) => {
      if (this._callbacks[name]) {
        if (requiredFlag === undefined || (this.flag & requiredFlag) === requiredFlag)
          this._callbacks[name](arg);
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
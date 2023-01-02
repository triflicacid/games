import sqlite3 from 'sqlite3';
sqlite3.verbose();

export class SQLiteDatabase {
  /** Constructor opens the database at file */
  constructor(path) {
    this._path = path;
    this._isOpen = false; // Is a connection established and open?
    this._db = undefined; // SQLite Database
  }

  /** Get database path */
  get path() { return this._path; }

  /** Are we connected to the database? */
  isOpen() { return this._isOpen; }

  /** Open connection to database */
  async open() {
    if (!this._isOpen) {
      try {
        this._db = await open(this._path);
        this._isOpen = true;
      } catch (e) {
        return this._error(e);
      }
    }
  }

  /** Run a query */
  async run(query, params = []) {
    if (this._isOpen) {
      try {
        return await run(this._db, query, params);
      } catch (e) {
        return this._error(e);
      }
    } else {
      return this._error(new SQLiteDatabaseError('running (class)', 'Database is not open'));
    }
  }

  /** Get array of all rows back from query */
  async all(query, params = []) {
    if (this._isOpen) {
      try {
        return await all(this._db, query, params);
      } catch (e) {
        return this._error(e);
      }
    } else {
      return this._error(new SQLiteDatabaseError('read:all (class)', 'Database is not open'));
    }
  }

  /** Get first row matching query */
  async get(query, params = []) {
    if (this._isOpen) {
      try {
        return await get(this._db, query, params);
      } catch (e) {
        return this._error(e);
      }
    } else {
      return this._error(new SQLiteDatabaseError('read:get (class)', 'Database is not open'));
    }
  }

  /** Loop through each row matching query */
  async each(query, callback, params = []) {
    if (this._isOpen) {
      try {
        return await each(this._db, query, params, callback);
      } catch (e) {
        return this._error(e);
      }
    } else {
      return this._error(new SQLiteDatabaseError('read:each (class)', 'Database is not open'));
    }
  }

  /** Close database connection */
  async close() {
    if (this._isOpen) {
      await close(this._db);
      this._db = undefined;
      this._isOpen = false;
    }
  }

  /** Handle error. Throws an error; markes as ": any" for compatibility. */
  _error(e) {
    if (this.isOpen()) this.close(); // Close connection
    throw e;
  }

  /** Is this a valid string for a name/column/value ? */
  static isValidString(str) {
    return /^[A-Za-z0-9@\.]*$/.test(str);
  }
}

export class SQLiteDatabaseError extends Error {
  constructor(stage, message, sql = "") {
    let msg = `[stage ${stage}] ${message}`;
    if (sql) msg += ` [${sql}]`;
    super(msg);
    this.name = 'SQLiteDatabaseError';
  }
}

function open(path) {
  return new Promise(function (resolve, reject) {
    const db = new sqlite3.Database(path, (err) => {
      if (err) reject(new SQLiteDatabaseError('opening', err.message));
      else resolve(db);
    });
  });
}

// any query: insert/delete/update. Return inserted column ID
function run(db, query, params = undefined) {
  return new Promise(function (resolve, reject) {
    db.run(query, params || [], function (err) {
      if (err) reject(new SQLiteDatabaseError('running', err.message, query));
      else resolve(this.lastID);
    });
  });
}

// first row read
function get(db, query, params = []) {
  return new Promise(function (resolve, reject) {
    db.get(query, params, (err, row) => {
      if (err) reject(new SQLiteDatabaseError('reading: get', err.message, query));
      else resolve(row);
    });
  });
}

// set of rows read
function all(db, query, params = []) {
  return new Promise(function (resolve, reject) {
    db.all(query, params, (err, rows) => {
      if (err) reject(new SQLiteDatabaseError('reading: all', err.message, query));
      else resolve(rows);
    });
  });
}

// each row returned one by one 
function each(db, query, params, callback) {
  return new Promise(function (resolve, reject) {
    db.serialize(() => {
      let n = 0;
      db.each(query, params, (err, row) => {
        if (err) reject(new SQLiteDatabaseError('reading: each', err.message, query));
        else {
          if (row) callback(row, n);
          n++;
        }
      });
      db.get("", (err, row) => resolve(n));
    });
  });
}

function close(db) {
  return new Promise(function (resolve, reject) {
    db.close();
    resolve(true);
  });
}
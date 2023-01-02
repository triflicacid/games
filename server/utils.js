import * as crypto from 'crypto';

/**
 * Handle termination actions of a server
 * Taken from https://blog.heroku.com/best-practices-nodejs-errors (c) JULIÁN DUQUE, DECEMBER 17, 2019
 */
export function terminate(server, options) {
  if (options.coredump == undefined) options.coredump = false;
  if (options.timeout == undefined) options.timeout = 500;
  if (options.log == undefined) options.log = false;

  // Exit function
  const exit = (code) => {
    options.coredump ? process.abort() : process.exit(code);
  };

  return (code, reason) => async (err) => {
    if (options.log) console.error(`[ERROR] code ${code}: ${reason}`);
    if (err && err instanceof Error) {
      // Log error information, use a proper logging library here :)
      console.log(err.message, err.stack);
    }
    if (options.fn) await options.fn(code);

    // Attempt a graceful shutdown
    server.close(exit);
    setTimeout(exit, options.timeout).unref();
  };
}


export function uuid() {
  return crypto.randomBytes(32).toString('hex');
}
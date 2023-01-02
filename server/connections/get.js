import IndexConnection from "./index.js";
import { existsSync } from "fs";

export async function getConnection(socket, source) {
  const [top, sub] = source.split("/");
  const Constructor = await (async function () {
    if (top === "index") {
      return IndexConnection;
    } else {
      const mpath = `games/${top}/connections/${sub}.js`;
      // Check if module file exists
      if (existsSync("server/" + mpath)) {
        // try {
        const module = await import("../" + mpath);
        return module.default;
        // } catch (e) {
        //   console.log(`  Failed to connect to listener at '${source}'`);
        // }
      } else {
        console.log(`<${socket.id}> ERROR: no connection object exposed for path '${source}'`);
      }
    }
  })();
  if (Constructor) {
    return new Constructor(socket);
  }
  return null;
};

export default getConnection;
import { EVENT } from "./constants.js";
import globals from "./globals.js";

export function init() {
  // Transform this.data.events from array, to a map
  const map = new Map();
  globals.data.events.forEach(event => {
    map.set(event.id, event);
  });
  globals.data.events = map;
}

/** Start interval check (maybe) for given event. If so, populate event.int property */
export function startInterval(event) {
  if (event.type === EVENT.BUILD_SILO) {
    const delta = 1000;
    event.int = setInterval(() => {
      event.time -= delta;
      if (event.els) event.els.forEach(el => );
      // if (event.time <= 0);
    }, delta);
  }
}
import globals from "./globals.js";
import { createCountryView, popViewStack, pushViewStack } from "./sidebar.js";
import { createSVGElement } from "./utils.js";
import { extractCoords } from "/libs/util.js";

/** Setup events */
export function init() {
    // !IMPORTANT! set SVG viewBox so that it is scaled correctly.
    const bb = globals.map.querySelector("g").getBoundingClientRect();
    globals.map.setAttribute("viewBox", `${Math.floor(bb.x)} ${Math.floor(bb.y)} ${Math.ceil(bb.width)} ${Math.ceil(bb.height)}`);

    //#region Events
    const countries = globals.map.querySelectorAll('.country');
    for (const country of countries) {
        const code = country.dataset.id;
        globals.data.countries[code].el = country; // Cache the country's SVG path
        let dontPop = false;
        country.addEventListener("mouseover", () => {
            if (globals.frozen) return;
            pushViewStack(createCountryView(code));
        });
        country.addEventListener("mouseleave", () => {
            if (globals.frozen) return;
            if (dontPop) {
                dontPop = false;
            } else {
                popViewStack();
            }
        });
        country.addEventListener("click", () => {
            if (globals.frozen) return;
            dontPop = true;
        });
    }
    //#endregion

    for (const [code, { el, overlord }] of Object.entries(globals.data.countries)) {
        if (overlord) {
            el.dataset.overlord = overlord;
        }
    }

    globals.map.addEventListener("mousedown", e => {
        const handler = mousedownHandlers[mousedownHandlers.length - 1];
        if (handler) {
            const [x, y] = extractCoords(e);
            const ok = handler(x, y);
            if (ok !== false) mousedownHandlers.pop();
        }
    });
}

/** Stack of "mousedown" handlers: execute topmost first: ((x: number, y: number) => boolean)[]. Once executed, removed UNLESS returns `false` */
export const mousedownHandlers = [];

/** Get array of countries with a given overlord */
export function getAllies(overlord) {
    return Object.entries(globals.data.countries).filter(([code, data]) => data.overlord === overlord).map(([code]) => code);
}

/** Disable all countried except those provided */
export function disableCountries(except = []) {
    Object.entries(globals.data.countries).forEach(([code, data]) => {
        if (except.includes(code)) {
            data.el.classList.add("enabled");
        } else {
            data.el.classList.add("disabled");
        }
    });
}

/** Un-disable all countries */
export function undisableCountries() {
    Object.values(globals.data.countries).forEach(data => {
        data.el.classList.remove("disabled", "enabled");
    });
}

/** Create SVG element for a silo */
export function createSiloSVGElement(country, x, y) {
    return createSVGElement("circle", {
        cx: x,
        cy: y,
        "data-country": country,
        "class": "silo",
    });
}
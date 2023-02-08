import { createCountryView, popViewStack, pushViewStack } from "./sidebar.js";
import globals from "./globals.js";
import { EVENT } from "./constants.js";

/** Add events to an element wherein the country will be shown on hover */
export function showCountryOnHover(el, countryCode, openInfo = true) {
    const country = globals.map.querySelector(`.country[data-id="${countryCode}"]`);
    el.addEventListener("mouseover", () => {
        if (globals.frozen) return;
        if (country) country.classList.add("highlighted");
        if (openInfo) pushViewStack(createCountryView(countryCode));
    });
    el.addEventListener("mouseleave", () => {
        if (globals.frozen) return;
        if (openInfo) popViewStack();
        if (country) country.classList.remove("highlighted");
    });
}

/** Create a countries' flag */
export function getFlag(country) {
    const img = document.createElement("img");
    img.src = "flags/" + country + ".svg";
    img.alt = img.title = country;
    return img;
}

/** Create SVG element */
export function createSVGElement(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [attr, val] of Object.entries(attrs))
        el.setAttributeNS(null, attr, val);
    return el;
}

/** Set eventEls[id] = el, doing necessary side-actions */
export function updateEventEl(eventEls, id, el) {
    const event = globals.data.events.get(id), oldEl = eventEls[id];
    if (oldEl) {
        if (event.els) {
            const idx = event.els.indexOf(oldEl);
            if (idx !== -1) event.els.splice(idx, 1);
        }
        oldEl.insertAdjacentElement("afterend", el);
        oldEl.remove();
    }
    eventEls[id] = el;
    if (!event.els) event.els = [];
    event.els.push(el);
}

export function createEventEl(event) {
    const el = document.createElement("span");
    el.dataset.eventId = event.id;
    switch (event.type) {
        case EVENT.DUMMY:
            el.innerHTML = "<em>(Dummy)</em>";
            break;
        case EVENT.BUILD_SILO: {
            el.insertAdjacentText("beforeend", event.data.rnd + "Building silo in ");
            const flag = getFlag(event.data.country);
            flag.classList.add("flag_small");
            showCountryOnHover(flag, event.data.country, false);
            el.insertAdjacentElement("beforeend", flag);
            const time = Math.ceil(event.data.time / 1000);
            el.insertAdjacentText("beforeend", ` (${time} sec${time === 1 ? '' : 's'})`);
            break;
        }
        default:
            el.innerHTML += `<em>event.type=${event.type}</em>`;
    }
    return el;
}
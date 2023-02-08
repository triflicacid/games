import { COUNTRIES, EVENT } from "./constants.js";
import globals from "./globals.js";
import { disableCountries, getAllies, undisableCountries } from "./map.js";
import { createEventEl, getFlag, updateEventEl } from "./utils.js";

export function init() {
    // Populate the base view
    const base = document.createElement("div");
    base.classList.add("basic-view");
    base.insertAdjacentHTML("beforeend", "<h2>Welcome to MAD: Missile Destruction</h2>");

    const btnLeave = document.createElement("button");
    btnLeave.innerText = "Leave";
    btnLeave.addEventListener("click", () => {
        if (globals.frozen) return;
        globals.socket.emit("leave");
    });
    base.appendChild(btnLeave);

    let div = document.createElement("div");
    base.appendChild(div);
    div.insertAdjacentHTML("beforeend", `<span>Game Name: ${globals.data.name}</span>`);
    if (globals.data.isP1) {
        div.insertAdjacentHTML("beforeend", `<span>Game ID: <small>${globals.data.id}</small></span>`);
        div.insertAdjacentHTML("beforeend", `<span>Username: ${globals.data.username}</span>`);
    }

    // base.insertAdjacentHTML("beforeend", `<p class="whoami">You are ${COUNTRIES[globals.me.region].name} <img src="flags/${globals.me.region}.svg" /></p>`);
    base.insertAdjacentHTML("beforeend", `<p>You are <strong>${COUNTRIES[globals.me.region].name}</strong> (${globals.me.region})</p>`);
    const flag = getFlag(globals.me.region);
    flag.classList.add("home-flag");
    base.insertAdjacentElement("beforeend", flag);
    flag.addEventListener("click", () => {
        pushViewStack(createCountryView(globals.me.region));
    });

    // Show money
    let span = document.createElement("span");
    base.appendChild(span);
    span.insertAdjacentText("beforeend", "Money: USD $");
    const money = document.createElement("span");
    span.appendChild(money);

    span = document.createElement("span");
    base.appendChild(span);
    span.insertAdjacentText("beforeend", "Income: USD $");
    const income = document.createElement("span");
    span.appendChild(income);

    // Allies
    const count = Object.entries(globals.data.countries).filter(([_, { overlord }]) => overlord === globals.me.region).length;
    base.insertAdjacentHTML("beforeend", `<p>You have ${count} ${count === 1 ? 'ally' : 'allies'}${count === 0 ? '.' : ':'}</p>`);
    base.appendChild(createAllyList(globals.me.region));

    // Events
    const eventEls = {};
    base.insertAdjacentHTML("beforeend", `<p>Events</p>`);
    const events = document.createElement("div");
    events.classList.add("event-list");
    for (const [id, event] of globals.data.events.entries()) {
        const el = createEventEl(event);
        updateEventEl(eventEls, id, el);
        events.appendChild(el);
    }
    base.insertAdjacentElement("beforeend", events);

    viewStack.push({
        content: base,
        els: {
            money,
            income,
        },
        eventEls,
        type: VIEW.BASE,
    });
    update();
}

/** Update the sidebar view */
export function update() {
    // Clear
    while (globals.sidebar.firstElementChild) globals.sidebar.firstElementChild.remove();
    // Push latest
    const view = viewStack[viewStack.length - 1];
    console.log(view.eventEls)
    // updateView(view);
    refreshView();
    view.content.classList.add("sidebar-content");

    const div = document.createElement('div');
    div.classList.add("sidebar-content-wrapper");

    const nav = document.createElement('div');
    nav.classList.add("sidebar-nav");
    if (viewStack.length > 1) { // Button to pop topmost card
        const back = document.createElement('button');
        back.innerHTML = "&larr;";
        back.addEventListener("click", () => {
            if (globals.frozen) return;
            popViewStack();
        });
        nav.appendChild(back);
    }
    div.appendChild(nav);

    div.appendChild(view.content);
    globals.sidebar.appendChild(div);
}

//#region Manipulate Stack
// Stack of views
const viewStack = []; // { content: HTMLDivElement, els: { [name: string]: HTMLElement }, eventEls: { [eventId: string]: HTMLElement }, type: enum VIEW }[]

/** Enum of view types */
export const VIEW = Object.freeze({
    BASE: 0,
    COUNTRY: 1,
});

/** Push new view to stack */
export function pushViewStack(view) {
    viewStack.push(view);
    update();
}

/** Pop view from stack */
export function popViewStack() {
    if (viewStack.length === 1) return undefined;
    const view = viewStack.pop();
    // Remove event element hooks
    for (const [id, el] of Object.entries(view.eventEls)) {
        el.remove();
        const event = globals.data.events.get(id);
        if (event && event.els) {
            const idx = event.els.indexOf(el);
            event.els.splice(idx, 1);
        }
    }
    // Update the sidebar
    update();
    return view;
}

/** Peek view stack */
export function peekViewStack() {
    return viewStack[viewStack.length - 1];
}

/** Remove view from stack */
export function removeViewStack(view) {
    const i = viewStack.indexOf(view);
    if (i === -1) return false;
    viewStack.splice(i, 1);
    update();
    return true;
}

/** Refresh the given view */
export function refreshView() {
    const view = viewStack[viewStack.length - 1];
    // Reset event el hooks
    if (view.eventEls) for (let id in view.eventEls) {
        const el = createEventEl(globals.data.events.get(id));
        updateEventEl(view.eventEls, id, el);
    }
    // Update
    updateView(view);
}
//#endregion

/** Update a given view */
function updateView(view) {
    if (view.type === VIEW.BASE) {
        view.els.money.innerText = globals.me.money.toLocaleString("en-GB");
        view.els.income.innerText = globals.me.income.toLocaleString("en-GB");
    } else if (view.type === VIEW.COUNTRY) {
        if (view.els.cost) {
            const cost = globals.data.countries[view.code].cost;
            view.els.cost.innerText = cost === undefined ? "?" : cost.toLocaleString("en-GB");
        }
        if (view.els.siloCost) {
            const cost = globals.data.countries[view.code].siloCost;
            view.els.siloCost.innerText = cost === undefined ? "?" : cost.toLocaleString("en-GB");
        }
    }
}

/** Create and return a list of allies */
function createAllyList(overlord) {
    const list = document.createElement("span");
    list.classList.add("ally-list");
    const allies = getAllies(overlord).sort((a, b) => COUNTRIES[a].name.localeCompare(COUNTRIES[b].name)).map(code => {
        const data = globals.data.countries[code];
        let span = document.createElement("span");
        const flag = getFlag(code);
        flag.classList.add("flag_small");
        flag.addEventListener("mouseover", () => {
            if (globals.frozen) return;
            data.el.classList.add("highlighted");
        });
        flag.addEventListener("mouseleave", () => {
            if (globals.frozen) return;
            data.el.classList.remove("highlighted");
        });
        flag.addEventListener("click", () => {
            if (globals.frozen) return;
            data.el.classList.remove("highlighted");
            pushViewStack(createCountryView(code));
        });
        span.appendChild(flag);
        return span;
    });
    allies.forEach(el => {
        list.appendChild(el);
    });
    return list;
}

//#region Create Views
/** Create view: country information */
export function createCountryView(code) {
    code = code.toUpperCase();
    const data = COUNTRIES[code];
    const card = document.createElement("div");
    const els = {}, eventEls = {};
    card.dataset.id = code;
    card.classList.add("country-card");

    // Flag
    const img = document.createElement("img");
    img.src = "flags/" + code + ".svg";
    img.classList.add("country-flag");
    card.appendChild(img);

    // Name
    let span = document.createElement("span");
    span.classList.add("country-name");
    span.innerText = data.name;
    card.appendChild(span);

    // Country Code
    span = document.createElement("span");
    span.classList.add("country-code");
    span.innerText = data.code;
    card.appendChild(span);

    // State
    span = document.createElement("span");
    span.classList.add("country-rel");
    span.innerHTML = (function () {
        if (code === globals.me.region)
            return `<span class="status-good">Home State</span>`;
        if (code === globals.enemy.region)
            return `<span class="status-bad">Enemy State</span>`;
        const overlord = globals.data.countries[code].overlord;
        if (overlord === globals.me.region)
            return `<span class="status-good">Ally</span>`;
        if (overlord === globals.enemy.region)
            return `<span class="status-bad">Enemy Ally</span>`;
        return `<span class="status-neutral">Neutral</span>`;
    })();
    card.appendChild(span);

    // Health
    span = document.createElement("span");
    span.classList.add("country-health");
    const meter = document.createElement("meter");
    meter.min = 0;
    meter.low = 50;
    meter.optimum = 75;
    meter.high = 100;
    meter.max = 100;
    meter.value = globals.data.countries[code].health;
    span.appendChild(meter);
    card.appendChild(span);

    const stats = document.createElement("div");
    stats.classList.add("country-stats");
    card.appendChild(stats);

    // Population
    span = document.createElement("span");
    span.classList.add("country-population");
    span.innerHTML = "Population: " + data.population.toLocaleString("en-GB") + " (" + data.density.toLocaleString("en-GB") + "/km<sup>2</sup>)";
    stats.appendChild(span);

    // Area
    span = document.createElement("span");
    span.classList.add("country-area");
    span.innerHTML = "Area: " + data.area.toLocaleString("en-GB") + " km<sup>2</sup>";
    stats.appendChild(span);

    // GDP
    span = document.createElement("span");
    span.classList.add("country-gdp");
    span.innerText = "GDP: USD $" + data.gdp.toLocaleString("en-GB");
    stats.appendChild(span);

    // Allyship ("Orientation")
    if (code !== globals.me.region && code !== globals.enemy.region) {
        card.insertAdjacentHTML("beforeend", "<span><strong>Orientation</strong></span>");
        let div = document.createElement("div");
        div.classList.add("orientation");
        const overlord = globals.data.countries[code].overlord;
        if (overlord === globals.me.region) { // Sever ally?
            div.insertAdjacentHTML("beforeend", `<p class="status-good">Ally</p>`);
            // Sever ally?
            let span = document.createElement("span");
            const btnSever = els.severAlly = document.createElement("button");
            btnSever.innerText = "Sever Ally";
            btnSever.addEventListener("click", () => {
                if (globals.frozen) return;
                globals.socket.emit("sever-ally", code);
            });
            span.appendChild(btnSever);
            div.appendChild(span);
        } else if (overlord === globals.enemy.region) {
            div.insertAdjacentHTML("beforeend", `<p class="status-bad">Enemy Ally</p>`);
        } else { // Make ally?
            div.insertAdjacentHTML("beforeend", `<span class="status-neutral">Neutral</span>`);
            // Cost
            let span = document.createElement("span");
            span.innerText = "Cost: USD $";
            const cost = els.cost = document.createElement("span");
            span.appendChild(cost);
            // Ask server for cost; element will be updated later.
            globals.socket.emit("calc-ally-cost", code);
            div.appendChild(span);
            // Make ally?
            span = document.createElement("span");
            const btnForm = els.formAlly = document.createElement("button");
            btnForm.innerText = "Form Ally";
            btnForm.addEventListener("click", () => {
                if (globals.frozen) return;
                globals.socket.emit("form-ally", code);
            });
            span.appendChild(btnForm);
            div.appendChild(span);
        }
        card.appendChild(div);
    }

    // Allies?
    if (code === globals.me.region || code === globals.enemy.region) {
        card.insertAdjacentHTML("beforeend", "<span><strong>Allies</strong></span>");
        card.insertAdjacentElement("beforeend", createAllyList(code));
    }

    // Silos
    if (code === globals.me.region || globals.data.countries[code].overlord === globals.me.region) {
        card.insertAdjacentHTML("beforeend", "<span><strong>Silos</strong></span>");
        // Silo count
        const count = globals.data.countries[code].silos ? globals.data.countries[code].silos.length : 0;
        card.insertAdjacentHTML("beforeend", `<span>This country has ${count.toLocaleString('en-GB')} silo${count === 1 ? '' : 's'}</span>`);
        // Build cost
        let span = document.createElement("span");
        card.appendChild(span);
        span.insertAdjacentText("beforeend", "Silo Cost: $");
        span.appendChild(els.siloCost = document.createElement("span"));
        globals.socket.emit("calc-silo-cost", code);
        // Build new silo
        span = document.createElement("span");
        card.appendChild(span);
        const btnBuild = document.createElement("button");
        let buildingSilo = false;
        btnBuild.innerText = "Build Silo";
        btnBuild.addEventListener("click", () => {
            if (buildingSilo) { // Are we building a silo?
                buildingSilo = false;
                btnBuild.innerText = "Build Silo";
                globals.setFrozen(false);
                globals.map.classList.remove("crosshair");
                btnBuild.classList.remove("freeze-resistant");
                undisableCountries();
            } else {
                /** Handle click on a friendly country */
                const handleClick = (event, code) => {
                    const bb = globals.map.getBoundingClientRect();
                    const x = Math.round(event.clientX - bb.left), y = Math.round(event.clientY - bb.top);
                    console.log(`Clicked on ${code} at (${x},${y})`);
                    globals.socket.emit("build-silo", { code, x, y });

                    // Remove event listeners
                    Object.entries(handlers).forEach(([code, f]) => {
                        globals.data.countries[code].el.removeEventListener("click", f);
                    });
                    btnBuild.click(); // "Cancel"
                };

                buildingSilo = true;
                btnBuild.innerText = "Cancel";
                btnBuild.classList.add("freeze-resistant");
                globals.setFrozen(true);
                globals.map.classList.add("crosshair");
                // Disable all countries EXCEPT those we are allies with (and us)
                const friends = getAllies(globals.data.countries[code].overlord || globals.me.region);
                friends.unshift(globals.me.region);
                disableCountries(friends);
                // Add listeners
                const handlers = {};
                friends.forEach(friend => {
                    const country = globals.data.countries[friend];
                    handlers[friend] = event => handleClick(event, friend);
                    country.el.addEventListener("click", handlers[friend]);
                });
            }
        });
        span.appendChild(btnBuild);

        const events = Array.from(globals.data.events.values()).filter(({ type }) => type === EVENT.BUILD_SILO);
        if (events.length > 0) {
            const div = document.createElement("div");
            div.classList.add("event-list");
            events.forEach(event => {
                const el = createEventEl(event);
                updateEventEl(eventEls, event.id, el);
                div.appendChild(el);
            });
            card.appendChild(div);
        }
    }

    return { content: card, els, eventEls, type: VIEW.COUNTRY, code, };
}
//#endregion
const globals = {
    frozen: false, // Freeze events (e.g. hover country)
    setFrozen(bool) {
        if (bool) {
            this.frozen = true;
            document.body.classList.add("frozen");
        } else {
            this.frozen = false;
            document.body.classList.remove("frozen");
        }
    },

    socket: undefined, // Socket
    data: undefined, // Data
    titlebar: undefined, // Header element
    map: undefined, // Map SVG element
    sidebar: undefined, // Sidebar element
    me: undefined, // Reference to either data.player1 or data.player2
    enemy: undefined, // Reference to either data.player1 or data.player2
};

globalThis.globals = globals;

export default globals;
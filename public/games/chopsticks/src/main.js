function createGame() {
    let n = +prompt("Enter number of players", 2);
    if (n < 2 || isNaN(n)) return void alert("Invalid player count");
    return new Game(n);
}

function onUpdate(x, game) {
    if (x.type === "error") {
        console.log("%c" + x.msg, "color:crimson;font-weight:bold;");
    } else if (x.type === "transfer") {
        if (x.to !== undefined) {
            console.log(`Transfer ${x.amount} chopstick(s) from ${game.getPlayerName(x.from)} to ${game.getPlayerName(x.to)}`);
        } else {
            console.log(`Player ${game.getPlayerName(game.getGo())} transferred ${x.amount} chopstick(s) between hands`);
        }
    } else {
        console.log(x);
    }
}

function main() {
    // Header container
    let div = document.createElement("div");
    div.classList.add("centre");
    document.body.appendChild(div);
    div.insertAdjacentHTML("beforeend", "<h1>Chopsticks</h1>");
    const btnNew = document.createElement("button");
    btnNew.innerText = "New Game";
    btnNew.addEventListener("click", () => {
        container.innerHTML = "";
        const game = createGame();
        if (game) {
            game.display(container);
            window.game = game;
        }
    });
    div.appendChild(btnNew);

    // Game container
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.insertAdjacentHTML("beforebegin", "<br>");

    // == LIVE ==
    //btnNew.click();
}

window.addEventListener("load", main);
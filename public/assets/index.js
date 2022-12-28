async function main() {
  const request = await fetch("assets/games.json");
  let games = await request.json();
  games = Object.fromEntries(Object.entries(games).sort(([, a], [, b]) => a.name.localeCompare(b.name, "en-GB"))); // Sort alphabetically by name

  const elGameList = document.getElementById("game-list");

  for (const name in games) {
    const game = games[name], singleplayer = game.singleplayer ?? true;
    const div = document.createElement("div");
    div.dataset.singleplayer = singleplayer;
    div.addEventListener("click", () => {
      if (game.external) {
        window.open(game.external); // External link
      } else {
        window.open(`games/${name}/${game.target || ""}`);
      }
    });
    div.insertAdjacentHTML("beforeend", `<span class='icon'><img src='games/${name}/icon.png' /></span>`);
    div.insertAdjacentHTML("beforeend", `<span class='name'>${game.name}${game.external ? '<img src=\'/assets/external.png\' />' : ''}</span>`);
    let span = document.createElement("span");
    span.classList.add("help");
    div.appendChild(span);
    const help = document.createElement("span");
    span.appendChild(help);
    help.addEventListener("click", e => {
      window.open(`help/${name}`);
      e.stopPropagation();
    });
    help.innerHTML = "&#x1F6C8; Help";

    elGameList.appendChild(div);
  }
}

window.addEventListener("load", main);
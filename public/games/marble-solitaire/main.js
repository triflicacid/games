var game;

// Calculate number of cells in a board given a WIDTH and HEIGHT
function calcCellCount(width, height) {
	return 4 * width * height + width * width;
}

// Create a new game. Provide the WIDTH and HEIGHT of the topmost segment of the cross "+"
function createGame(width, height) {
	const count = calcCellCount(width, height); // Number of cells
	const cells = Array.from({ length: count }).fill(true); // create grid and fill with marbles (true)
	const mid = width * height + Math.floor(width / 2) * (2 * height + width) + height + Math.floor(width / 2);
	cells[mid] = false; // clear centre cell (false)
	return { width, height, mid, cells };
}

// Create game from <game>.toString() string
function createGameFromString(string) {
	let [width, height, cells] = string.trim().split(",");
	cells = cells.split("").map(x => !!+x);
	width = +width;
	height = +height;
	let count = calcCellCount(width, height);
	if (cells.length !== count) return;
	return { width, height, cells };
}

// Load game - prepare for rendering, etc...
function loadGame(game, div) {
	const WIDTH = game.width, HEIGHT = game.height, CELLS = game.cells, MAXW = 2 * HEIGHT + WIDTH;
	let selected = null; // Cell that was clicked on
	const ELS = []; // Array of elements, indexes correspond to CELLS
	game.history = []; // History of moves

	div.innerHTML = "";
	const rowCellCount = [], rows = Array.from({ length: 2 * HEIGHT + WIDTH }, (_, j) => {
		const row = document.createElement("div");
		div.appendChild(row);
		rowCellCount[j] = j < game.height || j >= game.height + game.width ? game.width : MAXW;
		return row;
	});

	// Create a cell and append it to the given row
	function createCell(row, idx) {
		const span = document.createElement("span");
		if (idx >= 0) {
			ELS[idx] = span;
			span.classList.add("cell");
			span.dataset.idx = idx;
			if (CELLS[idx]) span.classList.add("marble");
			addEvents(span);
		}
		rows[row].appendChild(span);
		return span;
	}

	// Draw a stub
	function drawStub(rowStart, indexStart) {
		let r = rowStart, i = indexStart;
		for (let j = 0; j < HEIGHT; j++, r++) {
			for (let x = 0; x < HEIGHT; x++) createCell(r, -1);
			for (let x = 0; x < WIDTH; x++, i++) createCell(r, i);
			for (let x = 0; x < HEIGHT; x++) createCell(r, -1);
		}
		return [r, i]
	}

	// Add/remove marble from a cell
	function setMarble(idx, isMarble) {
		CELLS[idx] = isMarble;
		isMarble ? ELS[idx].classList.add("marble") : ELS[idx].classList.remove("marble");
	}

	// Add events to a cell
	function addEvents(cell) {
		cell.addEventListener("click", ev => {
			if (selected) {
				if (!cell.classList.contains("marble")) {
					let ok = move(+selected.dataset.idx, +cell.dataset.idx);
					if (ok) {
						recordMove(+selected.dataset.idx, +cell.dataset.idx);
						if (checkWon()) messageGameover();
					}
				}
				selected.classList.remove("selected");
				selected = null;
			} else {
				if (cell.classList.contains("marble")) {
					// If cell is unselected and contains a marble, select it
					cell.classList.add("selected");
					selected = cell;
				}
			}
		});
	}

	// Given an index, return the [x, y] co-ordinates
	function coordsFromIdx(idx) {
		for (let r = 0, i = 0; r < rows.length; r++) {
			let pad = (MAXW - rowCellCount[r]) / 2;
			if (idx === i) return [pad, r];
			if (idx < i + rowCellCount[r]) return [pad + idx - i, r];
			i += rowCellCount[r];
		}
	}

	// Given [x, y] coordinates, return linear index
	function idxFromCoords(x, y) {
		if (y < 0 || y > rows.length || ((y < game.height || y >= game.height + game.width) && (x < game.height || x >= game.height + game.width))) return -1;
		let idx = 0;
		for (let j = 0; j < y; j++) idx += rowCellCount[j];
		return idx + x - (MAXW - rowCellCount[y]) / 2;
	}

	// Move from one cell to another. Return if success.
	function move(iFrom, iTo) {
		if (!CELLS[iFrom] || CELLS[iTo] !== false) return false;
		const cFrom = coordsFromIdx(iFrom), cTo = coordsFromIdx(iTo);

		// WEST to EAST
		if (cFrom[1] === cTo[1] && iFrom + 2 === iTo && CELLS[iFrom + 1]) {
			setMarble(iFrom, false);
			setMarble(iFrom + 1, false);
			setMarble(iTo, true);
			return true;
		}

		// EAST to WEST
		if (cFrom[1] === cTo[1] && iFrom - 2 === iTo && CELLS[iFrom - 1]) {
			setMarble(iFrom, false);
			setMarble(iFrom - 1, false);
			setMarble(iTo, true);
			return true;
		}

		// NORTH to SOUTH
		if (cFrom[1] + 2 === cTo[1] && cFrom[0] === cTo[0]) {
			const iMid = idxFromCoords(cFrom[0], cFrom[1] + 1);
			if (CELLS[iMid]) {
				setMarble(iFrom, false);
				setMarble(iMid, false);
				setMarble(iTo, true);
				return true;
			}
			return false;
		}

		// SOUTH to NORTH
		if (cFrom[1] - 2 === cTo[1] && cFrom[0] === cTo[0]) {
			const iMid = idxFromCoords(cFrom[0], cFrom[1] - 1);
			if (CELLS[iMid]) {
				setMarble(iFrom, false);
				setMarble(iMid, false);
				setMarble(iTo, true);
				return true;
			}
			return false;
		}

		return false;
	}
	game.move = move;

	// Undo a move - reverse-move. Return if success.
	function undoMove(iFrom, iTo) {
		if (!CELLS[iFrom] || CELLS[iTo] !== false) return false;
		const cFrom = coordsFromIdx(iFrom), cTo = coordsFromIdx(iTo);

		// WEST to EAST
		if (cFrom[1] === cTo[1] && iFrom + 2 === iTo && CELLS[iFrom + 1] === false) {
			setMarble(iFrom, false);
			setMarble(iFrom + 1, true);
			setMarble(iTo, true);
			ok = true;
		}

		// EAST to WEST
		if (cFrom[1] === cTo[1] && iFrom - 2 === iTo && CELLS[iFrom - 1] === false) {
			setMarble(iFrom, false);
			setMarble(iFrom - 1, true);
			setMarble(iTo, true);
			ok = true;
		}

		// NORTH to SOUTH
		if (cFrom[1] + 2 === cTo[1] && cFrom[0] === cTo[0]) {
			const iMid = idxFromCoords(cFrom[0], cFrom[1] + 1);
			if (CELLS[iMid] === false) {
				setMarble(iFrom, false);
				setMarble(iMid, true);
				setMarble(iTo, true);
				return true;
			}
			return false;
		}

		// SOUTH to NORTH
		if (cFrom[1] - 2 === cTo[1] && cFrom[0] === cTo[0]) {
			const iMid = idxFromCoords(cFrom[0], cFrom[1] - 1);
			if (CELLS[iMid] === false) {
				setMarble(iFrom, false);
				setMarble(iMid, true);
				setMarble(iTo, true);
				return true;
			}
			return false;
		}

		return false;
	}
	game.undoMove = undoMove;

	function draw() {
		let r = 0, i = 0;
		([r, i] = drawStub(r, i));
		for (let j = 0; j < WIDTH; j++, r++) {
			for (let x = 0; x < 2 * HEIGHT + WIDTH; x++, i++) {
				createCell(r, i);
			}
		}
		([r, i] = drawStub(r, i));
	}
	game.draw = draw;

	// Same as idxFromCoords, but caches the result
	const cacheIdxFromCoords = (function() {
		const cache = {};
		return function(x, y) {
			let str = x + "," + y;
			return str in cache ? cache[str] : (cache[str] = idxFromCoords(x, y));
		};
	})();

	// Return array of all possible moves in the provided game: [from: number, to: number][]
	function getMoves() {
		const moves = [], rows = 2 * game.height + game.width;
		for (let y = 0, i = 0; y < rows; y++) {
			let xu, xlim;
			if (y >= game.height && y < game.height + game.width) { // In the body
				xu = 0;
				xlim = 2 * game.height + game.width;
			} else { // In NORTH or SOUTH stubs
				xu = game.height;
				xlim = game.height + game.width;
			}

			for (let x = xu; x < xlim; x++, i++) {
				// move WEST to EAST
				if (x < xlim - 2 && game.cells[i] && game.cells[i + 1] && game.cells[i + 2] === false) moves.push([i, i + 2]);
				// move EAST to WEST
				if (x > xu + 2 && game.cells[i] && game.cells[i - 1] && game.cells[i - 2] === false) moves.push([i, i - 2]);
				// move NORTH to SOUTH
				if (game.cells[i] && y < rows - 2) {
					//let ia = idxFromCoords(x, y + 1), ib = idxFromCoords(x, y + 2);
					let ia = cacheIdxFromCoords(x, y + 1), ib = cacheIdxFromCoords(x, y + 2);
					if (game.cells[ia] && game.cells[ib] === false) moves.push([i, ib]); 
				}
				// move SOUTH to NORTH
				if (game.cells[i] && y > 1) {
					//let ia = idxFromCoords(x, y - 1), ib = idxFromCoords(x, y - 2);
					let ia = cacheIdxFromCoords(x, y - 1), ib = cacheIdxFromCoords(x, y - 2);
					if (game.cells[ia] && game.cells[ib] === false) moves.push([i, ib]); 
				}
			}
		}
		return moves;
	}
	game.getMoves = getMoves;

	/** Check if the current game is won - only one marble remains, in the centre of the board */
	function checkWon() {
		let marbles = game.cells.filter(b => b).length;
		return marbles === 1 && game.cells[game.mid];
	}
	game.checkWon = checkWon;

	/** Return a string representation of this game */
	function toString() {
		return game.width + "," + game.height + "," + game.cells.map(b => +b).join("");
	}
	game.toString = toString;

	return game;
}

function appendMessage(text) {
	divText.insertAdjacentHTML("beforeend", text);
}

/** Record a move */
function recordMove(iFrom, iTo) {
	game.history.push([iFrom, iTo]);
	let p = document.createElement("p");
	p.insertAdjacentHTML("beforeend", `<span>Move ${iFrom} &rarr; ${iTo}</span>&nbsp;`);
	let btn = document.createElement("button");
	p.appendChild(btn);
	btn.innerText = "Undo";
	btn.addEventListener("click", function() {
		game.undoMove(iTo, iFrom);
		p.remove();
	});
	divText.appendChild(p);
}

/** Create message for GAMEOVER state */
function messageGameover() {
	let p = document.createElement("p");
	p.insertAdjacentHTML("beforeend", `<span>Gameover. You won!</span>&nbsp;`);
	let btn = document.createElement("button");
	p.appendChild(btn);
	btn.innerText = "Reset";
	btn.addEventListener("click", function() {
		game = createGame(game.width, game.height);
		loadGame(game, divGame);
		game.draw();
		divText.innerHTML = "";
		appendMessage(`<em>Reset game.</em><br>`);
	});
	divText.appendChild(p);
}

const div = document.createElement("div");
document.body.appendChild(div);
div.insertAdjacentHTML("beforeend", "<h1>Marble Solitaire</h1>");

const divButtons = document.createElement("div");
div.appendChild(divButtons);
const btnNew = document.createElement("button");
divButtons.appendChild(btnNew);
btnNew.innerText = "New Game";
btnNew.addEventListener("click", function() {
	game = createGame(3, 2);
	loadGame(game, divGame);
	game.draw();
	appendMessage(`<hr><em>Created new game.</em><br>`);
});
const btnNewCustom = document.createElement("button");
divButtons.appendChild(btnNewCustom);
btnNewCustom.innerText = "New Custom Game";
btnNewCustom.addEventListener("click", function() {
	let input = prompt("Enter the width and height of the topmost sector:", "3,2");
	if (!input) return;
	let [width, height] = input.split(",").map(x => +x.trim());
	game = createGame(width, height);
	loadGame(game, divGame);
	game.draw();
	divText.innerHTML = "";
	appendMessage(`<em>Created new custom game.</em><br>`);
});
divButtons.insertAdjacentHTML("beforeend", " | ");
const btnGetMoves = document.createElement("button");
divButtons.appendChild(btnGetMoves);
btnGetMoves.innerText = "Get Moves";
btnGetMoves.addEventListener("click", function() {
	if (!game) return;
	const moves = game.getMoves();
	appendMessage(`Found <strong>${moves.length}</strong> possible move(s):`);
	for (let [a, b] of moves) {
		let p = document.createElement("p");
		divText.appendChild(p);
		p.insertAdjacentHTML("beforeend", `<span>${a} &rarr; ${b}</span>&nbsp;`);
		let btn = document.createElement("button");
		btn.innerText = "Perform";
		btn.addEventListener("click", () => {
			if (game.move(a, b)) recordMove(a, b);
			btn.disabled = true;
		});
		p.appendChild(btn);
	}
});
const btnRandomMove = document.createElement("button");
btnRandomMove.innerText = "Random Move";
btnRandomMove.addEventListener("click", function() {
	if (!game) return;
	const moves = game.getMoves();
	if (moves.length > 0) {
		const move = moves[Math.floor(Math.random() * moves.length)];
		if (game.move(...move)) recordMove(...move);
	} else {
		appendMessage("<p><strong>&#x26A0;</strong> No available moves</p>");
	}
});
divButtons.appendChild(btnRandomMove);
divButtons.insertAdjacentHTML("beforeend", " | ");
const btnExport = document.createElement("button");
divButtons.appendChild(btnExport);
btnExport.innerText = "Export";
btnExport.addEventListener("click", function() {
	prompt("Exported game:", game.toString());
});
const btnImport = document.createElement("button");
divButtons.appendChild(btnImport);
btnImport.innerText = "Import";
btnImport.addEventListener("click", function() {
	let input = prompt("Enter game string below:");
	if (!input) return;
	let nGame = createGameFromString(input);
	if (nGame) {
		game = nGame;
		loadGame(game, divGame);
		game.draw();
		divText.innerHTML = "";
		appendMessage(`<em>Imported a new game.</em><br>`);
	} else {
		alert("Invalid game string.");
	}
});

const divGame = document.createElement("div");
divGame.classList.add("game");
div.appendChild(divGame);

const divTextOut = document.createElement("div");
div.appendChild(divTextOut);
const btnClear = document.createElement("button");
btnClear.innerText = "Clear";
btnClear.addEventListener("click", () => divText.innerHTML = "");
divTextOut.appendChild(btnClear);
const divText = document.createElement("div");
divTextOut.appendChild(divText);
divText.classList.add("message");

divText.insertAdjacentHTML("beforeend", '<span><em><a href="https://www.flaticon.com/free-icons/marbles" target="_blank">Marbles icons created by Freepik - Flaticon</a></em></span><br>');

// == TESTING CODE ==
btnNew.click();
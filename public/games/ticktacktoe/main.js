var origBoard; // Keep track of board
const huPlayer = "0";
const aiPlayer = "X";
var isAI = false;
var one = true; //Players go
let gameWon = null;
const winCombos = [
	[0, 1, 2], // Across the top
	[3, 4, 5], // Across the middel
	[6, 7, 8], // Accross the bottom
	[0, 3, 6], // Diagnal right-down
	[1, 4, 7], // Left down
	[2, 5, 8], // Center down
	[0, 4, 8], // RIght down
	[6, 4, 2] // Diagonal left-up
];

var cells, htmlText;

function startGame() {
	gameWon = null;
	one = true;
	outputWhoseGo();
	origBoard = Array.from({ length: 9 }, (_, i) => i);
	for (let i = 0; i < cells.length; i++) {
		cells[i].innerText = '';
		cells[i].style.removeProperty("background-color");
		cells[i].addEventListener("click", turnClick);
	}
}

/** Output whose go it is */
function outputWhoseGo() {
	const color = one ? "blue" : "red", name = one ? "One" : "Two";
	htmlText.innerHTML = `<em style='color: ${color}'>It is Player ${name}'s Go</em>`;
}

function turnClick(square) {
	if (typeof origBoard[square.target.id] == "number") {
		// square.target.id -> ID of clicked element
		if (one) {
			turn(+square.target.id, huPlayer);
			one = false;
		} else {
			turn(+square.target.id, aiPlayer);
			one = true;
		}
		if (!gameWon) {
			outputWhoseGo();
			let tie = checkTie();
			// AI?
			if (isAI && !tie && !one) {
				turn(bestSpot(), aiPlayer);
				if (!gameWon) checkTie();
				one = true;
			}
		}
	}
}

function turn(squareId, player) {
	if (squareId !== undefined) {
		// Log on board an "X" or "0";
		origBoard[squareId] = player;
		// Show an "0" or "X" in the square clicked (use the ID)
		document.getElementById(squareId).innerText = player;
	}
	gameWon = checkWin(origBoard, player);
	if (gameWon) {
		gameOver(gameWon);
	}
}

function checkWin(board, player) {
	// Go though every board elemennt
	// a => accumulator (value get back at end)
	// e => element of array
	// i => index
	let plays = board.reduce((a, e, i) =>
		(e === player) ? a.concat(i) : a, []
	);
	let gameWon = null;
	// Loop through every win combo and check it against the entries in the current board
	for (let [index, win] of winCombos.entries()) {
		if (win.every(elem => plays.indexOf(elem) > -1)) {
			// Cycle through every element in the win. check if the player has played in all the spots where there could be a win
			gameWon = { index: index, player: player };
			// ^^ which combo the player won at
			break;
		}
	}
	return gameWon;
}

function gameOver(gameWon) {
	// Highlight squares that are part of winning combo
	for (let index of winCombos[gameWon.index]) {
		// Go through every index of win combo
		document.getElementById(index).style.backgroundColor = gameWon.player == huPlayer ? "blue" : "red";
	}

	for (var i = 0; i < cells.length; i++) {
		cells[i].removeEventListener("click", turnClick);
	}
	displayWinner();
}

function displayWinner() {
	const color = one ? "blue" : "red", name = one ? "One" : "Two";
	htmlText.innerHTML = `<strong style='color: ${color}'>Player ${name} is the Winner!</strong>`;
}

function emptySquares() {
	return origBoard.filter(s => typeof s == "number");
}

function checkTie() {
	if (emptySquares().length === 0) {
		for (var i = 0; i < cells.length; i++) {
			cells[i].style.backgroundColor = "green";
			cells[i].removeEventListener("click", turnClick);
		}
		htmlText.innerHTML = `<strong style='color: green'>It's a Tie...</strong>`;
	}
	return false;
}

function bestSpot() {
	return minimax(origBoard, aiPlayer).index;
}

/*Minimax*/
function minimax(newBoard, player) {
	// Find all empty spots on th board
	var availSpots = emptySquares(newBoard);

	if (checkWin(newBoard, huPlayer)) {
		// If there is a win for the HUMAN player, return -10
		return { score: -10 };
	} else if (checkWin(newBoard, aiPlayer)) {
		// If there is a win for the AI player, return 10
		return { score: 10 };
	} else if (availSpots.length === 0) {
		// If there are no available spots, return 0
		return { score: 0 };
	}

	// Collect the scores from each of the empty spots
	var moves = [];
	for (let i = 0; i < availSpots.length; i++) {
		// Record ea\ch empry spaces INDEX and SCORE
		var move = {};
		move.index = newBoard[availSpots[i]];
		// Set empty spot to the player
		newBoard[availSpots[i]] = player;


		// If minimax does not find a tie/recursive state, it keeps going lower and lower into the game, evaluating EVERY move
		if (player === aiPlayer) {
			// Set move score for that square
			move.score = minimax(newBoard, huPlayer).score;
		} else {
			move.score = minimax(newBoard, aiPlayer).score;
		}

		// Reset new board to what it was before
		newBoard[availSpots[i]] = move.index;
		// Push move to moves array
		moves.push(move);
	}

	let bestMove, bestScore;
	if (player === aiPlayer) {
		// Chosse move with highest score when AI player
		bestScore = -1000;
		for (let i = 0; i < moves.length; i++) {
			// Only add the FIRST highest move score
			if (moves[i].score > bestScore) {
				bestScore = moves[i].score;
				bestMove = i;
			}
		}
	} else {
		// Choose move with lowest score when HUMAN player
		bestScore = 1000;
		for (let i = 0; i < moves.length; i++) {
			// Only add the FIRST lowest move score
			if (moves[i].score < bestScore) {
				bestScore = moves[i].score;
				bestMove = i;
			}
		}
	}
	return moves[bestMove];
}

function main() {
	cells = document.querySelectorAll(".cell");
	htmlText = document.getElementById("text");

	// HTML listeners
	let btn = document.getElementById("new-game");
	btn.addEventListener("click", () => {
		startGame();
	});
	let checkbox = document.getElementById("ai");
	checkbox.checked = isAI;
	checkbox.addEventListener("change", (e) => isAI = e.target.checked);

	startGame();
}

window.addEventListener("load", main);
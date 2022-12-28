/**
* Program written in game order
**/

let order = [];
let playerOrder = [];
let flash;
let turn;
let good; // Boolean
let compTurn; // Boolean
let intervalId;
let strict = false; // Whether chack mark has been checked
let noise = true;
let on = false; // Device ON or not
let win = false; // Won game or not

const turnCounter = document.getElementById("turn");
const topLeft = document.getElementById("topleft");
const topRight = document.getElementById("topright");
const bottomLeft = document.getElementById("bottomleft");
const bottomRight = document.getElementById("bottomright");
const strictButton = document.getElementById("strict");
const onButton = document.getElementById("on");
const startButton = document.getElementById("start");

strictButton.addEventListener("change", function (event) {
	if (strictButton.checked == true) { // Check if button is checked
		strict = true;
	} else {
		strict = false;
	}
}); // Listening for any event on that element

onButton.addEventListener("click", function (event) {
	if (onButton.checked == true) {
		on = true;
		turnCounter.innerHTML = "-";
	} else {
		on = false;
		turnCounter.innerHTML = "";
		clearColor();
		clearInterval(intervalId);
	}
});

startButton.addEventListener("click", function () {
	if (on || win) {
		play();
	}
});

function play() {
	win = false;
	order = [];
	playerOrder = [];
	flash = 0;
	intervalId = 0;
	turn = 1;
	turnCounter.innerHTML = "1";
	good = true; // No incorrect clicks yet!!

	for (var i = 0; i < 20; i++) {
		order.push(Math.floor(Math.random() * 4) + 1); // Generate a random number between 1 and 4
	}
	compTurn = true;

	/*	Start first turn*/
	intervalId = setInterval(gameTurn, 800);
}

function gameTurn() {
	on = false; // Play cannot press any buttons
	if (flash == turn) { // Computers turn is over
		clearInterval(intervalId);
		compTurn = false;
		clearColor();
		on = true;
	}

	if (compTurn) { // If turn isn't over
		clearColor();
		setTimeout(function () {
			if (order[flash] === 1) flashGreen();
			else if (order[flash] === 2) flashRed();
			else if (order[flash] === 3) flashYellow();
			else if (order[flash] === 4) flashBlue();
			flash++;
		}, 200);
	}

}

/*		FLASH COLORS	*/
function flashGreen() {
	if (noise) {
		let audio = document.querySelector("#sound-green");
		audio.play(); // Play audio
	}
	noise = true;
	topLeft.classList.add("active");
}
function flashRed() {
	if (noise) {
		let audio = document.querySelector("#sound-red");
		audio.play(); // Play audio
	}
	noise = true;
	topRight.classList.add("active");
}
function flashYellow() {
	if (noise) {
		let audio = document.querySelector("#sound-yellow");
		audio.play(); // Play audio
	}
	noise = true;
	bottomLeft.classList.add("active");
}
function flashBlue() {
	if (noise) {
		let audio = document.querySelector("#sound-blue");
		audio.play(); // Play audio
	}
	noise = true;
	bottomRight.classList.add("active");
}

function clearColor() {
	[topLeft, topRight, bottomLeft, bottomRight].forEach(e => e.classList.remove("active"));
}

function flashColor() {
	[topLeft, topRight, bottomLeft, bottomRight].forEach(e => e.classList.add("active"));
}

/* Player click colours	*/
topLeft.addEventListener("click", function () {
	if (on) {
		playerOrder.push(1);
		check(); // Check if player is right
		flashGreen();
		if (!win) setTimeout(clearColor, 300);
	}
});

topRight.addEventListener("click", function () {
	if (on) {
		playerOrder.push(2);
		check(); // Check if player is right
		flashRed();
		if (!win) setTimeout(clearColor, 300);
	}
});

bottomLeft.addEventListener("click", function () {
	if (on) {
		playerOrder.push(3);
		check(); // Check if player is right
		flashYellow();
		if (!win) setTimeout(clearColor, 300);
	}
});

bottomRight.addEventListener("click", function () {
	if (on) {
		playerOrder.push(4);
		check(); // Check if player is right
		flashBlue();
		if (!win) setTimeout(clearColor, 300);
	}
});

/* 	Check if player is right*/
function check() {
	if (playerOrder[playerOrder.length - 1] !== order[playerOrder.length - 1]) { good = false; } // Check last thing player pressed

	if (playerOrder.length == 20 && good == true) {
		winGame();
	}

	if (good == false) {
		flashColor();
		turnCounter.innerHTML = "NO!";
		setTimeout(function () {
			turnCounter.innerHTML = turn;
			clearColor();

			// If strict mode
			if (strict) {
				play(); // Restart game
			} else {
				// Repeat round
				compTurn = true;
				flash = 0;
				playerOrder = [];
				good = true;
				intervalId = setInterval(gameTurn, 800);
			}
		}, 800);
		noise = false;
	}
	// Player got it correct, but not won
	if (turn == playerOrder.length && good && !win) {
		turn++;
		playerOrder = [];
		compTurn = true;
		flash = 0;
		turnCounter.innerHTML = turn;
		intervalId = setInterval(gameTurn, 800);
	}
}

function winGame() {
	flashColor();
	turnCounter.innerHTML = "WIN!";
	on = false;
	win = true;
}
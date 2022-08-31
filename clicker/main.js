// Define our vars
const input = document.getElementById("seconds");
const button = document.getElementById("button");
const area = document.getElementById("area");
const display = document.getElementById("clicks");
var CLICK_TIME = 10000;
var clicks = 0;

// Start -> click button to begin
function start() {
	button.classList.remove("wide");
	button.setAttribute("stage","3");
	button.innerText = 'Start';
	button.removeEventListener('click', start);
	button.addEventListener('click', init);
	display.innerText = "-";
}

// Initiate
function init() {
	button.removeEventListener('click', init);
	// Display 3...2...1 counter
	button.innerText = '3';
	setTimeout(() => {
		button.setAttribute("stage","2");
		button.innerText = '2';
		setTimeout(() => {
			button.setAttribute("stage","1");
			button.innerText = '1';
			setTimeout(() => {
				display.innerText = '0 clicks';
				button.classList.add("hidden");
				area.setAttribute("class","active");
				area.addEventListener('click', clicked);
				setTimeout(finish, CLICK_TIME);
			}, 1000);
		}, 1000);
	}, 1000);
}

// Register each click
function clicked() {
	clicks += 1;
	console.log("Clicked! (Now "+clicks+")");
	display.innerText = clicks+" clicks";
}

// Finish
function finish() {
	area.removeEventListener('click', clicked);
	area.setAttribute("class","passive");
	button.classList.remove("hidden");
	let result = clicks / (CLICK_TIME/1000);
	button.classList.add("wide");
	button.innerHTML = 'You clicked at ' + result.toFixed(1) + ' <abbr title=\'Clicks per Second\'>cps</abbr>!';
	clicks = 0;
	setTimeout(() => {
		button.innerHTML += "<br>Go Again?";
		button.addEventListener('click', start);
	}, 2000);
}

// Change time
function changeSeconds() {
	let secs = input.value;
	if (secs < 1 || secs > 60) {
		secs.value = CLICK_TIME /1000;
	} else {
		CLICK_TIME = +secs * 1000;
	}
}

window.addEventListener("load", () => {
	start();
	input.value = 10;
	input.addEventListener('change', changeSeconds);
});
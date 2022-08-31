/* Time in milliseconds */
var LB = 500;
var UB = 5000;
var ON = false;
var box = document.querySelector(".container");
var text = document.querySelector(".container > .text");
var attempts = 0;
var timeArray = [];
var allTimes = 0;
var bestTime = 0;
var action;
var start;

function wait() {
  box.setAttribute("onclick", "clicked()");
  box.setAttribute("state", "wait");
  text.innerText = 'Click Here When The Colour Changes...';
  main();
}

function main() {
  let time = (Math.random() * UB) + LB;
  console.log(`(${Math.random()} * ${UB}) + ${LB} ==> ${time}`);
  action = setTimeout(function() {
    ON = true;
    start = Date.now();
    box.setAttribute("state", "on");
    text.innerText = 'Click Me!';
  }, time);
}

function resetBox() {
  clearTimeout(action);
  box.setAttribute("state", "off");
  box.setAttribute("onclick", "wait()");
  text.innerHTML = "Click Here To Start";
  ON = false;
}

function finish() {
  let time = Date.now() - start;
  text.innerHTML = "<i>You took " + time + "ms</i><hr>Click Here To Start";
  timeArray.push(time);
  allTimes += time;
  attempts += 1;
  if (time < bestTime || bestTime === 0) bestTime = time;
  results(time);
  resetBox();
}

function clicked() {
  if (ON) {
    finish();
  } else {
    resetBox();
    text.innerHTML = "<b>Do not click until the colour has changed</b><hr>Click Here To Start";
  }
}

function results(time) {
  let avg = (allTimes / attempts).toFixed(3);
  let HTML = "";
  for (let i = 0; i < timeArray.length; i++) {
    HTML = `Attempt no ${i + 1}: ${timeArray[i]}ms<br>${HTML}`;
  }
  HTML = `<mt>Average Time: ${avg}ms</mt><br><mt>Best Time: ${bestTime}ms</mt><br>${HTML}`;
  document.querySelector(".info").innerHTML = HTML;
  document.querySelector(".info").style.display = 'block';
}

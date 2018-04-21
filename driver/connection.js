var team = localStorage.getItem("team");
var raceKey = localStorage.getItem("room_code");
var roleKey = localStorage.getItem("role_key");
var cupName = localStorage.getItem("race_name");
document.getElementById("driver_race_name").innerHTML = "The " + cupName + " Cup";

// Setup attendance
var attendance = JSON.parse(localStorage.getItem("attendance"));
var sa_el = document.getElementById("team-a-shifters");
for (var i = attendance.shifters_a; i--;) {
  sa_el.innerHTML += '<img class="role_icon team-A-' + i + '" src="../images/shifter_inactive.svg"/>';
}
var sb_el = document.getElementById("team-b-shifters");
for (var i = 0; i < attendance.shifters_b; i++) {
  sb_el.innerHTML += '<img class="role_icon team-B-' + i + '" src="../images/shifter_inactive.svg"/>';
}

var countdown = document.getElementById("countdown");
function showCountdown(seconds) {
  countdown.innerHTML = seconds;
  if (seconds > 0) {
    setTimeout(function nextSecond() {
      showCountdown(seconds - 1)
    }, 1000);
  } else {

    GAME_LOCKED = false;
    START_TIME = new Date().getTime();

    if (team === "A") {
      // UNLOCK GAME
      firebase.database().ref(raceKey + "/order").set({
        order: shifterOrder,
        time: new Date().getTime(),
      });
    }
  }
}
var kickedOff = false;
var shifterOrder = []
function kickoff(raceName) {
  cupName = raceName;
  localStorage.setItem("race_name", cupName);
  document.getElementById("driver_race_name").innerHTML = "The " + cupName + " Cup";
  kickedOff = true;
  // Reveal game
  document.getElementById("modal").classList.remove("open");
  document.querySelector(".reset-container").classList.add("open");
  // Start countdown
  var secondsTilStart = 3;
  setTimeout(function delayCountDown() {
    countdownSound.play();
    showCountdown(3);
  }, 1000);
  // Create order
  var attendance = JSON.parse(localStorage.getItem("attendance"));
  var min = Math.min(attendance.shifters_a, attendance.shifters_b);
  var max = Math.max(attendance.shifters_a, attendance.shifters_b);
  for (var i = 0; i < min; i++) {
    var r = Math.floor(Math.random() * min);
    var t = typeof shifterOrder[i] === "undefined"
      ? (i + 1)
      : shifterOrder[i];
    shifterOrder[i] = typeof shifterOrder[r] === "undefined"
      ? (r + 1)
      : shifterOrder[r];
    shifterOrder[r] = t;
  }
  console.log("ORDER", shifterOrder);
  for (var i = min; i < max; i++) {
    shifterOrder.push(i + 1);
  }
}
function sendKickoff() {
  firebase.database().ref(raceKey + "/kickoff").set({
    kickoff: true,
    time: new Date().getTime(),
    name: cupName,
  });
}

function submitTime() {
  var end = new Date().getTime();
  firebase.database().ref(raceKey + "/times").push().set({
    race: localStorage.getItem("race_name"),
    raceKey: raceKey,
    millis: end - START_TIME,
    team: team,
    time: end,
  });
}
document.getElementById("finish-debug").addEventListener("click", submitTime, false);

var rematchMsg = document.getElementById("rematch-modal");
var rematchBtn = document.getElementById("rematch");
function rematch() {
  rematchBtn.disabled = true;
  cupName = getRandomName();
  document.getElementById("driver_race_name").innerHTML = "The " + cupName + " Cup";
  localStorage.setItem("race_name", cupName);
  firebase.database().ref(raceKey).update({
    name: cupName,
  });
  rematchMsg.innerHTML = "WELCOME TO<br/><h1>The " + cupName + " Cup!</h1>";
  rematchMsg.classList.add("open");
  setTimeout(() => {
    rematchMsg.classList.remove("open");
    kickedOff = false;
    sendKickoff();
  }, 2000);
  setTimeout(() => {
    rematchBtn.disabled = false;
  }, 5000);
  reinitializeGame();
}
rematchBtn.addEventListener("click", rematch, false);

document.addEventListener("config-loaded", function raceIndicators() {
  // LISTEN FOR KICKOFF
  firebase.database().ref(raceKey + "/kickoff").on("value", data => {
    console.log("KICKOFF");
    var json = data.val();
    if (!json.time || json.time < startTime) {
      return;
    }
    if (!kickedOff && json.kickoff) {
      kickoff(json.name);
    }
  });
  var readyRef = firebase.database().ref(raceKey + "/ready");
  var alreadyReady = [];
  function handleReady(data) {
    var json = data.val();
    if (alreadyReady.indexOf(data.key) > -1) {
      return;
    }
    alreadyReady.push(data.key);
    var id = json.role === "shifter" ? json.id : "driver";
    // console.log(".team-" + json.team + "-" + id);
    document.querySelector(".team-" + json.team + "-" + id).src = "../images/" + json.role + ".svg";

    if (team === "B") {
      return; // just team A for the kickoff
    }

    if (json.team === "A") {
      if (json.role === "driver") {
        attendance.driver_a = true;
      } else {
        attendance.shifters_a -= 1;
      }
    } else {
      if (json.role === "driver") {
        attendance.driver_b = true;
      } else {
        attendance.shifters_b -= 1;
      }
    }
    if (
      attendance.driver_a
      && attendance.driver_b
      && attendance.shifters_a === 0
      && attendance.shifters_b === 0
    ) {
      sendKickoff();
    }
  }
  readyRef.on("child_added", handleReady);
  readyRef.on("child_changed", handleReady);
  function recheck() {
    firebase.database().ref(raceKey + "/ready").once("value").then(data => data.forEach(handleReady));
  }
  document.getElementById("manual_check").addEventListener("click", recheck, false);
  recheck();

  var update = {};
  update[roleKey] = { team: team, role: "driver", time: new Date().getTime() };
  readyRef.update(update);

  firebase.database().ref(raceKey + "/shifts").on('child_added', data => {
    var json = data.val();
    if (!json.time || json.time < startTime) {
      return;
    }
    console.log("SHIFT", json);
    if (json.team === team) {
      CURRENT_GEAR = json.gear;
      document.getElementById("shift-gear").innerHTML = CURRENT_GEAR;
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent("gear-shift", true, true, CURRENT_GEAR);
      document.dispatchEvent(event);
    }
  });
});

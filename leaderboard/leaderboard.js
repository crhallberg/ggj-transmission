var loopTimer = false;
var timerStart;
var timerEl = document.getElementById("race_time");
function formatTime(millis) {
  var seconds = millis / 1000;
  var minutes = Math.floor(seconds / 60);
  seconds %= 60;
  // Pad
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds.toFixed(3);
  else seconds = seconds.toFixed(3);
  // Display
  return minutes + ":" + seconds;
}

var all_times = [];
function updateLeaderboard() {
  all_times.sort((a, b) => a.millis - b.millis);
  var newestA = -1;
  var newestB = -1;
  for (var i = 0; i < all_times.length; i++) {
    if (all_times[i].team === "A") {
      if (newestA < 0 || all_times[i].time > all_times[newestA]) {
        newestA = i;
      }
    } else {
      if (newestB < 0 || all_times[i].time > all_times[newestB]) {
        newestB = i;
      }
    }
  }
  var table = document.getElementById("table");
  var html = "";
  for (var i = 0; i < 5 && i < all_times.length; i++) {
    html += "<tr";
    if (i === newestA || i === newestB) {
      html += ' class="new"';
    }
    html += "><td>" + all_times[i].race + "</td>"
      + "<td>" + all_times[i].team + "</td>"
      + "<td>" + formatTime(all_times[i].millis) + "</td></tr>";
  }
  table.innerHTML = html;
}

var finished = { A: false, B: false };
var teamATimeEl = document.getElementById("team-A");
var teamBTimeEl = document.getElementById("team-B");
function updateTimer() {
  timerEl.innerHTML = formatTime(new Date().getTime() - timerStart);
  if (!finished["A"]) {
    teamATimeEl.innerHTML = formatTime(Math.random() * 5940000);
  }
  if (!finished["B"]) {
    teamBTimeEl.innerHTML = formatTime(Math.random() * 5940000);
  }
  // Repeat
  if (loopTimer) {
    requestAnimationFrame(updateTimer);
  }
}
function startTimer() {
  finished = { A: false, B: false };
  timerStart = new Date().getTime();
  loopTimer = true;
  updateTimer();
}
function stopTimer(json) {
  finished[json.team] = true;
  document.getElementById("team-" + json.team).innerHTML = formatTime(json.millis);
  loopTimer = !(finished["A"] && finished["B"]);
  if (!loopTimer) {
    timerEl.innerHTML = formatTime(json.millis);
    updateLeaderboard();
  }
}

document.addEventListener("config-loaded", function leaderboard() {
  // TODO: Capture races correctly
  var currentRace = null;
  firebase.database().ref().on("child_added", data => {
    var json = data.val();
    if (!json.created || json.created < startTime) {
      return;
    }
    if (currentRace) {
      firebase.database().ref(currentRace + "/kickoff").off("value");
      firebase.database().ref(currentRace + "/times").off("child_added");
      loopTimer = false;
      setTimeout(function() {
        timerEl.innerHTML = formatTime(0);
        document.getElementById("team-A").innerHTML = formatTime(0);
        document.getElementById("team-B").innerHTML = formatTime(0);
      }, 100);
    }
    currentRace = data.key;
    document.getElementById("leaderboard_race_name").innerHTML = json.name + " Cup";
    firebase.database().ref(currentRace + "/kickoff").on("value", data => {
      var json = data.val();
      console.log(json);
      if (!json.time || json.time < startTime) {
        return;
      }
      if (json.kickoff) {
        setTimeout(startTimer, 4000);
      }
    });
    // Final times
    firebase.database().ref(currentRace + "/times").on('child_added', function(data) {
      json = data.val();
      if (!json.time || json.time < startTime) {
        return;
      }
      all_times.push(json);
      stopTimer(json);
    });
  });
}, false);

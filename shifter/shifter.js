var ID = -1;
var GEAR_VALUE = -1;
var raceKey = localStorage.getItem("room_code");
var roleKey = localStorage.getItem("role_key");
var team = localStorage.getItem("team");
var sound = new Audio("../sounds/gearshift.wav");

document.getElementById("gear-number").innerHTML = team;

document.addEventListener("config-loaded", function raceIndicators() {
  var shiftsRef = firebase.database().ref(raceKey + "/shifts");
  firebase.database().ref(raceKey + "/roles").once("value").then(data => {
    // GET ID FROM ROLES ORDER
    var index = 0;
    var json = data.val();
    for (var key in json) {
      if (key === roleKey) {
        ID = index;
        break;
      } else if (
        json[key].team === team
        && json[key].role === "shifter"
      ) {
        index += 1;
      }
    }
    console.log("ID: " + ID);
    // WAIT FOR ORDER
    firebase.database().ref(raceKey + "/kickoff").on("value", data => {
      document.getElementById("gear-number").innerHTML = team;
      document.body.classList.remove("current");
    });
    firebase.database().ref(raceKey + "/order").on("value", data => {
      var json = data.val();
      if (!json.time || json.time < startTime) {
        return;
      }
      console.log(json);
      GEAR_VALUE = json.order[ID];
      document.body.classList.remove("current");
      document.getElementById("gear-number").innerHTML = GEAR_VALUE;
      // ACTION
      function pressButton(e) {
        e.preventDefault();
        document.getElementById("button-unpressed").style.display = "none";
        document.getElementById("button-pressed").style.display = "initial";
        // Play sound
        sound.pause();
        sound.currentTime = 0;
        sound.play();
        // Broadcast
        console.log("SHIFT", GEAR_VALUE);
        shiftsRef.push().set({
          gear: GEAR_VALUE,
          team: team,
          time: new Date().getTime()
        });
      }
      function unpressButton(e) {
        e.preventDefault();
        document.getElementById("button-unpressed").style.display = "initial";
        document.getElementById("button-pressed").style.display = "none";
      }
      document.addEventListener("keydown", pressButton, false);
      document.addEventListener("keyup", unpressButton, false);
      document.addEventListener("mousedown", pressButton, false);
      document.addEventListener("mouseup", unpressButton, false);
    });
    // LISTEN TO OTHER SHIFTS
    shiftsRef.on('child_added', function(data) {
      json = data.val();
      if (!json.time || json.time < startTime) {
        return;
      }
      if (json.team === team) { // Highlight current gear
        if (json.gear === GEAR_VALUE) {
          document.body.classList.add("current");
        } else {
          console.log(json);
          document.body.classList.remove("current");
        }
      }
    });
    // REPORT READY
    var update = {};
    update[roleKey] = {
      team: team,
      role: "shifter",
      id: ID,
      time: new Date().getTime()
    };
    firebase.database().ref(raceKey + "/ready").update(update);
  });
}, false);

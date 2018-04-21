var cupName, raceKey = localStorage.getItem("room_code");
var roleKey, currentRole = false;

document.addEventListener("config-loaded", function leaderboard() {
  var driverAicon = document.querySelector(".team-a-driver");
  var driverBicon = document.querySelector(".team-b-driver");
  var teamAshifters = document.querySelectorAll(".team-a-shifter");
  var teamBshifters = document.querySelectorAll(".team-b-shifter");
  function updateRolesAndIcons() {
    // Get title
    firebase.database().ref(raceKey).once("value").then(data => {
      var json = data.val();
      cupName = json.name;
    });
    // Roles
    firebase.database().ref(raceKey + "/roles").once("value").then(data => {
      var driverA = false;
      var driverB = false;
      var shiftersA = 0;
      var shiftersB = 0;
      var json = data.val();
      for (var key in json) {
        if (key === roleKey) {
          currentRole = json[key];
          document.querySelector("[data-team='" + currentRole.team + "'][data-role='" + currentRole.role + "']").classList.add("success");
          if (currentRole.role === "driver") {
            document.getElementById("ready_button").classList.remove("hidden");
          } else {
            document.getElementById("ready_button").classList.add("hidden");
          }
        }
        if (json[key].role === "driver") {
          if (json[key].team === "A") {
            driverA = true;
          } else {
            driverB = true;
          }
        } else {
          if (json[key].team === "A") {
            shiftersA += 1;
          } else {
            shiftersB += 1;
          }
        }
      }
      // Disable buttons
      if (driverA) {
        document.getElementById("select-a-driver").disabled = true;
        driverAicon.src = "../images/driver.svg";
      } else {
        document.getElementById("select-a-driver").disabled = false;
        driverAicon.src = "../images/driver_inactive.svg";
      }
      if (driverB) {
        document.getElementById("select-b-driver").disabled = true;
        driverBicon.src = "../images/driver.svg";
      } else {
        document.getElementById("select-b-driver").disabled = false;
        driverBicon.src = "../images/driver_inactive.svg";
      }
      // Update icons
      for (var i = 0; i < teamAshifters.length; i++) {
        if (i < shiftersA) {
          teamAshifters[i].src = "../images/shifter.svg";
        } else {
          teamAshifters[i].src = "../images/shifter_inactive.svg";
        }
      }
      for (var i = 0; i < teamBshifters.length; i++) {
        if (i < shiftersB) {
          teamBshifters[i].src = "../images/shifter.svg";
        } else {
          teamBshifters[i].src = "../images/shifter_inactive.svg";
        }
      }

      // UPDATE HEADERS
      // (here for loading and updated names)
      document.getElementById("room_code").innerHTML = "Room Code: " + raceKey;
      if (cupName) {
        document.getElementById("race_name").innerHTML = cupName + " Cup";
      }
      // Save to localhost
      localStorage.setItem("attendance", JSON.stringify({
        "driver_a": false, // to be corrected later
        "driver_b": false,
        "shifters_a": shiftersA,
        "shifters_b": shiftersB,
      }));
    });
  }

  roleKey = localStorage.getItem("role_key");
  if (!roleKey) {
    roleKey = firebase.database().ref(raceKey + "/roles").push().key;
    localStorage.setItem("role_key", roleKey);
  }
  updateRolesAndIcons();
  setInterval(updateRolesAndIcons, 1000);

  var buttons = document.querySelectorAll(".role_button");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function clickRole() {
      updates = {};
      updates[raceKey + "/roles/" + roleKey] = {
        team: this.dataset.team,
        role: this.dataset.role
      };
      firebase.database().ref().update(updates).then(updateRolesAndIcons);
      var prev = document.querySelector(".success");
      if (prev) prev.classList.remove("success");
      this.classList.add("success");
    }, false);
  }

  // Ready button
  document.getElementById("ready_button").addEventListener("click", function readyButton() {
    localStorage.setItem("team", currentRole.team);
    firebase.database().ref(raceKey + "/setup").push().set({
      team: currentRole.team,
      time: new Date().getTime(),
    });
  });
  function jump(data) {
    var json = data.val();
    if (!json.time || json.time < startTime) {
      return;
    }
    if (currentRole.team === json.team) {
      localStorage.setItem("race_name", cupName);
      localStorage.setItem("team", currentRole.team);
      window.location = "../" + currentRole.role + "/";
    }
  }
  firebase.database().ref(raceKey + "/setup").on("child_added", jump);
  firebase.database().ref(raceKey + "/setup").on("child_changed", jump);
}, false);

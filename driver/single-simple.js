var DEBUG = false;

var GAME_LOCKED = true;
var START_TIME;
var RACE_TIME;
var CURRENT_GEAR = 0;
var velocity = 0;
var distanceTraveled = 0;
// FINISH LINE
var FINISH_LINE_APPEARS = 45000;
var RACE_OVER_DISTANCE = FINISH_LINE_APPEARS + 800;
var finishLine;
var finishLineAppeared = false;
var finishLineDrawn = false;
var raceOver = false;
// Acceleration
var ACC_INIT_PERIOD = 250;
var ACC_PERIOD = ACC_INIT_PERIOD;
var ACC_EXT = 50;
var ACC_SPLIT = 0;
var MAX_ACC = 1 / 60;
var ACC_FLOOR = 0;
var ACC = 0;
// Sounds
var engine;
var stallSound;
var finishSound;
var countdownSound;
var applauseSound;

function preload() {
    engine = loadSound("../sounds/engine.wav");
    stallSound = loadSound("../sounds/stall.wav");
    finishSound = loadSound("../sounds/finish.wav");
    countdownSound = loadSound("../sounds/countdown.wav");
    applauseSound = loadSound("../sounds/applause.wav");
    countdownSound.setVolume(0.1);
    engine.setVolume(0.1);
}

function setup() {
    createCanvas(window.innerWidth - 50, 400);
}

function draw() {
    background(222);

    // Distance
    noStroke();
    fill("#bb99cc");
    rect(0, 0, width * distanceTraveled / RACE_OVER_DISTANCE, height);

    // RPM meter
    var theta = 60 * ACC_SPLIT / ACC_PERIOD + 60;
    theta = Math.min(Math.random() * 5 + 120, theta);
    push();
    translate(width / 2, 2 * height);
    strokeWeight(50);
    stroke(0);
    strokeCap(SQUARE);
    noFill();
    arc(0, 0, 3 * height, 3 * height, 8/3 * HALF_PI, 10/3 * HALF_PI);
    strokeWeight(52);
    stroke(0, 128, 0);
    arc(0, 0, 3 * height, 3 * height, 35/12 * HALF_PI, 37/12 * HALF_PI);
    strokeWeight(54);
    stroke(0, 255, 0);
    arc(0, 0, 3 * height, 3 * height, 71/24 * HALF_PI, 73/24 * HALF_PI);
    // Line
    rotate(radians(theta));
    strokeWeight(10);
    stroke(0);
    fill(255);
    rect(-1.5 * height - 50, -12.5, 100, 25);
    pop();

    // Speedometer
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(100);
    if (raceOver) {
        text((RACE_TIME / 1000) + " seconds", width / 2, 90);
    } else {
        text(ceil(velocity * 4) + " mph", width / 2, 90);
    }

    // Gears
    strokeWeight(5);
    for (var i = 0; i < 6; i++) {
        fill(0);
        if (i < CURRENT_GEAR) {
            fill(255, 255, 0);
        }
        var x = width / 2 - 180 + 70 * i;
        ellipse(x, 340, 50);
    }

    // Update
    if (GAME_LOCKED) {
        return;
    }
    driveOnACurve();
    distanceTraveled += velocity;

    // Race over

    if (distanceTraveled >= RACE_OVER_DISTANCE) {
        engine.stop();
        if (!raceOver) {
            console.log("YOUR WINNER");
            finishSound.play();
            applauseSound.play();
            submitTime();
        }
        raceOver = true;
    }

    // Engine sound
    if (!raceOver && !engine.isPlaying()) {
        engine.loop();
    }
    var speed = map(ACC_SPLIT + velocity * 10, 0, ACC_PERIOD + 200, 0.1, 3);
    engine.rate(speed); // how fast sound is playing
}

function driveOnACurve() {
    if (CURRENT_GEAR > 0) {
        ACC =
            Math.max(0, MAX_ACC * Math.sin(Math.PI * ACC_SPLIT / ACC_PERIOD)) +
            ACC_FLOOR; // ACC FORMULA
    } else {
        ACC = 0;
    }
    // console.log('CURRENT_GEAR: ' + CURRENT_GEAR, ACC);
    velocity += ACC;
    if (CURRENT_GEAR > 0 && ACC_SPLIT < ACC_PERIOD) {
        ACC_SPLIT += 1;
    }
}

document.addEventListener(
    "gear-shift",
    function handleCURRENT_GEARShift(event) {
        newGear = event.detail;
        CURRENT_GEAR = newGear; // up CURRENT_GEAR
        ACC_SPLIT = 0; // reset curve
        ACC_FLOOR = ACC; // save floor
        ACC_PERIOD = ACC_INIT_PERIOD + ACC_EXT * CURRENT_GEAR; // extend period
        // Downshift penalty
        if (newGear < CURRENT_GEAR) {
            ACC_FLOOR = 0;
        }
    },
    false
);

if (DEBUG) {
    GAME_LOCKED = false;
    document.getElementById("modal").classList.remove("open");
    var debug_shift = 0;
    document.addEventListener(
        "keydown",
        function debugShift() {
            if (engine.isPlaying() === false) {
                engine.loop();
            }
            if (debug_shift < 6) {
                debug_shift += 1;
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("gear-shift", true, true, debug_shift);
                document.dispatchEvent(event);
            }
        },
        false
    );
}

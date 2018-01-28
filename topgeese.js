var game = new Phaser.Game(800, 600, Phaser.AUTO, 'main_game', { preload: preloadPhaser, create: create, update: update });

var GAME_LOCKED = true;
var CURRENT_GEAR = 1;
var START_TIME;
var engine;
var stallSound;
var stalled = false;

function preloadPhaser()
{
	game.load.spritesheet('road','images/road.png');
	game.load.spritesheet('car','images/car.png');
	game.load.spritesheet('car1','images/car1.png');
	game.load.spritesheet('careven','images/careven.png');
	game.load.spritesheet('car3','images/car3.png');
	game.load.spritesheet('tach','images/Tachometer.png');
	game.load.spritesheet('needle','images/Needle.png');
	game.load.spritesheet('finish','images/finish.png');
}

function preload()
{
	engine = loadSound('engine.wav');
	stallSound = loadSound('stall.wav');
}

function setup()
{

}


var arrows;
var velocity = 0;
var road;
var secondRoad;
var TACH_FLOOR = 1000;
var gear = 0;
var VELOCITY_INCREMENTS_PER_GEAR = 14;
var TACH_INCREMENT_PER_ACCEL = 200;
var MIN_RPM = 600;
var accelDown;
var tach = 1000;
var rammaFjoldin = 0;
var carAnimationPhase = 1;
var needle;
// FINISH LINE
var FINISH_LINE_APPEARS = 30000;
var RACE_OVER_DISTANCE = FINISH_LINE_APPEARS + 800;
var distanceTraveled = 0;
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

function draw()
{
  var volume = map(1, 0, width, 0, 1);
  volume = constrain(volume, 0, 1);
  engine.amp(1);

  var speed = map(tach/45, 0.1, height, 0, 2);
  //console.log(speed);
  speed = constrain(speed, 0.01, 4);
  engine.rate(speed);
  if(GAME_LOCKED === false && engine.isPlaying() === false)
  {
	  engine.loop();
  }
  if(stalled)
  {
	  stalled = false;
	  stalled.play();
  }
}


function create()
{
	game.physics.startSystem(Phaser.Physics.P2JS);
	road = game.add.sprite(0,0,'road');
	secondRoad = game.add.sprite(800,0,'road');
	car = game.add.sprite(0,300,'car1');
	game.add.sprite(548,348,'tach');
	needle = game.add.sprite(680,488,'needle');
	needle.anchor.setTo(.8,.5);

	arrows = game.input.keyboard.createCursorKeys();
	//game.physics.p2.enable(car);
}

function update()
{
//	if (GAME_LOCKED) {
//		return;
//	}
	changeRoadSegmentPosition(road);
	changeRoadSegmentPosition(secondRoad);
	if(finishLineDrawn)
	{
		finishLine.position.x -= velocity;
	}
	distanceTraveled += velocity;
	errorCorrect(road, secondRoad);

	updateCarSpriteIfNecessary();

	driveOnACurve();
	increaseTach();

	rammaFjoldin++;

	if(distanceTraveled >= FINISH_LINE_APPEARS && finishLineDrawn === false)
	{
		finishLineDrawn = true;
		finishLine = game.add.sprite(800,0,'finish');
	}

	if(distanceTraveled >= RACE_OVER_DISTANCE)
	{
		raceOver = true;
		console.log('YOUR WINNER');
	}
}

function stall()
{
	velocity = 0;
	CURRENT_GEAR = 0;
	needle.angle = 0;
	//console.log('STALLED');
	stalled = true;
}

function increaseTach()
{
	var theta = 180 * ACC_SPLIT / ACC_PERIOD;
    theta = Math.min(Math.random() * 10 + 120, theta);
	needle.angle = theta;
}

function attemptShift()
{
	accelDown = false;
//	console.log(needle.angle);
	if(CURRENT_GEAR < 5)
	{
		CURRENT_GEAR++;
		if(needle.angle >= 65 && needle.angle <= 115)
		{
			velocity = VELOCITY_INCREMENT * CURRENT_GEAR;
		}
		else
		{
			stall();
		}
	}
}

function updateCarSpriteIfNecessary()
{
	if(rammaFjoldin === 0)
	{
		game.add.sprite(0,300,'car1');
	}
	else if(rammaFjoldin === 15)
	{
		game.add.sprite(0,300,'careven');
	}
	else if(rammaFjoldin === 30)
	{
		game.add.sprite(0,300,'car3');
	}
	else if(rammaFjoldin === 45)
	{
		game.add.sprite(0,300,'careven');
	}
	else if(rammaFjoldin === 60)
	{
		rammaFjoldin = 0;
	}
}

function driveOnACurve()
{
	if (gear > 0) {
		ACC = Math.max(0, MAX_ACC * Math.sin((Math.PI * ACC_SPLIT) / ACC_PERIOD)) + ACC_FLOOR; // ACC FORMULA
	} else {
		ACC = 0;
	}
	// console.log('GEAR: ' + gear, ACC);
	velocity += ACC;
	if (gear > 0 && ACC_SPLIT < ACC_PERIOD) {
		ACC_SPLIT += 1;
	}
}

function logTach()
{
//	console.log('TACH: ' + tach);
}

function changeRoadSegmentPosition(segment)
{
	segment.position.x -= velocity;
	if(segment.position.x <= -800)
	{
		segment.position.x = 800;
	}
}

function errorCorrect(one, two)
{
	if(one.position.x > two.position.x + 801)
	{
		one.position.x = two.position.x + 801;
	}
	else if(two.position.x > one.position.x + 801)
	{
		two.position.x = one.position.x + 801;
	}
}

document.addEventListener("gear-shift", function handleGearShift(event) {
	newGear = event.detail;
	gear = newGear; // up gear
	ACC_SPLIT = 0; // reset curve
	ACC_FLOOR = ACC; // save floor
	ACC_PERIOD = ACC_INIT_PERIOD + ACC_EXT * gear; // extend period
	// Downshift penalty
	if (newGear < gear) {
		ACC_FLOOR = 0;
	}
}, false);

var debug_shift = 0;
document.addEventListener("keydown", function debugShift() {
	if (debug_shift < 6) {
		debug_shift += 1
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent("gear-shift", true, true, debug_shift);
		document.dispatchEvent(event);
	}
}, false);

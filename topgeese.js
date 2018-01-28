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
var NEEDLE_INCREMENT = 300/60;
var VELOCITY_INCREMENT = 5;
var needleDirection = 1;
var distanceTraveled = 0;
var FINISH_LINE_APPEARS = 10000;
var RACE_OVER_DISTANCE = FINISH_LINE_APPEARS + 800;
var finishLine;
var finishLineAppeared = false;
var finishLineDrawn = false;
var raceOver = false;

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
	  stallSound.play();
  }
}


function create()
{
	game.physics.startSystem(Phaser.Physics.P2JS);
	road = game.add.sprite(0,0,'road');
	secondRoad = game.add.sprite(800,0,'road');
	car = game.add.sprite(0,300,'car1');
	game.add.sprite(549,349,'tach');
	needle = game.add.sprite(680,489,'needle');
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
	
	increaseTach();
	
	rammaFjoldin++;

	if(arrows.right.isDown)
	{
		accelDown = true;
	}
	if (arrows.right.isUp && accelDown && CURRENT_GEAR <= 4)
	{
		attemptShift();
	}
	else if(arrows.left.isDown && CURRENT_GEAR >= 0)
	{
		CURRENT_GEAR--;
	}
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
	needle.angle += (NEEDLE_INCREMENT * needleDirection);
	if(needle.angle === 90)
	{
		var q = 16;
	}
	console.log(needle.angle);
	if(needle.angle <= 0)
	{
		if(needleDirection === 1)
		{
			needle.angle = 180;
			needleDirection = -1;
		}
		else
		{
			needle.angle = 0;
			needleDirection = 1;
		}
	}
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

function attemptToIncreaseVelocity()
{
	if(velocity < (5 * (VELOCITY_INCREMENTS_PER_GEAR + (VELOCITY_INCREMENTS_PER_GEAR * CURRENT_GEAR))))
	{
//		console.log('GEAR: ' + CURRENT_GEAR);
		velocity += VELOCITY_INCREMENT;
		tach += TACH_INCREMENT_PER_ACCEL;
		needle.angle += NEEDLE_INCREMENT;
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
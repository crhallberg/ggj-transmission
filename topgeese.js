var game = new Phaser.Game(800, 600, Phaser.AUTO, 'main_game', { preload: preloadPhaser, create: create, update: update });

var GAME_LOCKED = true;
var CURRENT_GEAR = -1;
var START_TIME;
var engine;

function preloadPhaser()
{
	game.load.spritesheet('road','images/road.png');
	game.load.spritesheet('car','images/car.png');
	game.load.spritesheet('car1','images/car1.png');
	game.load.spritesheet('careven','images/careven.png');
	game.load.spritesheet('car3','images/car3.png');
	game.load.spritesheet('tach','images/Tachometer.png');
	game.load.spritesheet('needle','images/Needle.png');
}

function preload()
{
	engine = loadSound('engine.wav');
}

function setup()
{
	engine.loop();
}


var arrows;
var velocity = 1;
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
var NEEDLE_INCREMENT = 180/13;

function draw()
{
  var volume = map(1, 0, width, 0, 1);
  volume = constrain(volume, 0, 1);
  engine.amp(1);

  var speed = map(tach/45, 0.1, height, 0, 2);
  //console.log(speed);
  speed = constrain(speed, 0.01, 4);
  engine.rate(speed);
}


function create()
{
	game.physics.startSystem(Phaser.Physics.P2JS);
	road = game.add.sprite(0,0,'road');
	secondRoad = game.add.sprite(800,0,'road');
	car = game.add.sprite(0,300,'car1');
	game.add.sprite(674,474,'tach');
	needle = game.add.sprite(740,544,'needle');
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
	errorCorrect(road, secondRoad);
	
	updateCarSpriteIfNecessary();
	
	if(rammaFjoldin >= 60)
	{
		//console.log(rammaFjoldin);
		attemptToIncreaseVelocity();
		rammaFjoldin = 0;
	}
	rammaFjoldin++;
//	logTach();
//	console.log(velocity);
//	console.log('GEAR: ' + gear);

	if(arrows.right.isDown)
	{
		accelDown = true;
	}
	if (arrows.right.isUp && accelDown && gear <= 4)
	{
		tach -= 2800;
		gear++;
		needle.angle = 0;
		accelDown = false;
	}
	else if(arrows.left.isDown && gear >= 0)
	{
		gear--;
	}
	
	if(tach < MIN_RPM)
	{
		velocity = 1;
		gear = 0;
		tach = 1000;
		needle.angle = 0;
		console.log('STALLED');
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
}

function attemptToIncreaseVelocity()
{
	if(velocity < (VELOCITY_INCREMENTS_PER_GEAR + (VELOCITY_INCREMENTS_PER_GEAR * gear)))
	{
		console.log('GEAR: ' + gear);
		velocity++;
		tach += TACH_INCREMENT_PER_ACCEL;
		needle.angle += NEEDLE_INCREMENT;
	}
}

function logTach()
{
	console.log('TACH: ' + tach);
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
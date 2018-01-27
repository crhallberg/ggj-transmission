var game = new Phaser.Game(800, 600, Phaser.AUTO, 'main_game', { preload: preload, create: create, update: update });

var GAME_LOCKED = true;
var CURRENT_GEAR = -1;
var START_TIME;

function preload()
{
	game.load.spritesheet('road','images/road.png');
	game.load.spritesheet('car','images/car.png');
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
var frameCount = 0;


function create()
{
	game.physics.startSystem(Phaser.Physics.P2JS);
	road = game.add.sprite(0,0,'road');
	secondRoad = game.add.sprite(800,0,'road');
	car = game.add.sprite(0,300,'car');

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
	
	if(frameCount >= 60)
	{
		attemptToIncreaseVelocity();
		frameCount = 0;
	}
	frameCount++;
	logTach();
	console.log(velocity);
	console.log('GEAR: ' + gear);

	if(arrows.right.isDown)
	{
		accelDown = true;
	}
	if (arrows.right.isUp && accelDown && gear <= 4)
	{
		tach -= 2800;
		gear++;
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
		console.log('STALLED');
	}
}

function attemptToIncreaseVelocity()
{
	if(velocity < (VELOCITY_INCREMENTS_PER_GEAR + (VELOCITY_INCREMENTS_PER_GEAR * gear)))
	{
		console.log('GEAR: ' + gear);
		velocity++;
		tach += TACH_INCREMENT_PER_ACCEL;
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
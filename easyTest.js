var gpio=require('rpio');

var stopMotors = false;

var directionPin        = 7; // Pin used for direction
var stepPin             = 11; // Pin used for stepping

var STEPS_PER_REV       = 200
var MICROSTEPS_PER_STEP = 8
var RPMS                = 104.0
var MICROSECONDS_PER_MICROSTEP = (1000000/(STEPS_PER_REV * MICROSTEPS_PER_STEP)/(RPMS / 60))
var stepPause           = 1
//var stepPause           = MICROSECONDS_PER_MICROSTEP


function sleep(milliseconds) {
    let start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start )  > milliseconds) { break; }  
    }
}

function move() {
    gpio.write(stepPin, rpio.HIGH) 
    rpio.msleep(stepPause);  
    gpio.write(stepPin, rpio.LOW) 
    rpio.msleep(stepPause);     
    if(!stopMotors) move(); 
}

function stopMotor() {
    stopMotors = true;
    console.log("Stoping")
}

// Changing direction of motor 
function left() {  
    stopMotors = false;
    gpio.write(directionPin, rpio.HIGH)        
    console.log("Left")
    move();  
}

function right() {
    stopMotors = false;  
    gpio.write(directionPin, rpio.LOW)        
    console.log("Right")
    move();  
}

gpio.open(stepPin, rpio.OUTPUT);
gpio.open(directionPin, rpio.OUTPUT);

console.log("Pause length:" + stepPause)

left();

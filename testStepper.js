/**
 * Sample for the stepperdrv.js.
 * 
 * Here we are testing a Stepper motor that has 200 steps per revolution
 * which equates to 360/200 = 1.8 degrees per step.
 * 
 * In this test we continuously run forwards for 5 seconds and then continuously run
 * backwards for 5 seconds and then keep repeating.
 */

var speed        = 150; // RPM
var directionPin1 = 7; // Pin used for direction
var stepPin1      = 11; // Pin used for stepping

var directionPin2 = 13; // Pin used for direction
var stepPin2      = 15; // Pin used for stepping

console.log("Starting stepper-wiringpi - digital_ForwardBackward");

var stepperWiringPi = require("./stepperdrv");

var motor1 = stepperWiringPi.setupDigital(200, stepPin1, directionPin1);
var direction1 = stepperWiringPi.FORWARD;
var motor2 = stepperWiringPi.setupDigital(200, stepPin2, directionPin2);
var direction2 = stepperWiringPi.FORWARD;


console.log("Globals: FORWARD=%d, BACKWARD=%d", stepperWiringPi.FORWARD, stepperWiringPi.BACKWARD);

function changeDirection() {
  console.log("Changing direction from %d", direction);
  if (direction1 == stepperWiringPi.FORWARD) {
    direction1 = stepperWiringPi.BACKWARD;
    motor1.backward();
    motor2.forward();

  } else {
    direction1 = stepperWiringPi.FORWARD;
    motor1.forward();
    motor2.backward();
  }
  setTimeout(changeDirection.bind(this), 5000);
} // End of changeDirection

debugger;
motor1.setSpeed(speed);
motor2.setSpeed(speed);

changeDirection();

console.log("Starting to move ...");
// End of file

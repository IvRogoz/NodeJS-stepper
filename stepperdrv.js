/**
 * stepper-wiringpi
 * A module that moves a stepper motor for the Raspberry Pi based on the node-rpio
 * module for GPIO access.  See the README.md file for usage details. 
 * 
 * Based on the design and implementation of the Arduino Stepper class found here:
 * 
 * https://github.com/arduino/Arduino/tree/master/libraries/Stepper
 * https://github.com/nkolban/node-stepper-wiringpi
 * 
 * First made by Neil Kolban <kolban1@kolban.com> 2016-02-27
 * Simple adaptation from wiringpi to node-rpio by Ivan Rogoz
 */


var rpio = require('rpio');

var options = {
        gpiomem: true,          /* Use /dev/gpiomem */
        mapping: 'physical',    /* Use the P1-P40 numbering scheme */
        mock: undefined,        /* Emulate specific hardware in mock mode */
        close_on_exit: true,    /* On node process exit automatically close rpio */
}

rpio.init(options);

// Create definitions for the constants.
var FORWARD = 1;
var BACKWARD = -1;

// Publish the constants.
exports.FORWARD = FORWARD;
exports.BACKWARD = BACKWARD;

// A global used to identify motors for debugging purposes.  The first motor created
// will have index 1, the next will have index 2 and so on.
var motorIndex = 1;

exports.setupDigital = function (stepsPerRevolution, stepPin, directionPin) {
    var context = {
        step: step,         // Function
        setSpeed: setSpeed, // Function
        forward: forward,   // Function
        backward: backward, // Function
        stop: stop,         // Function

        _stepDelay: 60 * 1000 / stepsPerRevolution, // Set the default step delay to 1 rpm.
        _direction: FORWARD, // Motor direction.
        _timerId: null, // Interval object for stepping fixed number of steps.
        _moveTimeoutId: null, // Timeout object for continuous rotation
        _motorIndex: motorIndex, // The index of the motor used for debugging purposes.
        _stepPin: stepPin, // The pin used to step via a pulse
        _directionPin: directionPin, // The direction to rotate
        _stepsPerRevolution: stepsPerRevolution, // Total number of steps for this motor.
        _isDigital: true, // Is this a digital controller?
    };

    motorIndex++; // Increment the global motorIndex count (used for debugging).

    rpio.open(directionPin, rpio.OUTPUT, rpio.LOW);
    rpio.open(stepPin, rpio.OUTPUT, rpio.LOW);

    return context;
}

/**
 * PUBLIC:
 * Sets the speed in revolutions per minute (RPM)
 */
function setSpeed(desiredRPM) {
    // Some examples.
    //
    // When the number of steps in a revolution is 200
    // Desired RPM - stepDelay
    // 1           - 300ms
    // 60          - 5ms
    // 300         - 1ms
    //

    // The maxRPM is the number of revolutions per minute that would result in a
    // stepDelay of 1msec which is the smallest repeat time.  To figure this out,
    // consider the number of milliseconds in a second ... this is 60*1000.  Now
    // contemplate the number of steps in a revolution.  This is stored in the
    // 'numberOfSteps' property.  This tells us that to achieve 1 RPM, we would need
    // to move a step each delay interval.  As we increase the RPM, we will delay
    // LESS per step. 
    var maxRPM = 60 * 1000 / this._stepsPerRevolution;
    if (desiredRPM > maxRPM) {
        desiredRPM = maxRPM;
    }
    this._stepDelay = maxRPM / desiredRPM;
} // End of setSpeed


/**
 * PUBLIC:
 * Set the motor to rotate continuously forwards at the current set speed.
 */
function forward() {
    stop.call(this);
    this._direction = FORWARD;
    move.call(this);
} // End of forward


/**
 * PUBLIC:
 * Set the motor to rotate backwards at the current set speed.
 */
function backward() {
    stop.call(this);
    this._direction = BACKWARD;
    move.call(this);
} // End of backward


// PRIVATE: Setup for continuous rotation at given speed.
function move() {
    //console.log("Step number: %d", this._stepNumber);
    stepMotor.call(this);
    this._moveTimeoutId = setTimeout(move.bind(this), this._stepDelay);
} // End of move


// PUBLIC: Stop any continuous movement.
function stop() {
    if (this._moveTimeoutId != null) {
        clearTimeout(this._moveTimeoutId);
        this._moveTimeoutId = null;
    }
} // End of stop


/**
 * PUBLIC:
 * Moves the motor a fixed number of steps defined by `stepsToMove`.  If the number is negative,
 * the motor moves in the reverse direction.  The optional callback
 * function will be invoked when the number of steps being asked to
 * be moved have been moved.
 */
function step(stepsToMove, callback) {
    // Handle the case where the user asks to move 0 steps.
    if (stepsToMove == 0) {
        if (callback != null) {
            callback();
        }
        return;
    }
    var stepsLeft = Math.abs(stepsToMove);  // how many steps to take

    // determine direction based on whether stepsToMove is + or -:
    if (stepsToMove > 0) { this._direction = FORWARD; }
    if (stepsToMove < 0) { this._direction = BACKWARD; }

    // If we should already be in the middle of a movement, cancel it.
    if (this._timerId != null) {
        clearInterval(this._timerId);
    }

    stop(); // If we are in a continuous rotation ... stop that too.

    // Note: A question comes up on scheduling the first move immediately
    // as opposed to a stepDelay later.  We should always pause at least
    // one stepDelay even for the first step.  Consider what would happen
    // if we didn't.  Imagine we issued a step(1) and then a step(-1)
    // immediately on "completion" of the step(1).  We would imagine that
    // we should end up exactly where we started (which is correct).  However
    // if we don't wait at least one stepDelay then the call to step(-1) could
    // happen before the completion of a stepDelay period and we would now be
    // executing a -1 step even though the +1 step hadn't completed which
    // would not allow us to end up at the same position as that at which
    // we started.
    this._timerId = setInterval(function () {
        // If we have moved the correct number of steps then cancel the timer and return
        // after invoking a callback (if one has been supplied).
        if (stepsLeft <= 0) {
            clearInterval(this._timerId);
            this._timerId = null;
            if (callback != null) {
                callback();
            }
            return;
        } // End of stepsLeft <= 0

        // step the motor to step number 0, 1, ..., {3 or 10}
        stepMotor.call(this);

        stepsLeft--; // Decrement the steps left to move. 

    }.bind(this), this._stepDelay); // End of setInterval
} // End of step


function incrementStepNumber() {
    this._stepNumber++;
    if (this._stepNumber >= this._stepsPerRevolution) {
        this._stepNumber = 0;
    }
} // End of incrementStepNumber


function decrementStepNumber() {
    this._stepNumber--;
    if (this._stepNumber < 0) {
        this._stepNumber = this._stepsPerRevolution - 1;
    }
} // End of decrementStepNumber


/*
 * PRIVATE:
 * Moves the motor forward or backwards.
 */
function stepMotor() {
    // For digital movement, we need only pulse the stepPin.  First we set the direction
    // pin to the desired direction.
    // ENHANCEMENT: It is possible we can eliminate the cost of setting the direction and merely look
    // set it when the direction changes from the last time we stepped the motor.
    console.log("stepMotor: isDigital=%d, stepDelay=%d, stepPin=%d, directionPin=%d",
        this._isDigital, this._stepDelay, this._stepPin, this._directionPin);
    if (this._isDigital === true) {
        if (this._direction == FORWARD) {
            rpio.write(this._directionPin, rpio.HIGH);
        } else {
            rpio.write(this._directionPin, rpio.LOW);
        }
        rpio.write(this._stepPin, rpio.HIGH);
        rpio.sleep(5);
        rpio.write(this._stepPin, rpio.LOW);
        return;
    }

} // End of stepMotor
// End of file

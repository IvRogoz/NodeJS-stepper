var rpio = require('rpio');

/*
 * Blink an LED
 *
 * This example uses the default physical P01-P40 numbering
*/

var pin = 7;
var pin2 = 11;

/*
 * Configure the pin for output, setting it low initially.  The state is set
 * prior to the pin being activated, so is suitable for devices which require
 * a stable setup.
 */

rpio.open(pin, rpio.OUTPUT, rpio.LOW);
rpio.open(pin2, rpio.OUTPUT, rpio.LOW);

/*
 * Blink the LED 5 times.  The sleep functions block, but for a trivial example
 * like this that isn't a problem and simplifies things.
*/

for (var i = 0; i < 5; i++) {

	/* On for 1 second */
	rpio.write(pin, rpio.HIGH);
	rpio.write(pin2, rpio.LOW);
	rpio.sleep(1);

	/* Off for half a second (500ms) */
	rpio.write(pin, rpio.LOW);
	rpio.write(pin2, rpio.HIGH);
	rpio.msleep(500);
}

rpio.write(pin, rpio.LOW)
rpio.write(pin2,rpio.LOW)

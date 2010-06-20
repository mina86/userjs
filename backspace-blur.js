/*
 * ==UserScript==
 * @name         Blur on backspace
 * @namespace    http://mina86.com/
 * @version      0.9
 * @date         2010-06-17
 * @author       Michal “mina86” Nazarewicz <mina86@mina86.com>
 * @description  Shows
 * @description  When backspace is pressed in an empty input field where
 *               this field is blured.
 * @ujs:category browser: enhancements
 * @ujs:download http://github.com/mina86/userjs/raw/master/backspace-blur.js
 * @include      *
 * ==/UserScript==
 */

(function() {
	window.opera.addEventListener('BeforeEvent.keypress', function(e) {
		e = e.event;

		if (e.keyCode != 8) {
			return;
		}

		var blur = false;

		var tag = e.target.tagName.toUpperCase();
		if (tag == 'SELECT') {
			e.target.blur();
		} else if (tag == 'TEXTAREA') {
			blur = e.target.value == '';
		} else if (tag != 'INPUT') {
			/* Nothing */
		} else if (['TEXT', 'FILE', 'PASSWORD'].indexOf(e.target.getAttribute('type').toUpperCase()) != -1) {
			blur = e.target.value == '';
		} else {
			blur = true;
		}

		if (blur) {
			e.target.blur();
			e.preventDefault();
		}
	}, false);
})();

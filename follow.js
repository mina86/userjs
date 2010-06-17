/*
 * ==UserScript==
 * @name        Link Follow Scrpit
 * @namespace   http://mina86.com/
 * @version     0.9
 * @date        2010-06-17
 * @author      Michal “mina86” Nazarewicz <mina86@mina86.com>
 * @description Shows
 * @include     *
 * ==/UserScript==
 *
 * Based partially on follow.js form uzbl-browser.
 *
 * TODO: Some pages mess around a lot with the zIndex which lets some
 *       hints in the background.
 * TODO: Some positions are not calculated correctly (mostly because
 *       of uber-fancy-designed-webpages. Basic HTML and CSS works
 *       good
 * TODO: Still some links can't be followed/unexpected things
 *       happen. Blame some freaky webdesigners. ;)
 */

(function() {
	var doc = document;
	var follow = {

charset: 'htnsueoadify',  // for dvorak
/* charset: 'jkl;fdsauryt',  // qwerty users may like this */
/* charset: '0123456789',    // personally I consider digits to
                             // be the worst opiton */
hintStyle:   'background-color: #B9FF00; border: 2px solid #4A6600; color: black; font-size: 9px; font-weight: bold; line-height: 9px; margin: 0px; width: auto; padding: 1px; position: absolute; zIndex: 1000; text-decoration: none',
promptStyle: 'background-color: #FFB900; border: 2px solid #664A00; color: black; font-size: 11px; font-weight: bold; line-height: 9px; margin: 0px; width: auto; padding: 1px; position: absolute; zIndex: 1000; text-decoration: none; left: 0; bottom: 0',


running: false,
list: null,
prefix: '',
elements: null,
prompt: null,

run: function() {
	this.stop();
	var list = [], i, j, el, n = 0;

	var wLeft   = window.pageXOffset;
	var wTop    = window.pageYOffset;
	var wRight  = wLeft + window.innerWidth;
	var wBottom = wTop  + window.innerHeight;

	var getVisibleBox = function(el) {
		var top    = el.offsetTop;
		var left   = el.offsetLeft;
		for (var o = el; (o = o.offsetParent); ) {
			top  += o.offsetTop;
			left += o.offsetLeft;
		}
		var right  = left + el.offsetWidth;
		var bottom = top  + el.offsetHeight;

		if ((top    >= wBottom) || (left   >= wRight ) ||
			(bottom <= wTop   ) || (right  <= wLeft  )) {
			return false;
		}

		for (; el != doc; el = el.parentNode) {
			if (!el || !el.parentNode || (el.style && (el.style.display == 'none' || el.style.visibility == 'hidden'))) {
				return false;
			}
		}

		if (top    < wTop   ) top = wTop;
		if (left   < wLeft  ) left = wLeft;
		if (right  > wRight ) right = wRight;
		if (bottom > wBottom) bottom = wBottom;

		return [top, left, right, bottom];
	};

	/* Get elements */
	for (i = doc.links.length; i; ) {
		el = doc.links[--i];
		var box = getVisibleBox(el);
		if (box) {
			list[n++] = { element: el, box : box };
		}
	}

	for (i = doc.forms.length; i; ) {
		var els = doc.forms[--i].elements;
		for (j = els.length; j; ) {
			el = els[--j];
			if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(el.tagName) == -1) {
				continue;
			}

			var box = getVisibleBox(el);
			if (box) {
				list[n++] = { element: el, box : box };
			}
		}
	}

	if (!list.length) {
		return;
	}

	/* Assign labels $ hints */
	var elements = doc.createElement('div');
	if (!elements) {
		return;
	}

	var charset = this.charset;
	var chars = charset.length;
	var len = 1;
	for (i = chars; n > i; i *= chars) {
		++len;
	}

	i = n;
	do {
		var label = '', l = len;
		j = n - i;
		do {
			label = charset.charAt(j % chars) + label;
			j = Math.floor(j / chars);
		} while (--l);

		el       = list[--i];
		var hint = doc.createElement('div');
		hint.setAttribute('style', this.hintStyle + '; display: none; left: ' + el.box[1] + 'px; top: ' + el.box[0] + 'px');

		elements.appendChild(hint);
		el.label = label;
		el.hint  = hint;
	} while (i);


	var prompt = doc.createElement('div');
	prompt.setAttribute('style', this.promptStyle + '; display: none;');
	elements.appendChild(prompt);

	doc.body.appendChild(elements);

	/* Run */
	this.running = true;
	this.list = list;
	this.prefix = '';
	this.elements = elements;
	this.prompt = prompt;
	this.update();
},


/* Update hints */
update: function() {
	var list = this.list;
	var prefix = this.prefix;
	var len = prefix.length;
	var count = 0;
	var el;

	/* Filter hints */
	for (var i = list.length; i; ) {
		var item = list[--i];
		if (item.label.substring(0, len) != prefix) {
			item.hint.style.display = 'none';
		} else {
			item.hint.innerText = list[i].label.substring(len);
			item.hint.style.display = 'inline';
			++count;
			el = list[i].element;
		}
	}

	if (count != 1) {
		/* Show prompt */
		if (prefix == '') {
			this.prompt.style.display = 'none';
		} else {
			this.prompt.style.display = 'inline';
			this.prompt.innerText = prefix;
		}
		return;
	}

	/* If there is only one matching, enter link */
	this.stop();

	var name = el.tagName;
	if (name == 'A') {
		el.click();
		window.location = el.href;
	} else if (name == 'INPUT') {
		var type = el.getAttribute('type').toUpperCase();
		if (type == 'TEXT' || type == 'FILE' || type == 'PASSWORD') {
			el.focus();
			el.select();
		} else {
			el.click();
		}
	} else if (name == 'TEXTAREA' || name == 'SELECT') {
		el.focus();
		el.select();
	} else {
		el.click();
		window.location = el.href;
	}
},


/* Clear all leftovers */
stop: function() {
	if (this.elements) {
		this.elements.parentNode.removeChild(this.elements);
		this.elements = null;
	}
	this.running = false;
	this.prompt = null;
	this.list = null;
},


/* Handle key */
key: function(e) {
	var kc = e.keyCode;
	if (kc == 27) {
		this.stop();
	} else if (kc == 8) {
		if (this.prefix == '') {
			this.stop();
		} else {
			this.prefix = this.prefix.substring(0, this.prefix.length - 1);
			this.update();
		}
	} else if (this.charset.indexOf(String.fromCharCode(kc)) != -1) {
		this.prefix += String.fromCharCode(kc);
		this.update();
	} else {
		return true;
	}
	return false;
}
	};


	/* Handle keyboard input */
	window.opera.addEventListener('BeforeEvent.keypress', function(e) {
		e = e.event;

		if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) != -1) {
			return;
		}

		if (follow.running) {
			if (follow.key(e)) {
				return;
			}
		} else if (e.keyCode == 102 || e.keyCode == 70) {
			follow.run();
			if (this.running) {
				return;
			}
		} else {
			return;
		}
		e.preventDefault();
	}, false);
})();

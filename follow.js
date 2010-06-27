/*
 * ==UserScript==
 * @name         Link Follow Scrpit
 * @namespace    http://mina86.com/
 * @version      0.9
 * @date         2010-06-17
 * @author       Michal “mina86” Nazarewicz <mina86@mina86.com>
 * @description  Shows
 * @description  Shows a label next to links and form fields which one
 *               can type to use the element.
 * @ujs:category browser: enhancements
 * @ujs:download http://github.com/mina86/userjs/raw/master/follow.js
 * @include      *
 * ==/UserScript==
 *
 * Inspired by follow.js form uzbl-browser.
 *
 * License: Creative Commons Attribution-Share Alike 3.0 Poland Licence
 *      or: GNU General Public License version 3.0 or at your optional
 *          any later as published by the Free Software Foundation with
 *          exception that this can scrpit can be used as UserJS scrpit.
 *
 * TODO: Some pages mess around a lot with the zIndex which lets some
 *       hints in the background.
 * TODO: Some positions are not calculated correctly (mostly because
 *       of uber-fancy-designed-webpages. Basic HTML and CSS works
 *       good
 * TODO: Still some links can't be followed/unexpected things
 *       happen. Blame some freaky webdesigners. ;)
 * TODO: retMode always opens in background -- allow oppening in
 *       foreground in a new tab.
 * TODO: a normal mode but with opening in new tab (in background).
 *       Switching to retMode requires enter to be pressed.
 * TODO: Shift does not work with special characters.
 */

(function() {
	/* Configuration */


	var retMode = false;

	/* For dvorak, only right hand */
	var charset = 'htnsdgfcrlmwvzb-/@';
	/* For dvorak, both hands */
	/* var charset = 'htnsueoadgfipycrl.,\'mbkxwvzjq;-/@'; */

	/* For qwerty, only right hand */
	/* var charset = 'jkl;huyiopmn,./\'[]'; */
	/* For qwerty, both hands */
	/* var charset = 'jkl;fdsahuygrtiopewqmnvb,./cxz\'[]'; */

	/* Digits (the one thing that makes the least sense) */
	/* var charset = '0123456789';


	/* Alternativell you can set it to false and copy this to a user CSS. */
	/* var style = '.follow-link-hide, .follow-link-hint, .follow-link-match, .follow-link-prompt { letter-spacing: 0.1em; display: inline; background-color: #B9FF00; border: 1px solid #4A6600; color: black; font-size: 10px; font-weight: bold; line-height: 1em; margin: 0px; width: auto; padding: 1px; position: absolute; z-index: 1000; text-decoration: none; } .follow-link-prompt { background-color: #FFB900; border-color: #664A00; position: fixed; left: 0; bottom: 0; } .follow-link-match { background-color: #00B9FF; border-color: #004A66; content: "\\00A0" } .follow-link-hide { display: none } .follow-link-retmode .follow-link-prompt { background-color: #f00 } .follow-link-retmode .follow-link-hint { background-color: #FF0 }'; */
	var style = false;


	/* No need to touch avything below. */
	var doc = document;

	/* Main object */
	var follow = {

running: false,
list: null,
matching: 0,
prefix: '',
elements: null,
prompt: null,
retMode: false,
background: false,


/* Start follow script */
run: function() {
	this.stop();
	var list = [], i, j, el, item, n = 0;

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

		var href = el.href;
		if (!href || href == location.href) {
			continue;
		}

		var box = getVisibleBox(el);
		if (!box) {
			continue;
		}

		for (j = 0; j < n && list[j][0].el.href != href; ++j) {
			/* nop */
		}

		item = { el: el, box: box };
		if (j == n) {
			list[n++] = [ item ];
		} else {
			list[j][list[j].length] = item;
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
				list[n++] = [ { el: el, box: box } ];
			}
		}
	}

	if (!list.length) {
		return;
	}

	/* Assign labels & hints */
	var elements = doc.createElement('div');
	if (this.retMode) {
		elements.setAttribute('class', 'follow-link-retmode');
	}

	var chars = charset.length;
	i = n;
	do {
		item = list[--i];

		var label = '', m = 1, r = 0;
		j = n - i - 1;
		do {
			var u = j % chars;
			j = Math.floor(j / chars);
			label += charset.charAt(u);
			r += u * m;
			m *= chars;
		} while (m + r < n);

		item.label = label;
		item.match = false;

		j = item.length;
		do {
			el = item[--j];
			var hint = doc.createElement('div');
			hint.setAttribute('class', 'follow-link-hint');
			hint.setAttribute('style', 'left: ' + el.box[1] + 'px; top: ' + el.box[0] + 'px');
			elements.appendChild(hint);
			el.hint  = hint;
		} while (j);
	} while (i);


	var prompt = doc.createElement('div');
	prompt.setAttribute('class', 'follow-link-prompt');
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


/* Check if label matches prefix */
match: function(label) {
	var prefix = this.prefix.split(' ');
	var n = prefix.length;
	if (!n) return label;

	for (i = 0; i < n - 1; ++i) {
		if (label == prefix[i]) {
			return '';
		}
	}

	prefix = prefix[i];
	n = prefix.length;
	if (!n) return label;

	if (label.substring(0, n) == prefix) {
		return label.substring(n);
	}

	return false;
},


/* Update hints */
update: function() {
	var list = this.list;
	var count = 0;
	var el;

	/* Filter hints */
	for (var i = list.length; i; ) {
		var item = list[--i], match = this.match(item.label), class;
		if (match === false) {
			item.match = false;
			class = 'follow-link-hide';
			match = '';
		} else if (match === '') {
			item.match = true;
			class = 'follow-link-match';
			++count;
			el = item[0].el;
		} else {
			item.match = false;
			class = 'follow-link-hint';
		}

		var j = item.length;
		do {
			var e = item[--j];
			e.hint.setAttribute('class', class);
			e.hint.innerText = match;
		} while (j);
	}

	this.matching = count;

	if (count != 1 || this.retMode) {
		this.prompt.innerText = this.prefix === '' ? '\xA0' : this.prefix;
	} else {
		/* If there is only one matching, enter link */
		this.stop();
		this.click(el, this.background);
	}
},


/* Opens maching item(s) */
click: function(el, background) {
	var name = el.tagName;
	if (name == 'INPUT') {
		name = el.getAttribute('type').toUpperCase();
		if (name == 'TEXT' || name == 'FILE' || name == 'PASSWORD') {
			el.focus();
			el.select();
		} else {
			el.click();
		}
	} else if (name == 'TEXTAREA' || name == 'SELECT') {
		el.focus();
		el.select();
	} else if (background) {
		window.open(el.href, '_blank').blur();
	} else {
		el.click();
		/* window.location = el.href; */
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


/* Ret pressed in retMode */
ret: function(background) {
	var n = this.matching;
	if (n) {
		background = background || n > 1;
		var list = this.list;
		for (var i = list.length; n; ) {
			if (list[--i].match) {
				this.click(list[i][0].el, background);
				--n;
			}
		}
	}
	this.stop();
},


/* Handle key */
key: function(e) {
	var prefix = this.prefix;
	var kc = e.keyCode;
	if (kc == 27) {
		this.stop();

	} else if (kc == 8) {
		if (prefix == '') {
			this.stop();
		} else {
			this.prefix = prefix.substring(0, prefix.length - 1);
			this.update();
		}

	} else if (charset.indexOf(String.fromCharCode(kc).toLowerCase()) != -1) {
		this.background = e.shiftKey;
		this.prefix += String.fromCharCode(kc).toLowerCase();
		this.update();
	} else if (this.retMode && (kc == 10 || kc == 13)) {
		this.ret(false);
	} else if (kc != 32) {
		return true;
	} else if (prefix == '') {
		this.retMode = !this.retMode;
		if (this.retMode) {
			this.elements.setAttribute('class', 'follow-link-retmode');
		} else {
			this.elements.removeAttribute('class');
		}
	} else if (this.retMode && prefix.substring(prefix.length - 1) != ' ') {
		this.prefix += ' ';
		this.update();
	} else {
		return true;
	}
	return false;
}
	};


	/* Add stylesheet */
	if (style) {
		doc.addEventListener('DOMContentLoaded', function(e) {
			style = doc.createTextNode(style);
			if (!style) return;

			var styleElement = doc.createElement('style');
			if (!styleElement) return;

			styleElement.setAttribute("type", "text/css");
			styleElement.appendChild(style);

			var head = doc.getElementsByTagName('head');
			if (!head.length) return;

			head[0].appendChild(styleElement);
			style = null;
		}, false);
	}


	/* Handle keyboard input */
	window.opera.addEventListener('BeforeEvent.keypress', function(e) {
		e = e.event;

		if (e.altKey || e.ctrlKey || e.metaKey || e.keyCode != e.which ||
		    ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) != -1) {
			if (follow.running) follow.stop();
			return;
		}

		if (follow.running) {
			if (follow.key(e)) {
				return;
			}
		} else if (e.keyCode == 102 || e.keyCode == 70) {
			follow.retMode = e.shiftKey == !retMode;
			follow.run();
			if (this.running) {
				return;
			}
		} else {
			return;
		}
		e.preventDefault();
	}, false);


	/* Cancel on click */
	window.opera.addEventListener('BeforeEvent.click', function (e) {
		if (follow.running) {
			follow.stop();
		}
	}, false);
})();

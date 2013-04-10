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
 *       of uber-fancy-designed-webpages). Basic HTML and CSS works
 *       good.
 * TODO: Still some links can't be followed/unexpected things
 *       happen. Blame some freaky webdesigners. ;)
 * TODO: At <http://github.com/> pressing “s” focuses the “Search”
 *       field which interferes with this script if “s” is in the
 *       charset.
 * TODO: retMode always opens in background -- allow oppening in
 *       foreground in a new tab.
 * TODO: a normal mode but with opening in new tab (in background).
 *       Switching to retMode requires enter to be pressed.
 * TODO: Shift does not work with special characters.
 *
 * See documentation at <http://github.com/mina86/userjs>.
 */

(function(D, W) {
	/* Configuration */
	var retMode = false, charset, style = false;


	/* For dvorak, only right hand */
	charset = 'htnsdgfcrlmwvzb-/@';
	/* For dvorak, both hands */
	/* charset = 'htnsueoadgfipycrl.,\'mbkxwvzjq;-/@'; */

	/* For qwerty, only right hand */
	/* charset = 'jkl;huyiopmn,./\'[]'; */
	/* For qwerty, both hands */
	/* charset = 'jkl;fdsahuygrtiopewqmnvb,./cxz\'[]'; */

	/* Digits (the one thing that makes the least sense) */
	/* charset = '0123456789'; */


	/* Alternativell you can leave it commented and copy this to a user CSS. */
	/* style = 'div.follow-link-hide, div.follow-link-hint, div.follow-link-match, div.follow-link-prompt { letter-spacing: 0.1em !important; display: inline !important; background-color: #B9FF00 !important; border: 1px solid #4A6600 !important; color: black !important; font-size: 10px !important; font-weight: bold !important; line-height: 1em !important; margin: 0px !important; width: auto !important; padding: 1px !important; position: absolute !important; z-index: 1000 !important; text-decoration: none !important; } div.follow-link-prompt { background-color: #FFB900 !important; border-color: #664A00 !important; position: fixed !important; left: 0 !important; bottom: 0 !important; } div.follow-link-match { background-color: #00B9FF !important; border-color: #004A66 !important; content: "\\00A0" !important; } div.follow-link-hide { display: none !important; } div.follow-link-retmode div.follow-link-prompt { background-color: #f00 !important; } div.follow-link-retmode div.follow-link-hint { background-color: #FF0 !important; }' */


	/* No need to touch avything below. */
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
clickable: [],


/* Record that an element has "click" listener. */
recordClickable: function(el) {
	if (!el.tagName) {
		return;
	}
	var tagName = el.tagName.toUpperCase()

	if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].indexOf(tagName) != -1) {
		/* All of those elements are included uncodnitionally
		 * every time, so there is no need to track them in
		 * the clicable list. */
	} else if (tagName == 'A') {
		/* All links are scanned anyway and either href or
		 * onclick is tested, so instead of tracking links in
		 * clicable list, it's enough to make sure that
		 * onclick is set. */
		if (!el.onclick) {
			el.onclick = function(e) {
				return true;
			};
		}
	} else if (follow.clickable.indexOf(this) == -1) {
		follow.clickable.push(this);
	}
},


/* Scan for clicable elemenst of given tag name. */
scanClickable: function(elements, areLinks, list, getVisibleBox) {
	var i = elements.length, j, n = list.length;
	while (i) {
		var el = elements[--i];

		if (areLinks &&
		    (!el.href || el.href == location.href) &&
		    !el.onclick) {
			continue;
		}

		var box = getVisibleBox(el);
		if (!box) {
			continue;
		}

		var item = { el: el, box: box };

		if (areLinks && !el.onclick) {
			for (j = 0; j < n && list[j][0].el.href != el.href; ++j) {
				/* nop */
			}

			if (j < n) {
				list[j].push(item);
				continue;
			}
		}

		list.push([item]);
		++n;
	}
},


/* Start follow script */
run: function() {
	var list, el, item, i, j, n, cmp, label, m, r, j, u;

	this.stop();
	list = [];

	/* Get visible box of an element. */
	wLeft   = W.pageXOffset;
	wTop    = W.pageYOffset;
	wRight  = wLeft + W.innerWidth;
	wBottom = wTop  + W.innerHeight;

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

		for (; el != D; el = el.parentNode) {
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

	/* Get all clicable and visible elements. */
	this.scanClickable(D.getElementsByTagName('A'), true, list, getVisibleBox);
	this.scanClickable(D.getElementsByTagName('INPUT'), false, list, getVisibleBox);
	this.scanClickable(D.getElementsByTagName('TEXTAREA'), false, list, getVisibleBox);
	this.scanClickable(D.getElementsByTagName('SELECT'), false, list, getVisibleBox);
	this.scanClickable(D.getElementsByTagName('BUTTON'), false, list, getVisibleBox);
	this.scanClickable(this.clickable, false, list, getVisibleBox);

	n = list.length;
	if (!n) {
		return;
	}

	/* Sort by position in document tree. */
	if (D.sourceIndex) {
		cmp = function(a, b) {
			return a.sourceIndex - b.sourceIndex;
		};
	} else if (D.compareDocumentPosition) {
		cmp = function(a, b) {
			return 3 - (a.compareDocumentPosition(b) & 6);
		};
	}
	for (i = n; i; ) {
		list[--i].sort(function(a, b) {
			return cmp(a.el, b.el);
		});
	}
	list.sort(function(a, b) { return cmp(a[0].el, b[0].el); });

	/* Assign labels & hints */
	var elements = D.createElement('div');
	if (this.retMode) {
		elements.setAttribute('class', 'follow-link-retmode');
	}

	var chars = charset.length, i = n;
	do {
		item = list[--i];

		var label = '', m = 1, r = 0, j = n - i - 1;
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
			var hint = D.createElement('div');
			hint.setAttribute('class', 'follow-link-hint');
			hint.setAttribute('style', 'left: ' + el.box[1] + 'px; top: ' + el.box[0] + 'px');
			elements.appendChild(hint);
			el.hint  = hint;
		} while (j);
	} while (i);

	var prompt = D.createElement('div');
	prompt.setAttribute('class', 'follow-link-prompt');
	elements.appendChild(prompt);

	D.body.appendChild(elements);

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
		var item = list[--i], match = this.match(item.label), cssClass;
		if (match === false) {
			item.match = false;
			cssClass = 'follow-link-hide';
			match = '';
		} else if (match === '') {
			item.match = true;
			cssClass = 'follow-link-match';
			++count;
			el = item[0].el;
		} else {
			item.match = false;
			cssClass = 'follow-link-hint';
		}

		var j = item.length;
		do {
			var e = item[--j];
			e.hint.setAttribute('class', cssClass);
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
	} else if (background && el.href) {
		W.open(el.href, '_blank').blur();
	} else {
		el.click();
		/* W.location = el.href; */
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
		this.ret(this.retMode);
	} else if (kc != 32) {
		return true;
	} else if (prefix == '') {
		this.retMode = !this.retMode;
		if (this.retMode) {
			this.elements.setAttribute('class', 'follow-link-retmode');
		} else {
			this.elements.removeAttribute('class');
		}
	} else if (!this.retMode) {
		return true;
	} else if (prefix.substring(prefix.length - 1) != ' ') {
		this.prefix += ' ';
		this.update();
	} else {
		this.ret(this.retMode);
	}
	return false;
}
	};


	/* Overwrite addEventListener() to catch everything that is
	 * clickable. */
	var orig_addEventListener = Node.prototype.addEventListener;
	Node.prototype.addEventListener = function(type, listener, useCapture) {
		type = type.toLowerCase();
		if (type == 'click' || type == 'mousedown') {
			follow.recordClickable(this);
		}
		return orig_addEventListener.call(this, type, listener, useCapture);
	};


	/* Add stylesheet */
	if (style) {
		D.addEventListener('DOMContentLoaded', function(e) {
			style = D.createTextNode(style);
			if (!style) return;

			var styleElement = D.createElement('style');
			if (!styleElement) return;

			styleElement.setAttribute("type", "text/css");
			styleElement.appendChild(style);

			var head = D.getElementsByTagName('head');
			if (!head.length) return;

			head[0].appendChild(styleElement);
			style = null;
		}, false);
	}


	/* Handle keyboard input */
	W.opera.addEventListener('BeforeEvent.keypress', function(e) {
		e = e.event;

		if (e.altKey || e.ctrlKey || e.metaKey || e.keyCode != e.which ||
		    ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName.toUpperCase()) != -1) {
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
			if (follow.running) {
				return;
			}
		} else {
			return;
		}
		e.preventDefault();
	}, false);


	/* Cancel on click */
	W.opera.addEventListener('BeforeEvent.click', function (e) {
		if (follow.running) {
			follow.stop();
		}
	}, false);
})(document, window);

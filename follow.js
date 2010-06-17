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
charset: 'htnsueoadify',


running: false,
list: null,
prefix: '',
elements: null,
prompt: null,

run: function() {
	this.stop();
	var list = [], i, j, el;

	/* Get elements */
	for (i = 0; i < doc.links.length; ++i) {
		el = doc.links[i];
		if (el.isInView()) {
			list[list.length] = { element: el };
		}
	}

	for (i = 0; i < doc.forms.length; ++i) {
		var els = doc.forms[i].elements;
		for (j = 0; j < els.length; ++j) {
			el = els[j];
			if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(el.tagName) != -1 && el.isInView()) {
				list[list.length] = { element: el };
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
	var n = list.length, len = 1;
	for (i = chars; n > i; i *= chars) {
		++len;
	}

	for (i = 0; i < n; ++i) {
		var label = '', l = len;
		j = i;
		do {
			label = charset.charAt(j % chars) + label;
			j = Math.floor(j / chars);
		} while (--l);

		var pos  = list[i].element.getBoundingBox();
		var hint = doc.createElement('div');
		hint.style.display = 'none';
		hint.style.backgroundColor = '#B9FF00';
		hint.style.border = '2px solid #4A6600';
		hint.style.color = 'black';
		hint.style.fontSize = '9px';
		hint.style.fontWeight = 'bold';
		hint.style.lineHeight = '9px';
		hint.style.margin = '0px';
		hint.style.width = 'auto'; /* fix broken rendering on w3schools.com */
		hint.style.padding = '1px';
		hint.style.position = 'absolute';
		hint.style.zIndex = '1000';
		/* hint.style.textTransform = 'uppercase'; */
		hint.style.left = pos[1] + 'px';
		hint.style.top = pos[0] + 'px';
		/*
		  var img = el.getElementsByTagName('img');
		  if (img.length > 0) {
		  hint.style.top = pos[1] + img[0].height / 2 - 6 + 'px';
		  }
		*/
		hint.style.textDecoration = 'none';
		/* hint.style.webkitBorderRadius = '6px'; */

		elements.appendChild(hint);
		list[i].label = label;
		list[i].hint  = hint;
	}


	var prompt = doc.createElement('div');
	prompt.style.display = 'none';
	prompt.style.backgroundColor = '#FFB900';
	prompt.style.border = '2px solid #664A00';
	prompt.style.color = 'black';
	prompt.style.fontSize = '11px';
	prompt.style.fontWeight = 'bold';
	prompt.style.lineHeight = '9px';
	prompt.style.margin = '0px';
	prompt.style.width = 'auto'; /* fix broken rendering on w3schools.com */
	prompt.style.padding = '1px';
	prompt.style.position = 'absolute';
	prompt.style.zIndex = '1000';
	/* prompt.style.textTransform = 'uppercase'; */
	prompt.style.left = '0';
	prompt.style.bottom = '0';
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
	for (var i = 0; i < list.length; ++i) {
		if (list[i].label.substring(0, len) != prefix) {
			list[i].hint.style.display = 'none';
		} else {
			list[i].hint.innerText = list[i].label.substring(len);
			list[i].hint.style.display = 'inline';
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
		var cont = true;
		e = e.event;
		if (follow.running) {
			cont = follow.key(e);
		} else if (e.keyCode == 102 || e.keyCode == 70) {
			follow.run();
			cont = !this.running;
		}
		if (!cont) {
			e.preventDefault();
		}
	}, false);



	/* Make onlick-links "clickable" */
	HTMLElement.prototype.click = function() {
		if (typeof this.onclick == 'function') {
			this.onclick({ type: 'click' });
		}
	};

	/* Calculate element position to draw the hint.  Pretty accurate
	 * but on fails in some very fancy cases */
	HTMLElement.prototype.getBoundingBox = function() {
		var up     = this.offsetTop;
		var left   = this.offsetLeft;
		var width  = this.offsetWidth;
		var height = this.offsetHeight;
		for (var el = this; (el = el.offsetParent); ) {
			up   += el.offsetTop;
			left += el.offsetLeft;
		}
		return [up, left, width, height];
	};

	/* Calculate if an element is on the viewport and visible. */
	HTMLElement.prototype.isInView = function() {
		var box    = this.getBoundingBox();
		if (( box[0]           >= (window.pageYOffset + window.innerHeight)) ||
			( box[1]           >= (window.pageXOffset + window.innerWidth))  ||
			((box[0] + box[3]) <=  window.pageYOffset) ||
			((box[1] + box[2]) <=  window.pageXOffset)) {
			return false;
		}

		for (var el = this; el != doc; el = el.parentNode) {
			if (!el || !el.parentNode || (el.style && (el.style.display == 'none' || el.style.visibility == 'hidden'))) {
				return false;
			}
		}
		return true;
	};
})();

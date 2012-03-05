/*
 * ==UserScript==
 * @name         ToolTip
 * @namespace    http://mina86.com/
 * @version      0.9
 * @date         2010-06-17
 * @author       Michal “mina86” Nazarewicz <mina86@mina86.com>
 * @description  Shows a tooltip in lower left corner when link etc is hovered.
 * @ujs:category browser: enhancements
 * @ujs:download http://github.com/mina86/userjs/raw/master/tip.js
 * @exclude      *.google.com/*
 * @include      *
 * ==/UserScript==
 *
 * See documentation at <http://github.com/mina86/userjs>.
 */

(function(W, D) {
	/***** Configuration *****/

	var style = false;
	/* Alternativell you can leave it commented and copy this to a user CSS. */
	style = 'table#tool-tip-text { display: none; } @media screen, tv { table#tool-tip-text, table#tool-tip-text thead, table#tool-tip-text tbody, table#tool-tip-text tr, table#tool-tip-text tr td, table#tool-tip-text tr th { margin: 0 !important; padding: 0 !important; border: 0 none #000 !important; color: #000 !important; font-weight: normal !important; line-height: 1em !important; border-collapse: collapse !important; text-decoration: none !important; background-color: #F90 !important; width: auto !important; vertical-align: top !important; text-align: left; } table#tool-tip-text { border: 1px solid #664A00 !important; z-index: 1000 !important; position: fixed !important; left: 0 !important; bottom: 0 !important; } table#tool-tip-text.tool-tip-visible { display: table !important; } table#tool-tip-text tfoot { display: none; } table#tool-tip-text tfoot.tool-tip-visible { display: table-row-group !important; } table#tool-tip-text tr td { padding: 1px !important; font-size: 12px !important; } table#tool-tip-text tr th { padding: 1px !important; font-size: 10px !important; background-color: #9F0 !important; } table#tool-tip-text thead tr th { background-color: #FF0 !important; } table#tool-tip-text tfoot tr td { background-color: #999 !important; } table#tool-tip-text tfoot tr td.tool-tip-secure { background-color: #9F9 !important; } table#tool-tip-text tfoot tr td em { font-weight: bold !important; } table#tool-tip-text.tool-tip-keyboard-hide, table#tool-tip-text.tool-tip-keyboard-hide.tool-tip-visible { display: none !important; } }';

	/*
	 * A list of attributes to show in the tool tip.  Each element of
	 * the array is a 4-element array which elements have the
	 * following meaning:
	 *
	 * 1. the attribetu name,
	 * 2. the text the sow in TH,
	 * 3. whether attribute is protected,
	 * 4. class name to add to TR element or false.

	 * Protected attributes are such that are shown even if their
	 * value is shared with some other attribute.  For instance, in
	 * default settings if alt and title had the same value only the
	 * first one will be shown.  However, if href had the same value
	 * as some other earlier attribute it will be shown regardless.
	 * This may happen especially if an image is a link and image's
	 * alt is the same as link's href.  In such cases, the alt won't
	 * be shown though.
	 */

	var attrs = [
		[ 'href',    'H', true , false ],
		[ 'onclick', 'C', true , false ],
		[ 'alt',     'A', false, false ],
		[ 'title',   'T', false, false ],
		[ 'src',     'S', false, false ]
	];

	/*
	 * Set to true if you want element's information to be displayed
	 * (tag name, ID, class).
	 */
	var showElementInfo = true;

	/* Set to true if you want page URL to be dispaleyed.  Set to
	 * 'auto' (with apostrophes) to make it disappear if there are
	 * some attributes shown. */
	var showLocation = 'auto';

	/***** No need to touch avything below. *****/

	if (W.parent != W) {
		/* If we are in an iframe don't polute the frame
		 * (since iframes tend to be small).  Unfortunatelly,
		 * this also catches framesets. */
		showLocation = false;
		showElementInfo = false;
	}

	D.addEventListener('DOMContentLoaded', function(e) {
		/* Add style */
		if (style) {
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
		}

		/* Create elements */
		var attributes, location = null, old_target = null, updateInfo;
		var table = D.createElement('table');
		table.setAttribute('id', 'tool-tip-text');

		table.tooltip_classes = new Array();
		table.tooltip_modClass = function(add, rem) {
			var classes = this.tooltip_classes;
			var idx = classes.indexOf(rem);
			if (idx != -1) {
				classes.splice(idx, 1);
			}
			if (add && (idx = classes.indexOf(add))) {
				classes[classes.length] = add;
			}
			this.setAttribute('class', this.tooltip_classes.join(' '));
		};

		if (showElementInfo) {
			var old_info_target = null, elementInfo;
			updateInfo = function (e) {
if (e == old_info_target) {
	return;
}

old_info_target = e;

while (elementInfo.firstChild) {
	elementInfo.removeChild(elementInfo.firstChild);
}

var span = D.createElement('span');
span.setAttribute('class', 'tool-tip-tagname');
span.innerText = e.tagName.toLowerCase();
elementInfo.appendChild(span);

var tmp = e.getAttribute('id');
if (tmp) {
	span = D.createElement('span');
	span.setAttribute('class', 'tool-tip-id');
	span.innerText = '#' + tmp;
	elementInfo.appendChild(span);
}

tmp = e.getAttribute('class');
if (tmp) {
	span = D.createElement('span');
	span.setAttribute('class', 'tool-tip-class');
	span.innerText = '.' + tmp.replace(' ', '.');
	elementInfo.appendChild(span);
}
			};

			var thead = D.createElement('thead');
			var tr = D.createElement('tr');
			elementInfo = D.createElement('th');
			elementInfo.setAttribute('colspan', '2');
			tr.appendChild(elementInfo);
			updateInfo(D.body);
			thead.appendChild(tr);
			table.appendChild(thead);
		} else {
			updateInfo = function (e) { };
		}

		attributes = D.createElement('tbody');
		table.appendChild(attributes);

		if (showLocation) {
			var tfoot = D.createElement('tfoot');
			var tr = D.createElement('tr');
			var td = D.createElement('td');
			td.setAttribute('colspan', '2');

			if (W.location.protocol == 'https:') {
				td.setAttribute('class', 'tool-tip-secure');
			}

			td.innerText = W.location.href;

			tfoot.setAttribute('class', 'tool-tip-visible');

			tr.appendChild(td);
			tfoot.appendChild(tr);
			table.appendChild(tfoot);

			if (showLocation === 'auto') {
				location = tfoot;
			}
		}

		D.body.parentNode.appendChild(table);
		if (showLocation || showElementInfo) {
			table.tooltip_modClass('tool-tip-visible', 'tool-tip-hidden');
		}


		/* The handler */
		D.body.addEventListener('mouseover', function(e) {
var messages = [], count = 0, target = null, map = [ ];

e = e.target;
updateInfo(e);

for (; e && e.getAttribute; e = e.parentNode) {
	for (var i = 0, l = attrs.length; i < l; ++i) {
		var attr = e.getAttribute(attrs[i][0]);

		if (!attr || (!attrs[i][2] && map['attr_' + attr])) {
			continue;
		}

		if (map['attr_' + attr] && map['attr_' + attr] > 0) {
			messages[map['attr_' + attr] - 1] = false;
		}

		map['attr_' + attr] = attrs[i][2] ? -1 : (count + 1);
		messages[count++] = [ attrs[i][1], attr, attrs[i][3] ];
	}

	if (count && !target) target = e;
}
map = null;


if (old_target == target) {
	return;
}

old_target = target;

while (attributes.firstChild) {
	attributes.removeChild(attributes.firstChild);
}

if (!count) {
	if (!showElementInfo && !showLocation) {
		table.tooltip_modClass('tool-tip-hidden', 'tool-tip-visible');
	} else if (location) {
		location.setAttribute('class', 'tool-tip-visible');
	}
	return;
}

for (var i = 0; i < count; ++i) {
	var row = D.createElement('tr');
	if (messages[i][2]) {
		row.setAttribute('class', messages[i][2]);
	}

	var th  = D.createElement('th');
	var td  = D.createElement('td');

	th.innerText = messages[i][0];
	td.innerText = messages[i][1];
	row.appendChild(th);
	row.appendChild(td);

	attributes.appendChild(row);
}

table.tooltip_modClass('tool-tip-visible', 'tool-tip-hidden');
if (location) {
	location.setAttribute('class', 'tool-tip-hidden');
}
		}, false);

		/* Disable on some key down events */
		var keyHandler = function(e) {
			if (e.ctrlKey) { // && (e.altKey || e.metaKey)) {
				table.tooltip_modClass('tool-tip-keyboard-hide', '');
			} else {
				table.tooltip_modClass('', 'tool-tip-keyboard-hide');
			}
		};
		D.body.addEventListener('keydown', keyHandler, false);
		D.body.addEventListener('keyup', keyHandler, false);

	}, false);
})(window, window.document);

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
 * @include      *
 * ==/UserScript==
 *
 * See documentation at <http://github.com/mina86/userjs>.
 */

(function() {
	/* Configuration */

	var style = false;
	/* Alternativell you can leave it commented and copy this to a user CSS. */
	style = 'table#tool-tip-text, table#tool-tip-text thead, table#tool-tip-text tbody, table#tool-tip-text tr, table#tool-tip-text tr td, table#tool-tip-text tr th { margin: 0 !important; padding: 0 !important; border: 0 none #000 !important; color: #000 !important; font-weight: normal !important; line-height: 1em !important; border-collapse: collapse !important; text-decoration: none !important; background-color: #F90 !important; width: auto !important; vertical-align: top !important; text-align: left; } table#tool-tip-text { display: none; border: 1px solid #664A00 !important; z-index: 1000 !important; position: fixed !important; left: 0 !important; bottom: 0 !important; } table#tool-tip-text tr td { padding: 1px !important; font-size: 12px !important; } table#tool-tip-text tr th { padding: 1px !important; font-size: 10px !important; background-color: #9F0 !important; } table#tool-tip-text thead tr th { background-color: #FF0 !important; } table#tool-tip-text tfoot tr td { background-color: #999 !important; } table#tool-tip-text tfoot tr td.tool-tip-secure { background-color: #9F9 !important; }';

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

	/* Set to true, if you want page URL to be dispaleyed.  Set to
	 * 'auto' (with apostrophes) to make it disappear if there are
	 * some attributes shown. */
	var showLocation = 'auto';


	/* No need to touch avything below. */
	var doc = document;
	doc.addEventListener('DOMContentLoaded', function(e) {
		/* Add style */
		if (style) {
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
		}

		/* Create elements */
		var attributes, location = null, old_target = null, updateInfo;
		var table = doc.createElement('table');
		table.setAttribute('id', 'tool-tip-text');

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

var span = doc.createElement('span');
span.setAttribute('class', 'tool-tip-tagname');
span.innerText = e.tagName.toLowerCase();
elementInfo.appendChild(span);

var tmp = e.getAttribute('id');
if (tmp) {
	span = doc.createElement('span');
	span.setAttribute('class', 'tool-tip-id');
	span.innerText = '#' + tmp;
	elementInfo.appendChild(span);
}

tmp = e.getAttribute('class');
if (tmp) {
	span = doc.createElement('span');
	span.setAttribute('class', 'tool-tip-class');
	span.innerText = '.' + tmp.replace(' ', '.');
	elementInfo.appendChild(span);
}
			};

			var thead = doc.createElement('thead');
			var tr = doc.createElement('tr');
			elementInfo = doc.createElement('th');
			elementInfo.setAttribute('colspan', '2');
			tr.appendChild(elementInfo);
			updateInfo(doc.body);
			thead.appendChild(tr);
			table.appendChild(thead);
		} else {
			updateInfo = function (e) { };
		}

		attributes = doc.createElement('tbody');
		table.appendChild(attributes);

		if (showLocation) {
			var tfoot = doc.createElement('tfoot');
			var tr = doc.createElement('tr');
			var td = doc.createElement('td');
			td.setAttribute('colspan', '2');

			if (window.location.protocol == 'https:') {
				td.setAttribute('class', 'tool-tip-secure');
			}

			td.innerText = window.location.href;

			tr.appendChild(td);
			tfoot.appendChild(tr);
			table.appendChild(tfoot);

			if (showLocation === 'auto') {
					location = tfoot;
			}
		}

		doc.body.appendChild(table);
		if (showLocation || showElementInfo) {
			table.style.display = 'table';
		}


		/* The handler */
		doc.body.addEventListener('mouseover', function(e) {
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
		table.style.display = 'none';
	} else if (location) {
		location.style.display = 'table-row-group';
	}
	return;
}

for (var i = 0; i < count; ++i) {
	var row = doc.createElement('tr');
	if (messages[i][2]) {
		row.setAttribute('class', messages[i][2]);
	}

	var th  = doc.createElement('th');
	var td  = doc.createElement('td');

	th.innerText = messages[i][0];
	td.innerText = messages[i][1];
	row.appendChild(th);
	row.appendChild(td);

	attributes.appendChild(row);
}

table.style.display = 'table';
if (location) {
	location.style.display = 'none';
}
		}, false);
	}, false);
})();

/*
 * ==UserScript==
 * @name         ToolTip
 * @namespace    http://mina86.com/
 * @version      1.0
 * @date         2010-07-11
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
	style = 'table#tool-tip-text, table#tool-tip-text thead, table#tool-tip-text tbody, table#tool-tip-text tr, table#tool-tip-text tr td, table#tool-tip-text tr th { margin: 0 !important; padding: 0 !important; border: 0 none #000 !important; color: #000 !important; font-weight: normal !important; line-height: 1em !important; border-collapse: collapse !important; text-decoration: none !important; background-color: #F90 !important; width: auto !important; vertical-align: top !important; text-align: left; } table#tool-tip-text { display: none; border: 1px solid #664A00 !important; z-index: 1000 !important; position: fixed !important; left: 0 !important; bottom: 0 !important; } table#tool-tip-text tr td { padding: 1px !important; font-size: 12px !important; } table#tool-tip-text tr th { padding: 1px !important; font-size: 10px !important; background-color: #9F0 !important; } table#tool-tip-text thead tr th { background-color: #FF0 !important; }';

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


	/* No need to touch avything below. */
	var doc = document, content = null, old_target = null;
	var handler = function(e) {
		/* e = e.event; */

		var messages = [], count = 0, target = null, map = [ ];;

		if (showElementInfo) {
			target = e.target;
		}

		for (e = e.target; e && e.getAttribute; e = e.parentNode) {
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

		if (target == old_target) {
			return;
		}
		old_target = target;

		content.style.display = 'none';
		while (content.firstChild) {
			content.removeChild(content.firstChild);
		}

		if (count == 0 && !showElementInfo) {
			return;
		}


		if (showElementInfo) {
			var thead = doc.createElement('thead');
			var row = doc.createElement('tr');
			var th  = doc.createElement('th');
			th.setAttribute('colspan', '2');

			var span = doc.createElement('span');
			span.setAttribute('class', 'tool-tip-tagname');
			span.innerText = target.tagName.toLowerCase();
			th.appendChild(span);

			var tmp = target.getAttribute('id');
			if (tmp) {
				span = doc.createElement('span');
				span.setAttribute('class', 'tool-tip-id');
				span.innerText = '#' + tmp;
				th.appendChild(span);
			}

			tmp = target.getAttribute('class');
			if (tmp) {
				span = doc.createElement('span');
				span.setAttribute('class', 'tool-tip-class');
				span.innerText = '.' + tmp.replace(' ', '.');
				th.appendChild(span);
			}

			row.appendChild(th);
			thead.appendChild(row);
			content.appendChild(thead);
		}


		var tbody = count ? doc.createElement('tbody') : null;
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

			tbody.appendChild(row);
		}

		if (tbody) {
			content.appendChild(tbody);
		}
		content.style.display = 'table';
	};


	doc.addEventListener('DOMContentLoaded', function(e) {
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


		content = doc.createElement('table');
		content.setAttribute('id', 'tool-tip-text');
		doc.body.appendChild(content);
		doc.body.addEventListener('mouseover', handler, false);
		/* window.opera.addEventListener('BeforeEvent.mouseout' , handler, false); */
	}, false);
})();

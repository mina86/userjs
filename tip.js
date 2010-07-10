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
	style = '#tool-tip-text, #tool-tip-text tr, #tool-tip-text td, #tool-tip-text th { margin: 0 !important; padding: 0 !important; border: 0 none #000 !important; color: #000 !important; font-weight: normal !important; border-collapse: collapse !important; text-decoration: none !important; background-color: #F90 !important; } #tool-tip-text { display: none; border: 1px solid #664A00 !important; width: auto !important; z-index: 1000 !important; position: fixed !important; left: 0 !important; bottom: 0 !important; } #tool-tip-text td { padding: 1px !important; font-size: 10px !important; } #tool-tip-text th { padding: 1px !important; font-size: 8px !important; background-color: #9F0 !important; }';


	/* No need to touch avything below. */
	var doc = document, content = null, old_target = null;
	var handler = function(e) {
		/* e = e.event; */

		var messages = [], count = 0, target = null;
		var dbg = '';
		for (e = e.target; e && e.getAttribute; e = e.parentNode) {
			dbg += e + "\n";

			var title = e.getAttribute('title');
			var alt   = e.getAttribute('alt');
			var src   = e.getAttribute('src');
			var href  = e.getAttribute('href');
			var text  = e.innerText;

			if (title == alt ) alt   = null;
			if (title == src ) title = null;
			if (alt   == src ) alt   = null;
			if (title == href) title = null;
			if (alt   == href) alt   = null;
			if (title == text) title = null;
			if (alt   == text) alt   = null;

			if (href ) messages[count++] = [ 'H' , href  ];
			if (alt  ) messages[count++] = [ 'A'  , alt   ];
			if (src  ) messages[count++] = [ 'S'  , src   ];
			if (title) messages[count++] = [ 'T', title ];

			if (count && !target) {
				target = e;
			}
		}

		if (target == old_target) {
			return;
		}
		old_target = target;

		content.style.display = 'none';
		while (content.firstChild) {
			content.removeChild(content.firstChild);
		}

		if (count == 0) {
			return;
		}

		for (var i = 0; i < count; ++i) {
			var row = doc.createElement('tr');
			var th  = doc.createElement('th');
			var td  = doc.createElement('td');

			th.innerText = messages[i][0];
			td.innerText = messages[i][1];
			row.appendChild(th);
			row.appendChild(td);

			content.appendChild(row);
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

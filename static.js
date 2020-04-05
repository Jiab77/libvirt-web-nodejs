"use strict";

// app ui - Boot stuff when DOM is loaded
$(function () {
	console.group('UI');
	console.log('DOM Loaded.');
	console.groupEnd();

	// Disabled links
	$('a[href="#!"]').on('click', function(event) {
		event.preventDefault();
	});

	// Fix top menu when passed
	$('.ui.large.secondary.inverted.menu').visibility({
		once: false,
		onBottomPassed: function() {
			$('.fixed.menu').transition('fade in');
		},
		onBottomPassedReverse: function() {
			$('.fixed.menu').transition('fade out');
		}
	});

	// Create sidebar and attach to menu open
	$('.ui.sidebar')
		// .sidebar('setting', { transition: 'scale down', mobileTransition: 'scale down' })
		.sidebar('setting', { transition: 'overlay', mobileTransition: 'overlay' })
		.sidebar('attach events', '.toc.item');
	
	// Dropdowns
	$('.ui.dropdown').dropdown({
		on: 'hover'
	});

	// Accordions
	$('.ui.accordion').accordion();

	// Dismissable messages
	$('.message .close').on('click', function() {
		$(this).closest('.message').transition('fade');
	});

	// Tooltips
	$('.tooltipped').popup();

	// Scrolling tables
	// TODO: Add throttling...
	$('.scrolling-table').on('scroll', function (event) {
		// console.log('User is scrolling the table content.', event);
		// console.info('Scroll position:', event.target.scrollTop);
		// console.info('This:', $(this));
		// console.info('Table header:', $(this).find('.ui.table.sticky-headed thead tr:first-child > th'));

		// Store scroll position
		var pos = event.target.scrollTop;

		// Target next table with sticky headers
		var $tableHeaders = $(this).find('.ui.table.sticky-headed thead tr:first-child > th');

		// Set a darker background color when user is scrolling table content
		if (pos !== 0) {
			if (!$tableHeaders.hasClass('darken')) {
				$tableHeaders.addClass('darken');
			}
		}
		else {
			if ($tableHeaders.hasClass('darken')) {
				$tableHeaders.removeClass('darken');
			}
		}
	});
});

// app functions
function generateTable(id, url) {
	if (!id) {
		console.error('Table element Id not specified.');
		return false;
	}

	if (!url) {
		console.error('Data URL not specified.');
		return false;
	}

	var $table = $(id);

	console.info('Generating table [' + id + ']...');

	$.getJSON(url, function () {
		console.info('Fetched JSON data.');
	})
	.done(function (data) {
		if (data) {
			// Check 'count' field
			if (data.count) {
				console.info('Returned ' + data.count + ' results.');
			}
			else {
				console.warn('Response does not have "count" field.', data);
			}

			// Check 'result' field
			if (data.result) {
				// Validate results count
				if (data.count && data.count !== data.result.length) {
					console.warn('Returned results count differs from returned count value.', data);
				}

				// Build table from returned results
				var tableHTML = '', tableHeadersContent = '', tableBodyContent = '';
				var tableHeaders = Object.keys(data.result[0]); // Taking table headers from object keys
				var tableHeadersOpenTag = '<thead>';
				var tableHeadersCloseTag = '</thead>';
				var tableBodyOpenTag = '<tbody>';
				var tableBodyCloseTag = '</tbody>';

				// Iterate over results
				for (var i in tableHeaders) {
					// Start row
					if (i === 0) { tableHeadersContent += '<tr>'; }

					// Create cells
					tableHeadersContent += '<th>' + tableHeaders[i] + '</th>';

					// End row
					if (i === tableHeaders.length) { tableHeadersContent += '</tr>'; }
				}
				for (var i in data.result) {
					// Start row
					tableBodyContent += '<tr>';

					// Create cells
					for (var value of Object.values(data.result[i])) {
						tableBodyContent += '<td>' + value + '</td>';
					}

					// End row
					tableBodyContent += '</tr>';
				}

				// Build HTML
				tableHTML += tableHeadersOpenTag;
				tableHTML += tableHeadersContent;
				tableHTML += tableHeadersCloseTag;
				tableHTML += tableBodyOpenTag;
				tableHTML += tableBodyContent;
				tableHTML += tableBodyCloseTag;

				// Add HTML to the table
				$table.html(tableHTML);

				console.info('Table [' + id + '] generated.', $table[0]);
				console.info('Table [' + id + '] entries:', data.result);
			}
			else {
				console.error('Returned response is missing "result" field.', data);
			}
		}
		else {
			console.warn('Returned empty response.', data);
		}
	})
	.fail(function(jqXHR) {
		console.error('Could not fetch JSON data.', jqXHR);
	});
}

function generateSmoothChart(id, color, delay) {
	var maxYValue = 10000;
	var chart = new SmoothieChart({
			grid: {
				fillStyle: 'transparent',
				strokeStyle: 'rgba(166,197,103,0.20)',
				sharpLines: true,
				millisPerLine: 250,
				verticalSections: 6,
				borderVisible: false
			},
			labels: { fillStyle: '#FFFFFF', disabled: false, precision: 2, showIntermediateLabels: false },
			tooltip: true,
			responsive: false, // Do not enable, very badly managed...
		}),
		canvas = document.getElementById(id),
		series = new TimeSeries();

	chart.addTimeSeries(series, { lineWidth: 2, strokeStyle: color, fillStyle: 'rgba(166,197,103,0.20)' });
	chart.streamTo(canvas, delay / 2);

	setInterval(function() {
		var value = Math.pow(Math.random() * 2 - 1, 5) * maxYValue;
		series.append(new Date().getTime(), value);
	}, Math.random() * delay);
}
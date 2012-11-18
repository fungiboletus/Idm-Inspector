/* This file is released under the CeCILL-B V1 licence.*/

/**
 *	TimeControl control the displayed tuples and the time (yeah).
 *
 *	 A timeline is also proposed.
 */
var TimeControl = function() {

	this.create_interface();

	// Database statements, for counting and disabling interface
	this.database = {};
	this.database_length = 0;

	// Displaying of tooltip ?
	this.tooltip_visible = false;

	// The tooltip is displayed for the left slider, or the right
	this.tooltip_left = true;

	// Timeout for hiding tooltip
	this.tooltip_hide_timeout = -1;

	// Width of the button, in relation with the stylesheet
	this.button_width = 10;

	// The position of the left slider, in pixels
	this.left_pos = 0;

	// For the right
	this.right_pos = 0;

	// The position of the cursor
	this.cursor_pos = 0;

	// The margin is about the click compared to the slider position
	this.drag_margin = 0;

	// True when the user is dragging the slider
	this.ondrag = false;

	// When the user has cliked on the timeline
	this.slider_drag = false;

	// on the left slider
	this.border_left_drag = false;

	// right slider
	this.border_right_drag = false;

	// cursor drag'n'drop
	this.cursor_drag = false;

	// The slider area (in times)
	this.time_min = Number.MAX_VALUE;
	this.time_max = -Number.MAX_VALUE;

	// The cursor time value
	this.cursor_time = 0;

	// The slider width when dragging
	this.drag_width = 0;

	// The synchronization interface is displayed ?
	this.synchro_interface = false;

	this.animate_interface();

	EventBus.addListeners(this.listeners, this);

	this.is_playing = false;

	this.current_play_speed = 1.0;
	this.play_speeds = [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 40.0];

};

TimeControl.prototype = {

/*
 *	Creation of the interface
 *
 * Lot of verbose DOM code
 */
create_interface: function() {
	// The iframe mask is usefull for capture mouse event
	// over the iframes
	this.iframe_mask = newDom('div');
	this.iframe_mask.id = 'iframe_mask';
	this.iframe_mask.style.display = 'none';
	document.body.appendChild(this.iframe_mask);

	// Time control area
	this.time_control = newDom('div');
	this.time_control.id = "time_control";
	// this.time_control.className = 'disabled';
	document.body.appendChild(this.time_control);

	var time_buttons = newDom('div', 'time_buttons btn-group');

	this.bti = newDom('button', 'btn btn-mini btn-inverse');
	this.bti_icon = newDom('i');
	this.bti_icon_play_class = 'icon-play icon-white';
	this.bti_icon_pause_class = 'icon-pause icon-white';
	this.bti_icon.className = this.bti_icon_play_class;
	this.bti.appendChild(this.bti_icon);
	time_buttons.appendChild(this.bti);

	this.reduce_button = newDom('button', 'btn btn-mini btn-inverse');
	var reduce_button_icon = newDom('i', 'icon-resize-small icon-white');
	this.reduce_button.appendChild(reduce_button_icon);
	time_buttons.appendChild(this.reduce_button);

	this.expand_button = newDom('button', 'btn btn-mini btn-inverse');
	var expand_button_icon = newDom('i', 'icon-resize-full icon-white');
	this.expand_button.appendChild(expand_button_icon);
	time_buttons.appendChild(this.expand_button);

	this.speed_button = newDom('button', 'btn btn-mini btn-inverse');
	this.speed_button.appendChild(document.createTextNode('x1'));
	time_buttons.appendChild(this.speed_button);

	this.time_info = newDom('button', 'btn btn-mini time_info');
	this.time_info.appendChild(document.createTextNode('12:45:12.054'));
	time_buttons.appendChild(this.time_info);

	this.time_control.appendChild(time_buttons);

	// Creation of the slider
	var zone_slider = newDom('div', 'zone_slider');
	this.time_control.appendChild(zone_slider);
	this.jslider = $(zone_slider);

	this.area = newDom('div', 'area');
	zone_slider.appendChild(this.area);

	this.border_left = newDom('div', 'border border_left');
	this.area.appendChild(this.border_left);

	this.border_right = newDom('div', 'border border_right');
	this.area.appendChild(this.border_right);

	// Creation of the tooltip
	this.tooltip = newDom('div', 'tooltip top');
	this.tooltip_arrow = newDom('div', 'tooltip-arrow');
	this.tooltip_inner = newDom('div', 'tooltip-inner');
	this.tooltip_inner.appendChild(document.createTextNode('coucou'));
	this.tooltip.appendChild(this.tooltip_arrow);
	this.tooltip.appendChild(this.tooltip_inner);
	document.body.appendChild(this.tooltip);

	// Creation of the time cursor
	this.time_cursor = newDom('div', 'time_cursor');
	this.area.appendChild(this.time_cursor);
},

/*
 *	Animate the interface (link callback)
 */
animate_interface: function() {
	var obj = this;

	// Updates the sizes information when window change
	$(window).resize(function() {
		obj.window_resize();
	});

	// Click on the slider
	this.jslider.mousedown(function(e) {
		obj.ondrag = true;
		if (!obj.border_left_drag && !obj.border_right_drag &&
			!obj.cursor_drag)
		{
			var m_x = e.clientX - obj.slider_left - obj.left_pos;
			obj.drag_margin = m_x;
			obj.drag_width = obj.right_pos - obj.left_pos;

			obj.slider_drag = true;
			obj.dragdrop(e);
		}
		obj.iframe_mask.style.display  = 'block';
	});

	var mouse_has_moved = false;

	// Capture the end of drag (mouseup)
	var jdoc = $(document);
	jdoc.mouseup(function(e) {
		if (mouse_has_moved)
			mouse_has_moved = false;
		// If mouse has not moved, but it's a click on the drag area
		else if (obj.slider_drag)
		{
			var pos = e.clientX - obj.slider_left - obj.button_width - 4;

			var time_t = obj.time_min * 1 + pos / obj.slider_width
				* (obj.time_max - obj.time_min);

			EventBus.send('cursor', {time_t: time_t});
		}

		// Reset the state booleans
		obj.ondrag = false;
		obj.slider_drag = false;
		obj.border_left_drag = false;
		obj.border_right_drag = false;
		obj.cursor_drag = false;

		// Hide the dragging objects
		if (obj.tooltip_visible) obj.hide_tooltip();
		obj.iframe_mask.style.display  = 'none';


	});

	// Capture the drag mouvements
	jdoc.mousemove(function(e) {
		if (obj.ondrag)
			mouse_has_moved = true;
		obj.dragdrop(e, obj);
	});

	// Disable text selection when dragging
	document.onselectstart = function(){ return !obj.ondrag;};

	// Drag the left slider
	$(this.border_left).mousedown(function(e) {
		obj.ondrag = true;
		obj.border_left_drag = true;
		obj.drag_margin = e.clientX - obj.slider_left - obj.left_pos;
		obj.show_tooltip(true);
		obj.dragdrop(e);
	});

	// Drag the right slider
	$(this.border_right).mousedown(function(e) {
		obj.ondrag = true;
		obj.border_right_drag = true;
		obj.drag_margin = e.clientX - obj.slider_left - obj.right_pos;
		obj.show_tooltip(false);
		obj.dragdrop(e);
	});

	// Drag the slider
	$(this.time_cursor).mousedown(function(e) {
		obj.ondrag = true;
		obj.slider_drag = false;
		obj.cursor_drag = true;
		obj.drag_margin = obj.button_width * 2 - e.offsetX;
		obj.dragdrop(e);
	});

	// Manage the play button
	var play_interval = -1;
	$(this.bti).click(function() {
		EventBus.send(obj.bti_icon.className == obj.bti_icon_play_class ?
			'play' : 'pause');
	});

	// Manage the reduce and expand buttons
	$(this.reduce_button).click(function() {
		obj.reduce_interval();
	});
	$(this.expand_button).click(function() {
		obj.expand_interval();
	});

	// Speed button
	$(this.speed_button).click(function() {
		var speedIndex = obj.play_speeds.indexOf(obj.current_play_speed);

		if (speedIndex === -1)
			speedIndex = obj.play_speeds.indexOf(1.0);

		EventBus.send('play_speed', {
			speed: obj.play_speeds[(speedIndex+1)%obj.play_speeds.length]
		});
	});
},

/*
 *	Draw the tooltip at the correct place
 */
draw_tooltip: function() {

	// Calculate the correct position
	var width_margin = this.tooltip.offsetWidth;
	var tpos = this.slider_left - width_margin * 0.5 + 3;

	// If show to the left slider
	if (this.tooltip_left)
		tpos += this.left_pos + this.button_width;
	// Or the right slider
	else
	{
		var right_pos = this.left_pos + $(this.area).width() + this.button_width + this.button_width + 3;
		tpos += right_pos - this.button_width;
	}

	// The idea is to don't create scrollbar when tooltip is
	// on the right of the page
	// for the right, buttons make a large space, we don't need
	// to check the placement
	var max_width = $(document.body).width();
	var margin_arrow = -5;
	if (tpos + width_margin > max_width)
	{
		var old_tpos = tpos;
		tpos = max_width - width_margin;

		var diff = old_tpos - tpos;
		margin_arrow += diff;

		// For create a good looking effect, the arrow
		// of the tooltip is moved, but with a max positionnment
		var max_arrow = width_margin * 0.25 + 5;
		if (margin_arrow > max_arrow) margin_arrow = max_arrow;
	}

	// update the tooltip (draw draw draw)
	tpos += 'px';
	margin_arrow += 'px';

	if (this.tooltip.style.left != tpos)
		this.tooltip.style.left = tpos;

	if (this.tooltip_arrow.style.marginLeft != margin_arrow)
			this.tooltip_arrow.style.marginLeft = margin_arrow;
},

/*
 *	Get a wonderful and very beautiful string,
 *	from a date.
 *
 *	format is: hh:mm:ss:mmm
 */
get_txt_date: function(date)
{
	date = new Date(date * 1000);

	// current date if bad date (initial state for example)
	if (isNaN(date * 1))
		date = new Date();

	var hours = date.getHours().toString();
	if (hours.length < 2) hours = '0'+hours;
	var mins = date.getMinutes().toString();
	if (mins.length < 2) mins = '0'+mins;
	var seconds = date.getSeconds().toString();
	if (seconds.length < 2) seconds = '0'+seconds;
	var mili = date.getMilliseconds().toString();
	while(mili.length < 3) mili = '0'+mili;

	return hours+':'+ mins + ':' + seconds + '.' + mili;
},

/*
 *	Show the tooltip.
 *
 *	Manage states, drawing, and css transitions.
 */
show_tooltip: function(left) {
	this.tooltip_visible = true;
	this.tooltip_left = left;

	// If a hidden event will occur, stop it
	if (this.tooltip_hide_timeout > 0)
		window.clearTimeout(this.tooltip_hide_timeout);

	// Show it
	this.tooltip.style.display  = 'block';

	// Make a beautiful transition
	// The setTimeout event is necessary for triggering
	// the css transition
	var obj = this;
	window.setTimeout(function() {
		obj.tooltip.className = 'tooltip fade in top';
		obj.draw_tooltip();
	}, 1);

},

/*
 *	Hide the tooltip.
 *	yes.
 */
hide_tooltip: function() {
	this.tooltip_visiple = false;
	this.tooltip.className = 'tooltip fade top';

	// Remove it from the display, to avoid inconvenience
	var obj = this;
	this.tooltip_hide_timeout = window.setTimeout(function() {
		obj.tooltip.style.display = 'none';
	}, 160);
},

/*
 *	Draw the wonderful slider.
 */
draw: function() {
	var left = this.left_pos + this.button_width;
	var right = this.slider_width - this.right_pos + this.button_width;
	var cursor = this.cursor_pos + this.button_width - left;

	if (left > this.slider_width - this.button_width)
		left = this.slider_width - this.button_width;

	if (right < this.button_width)
		right = this.button_width;

	if (cursor < 0)
		cursor = 0;
	if (cursor > this.slider_width - this.button_width - left - right + 4)
		cursor = this.slider_width - this.button_width - left - right + 4;

	left += 'px';
	right += 'px';
	cursor += 'px';

	if (this.area.style.left != left)
		this.area.style.left =  left;
	if (this.area.style.right != right)
		this.area.style.right = right;
	if (this.time_cursor.style.left != cursor)
		this.time_cursor.style.left = cursor;

	if (this.tooltip_visible)
		this.draw_tooltip();
},

/*
 *	Window resuze callback.
 *
 *	Update size informations of the slider, and draw it again
 */
window_resize: function() {
	this.slider_left = this.jslider.position().left;

	if (this.slider_width) {
		var new_width = this.jslider.width()
			- this.button_width - this.button_width;
		var ratio = new_width / this.slider_width;
		this.left_pos *= ratio;
		this.right_pos *= ratio;
		this.slider_width = new_width;
	}
	else
		this.slider_width = this.jslider.width();

	this.draw();
},

/*
 *	Calculate the time from the slider position.
 */
get_times_by_pos: function() {
	// Maths are very epic here...
	var t = this.time_min * 1;
	var time_int = this.time_max - this.time_min;
	var start_t = t + this.left_pos / this.slider_width * time_int;
	var end_t = t + this.right_pos / this.slider_width * time_int;

	return {
		start_t: start_t,
		end_t: end_t
	};
},

/*
 *	Dragdrop callback.
 */
dragdrop: function(e, obj) {

	// Call from this, or an event with this in params ?
	obj = obj == null ? this : obj;

	// If the drag is off, we have nothing to do
	if (obj.ondrag)
	{
		// Mouse position compared to the slider
		var m_x = e.clientX - obj.slider_left - obj.drag_margin;

		// Bounds of the mouse position
		if (m_x > obj.slider_width) m_x = obj.slider_width;

		if (obj.slider_drag)
		{
			obj.left_pos = m_x;
			obj.right_pos = m_x + obj.drag_width;
			if (obj.left_pos < 0)
			    obj.left_pos = 0;

			if (obj.right_pos > obj.slider_width)
				obj.right_pos = obj.slider_width;
		}
		else
		{
			if (m_x < 0) m_x = 0;
			if (obj.border_left_drag)
			{
				obj.left_pos = m_x;
				if (obj.left_pos > obj.right_pos)
					obj.right_pos = obj.left_pos;
			}
			else if (obj.border_right_drag)
			{
				obj.right_pos = m_x;
				if (obj.right_pos < obj.left_pos)
					obj.left_pos = obj.right_pos;
			}
			else if (obj.cursor_drag)
			{
				var time_t = obj.time_min * 1 + m_x / obj.slider_width
					* (obj.time_max - obj.time_min);

				EventBus.send('cursor', {time_t: time_t});

				return;
			}
		}

		// We just sand a time event, we don't draw anything
		// the time event callbak will take care
		EventBus.send('time_sync', obj.get_times_by_pos());
	}
},

/*
 *	The callback excuted by a setInterval, for playing.
 */
play_callback: function(t) {

	var plus = ((t - this.play_start)/1000.0) * this.current_play_speed;

	this.play_start = t;
	// console.log(t, plus);

	// Get the current time
	var times = this.get_times_by_pos();
	// console.log(new Date().getSeconds(), plus, times.start_t);

	var time = this.cursor_time;

	time += plus;

	// Looping
	if (time < times.start_t || time > times.end_t)
		time = times.start_t;
	// else
	// // Update the time
	// times.start_t += plus;
	// times.end_t += plus;


	// // The max time is the limit
	// if (times.end_t > this.time_max)
	// 	times.end_t = this.time_max;

	// // If the start time is bigger than the end time,
	// // we will have bad time
	// if (times.start_t > times.end_t)
	// {
	// 	times.start_t = times.end_t;

	// 	// Simulate a click on pause button
	// 	$(this.bti).click();
	// }

	// EventBus.send('time_sync', times);
	EventBus.send('cursor', {time_t: time});

	var obj = this;
	if (this.is_playing)
		window.requestAnimationFrame(function(t){ obj.play_callback(t); });
},

/*
 *	Reduce the timeline interval to teh selected interval.
 */
reduce_interval: function() {
	var t = this.get_times_by_pos();

	this.time_min = t.start_t;
	this.time_max = t.end_t;
	EventBus.send('time_sync', t);
},

expand_interval: function() {
	this.time_min = this.initial_time_min;
	this.time_max = this.initial_time_max;

	EventBus.send('time_sync', {
		start_t: this.time_min,
		end_t: this.time_max
	});
},

create_synchro_interface: function(d, obj) {

	this.synchro_area = newDom('div', 'synchro_area modal hide fade in');
	var closeButton = newDom('button', 'close');
	closeButton.setAttribute('type', 'button');
	closeButton.setAttribute('data-dismiss', 'modal');
	addText(closeButton, '×');

	var table = newDom('table', 'table table-striped table-bordered');
	var thead = newDom('thead');
	thead_tr = newDom('tr');
	var th_name = newDom('th');
	addText(th_name, 'Name');
	var th_begin = newDom('th');
	addText(th_begin, 'Begin');
	var th_end = newDom('th');
	addText(th_end, 'End');
	var th_shift = newDom('th');
	addText(th_shift, 'Shift');
	thead_tr.appendChild(th_name);
	thead_tr.appendChild(th_begin);
	thead_tr.appendChild(th_end);
	thead_tr.appendChild(th_shift);
	thead.appendChild(thead_tr);
	table.appendChild(thead);

	var tbody = newDom('tbody');
	table.appendChild(tbody);

	this.synchro_area.appendChild(closeButton);
	this.synchro_area.appendChild(table);
	document.body.appendChild(this.synchro_area);

	this.synchro_interface = true;

	EventBus.send('get_bounds');

	var modal = $(this.synchro_area);
	modal.modal({
		keyboard: true,
		backdrop: true,
		show: false
	});
},

fill_synchro_interface: function(bounds) {
	// console.log(bounds);
	var table = this.synchro_area.lastChild.lastChild;
	for (var k in bounds)
	{
		if (k !== '__global__')
		{
			var line = newDom('tr');
			var name = newDom('th');
			var hname = newDom('span');
			addText(hname, k);
			name.appendChild(hname);

			var inputBegin = newDom('input');
			inputBegin.setAttribute('type', 'number');
			var vBegin = bounds[k].time_tMin;
			inputBegin.setAttribute('data-init', vBegin);
			inputBegin.value = vBegin;
			var tdBegin = newDom('td');
			tdBegin.appendChild(inputBegin);
			$(inputBegin).change(function() {
				var old_time = parseInt(this.getAttribute('data-init'));
				var new_time = parseInt(this.value);
				var diff = new_time - old_time;
				var inputs = $(this).parent().parent().find('input');
				inputs[1].value = parseInt(inputs[1].getAttribute('data-init')) + diff;
				inputs[2].value = diff;
			});

			var inputEnd = newDom('input');
			inputEnd.setAttribute('type', 'number');
			var vEnd = bounds[k].time_tMax;
			inputEnd.setAttribute('data-init', vEnd);
			inputEnd.value = vEnd;
			var tdEnd = newDom('td');
			tdEnd.appendChild(inputEnd);
			$(inputEnd).change(function() {
				var old_time = parseInt(this.getAttribute('data-init'));
				var new_time = parseInt(this.value);
				var diff = new_time - old_time;
				var inputs = $(this).parent().parent().find('input');
				inputs[0].value = parseInt(inputs[0].getAttribute('data-init')) + diff;
				inputs[2].value = diff;
			});

			var inputShift = newDom('input');
			inputShift.setAttribute('type', 'number');
			inputShift.value = '0';
			var tdShift = newDom('td');
			tdShift.appendChild(inputShift);
			$(inputShift).change(function() {
				var diff = parseInt(this.value);
				var inputs = $(this).parent().parent().find('input');
				inputs[0].value = parseInt(inputs[0].getAttribute('data-init')) + diff;
				inputs[1].value = parseInt(inputs[1].getAttribute('data-init')) + diff;
			});

			line.appendChild(name);
			line.appendChild(tdBegin);
			line.appendChild(tdEnd);
			line.appendChild(tdShift);

			table.appendChild(line);
		}
	}

	$(this.synchro_area).modal('show');
},

//Extraction
send_selection: function(name_s, min_s, max_s, statement_name){

	EventBus.send('send_selection', {
		name_s : name_s,
		min_s : min_s,
		max_s : max_s,
		statement_name : statement_name
	});

},

listeners: {
/*
 *	Updating the slider position from the time event.
 *
 *	And draw it \o/
 */
time_sync: function(d, obj) {

	if (obj.cursor_time < d.start_t || obj.cursor_time > d.end_t)
	{
		if (obj.cursor_time < d.start_t)
			obj.cursor_time = d.start_t;
		else if (obj.cursor_time > d.end_t)
			obj.cursor_time = d.end_t;
		EventBus.send('cursor', {time_t: obj.cursor_time});
	}

	// Simple maths, simple maths everywhere
	var time_int = obj.time_max - obj.time_min;
	obj.left_pos = (d.start_t - obj.time_min) * (obj.slider_width / time_int);
	obj.right_pos = (d.end_t - obj.time_min) * (obj.slider_width / time_int);

	obj.draw();

	// Update the value of the tooltip
	var txt_inner = obj.get_txt_date(obj.tooltip_left ?
		d.start_d : d.end_t);

	obj.tooltip_inner.firstChild.data = txt_inner;
},

/*
 *	Updating the time cursor position from the cursor event.
 */
cursor: function(d, obj) {

	obj.cursor_time = d.time_t;
	obj.cursor_pos = (d.time_t - obj.time_min) *
		(obj.slider_width / (obj.time_max - obj.time_min));

	obj.draw();

	var txt_info = obj.get_txt_date(d.start_t);
	obj.time_info.firstChild.data = txt_info;
},

/**
 *	Updating the bounds of the time control
 */
bounds: function(d, obj) {
	obj.time_min = d.__global__.time_tMin;
	obj.time_max = d.__global__.time_tMax;
	obj.initial_time_min = obj.time_min;
	obj.initial_time_max = obj.time_max;

	if (obj.synchro_interface)
		obj.fill_synchro_interface(d);
},

add_statement: function(e, obj) {
	if (obj.database_length == 0)
	{
		obj.time_control.className = '';
		obj.window_resize();
	}

	if (!(e.statement_name in obj.database))
	{
		obj.database[e.statement_name] = true;
		++obj.database_length;
	}
},

del_statement: function(e, obj) {
	if (e.statement_name in obj.database)
	{
		delete obj.database[e.statement_name];
		--obj.database_length;
	}

	if (obj.database_length == 0){
		obj.time_control.className = 'disabled';
		obj.time_min = Number.MAX_VALUE;
		obj.time_max = -Number.MAX_VALUE;
	}

},

get_tuples: function(e, obj) {
	EventBus.send('time_sync', obj.get_times_by_pos());
},

play: function(e, obj) {
	obj.bti_icon.className = obj.bti_icon_pause_class;
	if (!obj.is_playing)
	{
		obj.is_playing = true;
		obj.play_start = Date.now();
		obj.play_callback(obj.play_start);
	}
},

pause: function(e, obj) {
	obj.bti_icon.className = obj.bti_icon_play_class;
	if (obj.is_playing)
		obj.is_playing = false;
},

play_speed: function(d, obj) {
	obj.current_play_speed = d.speed;
	obj.speed_button.firstChild.data = 'x'+d.speed;
},


}};

/* This file is released under the CeCILL-B V1 licence.*/

/**
 *	Generate fun random colors.
 */
var get_random_color_degrees = [];
function get_random_color() {

	var degree = 0;
	for (var i = 0; i < 20; ++i)
	{
		degree = Math.round(Math.random() * 360);
		var j = 0;
		for (var j = 0; j < get_random_color_degrees.length; ++j)
			if (Math.abs(get_random_color_degrees[j] - degree) <
				30-get_random_color_degrees.length)
				j = 1000;

		if (j == get_random_color_degrees.length)
			i = 1000;

	}

	get_random_color_degrees.push(degree);

	var saturation = 80 + Math.round(Math.random() * 4) * 5;
	var luminosite = 45 + Math.round(Math.random() * 2) * 5;

	return degree+','+saturation+'%,'+luminosite+'%';
};

var initialize_application = function() {
	// Création of the cadreur
	cadreurInstance = new Cadreur(
			byId('dashboard'),
			Cadreur_DIRECTIONS.HORIZONTAL);
	var layout = cadreurInstance;

	// Création of the proxy operator between the REST and the runtime
	superOperatorInstance = new SuperOperator();

	// auiensrt
	timeControlInstance = new TimeControl();

	var create_toolbar_button = function(text) {
		var button = newDom('li');
		var a_button = newDom('a');
		a_button.setAttribute('href', '#');
		a_button.onclick = noNo;
		a_button.appendChild(document.createTextNode(text));
		button.appendChild(a_button);

		return button;
	};

	var nb_boxes = 0;

	var create_perfect_box = function() {
		var box = layout.createBox();

		var color = get_random_color();
		var dark_color = color.substr(0, color.length-3)+'25%';

		// It's just a line, but the code is epic
		var border_line = document.createElement('div');
		border_line.className = 'borderLine';
		border_line.style.background = "-webkit-gradient(linear, left top, right top, color-stop(0%,hsla("+
			color+",0.6)), color-stop(55%,hsla("+color+",0.6)), color-stop(100%,hsla("+dark_color+",0.65)))";
		border_line.style.background = "-webkit-linear-gradient(left, hsla("+color+",0.6) 0%,hsla("+color+
			",0.6) 55%,hsla("+dark_color+",0.65) 100%)";
		border_line.style.background = "linear-gradient(to right, hsla("+
			color+",0.6) 0%,hsla("+color+",0.6) 55%,hsla("+dark_color+",0.65) 100%)";
		border_line.style.background = "-moz-linear-gradient(left, hsla("
				+color+",0.6) 0%, hsla("+color+",0.6) 55%, hsla("
				+dark_color+",0.65) 100%)";
		box.back.appendChild(border_line);

		box.box.setAttribute('cadreur_color', 'hsl('+color+')');
		box.box.id = "box_"+nb_boxes+++'_'+Math.abs(color.slice(1).hashCode());
		return box.box;
	}

	// Manage flip button
	var button = newDom('button', 'btn btn-mini btn-inverse flip-button');
	button.appendChild(document.createTextNode('Flip'));
	$('#time_control').prepend(button);

	$(button).click(function() {

		var jboxes = $('.boxdiv');

		layout.toggleFrontMode(function() {
			jboxes.removeClass('flipped_animation');
			if (layout.front)
			{
				// In a setTimeout for event order (dirty but funny)
				setTimeout(function(){
					EventBus.send('size_change');
				}, 1);
			}
		});
	});

	var manage_all_box_sizes = function() {
		$('.boxdiv').each(function() {
			var jthis = $(this);
			var width = jthis.width();
			var height = jthis.height();

			if (height < 190)
				jthis.addClass('small-height');
			else
				jthis.removeClass('small-height');

			if (width < 350)
				jthis.addClass('small-width');
			else
				jthis.removeClass('small-width');

			var iframes = jthis.find('iframe');
			var sqrt_nb_iframes = Math.sqrt(iframes.length);

			// If the the ceil is vertical, make more lines
			if (width < height)
			{
				var nb_lines = Math.ceil(sqrt_nb_iframes);
				var nb_columns = Math.round(sqrt_nb_iframes);
			}
			else
			{
				var nb_lines = Math.round(sqrt_nb_iframes);
				var nb_columns = Math.ceil(sqrt_nb_iframes);
			}

			var n_line = 0;
			var n_column = 0;
			var iframe_width = width / nb_columns;
			var iframe_height = height / nb_lines;

			iframes.each(function() {

				this.style.top = n_line * iframe_height + 'px';
				this.style.left = n_column * iframe_width + 'px';

				this.style.width = iframe_width + 'px';
				this.style.height = iframe_height + 'px';

				if (++n_column === nb_columns)
				{
					n_column = 0;

					if (++n_line === nb_lines)
						n_line = 0;
				}
			});
		});
	};

	// Creation of layouts buttons
	var buttonsLayouts = {
		Vertical: layout.layouts.verticalSplit,
		Horizontal: layout.layouts.horizontalSplit,
		Grid: layout.layouts.grid,
		Multi: layout.layouts.multi
	};


	for (var name in buttonsLayouts)
	{
		var layout_button = create_toolbar_button(name);
		layout_button.className = 'layout_button';
		layout_button.firstChild.className = 'icon_button '+name.toLowerCase()+'_text';
		$(layout_button).click(function() {
			var name = $(this)[0].firstChild.firstChild.data;
			layout.changeLayout(buttonsLayouts[name]);

		});

		// todo
		//back_buttons_bar.append(layout_button);
	}


	var create_visualization_iframe = function(id, url)
	{
		var iframe = newDom('iframe');
		iframe.id = id;
		iframe.className = 'visualization';
		iframe.setAttribute('name', id);
		iframe.setAttribute('src', url);
		return iframe;
	};

	var alert_area = newDom('div', 'alert-area fade');
	alert_area.style.display = 'none';
	document.body.appendChild(alert_area);

	EventBus.addListener('error', function(e) {
		alert_area.style.display = 'block';
		var alert_div = newDom('div', 'alert alert-error fade');
		var alert_close = newDom('a', 'close');
		alert_close.setAttribute('data-dismiss', 'alert');
		alert_close.appendChild(document.createTextNode('\u00d7'));
		alert_div.appendChild(alert_close);
		var alert_h4 = newDom('h4', 'alert-heading');
		alert_h4.appendChild(document.createTextNode('Error '+e.status));
		alert_div.appendChild(alert_h4);
		var alert_p = newDom('p');
		alert_p.innerHTML = e.message;
		//alert_p.appendChild(document.createTextNode(e.message));
		alert_div.appendChild(alert_p);

		alert_area.appendChild(alert_div);

		window.setTimeout(function() {
			alert_area.className = 'alert-area fade in';
			alert_div.className = 'alert alert-error fade in';
		}, 1);

		$(alert_area).bind('close', function() {
			if (alert_area.children.length === 1)
			{
				alert_area.className = 'alert-area fade';
				window.setTimeout(function() {
					alert_area.style.display = 'none';
				}, 150);
			}
		});
		// alert('Error '+e.status+' :\n' +e.message);
	});

	var first_step = true;
	var recursive_layout_creation = function(data, parent) {
		for (var _i = 0; _i < data.length; ++_i)
		{
			var d = data[_i];
			if ($.isArray(d.composite_h) || $.isArray(d.composite_v))
			{
				if ($.isArray(d.composite_h)) {
					var composite = d.composite_h;
					current_direction = Cadreur_DIRECTIONS.HORIZONTAL;
				}
				else
				{
					var composite = d.composite_v;
					current_direction = Cadreur_DIRECTIONS.VERTICAL;	
				}

				if (first_step)
				{
					var container = layout.rootContainer;
					container.direction = current_direction;
					first_step = false;
				}
				else
				{
					var container = new CadreurContainer(current_direction);
					layout.addBox(container, parent);
				}

				recursive_layout_creation(composite, container);
			}
			else
			{
				for (var e in d) {
					(function(e) {
						var box = create_perfect_box();
						layout.addBox(box, parent);
						var jbox = $(box);


						var title = newDom('h2');
						title.appendChild(document.createTextNode(e));

						var content = newDom('ul');
						var ni = d[e].length;
						for (var i = 0; i < ni; ++i)
						{
							var li = newDom('li');
							li.appendChild(document.createTextNode(d[e][i]));	
							content.appendChild(li);


						}
						jbox.find('.back').append(title).append(content);

						var id = 'f'+jbox.attr('id');
						var url = 'Display/'+e+'/D'+e+'.html';
						var iframe = create_visualization_iframe(id, url);

						jbox.find('.front').append(iframe);
						$(iframe).one('load', function() {
							jbox.find('.back ul li').each(function() {
								EventBus.send('add_statement',
									{statement_name: this.firstChild.data, box_name: id});	
							});

							EventBus.send('size_change');
							EventBus.send('get_bounds');
						});
					})(e);
				}
			}
		}
	};

	superOperatorInstance.sensors_informations = dashboardContent.sensors;
	recursive_layout_creation([dashboardContent], null);

	if ($('.boxdiv').length === 0)
	{
		EventBus.send('error', {status: ': empty content', message: 'No one box is present'});
	}

	// Equilibrate in setTimeout for trigger CSS3 transitions
	// setTimeout(function(){layout.equilibrate();}, 1); // disabled for performances
	layout.equilibrate();
	manage_all_box_sizes();

	// 600 is the duration of the layout's transitions
	$.event.special.debouncedresize.threshold = 600;
	$(window).on('debouncedresize',function()
	{
		manage_all_box_sizes();

		EventBus.send('size_change');
	});

	setTimeout(function(){
		manage_all_box_sizes();
		EventBus.send('size_change');
	}, 600);
};

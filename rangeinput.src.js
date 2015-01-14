/**
 * @license
 *
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 *
 * http://flowplayer.org/tools/rangeinput/
 * https://github.com/jquerytools/jquerytools
 * https://github.com/arleslie3/rangeinput
 *
 * Since: Mar 2010
 * Date: @DATE
 *
 * @author Tero Piirainen [Flowplayer] - Original Author
 *
 * @auther Andrew Leslie - Dozmia Inc.
 * This is customized heavely to work for Dozmia, but could be used for other projects.
 *
 * https://dozmia.com
 */
(function($) {

	$.tools = $.tools || {version: '@VERSION'};

	var tool;

	tool = $.tools.rangeinput = {

		conf: {
			min: 0,
			max: 100,		// as defined in the standard
			steps: 0,
			value: 0,
			keyboard: true,
			progress: false,
			speed: 100,

			// set to null if not needed
			css: {
				input    : 'range',
				slider   : 'slider',
				progress : 'progress',
				handle   : 'handle'
			}

		}
	};

	var doc, draggable;

	$.fn.drag = function(conf) {

		// disable IE specialities
		document.ondragstart = function () { return false; };

		conf = $.extend({x: true, y: true, drag: true}, conf);

		doc = doc || $(document).on("mousedown mouseup", function(e) {

			var el = $(e.target);

			// start
			if (e.type == "mousedown" && el.data("drag")) {
				var offset = el.offset()
				var x0 = e.pageX - offset.left,
					y0 = e.pageY - offset.top,
					start = true;

				doc.on("mousemove.drag", function(e) {
					var x = e.pageX -x0,
						 y = e.pageY -y0,
						 props = {};

					if (conf.x) { props.left = x; }
					if (conf.y) { props.top = y; }

					if (start) {
						el.trigger("dragStart");
						start = false;
					}
					if (conf.drag) { el.css(props); }
					el.trigger("drag", [y, x]);
					draggable = el;
				});

				e.preventDefault();

			} else {

				try {
					if (draggable) {
						draggable.trigger("dragEnd");
					}
				} finally {
					doc.off("mousemove.drag");
					draggable = null;
				}
			}

		});

		return this.data("drag", true);
	};

	// get hidden element's width or height even though it's hidden
	function dim(el, key) {
		var v = parseInt(el.css(key), 10);
		if (v) { return v; }
		var s = el[0].currentStyle;
		return s && s.width && parseInt(s.width, 10);
	}

	function hasEvent(el) {
		var e = el.data("events");
		return e && e.onSlide;
	}

	function RangeInput(input, conf) {

		// private variables
		var self = this,
			 css = conf.css,
			 root = $("<div><div/><a href='#'/></div>").data("rangeinput", self),
			 value,			// current value
			 origo,			// handle's start point
			 len,				// length of the range
			 pos;				// current position of the handle

		// create range
		input.before(root);

		var handle = root.addClass(css.slider).find("a").addClass(css.handle),
			 progress = root.find("div").addClass(css.progress);

		// get (HTML5) attributes into configuration
		$.each("min,max,step,value".split(","), function(i, key) {
			var val = input.attr(key);
			if (parseFloat(val)) {
				conf[key] = parseFloat(val, 10);
			}
		});

		var range = conf.max - conf.min;

		// Replace built-in range input (type attribute cannot be changed)
		if (input.attr("type") == 'range') {
			var def = input.clone().wrap("<div/>").parent().html(),
				 clone = $(def.replace(/type/i, "type=text data-orig-type"));

			clone.val(conf.value);
			input.replaceWith(clone);
			input = clone;
		}

		input.addClass(css.input);

		var fire = $(self).add(input), fireOnSlide = true;


		/**
		 	The flesh and bone of this tool. All sliding is routed trough this.

			@param evt types include: click, keydown, blur and api (setValue call)
			@param isSetValue when called trough setValue() call (keydown, blur, api)

			vertical configuration gives additional complexity.
		 */
		function slide(evt, x, val, isSetValue) {
			if (x !== undefined) {
				var isClick = evt.type == "click";
				var speed = isClick ? conf.speed : 0,
					 callback = isClick ? function()  {
						evt.type = "change";
						fire.trigger(evt, [val]);
					 } : null;

				var offset = root.offset().left,
					sliderWidth = root.width(),
					left = x - offset;

				if (left < 0) {
					input.val(0);
					handle.animate({left: 0 - (handle.width() / 2)}, speed, callback);
					progress.width(0);
					return false;
				} else if (left > sliderWidth) {
					input.val(conf.max);
					handle.animate({left: sliderWidth - (handle.width() / 2)}, speed, callback);
					progress.width(sliderWidth);
					return false;
				} else {
					val = (left * conf.max) / sliderWidth;
					input.val(val)
					handle.animate({left: left - (handle.width() / 2)}, speed, callback);
					progress.width(left);
				}
			} else {
				var offset = root.offset().left,
					sliderWidth = root.width();

				if (val < 0) {
					input.val(0);
					handle.animate({left: 0 - (handle.width() / 2)}, 1);
					progress.width(0);
					return false;
				} else if (left > sliderWidth) {
					input.val(conf.max);
					handle.animate({left: sliderWidth - (handle.width() / 2)}, 1);
					progress.width(sliderWidth);
					return false;
				} else {
					var percent = (val * 100) / conf.max;
						percent = (percent * sliderWidth) / 100;
						percent = percent - (handle.width() / 2);

					input.val(val)
					handle.animate({left: percent - (handle.width() / 2)}, 1);
					progress.width(percent);
				}
			}

			return self;
		}


		$.extend(self, {

			getValue: function() {
				return input.val();
			},

			setValue: function(val, e) {
				init();

				if (e === undefined) {
					e = jQuery.Event('change');
				}
				e.preventDefault();

				return slide(e, undefined, val, true);
			},

			getConf: function() {
				return conf;
			},

			getProgress: function() {
				return progress;
			},

			getHandle: function() {
				return handle;
			},

			getInput: function() {
				return input;
			},

			// HTML5 compatible name
			stepUp: function(am) {
				return self.step(am || 1);
			},

			// HTML5 compatible name
			stepDown: function(am) {
				return self.step(-am || -1);
			},

			setMax: function(max) {
				conf.max = max;
				return conf.max;
			},

			setMin: function(min) {
				conf.min = min;
				return conf.min;
			}

		});

		// callbacks
		$.each("onSlide,change".split(","), function(i, name) {
			// from configuration
			if ($.isFunction(conf[name]))  {
				$(self).on(name, conf[name]);
			}
		});


		// dragging
		handle.drag({drag: false}).on("dragStart", function() {

			/* do some pre- calculations for seek() function. improves performance */
			init();

			// avoid redundant event triggering (= heavy stuff)
			fireOnSlide = hasEvent($(self)) || hasEvent(input);


		}).on("drag", function(e, y, x) {

			if (input.is(":disabled")) { return false; }
			slide(e, x);
			$(self).trigger('onSlide');

		}).on("dragEnd", function(e) {
			if (!e.isDefaultPrevented()) {
				e.type = "change";
				fire.trigger(e, [value]);
			}

		}).click(function(e) {
			return e.preventDefault();
		});

		// clicking
		root.click(function(e) {
			if (input.is(":disabled") || e.target == handle[0]) {
				return false;
			}
			init();

			var sliderWidth = root.width(),
				offset = root.offset().left;;

			var left = e.pageX - offset
			handle.css('left', left - (handle.width() / 2));
			progress.css('width', left);
			input.val((left * conf.max) / sliderWidth);

			$(self).trigger('change');

			return e;
		});

		if (conf.keyboard) {

			input.keydown(function(e) {

				if (input.attr("readonly")) { return; }

				var key = e.keyCode,
					 up = $([75, 76, 38, 33, 39]).index(key) != -1,
					 down = $([74, 72, 40, 34, 37]).index(key) != -1;

				if ((up || down) && !(e.shiftKey || e.altKey || e.ctrlKey)) {

					// UP: 	k=75, l=76, up=38, pageup=33, right=39
					if (up) {
						self.step(key == 33 ? 10 : 1, e);

					// DOWN:	j=74, h=72, down=40, pagedown=34, left=37
					} else if (down) {
						self.step(key == 34 ? -10 : -1, e);
					}
					return e.preventDefault();
				}
			});
		}


		input.blur(function(e) {
			var val = $(this).val();
			if (val !== value) {
				self.setValue(val, e);
			}
		});


		// HTML5 DOM methods
		$.extend(input[0], { stepUp: self.stepUp, stepDown: self.stepDown});


		// calculate all dimension related stuff
		function init() {
			len = dim(root, "width") - dim(handle, "width");
			origo = root.offset().left;
		}

		function begin() {
			init();
			self.setValue(conf.value !== undefined ? conf.value : conf.min);
		}
		begin();

		// some browsers cannot get dimensions upon initialization
		if (!len) {
			$(window).load(begin);
		}
	}

	$.expr[':'].range = function(el) {
		var type = el.getAttribute("type");
		return type && type == 'range' || !!$(el).filter("input").data("rangeinput");
	};


	// jQuery plugin implementation
	$.fn.rangeinput = function(conf) {

		// already installed
		if (this.data("rangeinput")) { return this; }

		// extend configuration with globals
		conf = $.extend(true, {}, tool.conf, conf);

		var els;

		this.each(function() {
			var el = new RangeInput($(this), $.extend(true, {}, conf));
			els = els ? els.add(el) : el;
		});

		return els ? els : this;
	};

}) (jQuery);

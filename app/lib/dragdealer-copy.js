(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports.Dragdealer = factory();
  } else {
    // Browser globals
    root.Dragdealer = factory();
  }
}(this, function () {

  var Dragdealer = function(wrapper, options) {
    this.options = $.extend({}, this.defaults, this.options);

    this.$wrapper = $(wrapper);
    if (!this.$wrapper.length) return;

    this.$handle = $(this.options.handle, this.wrapper);
    if (!this.$handle.length) return;

    this.$win = $(window);
    this.$doc = $(document);

    this.wrapper = this.$wrapper.get(0);
    this.handle = this.$handle.get(0);

    this.bindMethods();
    this.init();

    this.bindEventListeners();
  };

  Dragdealer.prototype = {
    defaults: {
      disabled: false,
      horizontal: true,
      vertical: false,
      slide: true,
      steps: 0,
      snap: false,
      loose: false,
      speed: 0.1,
      xPrecision: 0,
      yPrecision: 0,
      handle: '.handle',
      css3: true,
      activeClass: 'active',
      tapping: true
    },

    init: function() {
      if (this.options.css3) {
        triggerWebkitHardwareAcceleration(this.handle);
      }

      this.value = {
        prev: [-1, -1],
        current: [this.options.x || 0, this.options.y || 0],
        target: [this.options.x || 0, this.options.y || 0] // 0 ~ 1 비율로 값을 설정.
      };

      this.offset = {
        wrapper: [0, 0], // wrapper 의 left, top
        mouse: [0, 0], // [ (Cursor.x - handle x 위치), (Cursor.y - handle y 위치)]

        prev: [-999999, -999999],
        current: [0, 0], // handle 이 이동할 실제 px 값
        target: [0, 0]
      };

      this.dragStartPosition = {x: 0, y: 0}; // statDrag() 함수 호출시,

      this.change = [0, 0];

      this.stepRatios = this.calculateStepRatios(); // step 수가 5 라면, [0, 1/5, 2/5, 3/5, 4/5] 배열 반환.

      this.activity = false;
      this.dragging = false;
      this.tapping = false;

      this.reflow();

      if (this.options.disabled) {
        this.disable();
      }
    },

    setWrapperOffset: function() {
      this.offset.wrapper = Position.get(this.wrapper);
    },
    calculateBounds: function() {
      // Apply top/bottom/left and right padding options to wrapper extremities
      // when calculating its bounds
      var bounds = {
        top: this.options.top || 0,
        bottom: -(this.options.bottom || 0) + this.wrapper.offsetHeight,
        left: this.options.left || 0,
        right: -(this.options.right || 0) + this.wrapper.offsetWidth
      };

      // The available width and height represents the horizontal and vertical
      // space the handle has for moving. It is determined by the width and
      // height of the wrapper, minus the width and height of the handle
      bounds.availWidth = (bounds.right - bounds.left) - this.handle.offsetWidth;
      bounds.availHeight = (bounds.bottom - bounds.top) - this.handle.offsetHeight;

      return bounds;
    },
    calculateValuePrecision: function() {
      // The sliding transition works by dividing itself until it reaches a min
      // value step; because Dragdealer works with [0-1] values, we need this
      // "min value step" to represent a pixel when applied to the real handle
      // position within the DOM. The xPrecision/yPrecision options can be
      // specified to increase the granularity when we're controlling larger
      // objects from one of the callbacks
      var xPrecision = this.options.xPrecision || Math.abs(this.bounds.availWidth),
        yPrecision = this.options.yPrecision || Math.abs(this.bounds.availHeight);

      return [
        xPrecision ? 1 / xPrecision : 0,
        yPrecision ? 1 / yPrecision : 0
      ];
    },
    calculateStepRatios: function() {
      var stepRatios = [];
      if (this.options.steps >= 1) {
        for (var i = 0; i <= this.options.steps - 1; i++) {
          if (this.options.steps > 1) {
            stepRatios[i] = i / (this.options.steps - 1);
          } else {
            // A single step will always have a 0 value
            stepRatios[i] = 0;
          }
        }
      }
      return stepRatios;
    },

    bindMethods: function() {
      this.requestAnimationFrame = bind(requestAnimationFrame, window);
      this.cancelAnimationFrame = bind(cancelAnimationFrame, window);

      this.animateWithRequestAnimationFrame = bind(this.animateWithRequestAnimationFrame, this);
      this.animate = bind(this.animate, this);

      this.onHandleMouseDown = $.proxy(this.onHandleMouseDown, this);
      this.onDocumentMouseMove = $.proxy(this.onDocumentMouseMove, this);
      this.onDocumentMouseUp = $.proxy(this.onDocumentMouseUp, this);
      this.onHandleClick = $.proxy(this.onHandleClick, this);
      //this.onWrapperMouseDown = $.proxy(this.onWrapperMouseDown, this);
      this.onWindowResize = $.proxy(this.onWindowResize, this);

      this.onHandleTouchStart = $.proxy(this.onHandleTouchStart, this);
      this.onWrapperTouchMove = $.proxy(this.onWrapperTouchMove, this);
      this.onWrapperTouchStart = $.proxy(this.onWrapperTouchStart, this);
      this.onDocumentTouchEnd = $.proxy(this.onDocumentTouchEnd, this);
    },

    bindEventListeners: function() {
      this.$handle.on('mousedown', this.onHandleMouseDown);
      this.$doc.on('mousemove', this.onDocumentMouseMove);
      this.$doc.on('mouseup', this.onDocumentMouseUp);
      this.$handle.on('click', this.onHandleClick);
      //this.$wrapper.on('mousedown', this.onWrapperMouseDown);
      this.$win.on('resize', this.onWindowResize);

      this.$handle.on('touchstart', this.onHandleTouchStart);
      this.$wrapper.on('touchmove', this.onWrapperTouchMove);
      this.$wrapper.on('touchstart', this.onWrapperTouchStart);
      this.$doc.on('touchend', this.onDocumentTouchEnd);

      this.animate(false, true);
      this.interval = this.requestAnimationFrame(this.animateWithRequestAnimationFrame);
    },

    unbindEventListeners: function() {
      this.$handle.off('mousedown', this.onHandleMouseDown);
      this.$doc.off('mousemove', this.onDocumentMouseMove);
      this.$doc.off('mouseup', this.onDocumentMouseUp);
      this.$handle.off('click', this.onHandleClick);
      //this.$wrapper.off('mousedown', this.onWrapperMouseDown);
      this.$win.off('resize', this.onWindowResize);

      this.$handle.off('touchstart', this.onHandleTouchStart);
      this.$wrapper.off('touchmove', this.onWrapperTouchMove);
      this.$wrapper.off('touchstart', this.onWrapperTouchStart);
      this.$doc.off('touchend', this.onDocumentTouchEnd);

      this.cancelAnimationFrame(this.interval);
    },

    onHandleMouseDown: function(e) {
      Cursor.refresh(e.originalEvent);

      e.preventDefault();
      e.stopPropagation();

      this.activity = false;
      this.startDrag();
    },

    onHandleTouchStart: function(e) {
      Cursor.refresh(e.originalEvent);

      // Unlike in the `mousedown` event handler, we don't prevent defaults here,
      // because this would disable the dragging altogether. Instead, we prevent
      // it in the `touchmove` handler. Read more about touch events
      // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events#Handling_clicks
      // stopEventPropagation(e);
      e.stopPropagation();

      this.activity = false;
      this.startDrag();
    },

    onDocumentMouseMove: function(e) {
      if ((e.clientX - this.dragStartPosition.x) === 0 &&
        (e.clientY - this.dragStartPosition.y) === 0) {
        // This is required on some Windows8 machines that get mouse move events without actual mouse movement
        return;
      }

      Cursor.refresh(e.originalEvent);
      if (this.dragging) {
        this.activity = true;
        e.preventDefault();
      }
    },

    onWrapperTouchMove: function(e) {
      Cursor.refresh(e.originalEvent);
      // Dragging on a disabled axis (horizontal or vertical) shouldn't prevent
      // defaults on touch devices. !this.activity denotes this is the first move
      // inside a drag action; you can drag in any direction after this point if
      // the dragging wasn't stopped
      if (!this.activity && this.draggingOnDisabledAxis()) {
        if (this.dragging) {
          this.stopDrag();
        }
        return;
      }
      // Read comment in `onHandleTouchStart` above, to understand why we're
      // preventing defaults here and not there
      e.preventDefault();
      this.activity = true;
    },

    /*
    onWrapperMouseDown: function(e) {
      Cursor.refresh(e.originalEvent);
      e.preventDefault();
      this.startTap();
    },
    */

    onWrapperTouchStart: function(e) {
      Cursor.refresh(e.originalEvent);
      e.preventDefault();
      this.startTap();
    },

    onDocumentMouseUp: function(e) {
      this.stopDrag();
      this.stopTap();
    },

    onDocumentTouchEnd: function(e) {
      this.stopDrag();
      this.stopTap();
    },

    onHandleClick: function(e) {
      // We keep track if any dragging activity has been made between the
      // mouse/touch down and up events; based on this we allow or cancel a click
      // event from inside the handle. i.e. Click events shouldn't be triggered
      // when dragging, but should be allowed when clicking still
      if (this.activity) {
        e.preventDefault();
        e.stopPropagation();
      }
    },

    onWindowResize: function(e) {
      this.reflow();
    },
    enable: function() {
      this.disabled = false;
      this.$handle.removeClass('disabled');
    },

    disable: function() {
      this.disabled = true;
      this.handle.className += ' disabled';
    },

    reflow: function() {
      this.setWrapperOffset(); // this.offset.wrapper 세팅.
      this.bounds = this.calculateBounds(); // this.bounds 세팅. {top, bottom, left, right, availWidth, availHeight} // availWidth, availHeight 는 이동 가능한 거리를 의미한다.
      this.valuePrecision = this.calculateValuePrecision(); // [ 1 / availWidth, 1 / availHeight ]

      console.log('this.bounds :', this.bounds);
      console.log('this.valuePrecision :', this.valuePrecision);
      
      this.updateOffsetFromValue(); // this.offset.current 세팅 및 handle 의 위치 이동시키기.
    },

    getStep: function() {
      return [
        this.getStepNumber(this.value.target[0]),
        this.getStepNumber(this.value.target[1])
      ];
    },
    getStepWidth: function () {
      return Math.abs(this.bounds.availWidth / this.options.steps);
    },
    getValue: function() {
      return this.value.target;
    },
    setStep: function(x, y, snap) {
      this.setValue(
        this.options.steps && x > 1 ? (x - 1) / (this.options.steps - 1) : 0,
        this.options.steps && y > 1 ? (y - 1) / (this.options.steps - 1) : 0,
        snap
      );
    },
    setValue: function(x, y, snap) {
      this.setTargetValue([x, y || 0]);
      if (snap) {
        this.groupCopy(this.value.current, this.value.target);
        // Since the current value will be equal to the target one instantly, the
        // animate function won't get to run so we need to update the positions
        // and call the callbacks manually
        this.updateOffsetFromValue();
        this.callAnimationCallback();
      }
    },
    startTap: function() {
      if (this.disabled || !this.options.tapping) {
        return;
      }

      this.tapping = true;
      this.setWrapperOffset();

      this.setTargetValueByOffset([
        Cursor.x - this.offset.wrapper[0] - (this.handle.offsetWidth / 2),
        Cursor.y - this.offset.wrapper[1] - (this.handle.offsetHeight / 2)
      ]);
    },
    stopTap: function() {
      if (this.disabled || !this.tapping) {
        return;
      }
      this.tapping = false;

      this.setTargetValue(this.value.current);
    },

    startDrag: function() {
      if (this.disabled) return;

      this.dragging = true;
      this.setWrapperOffset();

      this.dragStartPosition = {x: Cursor.x, y: Cursor.y};

      var handlePosition = Position.get(this.handle);

      this.offset.mouse = [
        Cursor.x - handlePosition[0],
        Cursor.y - handlePosition[1]
      ];

      this.$wrapper.addClass(this.options.activeClass);

      this.callDragStartCallback();
    },

    stopDrag: function() {
      if (this.disabled || !this.dragging) return;
      this.dragging = false;

      var deltaX = this.bounds.availWidth === 0 ? 0 :
          ((Cursor.x - this.dragStartPosition.x) / this.bounds.availWidth),
        deltaY = this.bounds.availHeight === 0 ? 0 :
          ((Cursor.y - this.dragStartPosition.y) / this.bounds.availHeight),
        delta = [deltaX, deltaY];

      var target = this.groupClone(this.value.current);
      if (this.options.slide) {
        var ratioChange = this.change;
        // console.log('ratioChange :', ratioChange);

        target[0] += ratioChange[0] * 4;
        target[1] += ratioChange[1] * 4;
      }
      // console.log('target :', target);
      
      this.setTargetValue(target);

      // this.wrapper.className = this.wrapper.className.replace(' ' + this.options.activeClass, '');
      this.$wrapper.removeClass(this.options.activeClass);

      this.callDragStopCallback(delta);
    },
    callAnimationCallback: function() {
      var value = this.value.current;
      if (this.options.snap && this.options.steps > 1) {
        value = this.getClosestSteps(value);
      }
      if (!this.groupCompare(value, this.value.prev)) {
        if (typeof(this.options.animationCallback) == 'function') {
          this.options.animationCallback.call(this, value[0], value[1]);
        }
        this.groupCopy(this.value.prev, value);
      }
    },
    callTargetCallback: function() {
      if (typeof(this.options.callback) == 'function') {
        this.options.callback.call(this, this.value.target[0], this.value.target[1]);
      }
    },
    callDragStartCallback: function() {
      if (typeof(this.options.dragStartCallback) == 'function') {
        this.options.dragStartCallback.call(this, this.value.target[0], this.value.target[1]);
      }
    },
    callDragStopCallback: function(delta) {
      if (typeof(this.options.dragStopCallback) == 'function') {
        this.options.dragStopCallback.call(this, this.value.target[0], this.value.target[1], delta);
      }
    },
    animateWithRequestAnimationFrame: function (time) {
      if (time) {
        // using requestAnimationFrame
        this.timeOffset = this.timeStamp ? time - this.timeStamp : 0;
        this.timeStamp = time;
      } else {
        // using setTimeout(callback, 25) polyfill
        this.timeOffset = 25;
      }
      this.animate();
      this.interval = this.requestAnimationFrame(this.animateWithRequestAnimationFrame);
    },

    animate: function(direct, first) {
      if (direct && !this.dragging) {
        return;
      }

      if (this.dragging) {
        var prevTarget = this.groupClone(this.value.target); // 이전의 위치 값

        // drag start 시의 초기 커서 위치로부터, 현재 위치와의 차이값 출력.
        var offset = [
          Cursor.x - this.offset.wrapper[0] - this.offset.mouse[0],
          Cursor.y - this.offset.wrapper[1] - this.offset.mouse[1]
        ];

        this.setTargetValueByOffset(offset, this.options.loose);

        // 변경된 위치 값
        this.change = [
          this.value.target[0] - prevTarget[0],
          this.value.target[1] - prevTarget[1]
        ];
      }

      if (this.dragging || first) {
        this.groupCopy(this.value.current, this.value.target);
      }

      if (this.dragging || this.glide() || first) {
        this.updateOffsetFromValue();
        this.callAnimationCallback();
      }
    },

    glide: function() {
      var diff = [
        this.value.target[0] - this.value.current[0],
        this.value.target[1] - this.value.current[1]
      ];
      if (!diff[0] && !diff[1]) {
        return false;
      }
      if (Math.abs(diff[0]) > this.valuePrecision[0] ||
        Math.abs(diff[1]) > this.valuePrecision[1]) {
        this.value.current[0] += diff[0] * Math.min(this.options.speed * this.timeOffset / 25, 1);
        this.value.current[1] += diff[1] * Math.min(this.options.speed * this.timeOffset / 25, 1);
      } else {
        this.groupCopy(this.value.current, this.value.target);
      }
      return true;
    },
    updateOffsetFromValue: function() {
      if (!this.options.snap) {
        this.offset.current = this.getOffsetsByRatios(this.value.current);
      } else {
        this.offset.current = this.getOffsetsByRatios(
          this.getClosestSteps(this.value.current)
        );
      }

      if (!this.groupCompare(this.offset.current, this.offset.prev)) {
        this.renderHandlePosition(); // x, y 위치를 this.offset.current[0]
        this.groupCopy(this.offset.prev, this.offset.current);
      }
    },

    // handle 위치를 this.offset.current 위치로 이동시킨다.
    renderHandlePosition: function() {

      var transform = '';
      if (this.options.css3 && StylePrefix.transform) {
        if (this.options.horizontal) {
          transform += 'translateX(' + this.offset.current[0] + 'px)';
        }
        if (this.options.vertical) {
          transform += ' translateY(' + this.offset.current[1] + 'px)';
        }
        this.handle.style[StylePrefix.transform] = transform;
        return;
      }

      if (this.options.horizontal) {
        this.handle.style.left = this.offset.current[0] + 'px';
      }
      if (this.options.vertical) {
        this.handle.style.top = this.offset.current[1] + 'px';
      }
    },
    setTargetValue: function(value, loose) {
      var target = loose ? this.getLooseValue(value) : this.getProperValue(value);

      this.groupCopy(this.value.target, target);
      this.offset.target = this.getOffsetsByRatios(target);

      this.callTargetCallback();
    },


    setTargetValueByOffset: function(offset, loose) {
      var value = this.getRatiosByOffsets(offset);

      // target 값은 1 보다 커질 수 없다.
      var target = loose ? this.getLooseValue(value) : this.getProperValue(value);

      this.groupCopy(this.value.target, target);
      this.offset.target = this.getOffsetsByRatios(target);
    },
    getLooseValue: function(value) {
      var proper = this.getProperValue(value);
      return [
        proper[0] + ((value[0] - proper[0]) / 4),
        proper[1] + ((value[1] - proper[1]) / 4)
      ];
    },
    getProperValue: function(value) {
      var proper = this.groupClone(value);

      proper[0] = Math.max(proper[0], 0);
      proper[1] = Math.max(proper[1], 0);
      proper[0] = Math.min(proper[0], 1);
      proper[1] = Math.min(proper[1], 1);

      if ((!this.dragging && !this.tapping) || this.options.snap) {
        if (this.options.steps > 1) {
          proper = this.getClosestSteps(proper);
        }
      }
      return proper;
    },
    getRatiosByOffsets: function(group) {
      return [
        this.getRatioByOffset(group[0], this.bounds.availWidth, this.bounds.left),
        this.getRatioByOffset(group[1], this.bounds.availHeight, this.bounds.top)
      ];
    },
    getRatioByOffset: function(offset, range, padding) {
      return range ? (offset - padding) / range : 0;
    },



    getOffsetsByRatios: function(group) {
      return [
        this.getOffsetByRatio(group[0], this.bounds.availWidth, this.bounds.left),
        this.getOffsetByRatio(group[1], this.bounds.availHeight, this.bounds.top)
      ];
    },

    getOffsetByRatio: function(ratio, range, padding) {
      return Math.round(ratio * range) + padding;
    },



    getStepNumber: function(value) {
      // Translate a [0-1] value into a number from 1 to N steps (set using the
      // "steps" option)
      return this.getClosestStep(value) * (this.options.steps - 1) + 1;
    },
    getClosestSteps: function(group) {
      return [
        this.getClosestStep(group[0]),
        this.getClosestStep(group[1])
      ];
    },
    getClosestStep: function(value) {
      var k = 0;
      var min = 1;
      for (var i = 0; i <= this.options.steps - 1; i++) {
        if (Math.abs(this.stepRatios[i] - value) < min) {
          min = Math.abs(this.stepRatios[i] - value);
          k = i;
        }
      }
      return this.stepRatios[k];
    },
    groupCompare: function(a, b) {
      return a[0] == b[0] && a[1] == b[1];
    },
    groupCopy: function(a, b) {
      a[0] = b[0];
      a[1] = b[1];
    },
    groupClone: function(a) {
      return [a[0], a[1]];
    },
    draggingOnDisabledAxis: function() {
      return (!this.options.horizontal && Cursor.xDiff > Cursor.yDiff) ||
        (!this.options.vertical && Cursor.yDiff > Cursor.xDiff);
    }
  };




// Cross-browser vanilla JS event handling

  var addEventListener = function(element, type, callback) {
    if (element.addEventListener) {
      element.addEventListener(type, callback, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + type, callback);
    }
  };

  var removeEventListener = function(element, type, callback) {
    if (element.removeEventListener) {
      element.removeEventListener(type, callback, false);
    } else if (element.detachEvent) {
      element.detachEvent('on' + type, callback);
    }
  };

  var preventEventDefaults = function(e) {
    if (!e) {
      e = window.event;
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
  };

  var stopEventPropagation = function(e) {
    if (!e) {
      e = window.event;
    }
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.cancelBubble = true;
  };


  var Cursor = {
    /**
     * Abstraction for making the combined mouse or touch position available at
     * any time.
     *
     * It picks up the "move" events as an independent component and simply makes
     * the latest x and y mouse/touch position of the user available at any time,
     * which is requested with Cursor.x and Cursor.y respectively.
     *
     * It can receive both mouse and touch events consecutively, extracting the
     * relevant meta data from each type of event.
     *
     * Cursor.refresh(e) is called to update the global x and y values, with a
     * genuine MouseEvent or a TouchEvent from an event listener, e.g.
     * mousedown/up or touchstart/end
     */
    x: 0, // 현재 mouse x 위치
    y: 0, // 현재 mouse y 위치
    xDiff: 0, // (현재 mouse x 위치 - 직전의 mouse x 위치) 절대값
    yDiff: 0, // (현재 mouse y 위치 - 직전의 mouse y 위치) 절대값

    refresh: function(e) {
      if (!e) {
        e = window.event;
      }
      if (e.type == 'mousemove') {
        this.set(e);
      } else if (e.touches) {
        this.set(e.touches[0]);
      }
    },

    set: function(e) {
      var lastX = this.x,
        lastY = this.y;
      if (e.clientX || e.clientY) {
        this.x = e.clientX;
        this.y = e.clientY;
      } else if (e.pageX || e.pageY) {
        this.x = e.pageX - document.body.scrollLeft - document.documentElement.scrollLeft;
        this.y = e.pageY - document.body.scrollTop - document.documentElement.scrollTop;
      }
      this.xDiff = Math.abs(this.x - lastX);
      this.yDiff = Math.abs(this.y - lastY);
    }
  };


  var Position = {
    /**
     * Helper for extracting position of a DOM element, relative to the viewport
     *
     * The get(obj) method accepts a DOM element as the only parameter, and
     * returns the position under a (x, y) tuple, as an array with two elements.
     */
    get: function(obj) {
      // Dragdealer relies on getBoundingClientRect to calculate element offsets,
      // but we want to be sure we don't throw any unhandled exceptions and break
      // other code from the page if running from in very old browser that doesn't
      // support this method
      var rect = {left: 0, top: 0};
      if (obj.getBoundingClientRect !== undefined) {
        rect = obj.getBoundingClientRect();
      }

      return [rect.left, rect.top];
    }
  };












  var bind = function(fn, context) {
    /**
     * CoffeeScript-like function to bind the scope of a method to an instance,
     * the context of that method, regardless from where it is called
     */
    return function() {
      return fn.apply(context, arguments);
    };
  };

  var StylePrefix = {
    transition: getPrefixedStylePropName('transition'),
    transform: getPrefixedStylePropName('transform'),
    perspective: getPrefixedStylePropName('perspective'),
    backfaceVisibility: getPrefixedStylePropName('backfaceVisibility')
  };

  function getPrefixedStylePropName(propName) {
    var domPrefixes = 'Webkit Moz ms O'.split(' '),
      elStyle = document.documentElement.style;
    if (elStyle[propName] !== undefined) return propName; // Is supported unprefixed
    propName = propName.charAt(0).toUpperCase() + propName.substr(1);
    for (var i = 0; i < domPrefixes.length; i++) {
      if (elStyle[domPrefixes[i] + propName] !== undefined) {
        return domPrefixes[i] + propName; // Is supported with prefix
      }
    }
  };

  function triggerWebkitHardwareAcceleration(element) {
    if (StylePrefix.backfaceVisibility && StylePrefix.perspective) {
      element.style[StylePrefix.perspective] = '1000px';
      element.style[StylePrefix.backfaceVisibility] = 'hidden';
    }
  };

  var vendors = ['webkit', 'moz'];
  var requestAnimationFrame = window.requestAnimationFrame;
  var cancelAnimationFrame = window.cancelAnimationFrame;

  for (var x = 0; x < vendors.length && !requestAnimationFrame; ++x) {
    requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!requestAnimationFrame) {
    requestAnimationFrame = function (callback) {
      return setTimeout(callback, 25);
    };
    cancelAnimationFrame = clearTimeout;
  }

  return Dragdealer;
}));
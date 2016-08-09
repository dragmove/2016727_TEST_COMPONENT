
/*
 * nc.rwd.Tab
 */
;(function($, window) {
  "use strict";
  
  if(!window.nc) window.nc = {};
  if(!nc.rwd) nc.rwd = {};

  nc.rwd.Tab = function(options) {
    if(!options) return;

    this._activeClass = options.activeClass || 'on';
    this._btns = options.btns || [];
    this._activateCallback = options.activateCallback || null;
    this._activateIndex = 0;

    this._init();
  };

  nc.rwd.Tab.prototype._init = function() {
    this._setBtnsEventHandler(this._btns, true);
  };

  nc.rwd.Tab.prototype._setBtnsEventHandler = function(btns, flag) {
    if(flag === true) {
      $(btns).on('click', $.proxy(this._btnMouseEventHandler, this));
    }else{
      $(btns).off('click', $.proxy(this._btnMouseEventHandler, this));
    }
  };

  nc.rwd.Tab.prototype._btnMouseEventHandler = function(event) {
    event.preventDefault();

    switch(event.type) {
      case 'click' :
        var btn = event.currentTarget,
          previousIndex = this._activateIndex;

        this._activateTab(btn);
        this._activateIndex = $(this._btns).index(btn) + 1;

        this._activateTabCallback({
          btn: btn,
          previousIndex: previousIndex,
          index: this._activateIndex
        });
        break;
    }
  };

  nc.rwd.Tab.prototype._activateTabCallback = function(obj) {
    var callback = this._activateCallback;
    if(callback && callback.constructor === Function) callback.apply(null, [obj]);
  };

  nc.rwd.Tab.prototype._activateTab = function(btn) {
    $(this._btns).removeClass(this._activeClass);
    $(btn).addClass(this._activeClass);
  };

  nc.rwd.Tab.prototype._activateNaviByIndex = function(index) {
    $(this._btns).removeClass(this._activeClass);
    $(this.getBtn(index)).addClass(this._activeClass);
  };

  /*
   * public methods
   */
  nc.rwd.Tab.prototype.getBtn = function(index) {
    var index = index - 1;
    if(index < 0) return null;
    return $(this._btns).get(index);
  };

  nc.rwd.Tab.prototype.getActivatedIndex = function() {
    return this._activateIndex;
  };

  nc.rwd.Tab.prototype.activate = function(index) {
    var previousIndex = this._activateIndex,
      targetIndex = (index < 0 || index > this._btns.length) ? 0 : index;

    this._activateNaviByIndex(targetIndex);
    this._activateIndex = targetIndex;
  };

  nc.rwd.Tab.prototype.destroy = function() {
    $(this._btns).removeClass(this._activeClass);
    this._setBtnsEventHandler(this._btns, false);

    this._activeClass = 'on';
    this._btns = [];
    this._activateCallback = null;
    this._activateIndex = 0;
  };
}(jQuery, window));

(function($, window) {
  "use strict";

  /*
   * implementation
   */
  var $win = $(window),
    tab = null,
    scrollTabControl = null;

  $(document).ready(init);

  function init() {
    setTab();
    setCustomScroll();
  }

  function setTab() {
    tab = new nc.rwd.Tab({
      btns: $('.tabs li a'),
      activateCallback: activateNaviCallback,
      activeClass: 'on'
    });

    function activateNaviCallback(_obj) {
      console.log('activateNaviCallback - _obj :', _obj);
    }
  }

  function setCustomScroll() {
    var scrollControl = new ScrollControl({
      element: $('.wrap-scroll')
    });
  }





  /*
   * ScrollControl
   */
  function ScrollControl(options) {
    this.stylePrefix = {
      transition: this.getPrefixedStylePropName('transition'),
      transform: this.getPrefixedStylePropName('transform'),
      perspective: this.getPrefixedStylePropName('perspective'),
      backfaceVisibility: this.getPrefixedStylePropName('backfaceVisibility')
    };

    this.$doc = $(document);
    this.$el = $(options.element);
    this.el = this.$el.get(0);

    this.velocityStack = new Array(5);

    this.offset = {
      diff: {x: 0, y: 0}, // mouse.x - el.x
      
      mouse: {x: 0, y: 0}, // mouse cursor position
      el: {x: 0, y: 0} // element translate
    };

    this.dragging = false;

    this.init();
  }

  ScrollControl.prototype.init = function() {
    this.disableSelect();
    this.setHardwareAcceleration(this.el);

    this.setTransition(this.el, 0, 'cubic-bezier(0.23, 1, 0.32, 1)'); // cubic-bezier(0.23, 1, 0.32, 1)
    this.setTranslateX(this.el, this.offset.el.x);

    this.$el.on('mousedown', $.proxy(this.dragstart, this));
  };

  ScrollControl.prototype.setTransition = function(element, duration, ease) {
    $(element).css(this.stylePrefix.transition, ['all', duration + 'ms', ease].join(' '));
  };

  ScrollControl.prototype.setTranslateX = function(element, x) {
    var transform = '';
    transform =  'translateX(' + x + 'px)';
    $(element).css(this.stylePrefix.transform, transform);
  };

  ScrollControl.prototype.dragstart = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this.setTransition(this.el, 0, 'cubic-bezier(0.23, 1, 0.32, 1)');

    this.$doc.on('mousemove', $.proxy(this.dragmove, this));
    this.$doc.on('mouseup', $.proxy(this.dragend, this));
    this.$doc.on('mouseleave', $.proxy(this.dragleave, this));

    this.offset.mouse.x = evt.pageX;

    this.offset.diff.x = this.offset.mouse.x - this.offset.el.x;
    console.log('this.offset.diff.x :', this.offset.diff.x);

    this.dragging = true;
  };

  ScrollControl.prototype.dragmove = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if(!this.dragging) return;
    console.log('dragmove');
    // TODO

    this.offset.mouse.x = evt.pageX;
    this.offset.el.x = this.offset.mouse.x - this.offset.diff.x;

    this.addVelocityPoint({
      timestamp: evt.timeStamp,
      x: this.offset.mouse.x
    })

    this.setTranslateX(this.el, this.offset.el.x);
  };

  ScrollControl.prototype.dragend = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this.dragging = false;

    var velocityX = this.getVelocity().x * 0.5;
    console.log('this.offset.el.x :', this.offset.el.x);
    console.log('velocityX :', velocityX);

    this.offset.el.x += velocityX;
    console.log('this.offset.el.x :', this.offset.el.x);

    this.setTransition(this.el, 500, 'cubic-bezier(0.23, 1, 0.32, 1)');
    this.setTranslateX(this.el, parseInt(this.offset.el.x, 10));

    this.$doc.off('mousemove', $.proxy(this.dragmove, this));
    this.$doc.off('mouseup', $.proxy(this.dragend, this));
    this.$doc.off('mouseleave', $.proxy(this.dragleave, this));

    this.resetVelocityStack();
  };

  ScrollControl.prototype.getVelocity = function() {
    var stack = this.velocityStack;

    var sumX = 0;
    for(var i=0,max=stack.length-1; i<max; i++) {
      if( stack[i] ) {
        sumX += (stack[i+1].x - stack[i].x)
      }
    }

    return {
      x: sumX
    };
  };

  ScrollControl.prototype.dragleave = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this.dragging = false;
    // TODO

    console.log('dragleave');

    this.$doc.off('mousemove', $.proxy(this.dragmove, this));
    this.$doc.off('mouseup', $.proxy(this.dragend, this));
    this.$doc.off('mouseleave', $.proxy(this.dragleave, this));
  };

  ScrollControl.prototype.resetVelocityStack = function() {
    this.velocityStack = new Array(5);
  };

  ScrollControl.prototype.addVelocityPoint = function(val) {
    var arr = this.velocityStack;
    arr = arr.slice(1, arr.length);
    arr.push(val);
    
    this.velocityStack = arr;

    console.log('this.velocityStack :', this.velocityStack);
  };

  ScrollControl.prototype.setHardwareAcceleration = function(element) {
    if (this.stylePrefix.backfaceVisibility && this.stylePrefix.perspective) {
      element.style[this.stylePrefix.perspective] = '1000px';
      element.style[this.stylePrefix.backfaceVisibility] = 'hidden';
    }
  };

  ScrollControl.prototype.disableSelect = function() {
    this.$el.css({
      '-webkit-touch-callout' : 'none',
      '-webkit-user-select' : 'none',
      '-khtml-user-select' : 'none',
      '-moz-user-select' : 'none',
      '-ms-user-select' : 'none',
      'user-select' : 'none'
    });
  };

  ScrollControl.prototype.getPrefixedStylePropName = function(propName) {
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




  }(jQuery, window));



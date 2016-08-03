
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


(function($, window, isMobile) {
  "use strict";

  var utils = {
    getPrefixedTransformTransitionPropertyStr: function(_transitionOrTransformStr) {
      var i,
        s = document.createElement('p').style,
        v = ['ms','O','Moz','Webkit'];

	    if( s[_transitionOrTransformStr] == '' ) return _transitionOrTransformStr;

	    _transitionOrTransformStr = _transitionOrTransformStr.charAt(0).toUpperCase() + _transitionOrTransformStr.slice(1);
	    for( i = v.length; i--; ) {
        if( s[v[i] + _transitionOrTransformStr] === '' ) return (v[i] + _transitionOrTransformStr);
      }
    }
  };

  function Drag(options) {
    var defaults = {
      axis: 'x',
      edgeFriction: 1
    };

    this.options = $.extend({}, defaults, options);

    this.touchObj = {
      curLeft: 0,

      startX: 0,
      startY: 0,
      curX: 0,
      curY: 0,

      fingerCount: 0
      // edgeFriction: 1
    };


    this.dragging = false;

    this.$doc = $(document);
    this.$el = $(options.el);
    this.elementWidth = this.$el.width();

    this.swipeLeft = 0;
    this.animating = false;

    this.transformType = utils.getPrefixedTransformTransitionPropertyStr('transform');

    this.init();
  };

  Drag.prototype.init = function() {
    var _ = this;

    _.$el.on('touchstart mousedown', {
      action: 'start'
    }, $.proxy(_.swipeHandler, _));

    _.$doc.on('touchmove mousemove', {
      action: 'move'
    }, $.proxy(_.swipeHandler, _));

    _.$doc.on('touchend mouseup', {
      action: 'end'
    }, $.proxy(_.swipeHandler, _));

    _.$doc.on('touchcancel mouseleave', {
      action: 'end'
    }, $.proxy(_.swipeHandler, _));

    // TODO
    // resize, orientationchange
  };

  Drag.prototype.swipeHandler = function(evt) {
    var _ = this;

    _.touchObj.fingerCount = (event.originalEvent && event.originalEvent.touches) ? event.originalEvent.touches.length : 1;

    switch(evt.data.action) {
      case 'start' :
        _.swipeStart(evt);
        break;

      case 'move' :
        _.swipeMove(evt);
        break;

      case 'end' :
        _.swipeEnd(evt);
        break;
    }
  };

  Drag.prototype.swipeStart = function(evt) {
    var _ = this,
      touches;

    if (_.touchObj.fingerCount !== 1) {
      _.touchObj = {};
      return false;
    }

    if( evt.originalEvent && evt.originalEvent.touches ) {
      touches = evt.originalEvent.touches[0];
    }
    _.touchObj.startX = _.touchObj.curX = (touches) ? touches.pageX : evt.clientX;
    _.touchObj.startY = _.touchObj.curY = (touches) ? touches.pageY : evt.clientY;

    _.touchObj.curLeft = _.getLeft(_.$el);
    _.dragging = true;
  };

  Drag.prototype.swipeMove = function(evt) {
    var _ = this,
      swipeDirection, swipeLength, swipeOffset, touches;

    touches = (evt.originalEvent) ? evt.originalEvent.touches : null;

    console.log('_.dragging :', _.dragging)
    if ( !_.dragging || (touches && touches.length !== 1) ) {
      return false;
    }


    _.touchObj.curX = (touches) ? touches[0].pageX : evt.clientX;
    _.touchObj.curY = (touches) ? touches[0].pageY : evt.clientY;

    if (_.options.axis === 'x') {
      _.touchObj.swipeLength = Math.round( Math.sqrt( Math.pow(_.touchObj.curX - _.touchObj.startX, 2) ) );
      swipeOffset = (_.touchObj.startX <= _.touchObj.curX) ? 1 : -1;

    } else if (_.options.axis === 'y') {
      // TODO
    } else {
      // TODO
    }

    swipeDirection = _.swipeDirection();
    if (_.options.axis === 'x' && swipeDirection === 'vertical') return;

    swipeLength = _.touchObj.swipeLength * _.options.edgeFriction;

    if (_.options.axis === 'x') {
      _.swipeLeft = _.touchObj.curLeft + (swipeLength * swipeOffset);
      console.log('_.swipeLeft :', _.swipeLeft);
    } else {
      // TODO
    }

    if (_.animating === true) {
      _.swipeLeft = null;
      return false;
    }

    _.setCSS(_.swipeLeft);
  };

  Drag.prototype.swipeEnd = function(evt) {
    console.log('swipeEnd');

    var _ = this,
      direction;

    _.dragging = false;

    if (_.touchObj.curX === undefined) return false;

    direction = _.swipeDirection();

    switch(direction) {
      case 'left' :
        // TODO - dx, dy
      break;

      case 'right' :
        // TODO - dx, dy
      break;
    }

    if (direction !== 'vertical') {
      _.touchObj = {};
      // _.swipe( dx, dy, direction );
    }
  };

  Drag.prototype.swipe = function(dx, dy, direction) {
    // TODO
  };

  Drag.prototype.getLeft = function($el) {
    var _ = this,
      str = _.$el.get(0).style[_.transformType],
      left = 0;

    if ( !str ) {
      left = 0;
    } else {
      left = parseInt( str.split('(')[1].split(')')[0].split(',')[0], 10 );
    }

    return parseInt( left, 10 );
  };

  Drag.prototype.setCSS = function(position) {
    var _ = this,
      x = '0px',
      y = '0px';

    x = (_.options.axis === 'x') ? Math.ceil(position) + 'px' : '0px';
    y = (_.options.axis === 'y') ? Math.ceil(position) + 'px' : '0px';

    _.$el.get(0).style[_.transformType] = 'translate(' + x + ', ' + y + ')';
  };

  Drag.prototype.swipeDirection = function() {
    var xDist, yDist, r, swipeAngle, _ = this;

    xDist = _.touchObj.startX - _.touchObj.curX;
    yDist = _.touchObj.startY - _.touchObj.curY;
    r = Math.atan2(yDist, xDist);

    swipeAngle = Math.round( r * 180 / Math.PI );

    if (swipeAngle < 0) swipeAngle = 360 - Math.abs(swipeAngle);
    if ( (swipeAngle >= 0) && (swipeAngle <= 45) ) return 'left';
    if ( (swipeAngle >= 315) && (swipeAngle <= 360) ) return 'left';
    if ( (swipeAngle >= 135) && (swipeAngle <= 225) ) return 'right';

    if (_.options.axis === 'y') {
      // TODO
    }

    return 'vertical';
  };



  var tab;

  init();

  function init() {
    setTab();

    var $scrollWrap = $('.wrap-scroll');

    var drag = new Drag({
      el: $scrollWrap
    });
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






}(jQuery, window, isMobile));



(function($, window, isMobile) {
  "use strict";

  return;






  var RESIZE_TIMEOUT_DELAY = 50;
  var resizeTimeout = null;

  var $win = $(window),
    tab = null,
    scrollTabControl = null;


  var utils = {
    matrixToArray: function(str) {
      return str.split('(')[1].split(')')[0].split(',');
    },
    arrayToMatrix: function(array) {
      return 'matrix(' +  array.join(',')  + ')';
    },
    transformMatrix: function(element, matrixStr) {
      $(element).css({
        '-webkit-transform': matrixStr,
           '-moz-transform': matrixStr,
            '-ms-transform': matrixStr,
             '-o-transform': matrixStr,
                'transform': matrixStr
      });
    }
  };

  $(document).ready(init);

  function init() {
    setTab();
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

    /*
    //activate 3rd btn
    tab.activate(3);

    //get activated index
    console.log( 'after call "tab.activate(3)", print "tab.getActivatedIndex()" :', tab.getActivatedIndex() );

    window.tab = tab;
    */

    scrollTabControl = setPepScrollTab();

    $win.on('resize orientationchange', function(evt) {
      if(resizeTimeout) window.clearTimeout(resizeTimeout);

      resizeTimeout = window.setTimeout(function() {
        setScrollTabPosition();
        scrollTabControl = setPepScrollTab(true);
      }, RESIZE_TIMEOUT_DELAY);
    });
  }

  function setScrollTabPosition() {
    var scrollWrap = $('.wrap-scroll'),
      parentWidth = scrollWrap.parent().width();

    var matrix = scrollWrap.css('-webkit-transform') ||
      this.$el.css('-moz-transform') ||
      this.$el.css('-ms-transform') ||
      this.$el.css('-o-transform') ||
      this.$el.css('transform');
    if(matrix === 'none') matrix = 'matrix(1, 0, 0, 1, 0, 0)';

    var matrixArr = utils.matrixToArray(matrix),
      x = parseInt(matrixArr[4], 10),
      left = parseInt( scrollWrap.css('left'), 0 );

    /*
    if( x + scrollWrap.outerWidth() > parentWidth ) {
      //var posX = parentWidth - scrollWrap.outerWidth() - left;
      //if( posX <= 0 ) posX = 0;

      //matrixArr[4] = posX;
      //utils.transformMatrix( scrollWrap, utils.arrayToMatrix(matrixArr) );
    }
    */
  }

  function setPepScrollTab(isReset) {
    if(isReset) $.pep.unbind(scrollTabControl);

    var scrollWrap = $('.wrap-scroll');

    var draggableLeftRange = scrollWrap.parent().width() - scrollWrap.outerWidth(),
      constrainTo = (draggableLeftRange >= 0) ? 'parent' : [0, 0, 0, draggableLeftRange];

    var scrollControl = $('.wrap-scroll').pep({
      initiate: function(evt){
      },
      start: function(evt){
      },
      drag: function(evt){
      },
      stop: function(evt){
      },
      rest: function(evt){
      },
      // moveTo: function() {},
      cssEaseDuration: 750,
      shouldPreventDefault: (isMobile.any) ? false : true,
      allowDragEventPropagation: true,
      constrainTo: constrainTo
    });

    return scrollControl;
  }
}(jQuery, window, isMobile));

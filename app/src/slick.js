
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



  /*
   * implementation
   */
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



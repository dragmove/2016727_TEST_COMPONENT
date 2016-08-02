(function($) {
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

  /*
   * implementation
   */
  var tab = null;

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

    // setPep();
    // setPersonalImplementation();
    setPersonalImplementation();
  }

  function setPersonalImplementation() {
    /*
    $('.wrap-scroll').on('touchstart', function(evt) {
      console.log('down :', evt);
      evt.stopImmediatePropagation();
      evt.stopPropagation();
      evt.preventDefault();
    });

    $('.wrap-scroll').on('touchmove', function(evt) {
      console.log('move :', evt);
      evt.stopImmediatePropagation();
      evt.stopPropagation();
      evt.preventDefault();
    });

    $('.wrap-scroll').on('touchend', function(evt) {
      console.log('up :', evt);
      evt.stopImmediatePropagation();
      evt.stopPropagation();
      evt.preventDefault();
    });
    */
  }

  function subscribe() {
    $('.wrap-scroll').on('touchstart', function handleStart(evt) {
    });
  }

  function isValidMoveEvent(evt) {
    return ( !isTouch(evt) || ( isTouch(evt) && evt.originalEvent && evt.originalEvent.touches && evt.originalEvent.touches.length === 1 ) );
  }

  function isTouch(evt) {
    return evt.type.search('touch') > -1;
  }

  function normalizeEvent(evt) {
    var obj = {
      x: 0,
      y: 0,
      type: ''
    };

    if( isTouch(evt) ) {
      obj.x = evt.originalEvent.touches[0].pageX;
      obj.y = evt.originalEvent.touches[0].pageY;
      obj.type = evt.type;

    } else if ( isPointerEventCompatible() || !isTouch ) {
      if(evt.pageX) {
        obj.x = obj.pageX;
        obj.y = obj.pageY;
      } else {
        obj.x = evt.originalEvent.pageX;
        obj.y = evt.originalEvent.pageY;
      }
      obj.type = evt.type;
    }

    return obj;
  }

  function isPointerEventCompatible() {
    return ('MSPointerEvent' in window);
  }


















  function setPep() {
    var $scrollTabs = $('.wrap-scroll').pep({
      initiate: function(evt){
        console.log('initiate');
        console.log('evt :', evt);
        evt.preventDefault();
        evt.stopPropagation();
      },
      start: function(evt){
        console.log('start');
        evt.preventDefault();
        evt.stopPropagation();
      },
      drag: function(evt){
        console.log('drag');
        evt.preventDefault();
        evt.stopPropagation();
      },
      stop: function(evt){
        console.log('stop');
        evt.preventDefault();
        evt.stopPropagation();
      },
      rest: function(evt){
        console.log('rest');
        evt.preventDefault();
        evt.stopPropagation();
      },
      constrainTo: [0, 0, 0, -100],
      axis: 'x',
      startPos: {
        left: null, 
        top: null
      }
    });
    // $.pep.unbind($scrollTabs);

    /*
    //activate 3rd btn
    tab.activate(3);

    //get activated index
    console.log( 'after call "tab.activate(3)", print "tab.getActivatedIndex()" :', tab.getActivatedIndex() );

    window.tab = tab;
    */
  }
}(jQuery));
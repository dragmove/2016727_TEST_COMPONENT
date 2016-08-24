/*
 * nc.rwd.Tab
 */
;(function ($, window) {
  "use strict";

  if (!window.nc) window.nc = {};
  if (!nc.rwd) nc.rwd = {};

  nc.rwd.Tab = function (options) {
    if (!options) return;

    this._activeClass = options.activeClass || 'on';
    this._wrap = options.wrap || null;
    this._btns = options.btns || [];
    this._activateCallback = options.activateCallback || null;
    this._activateIndex = 0;

    this._init();
  };

  nc.rwd.Tab.prototype._init = function () {
    this._setBtnsEventHandler(this._btns, true);
  };

  nc.rwd.Tab.prototype._setBtnsEventHandler = function (btns, flag) {
    if (flag === true) {
      $(btns).on('click', $.proxy(this._btnMouseEventHandler, this));
    } else {
      $(btns).off('click', $.proxy(this._btnMouseEventHandler, this));
    }
  };

  nc.rwd.Tab.prototype._btnMouseEventHandler = function (event) {
    event.preventDefault();

    switch (event.type) {
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

  nc.rwd.Tab.prototype._activateTabCallback = function (obj) {
    var callback = this._activateCallback;
    if (callback && callback.constructor === Function) callback.apply(null, [obj]);
  };

  nc.rwd.Tab.prototype._activateTab = function (btn) {
    $(this._btns).removeClass(this._activeClass);
    $(btn).addClass(this._activeClass);
  };

  nc.rwd.Tab.prototype._activateNaviByIndex = function (index) {
    $(this._btns).removeClass(this._activeClass);
    $(this.getBtn(index)).addClass(this._activeClass);
  };

  /*
   * public methods
   */
  nc.rwd.Tab.prototype.getWrap = function() {
    return this._wrap;
  };

  nc.rwd.Tab.prototype.getBtn = function (index) {
    var index = index - 1;
    if (index < 0) return null;
    return $(this._btns).get(index);
  };

  nc.rwd.Tab.prototype.getActivatedIndex = function () {
    return this._activateIndex;
  };

  nc.rwd.Tab.prototype.getBtnLength = function() {
    return $(this._btns).length || 0;
  };

  nc.rwd.Tab.prototype.activate = function (index) {
    var previousIndex = this._activateIndex,
      targetIndex = (index < 0 || index > this._btns.length) ? 0 : index;

    this._activateNaviByIndex(targetIndex);
    this._activateIndex = targetIndex;
  };

  nc.rwd.Tab.prototype.destroy = function () {
    $(this._btns).removeClass(this._activeClass);
    this._setBtnsEventHandler(this._btns, false);

    this._activeClass = 'on';
    this._btns = [];
    this._activateCallback = null;
    this._activateIndex = 0;
  };
}(jQuery, window));

;(function ($, isMobile, window) {
  "use strict";

  var $window = $(window);

  var isCanvasMaskUsable = false;

  var tab,
    tabWrap,
    canvasMask;

  $(document).ready(init);

  function init() {

    console.log('isMobile.any :', isMobile.any);
    
    setTab();

    tabWrap = tab.getWrap();

    $window.on('resize orientationchange', resize);
    resize();

    /*
    canvasMask.disable();
    canvasMask.enable();
    */

    // TEST
    if(canvasMask) {
      console.log('canvasMask.getValue() :', canvasMask.getValue());
    }

    setTestBtns();
  }

  function setTestBtns() {
    $('.test-btns a').on('click', function (event) {
      event.preventDefault();

      var target = $(event.currentTarget),
        index = parseInt(target.text(), 10);
      activateTabByExternal(index);
    });
  }

  function activateTabByExternal(index) {
    if(tab) tab.activate(index);

    if(isCanvasMaskUsable) {
      if( index < 1 || index > tab.getBtnLength() ) return;

      var prev = (index <= 1) ? 0 : index - 1,
        next = (index >= tab.getBtnLength()) ? 0 : index + 1;

      if(!prev) {
        // go to left end
        setDragDealerPosition(0, 0);
        return;
      }

      if(!next) {
        // go to right end
        canvasMask.setValue(1, 0);
        return;
      }

      var tabBtn = $(tab.getBtn(prev));
      if(tabBtn.length) setDragDealerPosition( -tabBtn.position().left, 0 );
    }
  }

  function resize() {
    console.log('resize');

    if ( tabWrap.width() > window.innerWidth ) {
      createCanvasMask();
    } else {
      if(canvasMask) {
        canvasMask.disable();
        isCanvasMaskUsable = false;

        setDragDealerPosition(0, 0);
      }
    }
  }

  function createCanvasMask() {
    if(!canvasMask) {
      console.log('create canvas mask.');

      canvasMask = new Dragdealer( $('.slidetab').get(0), {
        handleClass: 'slidetab__handle',

        disabled: false,
        horizontal: true,
        vertical: false,

        slide: true,
        loose: true,

        speed: 0.3,
        css3: true,

        callback: function(x, y) {
          console.log(x, y);
        }
      });
    } else {
      canvasMask.enable();
    }

    
    if(!isMobile.any) {
      // desktop - disable drag
      canvasMask.disable();
    }

    isCanvasMaskUsable = true;
  }

  function setDragDealerPosition(x, y) {
    var offset = canvasMask.getRatiosByOffsets([x, 0]);
    console.log('offset :', offset);

    canvasMask.setValue( offset[0], offset[1] );
  }

  function setTab() {
    tab = new nc.rwd.Tab({
      wrap: $('.slidetab__tab'),
      btns: $('.slidetab__tab li a'),
      activateCallback: activateNaviCallback,
      activeClass: 'on'
    });

    function activateNaviCallback(_obj) {
      console.log('activateNaviCallback - _obj :', _obj);
    }
  }

  window.setDragDealerPosition = setDragDealerPosition;
}(jQuery, isMobile, window));
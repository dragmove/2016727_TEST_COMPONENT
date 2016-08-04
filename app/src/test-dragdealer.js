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
  nc.rwd.Tab.prototype.getBtn = function (index) {
    var index = index - 1;
    if (index < 0) return null;
    return $(this._btns).get(index);
  };

  nc.rwd.Tab.prototype.getActivatedIndex = function () {
    return this._activateIndex;
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

(function ($, window) {
  "use strict";

  var tab;

  $(document).ready(init);

  function init() {
    setTab();

    var canvasMask = new Dragdealer( $('.wrap-scroll-tabs').get(0), {
      handleClass: 'wrap-scroll',

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

    /*
    canvasMask.disable();
    canvasMask.enable();
    */
    console.log('canvasMask.getValue() :', canvasMask.getValue());
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
}(jQuery, window));
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'TweenMax', 'Hammer', 'ScrollToPlugin'], factory);
  } else {
    root.SinglePageScroll = factory(root.jQuery, TweenMax, Hammer);
  }
}(this, function ($, TweenMax, Hammer) {

  // requestAnimationFrame polyfill: https://gist.github.com/paulirish/1579671
  (function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
  }());

  var util = {
    // 摘自_.debounce : http://underscorejs.org/#debounce
    debounce: function(func, wait, immediate) {
      var timeout, args, context, timestamp, result;

      var later = function() {
        var last = _.now() - timestamp;

        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = _.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }

        return result;
      };
    },

    // 摘自_.throttle : http://underscorejs.org/#throttle
    throttle: function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      if (!options) options = {};
      var later = function() {
        previous = options.leading === false ? 0 : _.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function() {
        var now = _.now();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    },

    scrollTo: function (target, cb) {
      // var current =
    }
  };

  // 兼容性良好的鼠标滚轮监听函数: https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  util.addWheelListener = (function(window,document) {

    var prefix = "", _addEventListener, onwheel, support;

    // detect event model
    if ( window.addEventListener ) {
        _addEventListener = "addEventListener";
    } else {
        _addEventListener = "attachEvent";
        prefix = "on";
    }

    // detect available wheel event
    support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
              document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
              "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

    var addWheelListener = function( elem, callback, useCapture ) {
        _addWheelListener( elem, support, callback, useCapture );

        // handle MozMousePixelScroll in older Firefox
        if( support == "DOMMouseScroll" ) {
            _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
        }
    };

    function _addWheelListener( elem, eventName, callback, useCapture ) {
        elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
            !originalEvent && ( originalEvent = window.event );

            // create a normalized event object
            var event = {
                // keep a ref to the original event object
                originalEvent: originalEvent,
                target: originalEvent.target || originalEvent.srcElement,
                type: "wheel",
                deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                deltaX: 0,
                deltaZ: 0,
                preventDefault: function() {
                    originalEvent.preventDefault ?
                        originalEvent.preventDefault() :
                        originalEvent.returnValue = false;
                }
            };

            // calculate deltaY (and deltaX) according to the event
            if ( support == "mousewheel" ) {
                event.deltaY = - 1/40 * originalEvent.wheelDelta;
                // Webkit also support wheelDeltaX
                originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
            } else {
                event.deltaY = originalEvent.detail;
            }

            // it's time to fire the callback
            return callback( event );

        }, useCapture || false );
    }
    return addWheelListener;
  })(window,document);


  /**
   *  整页滚屏模板
   * @param arg {Object} 参数
   * arg.pages  包含各个页面元素的jQuery对象
   * arg.onBeforeShow {funtion} 页面显示前执行的函数, 如果函数返回false将不会替换当前页面
   *      函数签名: function (data) {}
   *      data.actionType   {string} 页面更换的动作类型,有`keydown`,`listNav`,`mousewheel`
   *      data.current为被显示的页面索引, 从0开始
   *      data.prev为本页显示前的页面索引, 从0开始
   * arg.onPageShow   {function} 页面显示后的函数:
   *      函数签名: funtion (data) {}
   *      data.actionType   {string} 页面更换的动作类型,有`keydown`,`listNav`,`mousewheel`
   *      data.current为被显示的页面索引, 从0开始
   *      data.prev为本页显示前的页面索引, 从0开始
   * arg.onPageHide   {function} 页面隐藏后调用的函数
   *      函数签名: function (data) {}
   *      data.actionType   {string} 页面更换的动作类型,有`keydown`,`listNav`,`mousewheel`
   *      data.current为被隐藏的页面索引,从0开始
   *      data.next为本页隐藏后会显示的页面索引, 从0开始
   * arg.enable {Object} 允许哪些动作触发滚屏
   *      enable.listNav {boolean} 是否允许右侧滚屏,默认true, 组件添加导航所需html
   *      enable.keydown {boolean} 是否允许上下键滚屏,默认true
   *      enable.mousewheel {boolean} 是否允许鼠标滚轮滚屏, 默认true
   **/
  function SinglePageScroll(arg) {
    var me = this;
    $.extend(true, me, SinglePageScroll.defaults, arg);
    me.cacheElements();
    me.addListeners();
    me.adjustPageSize();
    me.go({
      target: me.current
    });
  }

  SinglePageScroll.actionType = {
    keydown: 'keydown',
    listNav: 'listNav',
    mousewheel: 'mousewheel',
    swipe: 'swipe'
  };

  SinglePageScroll.prototype.cacheElements = function () {
    var me = this;
    me.doc = $(document);
    me.win = $(window);
    me.body = $('body');

    if (!(me.pages && me.pages.length)) {
      throw new Error('页面列表不能为空');
    }
    if (me.enable.listNav) {
      var navTokens = [];
      navTokens.push('<ul class="single-page-nav">');
      _.each(me.pages, function (d, i) {
        navTokens.push('<li data-target="' + i + '"></li>');
      });
      navTokens.push('</ul>');
      me.body.append(navTokens.join(''));
      me.listNav = me.body.find('.single-page-nav');
    }
  };
  SinglePageScroll.prototype.addListeners = function () {
    var me = this;
    if (me.enable.keydown) {
      me.doc.on('keydown', _.bind(me.onKeydown, me));
    }
    if (me.enable.mousewheel) {
      util.addWheelListener(document, function (e) {e.preventDefault();});
      util.addWheelListener(document, util.throttle(_.bind(me.onMousewheel, me), 1200, {trailing: false}));
      // me.doc.on('mousewheel', false);
      // me.doc.on('mousewheel', );
    }
    if (me.enable.listNav) {
      me.listNav.on('click', 'li', _.bind(me.onNavListClick, me));
    }
    if (me.enable.swipe) {
      // var swipe = new Hammer(me.body[0]);
      // swipe.get('swipe')
      //   .set({
      //     direction: Hammer.DIRECTION_VERTICAL
      //   });
      // swipe.on('tap', _.bind(me.onSwipe, me));
    }
    me.win.on('resize', util.debounce(_.bind(me.adjustPageSize, me), 400));
  };

  SinglePageScroll.prototype.onSwipe = function (e) {
    alert(JSON.stringify(e));
  };

  SinglePageScroll.prototype.onNavListClick = function (e) {
    var item = $(e.target);
    var me = this;

    var targetPage = parseInt(item.data('target'), 10);
    me.go({
      target: targetPage,
      current: me.current,
      actionType: SinglePageScroll.actionType.listNav
    });
  };
  /**
   * 跳转到data指定页面, 并执行相对应回调
   * @param data {Object} 包含目标页和当前页索引参数
   *    data.target   {number} 目标页索引
   *    data.current  {number} 当前页索引
   *    data.actionType {string} 触发屏幕切换的动作类型
   **/
  SinglePageScroll.prototype.go = function (data) {
    var me = this;
    var target = data.target;
    var current = data.current;

    if (target === current) {
      return;
    }

    if (target < 0) {
      throw new Error('目标页索引不能小于0');
      return;
    } else if (target >= me.pages.length) {
      throw new Error('目标页索引不能超过页面数量');
    }

    if (!me.onBeforeShow(data)) {
      return;
    }


    TweenMax.to(window, me.duration, {
      scrollTo: {y: me.steps[target]},
      onComplete: function () {
        me.current = target;
        if (me.enable.listNav) {
          me.listNav.find('li')
            .removeClass('active')
            .filter(function (i) { return i === target; })
            .addClass('active');
        }

        me.onShow({
          current: target,
          prev: current
        });
        if (current != undefined) {
          me.onHide({
            current: current,
            next: target
          });
        }

      }
    });
  };
  SinglePageScroll.prototype.up = function (data) {
    var me = this;
    if (me.current > 0) {
      me.go({
        target: me.current - 1,
        current: me.current,
        actionType: data.actionType
      });
    }
  };
  SinglePageScroll.prototype.down = function (data) {
    var me = this;
    if (me.current < me.pages.length - 1) {
      me.go({
        target: me.current + 1,
        current: me.current,
        actionType: data.actionType
      });
    }
  };
  SinglePageScroll.prototype.adjustPageSize = function () {
    var me = this;
    var height = me.win.height();
    me.pages.height(height);
    var steps = [];
    _.each(me.pages, function (d, i) {
      steps[i] = height * i;
    });
    me.steps = steps;
    window.scrollTo(0, steps[me.current]);
  };
  SinglePageScroll.prototype.onMousewheel = function (e) {
    var me = this;
    console.log(e)
    if (e.deltaY < 0) {
      me.up({
        actionType: SinglePageScroll.actionType.mousewheel
      });
    } else if (e.deltaY > 0) {
      me.down({
        actionType: SinglePageScroll.actionType.mousewheel
      });
    }
  };
  SinglePageScroll.prototype.onKeydown = function (e) {
    switch (e.which) {
      case 38:
        e.preventDefault();
        this.up({
          actionType: SinglePageScroll.actionType.keydown
        });
        break;
      case 40:
        e.preventDefault();
        this.down({
          actionType: SinglePageScroll.actionType.keydown
        });
        break;
    }
  };

  SinglePageScroll.defaults = {
    duration: 0.3,
    current: 0,
    enable: {
      listNav: true,
      mousewheel: true,
      keydown: true,
      swipe: true
    },
    onBeforeShow: function () {return true;},
    onShow: $.noop,
    onHide: $.noop
  };

  return SinglePageScroll;
}));

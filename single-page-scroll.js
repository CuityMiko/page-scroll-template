(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'underscore', 'TweenMax', 'Hammer', 'ScrollToPlugin', 'jquery.mousewheel'], factory);
  } else {
    root.SinglePageScroll = factory(root.jQuery, _, TweenMax, Hammer);
  }
}(this, function ($, _, TweenMax, Hammer) {

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
      var tplFn = _.template('<li data-target="<%= targetIndex %>"></li>');
      navTokens.push('<ul class="single-page-nav">');
      _.each(me.pages, function (d, i) {
        navTokens.push(tplFn({targetIndex: i}));
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
      me.doc.on('mousewheel', false);
      me.doc.on('mousewheel', _.throttle(_.bind(me.onMousewheel, me), 1200, {trailing: false}));
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
    me.win.on('resize', _.debounce(_.bind(me.adjustPageSize, me), 400));
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
    if (e.deltaY > 0) {
      me.up({
        actionType: SinglePageScroll.actionType.mousewheel
      });
    } else if (e.deltaY < 0) {
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

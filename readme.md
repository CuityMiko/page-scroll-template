
## 单页滚屏模板

![][1]

[demo][2]


### 滚屏支持

- 支持AMD和普通全局对象访问
- 鼠标滚轮
- 键盘上下方向键
- 右侧导航点击

### 使用

- 全局变量引入script参考index.html
- amd参考index-amd.html

- 组件监听浏览器窗口高度, 并设置传入的`pages`高度为浏览器窗口高度

## API

### SinglePageScroll

```
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
```

## FAQs

### 页面有些部分需要滚动功能, 不想触发整页滚动怎么办

答:

- 在该页元素监听`mousewheel`事件, `e.stopPropagation()`阻止冒泡
- 或者在`onBeforeShow`回调中根据`actionType`进行判断


[2]: http://qiudeqing.com/page-scroll-template/
[1]: http://gtms01.alicdn.com/tps/i1/TB1bnylJFXXXXXBXpXXEbJOIVXX-76-77.jpg

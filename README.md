# 客户端如何优化处理因用户误操作导致的多次请求

在互联网应用中，我们经常用到的场景，比如用户点击某个按钮，触发的操作会和后台api进行数据交互，生成一些记录，比如下单购买。如果后台api请求比较慢，而客户端体验又做得不到位，导致用户以为没点击到或者是页面假死，在上次请求还没处理完，就再次点击按钮。这样会导致某个操作生成多次记录，导致一些异常的bug。

很显然，后台的api在这方面是需要做好处理。然而，面对用户，我们需要更好的体验，可以在客户端去避免这些问题，前置地解决问题。

最近听产品经理常说，用户点击某个按钮多次，后台还没处理完导致多笔记录生成，我们需要在用户点击后跳转到一个新的页面，其实这根本不是跳页问题，是程序问题。如果程序员真这么干，是不是要下岗了。

以前偷懒的时候，在前端我们可能会这么处理：

```js
var getUserDataFlag = false;
function getUserData() {
  if (getDataFlag) {
    return;
  }
  getDataFlag = true;
  $.ajax({
    url: '/xxx/getUser',
    success: function () {
      getUserData = false;
      //todo
    },
    error: function () {
      getUserData = false;
    }
  })
}
//当接口很多的时候，我们的代码就变成这样
var getUserAssetFlag = true;
function getUserAsset() {
  if (getDataFlag) {
    return;
  }
  getDataFlag = true;
  $.ajax({
    url: '/xxx/getUserAsset',
    success: function () {
      getUserAssetFlag = false;
      //todo
    },
    error: function () {
      getUserAssetFlag = false;
    }
  })
}
```

上面的例子你会发现，当接口越来越多，维护请求状态的变量将会越来越多，并且当存在依赖时，维护成本更高，也更容易出错。

如何优雅地解决这样的问题，其实封装一下请求就能简单又能自动地处理这个问题。

最近在重构angular的项目以及在写微信小程序demo，有一些小实践和总结，例子请参照：


- [`angular的例子`](./angular-demo.js)
- [`微信小程序的例子`](./xiaochengxu-demo.js)


欢迎大家交流更多好的解决方案。
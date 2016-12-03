;(function () {
  //定义api promise service
  angular.module('app.apiService', [''])
    .factory('apiService', ['$http', '$q', function($http, $q) {
      function isObject (obj) {
        return isType(obj, 'Object')
      }
      function isType (obj, type) {
        return Object.prototype.toString.call(obj) === '[object ' + type + ']'
      }
      //记录所有与后台正在请求的地址和参数
      var requestList = {};
      //将请求记录到requestList中
      function addRequestKey (key) {
          requestList[key] = true
      }
      //将请求从requestList移除
      function removeRequestKey (key) {
          delete requestList[key]
      }
      //请求是否在requestList中
      function hitRequestKey (key) {
          return requestList[key]
      }
      //根据请求的地址，类型以及数据生成唯一请求key
      function getRequestKey (data) {
          if (!isObject(data)) {
              return data
          }
          var ajaxKey = 'Method: ' + data.method + ',Url: ' + data.url + ',Data: '
          try {
              ajaxKey += JSON.stringify(data.data)
          } catch (e) {
              ajaxKey += data.data
          }
          return ajaxKey
      }
      //统一请求入口
      function http (data) {
        if (!isObject(data)) {
          throw Error('ajax请求参数必须是json对象: ' + data)
        }
        data.method = (data.method || 'GET').toUpperCase();
        data.headers = data.headers || {'Content-Type': 'application/json'};
        if (data.method === 'GET') {
          data.params = data.data;
          delete data.data
        }
        var ajaxKey = getRequestKey(data)
        //当key命中且请求未完成，抛出异常
        if (hitRequestKey(ajaxKey)) {
            throw Error('重复提交请求：' + ajaxKey)
        }
        //将当前请求记录起来
        addRequestKey(ajaxKey)
        return $http(data)
            .then(function (data, status, headers, config) {
              //请求完成移除请求记录
              removeRequestKey(ajaxKey)
              return data.data
            })
            .catch(function (e) {
              //请求完成移除请求记录
              removeRequestKey(ajaxKey)
              return $q.reject(e);
            })
      }
      var output = {
        // get 请求
        getUserState: function (data) {
          return http({
            url: '/xxx/getState',
            data: data
          })
        },
        // post 请求
        saveUserState: function (data) {
          return http({
            url: '/xxx/postData',
            method: 'POST',
            data: data
          })
        }
      }
      return output;
  }])
})();

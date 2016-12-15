import vue from 'vue'
import {API_ROOT} from './config'
import {makeQueryUrl, isObject} from './utils/util'
import * as mutationTypes from './vuex/mutation-type'

// api请求记录
let requestList = {}

// 将当前请求的api记录起来
export function addRequestKey (key) {
  requestList[key] = true
}

// 将请求完成的api从记录中移除
export function removeRequestKey (key) {
  delete requestList[key]
}

// 当前请求的api是否已有记录
export function hitRequestKey (key) {
  return requestList[key]
}

// 获取串行请求的key,方便记录
export function getLockRequestKey (data) {
  if (!isObject(data)) {
    return data
  }
  let ajaxKey = 'lockRequestKey:'
  try {
    ajaxKey += JSON.stringify(data)
  } catch (e) {
    ajaxKey += data
  }
  return ajaxKey
}

// 根据请求的地址，请求参数组装成api请求的key,方便记录
export function getRequestKey (data) {
  if (!isObject(data)) {
    return data
  }
  let ajaxKey = 'Method: ' + data.method + ',Url: ' + data.url + ',Data: '
  try {
    ajaxKey += JSON.stringify(data.data)
  } catch (e) {
    ajaxKey += data.data
  }
  return ajaxKey
}

export const http = ({
  method,
  url,
  params
}, commit) => {
  if (commit) commit(mutationTypes.START_LOADING)
  let httpParam = []
  let _url = url
  method = method.toLocaleLowerCase()
  // 下面对所有http请求做防重复请求处理，后面单独分享原理
  let ajaxKey = getRequestKey({method: method, url: url, data: params})
  if (hitRequestKey(ajaxKey)) {
    throw Error('重复提交请求：' + ajaxKey)
  }
  addRequestKey(ajaxKey)
  if (method === 'get') {
    _url = makeQueryUrl(url, params)
  }
  _url = API_ROOT + _url
  httpParam.push(_url)
  switch (method) {
    case 'post' :
      httpParam.push(params)
      break
  }
  return vue.http[method](...httpParam)
    .then((res) => {
      // 请求完成，释放记录的key，可以发起下次请求了
      removeRequestKey(ajaxKey)
      if (commit) commit(mutationTypes.FINISH_LOADING)
      if ((res.status >= 200 && res.status < 300) || res.status === 304) {
        return res.data
      }
      return Promise.reject(new Error(res.status))
    }, (res) => {
      // 请求完成，释放记录的key，可以发起下次请求了
      removeRequestKey(ajaxKey)
      if (commit) commit(mutationTypes.FINISH_LOADING)
      return Promise.reject(new Error(res.status))
    })
}

// 通用get方法
export const getMethod = ({
  url,
  query
}, commit) => {
  let method = 'get'
  return http({method, url, query}, commit)
}

// 通用post方法
export const postMethod = ({
  url,
  params
}, commit) => {
  let method = 'post'
  return http({method, url, params}, commit)
}

// 该方法适用于串行请求的api
export function lockRequest (data, commit, fn) {
  let ajaxKey = getLockRequestKey(data)
  if (hitRequestKey(ajaxKey)) {
    throw Error('重复提交请求：' + ajaxKey)
  }
  addRequestKey(ajaxKey)
  return new Promise(function (resolve, reject) {
    return fn(commit, data)
      .then(function (data) {
        removeRequestKey(ajaxKey)
        return resolve(data)
      })
      .catch(function (error) {
        removeRequestKey(ajaxKey)
        return reject(error)
      })
  })
}

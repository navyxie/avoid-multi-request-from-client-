import {isObject} from './util'

let Promise = require('../libs/bluebird.min')
let requestList = {} //api请求记录

// 将当前请求的api记录起来
export function addRequestKey (key) {
    requestList[key] = true
}

// 将请求完成的api从记录中移除
export function removeRequestKey (key) {
    delete requestList[key]
}

//当前请求的api是否已有记录
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

//根据请求的地址，请求参数组装成api请求的key,方便记录
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
//所有与服务器进行http请求的出口
export function http (data) {
    if (!isObject(data)) {
        throw Error('ajax请求参数必须是json对象: ' + data)
    }
    data.method = (data.method || 'GET').toUpperCase()
    //下面5行是对所有http请求做防重复请求处理，后面单独分享原理
    let ajaxKey = getRequestKey(data)
    if (hitRequestKey(ajaxKey)) {
        throw Error('重复提交请求：' + ajaxKey)
    }
    addRequestKey(ajaxKey)
    //bluebird.js包装成promisepromise api
    return new Promise(function (resolve, reject) {
        //通过wx.request api 向服务器端发出http请求
        wx.request({
            url: data.url,
            data: data.data,
            method: data.method,
            header: data.header || {'Content-Type': 'application/json'},
            complete: function (res) {
                // 请求完成，释放记录的key，可以发起下次请求了
                removeRequestKey(ajaxKey)
                let statusCode = res.statusCode
                if (statusCode === 200 || statusCode === 304) {
                    return resolve(res.data)
                }
                return reject(res)
            }
        })
    }) 
}

//通用get请求方法
export function httpGet (data) {
    return http(data)
}

//通用post请求方法
export function httpPost (data) {
    data.method = 'POST'
    return http(data)
}

// 该方法适用于串行请求的api
export function lockRequest (data, fn) {
    let ajaxKey = getLockRequestKey(data)
    if (hitRequestKey(ajaxKey)) {
        throw Error('重复提交请求：' + ajaxKey)
    }
    addRequestKey(ajaxKey)
    return new Promise(function (resolve, reject) {
        fn(data)
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
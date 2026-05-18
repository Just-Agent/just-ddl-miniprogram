import config from './config.js'

const createRequestId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const appendQuery = (url, data = {}) => {
  const keys = Object.keys(data).filter((key) => data[key] !== undefined && data[key] !== null)
  if (!keys.length) return url
  const queryParams = keys.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`).join('&')
  return `${url}${url.includes('?') ? '&' : '?'}${queryParams}`
}

const request = (options) => new Promise((resolve, reject) => {
  const showLoading = options.showLoading === true
  if (showLoading) wx.showLoading({ title: options.loadingText || '加载中...', mask: true })
  const method = (options.method || 'GET').toUpperCase()
  const rawUrl = /^https?:\/\//.test(options.url) ? options.url : `${config.baseUrl}${options.url}`
  const url = method === 'GET' && options.data ? appendQuery(rawUrl, options.data) : rawUrl

  wx.request({
    url,
    method,
    data: method !== 'GET' ? (options.data || {}) : {},
    header: {
      'Content-Type': 'application/json',
      'X-Request-Id': options.requestId || createRequestId(),
      ...options.header,
    },
    timeout: options.timeout || config.timeout,
    success: (res) => {
      if (showLoading) wx.hideLoading()
      const { statusCode, data } = res
      if (statusCode >= 200 && statusCode < 300) {
        if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'code')) {
          if (data.code === 0) {
            resolve(data.data || {})
            return
          }
          wx.showToast({ title: data.msg || data.message || '请求失败', icon: 'none', duration: 2000 })
          reject(data)
          return
        }
        resolve(data)
        return
      }
      wx.showToast({ title: statusCode >= 500 ? '服务暂不可用' : '网络错误', icon: 'none', duration: 2000 })
      reject(res)
    },
    fail: (err) => {
      if (showLoading) wx.hideLoading()
      if (options.silent !== true) wx.showToast({ title: '网络连接失败', icon: 'none', duration: 2000 })
      reject(err)
    },
  })
})

request.get = (url, data, options = {}) => request({ ...options, url, data, method: 'GET' })
request.post = (url, data, options = {}) => request({ ...options, url, data, method: 'POST' })

export default request

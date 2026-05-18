const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext()
    return { ok: true, data: { openid: wxContext.OPENID, unionid: wxContext.UNIONID || '', appid: wxContext.APPID } }
  } catch (error) {
    console.error('login failed', error)
    return { ok: false, error: 'LOGIN_FAILED' }
  }
}

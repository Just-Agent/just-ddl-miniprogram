const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async (event) => {
  const content = String(event.content || '').slice(0, 2000)
  if (!content.trim()) return { ok: false, error: 'EMPTY_CONTENT' }
  try {
    // TODO: 接入微信内容安全接口或企业自有审核服务。
    return { ok: true, data: { status: 'approved' } }
  } catch (error) {
    console.error('content check failed', error)
    return { ok: false, error: 'CONTENT_CHECK_FAILED' }
  }
}

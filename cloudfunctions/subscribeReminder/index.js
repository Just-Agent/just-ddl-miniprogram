const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => ({
  ok: false,
  error: 'PHASE_TWO_NOT_ENABLED',
  message: 'Subscription reminder templates and user opt-in are reserved for phase two.',
})

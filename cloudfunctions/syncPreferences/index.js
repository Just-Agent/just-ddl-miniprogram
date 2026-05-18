const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => ({
  ok: false,
  error: 'PHASE_TWO_NOT_ENABLED',
  message: 'Cloud preference sync is reserved for Just-DDL phase two.',
})

App({
  globalData: {
    cloudEnv: 'just-ddl-dev',
    user: null,
    dataVersion: '',
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: 'just-ddl-dev', traceUser: true })
    }
  },
})

Component({
  properties: {
    visible: { type: Boolean, value: false },
  },
  methods: {
    openPrivacy() {
      if (wx.openPrivacyContract) wx.openPrivacyContract()
    },
    close() {
      this.triggerEvent('close')
    },
  },
})

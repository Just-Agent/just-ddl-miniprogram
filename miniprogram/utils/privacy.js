export const checkPrivacy = () => new Promise((resolve) => {
  if (!wx.getPrivacySetting) { resolve({ needAuthorization: false, privacyContractName: '' }); return }
  wx.getPrivacySetting({ success: resolve, fail: () => resolve({ needAuthorization: true, privacyContractName: '隐私保护指引' }) })
})
export const requirePrivacy = () => new Promise((resolve, reject) => {
  if (!wx.requirePrivacyAuthorize) { resolve({ ok: true }); return }
  wx.requirePrivacyAuthorize({ success: () => resolve({ ok: true }), fail: reject })
})
export const openPrivacyContract = () => { if (wx.openPrivacyContract) wx.openPrivacyContract({ fail: console.error }) }

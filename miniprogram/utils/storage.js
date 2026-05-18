export const setStorage = (key, value, ttlMs = 0) => {
  wx.setStorageSync(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 })
}

export const getStorage = (key, defaultValue = null) => {
  const item = wx.getStorageSync(key)
  if (!item) return defaultValue
  if (item.expiresAt && item.expiresAt < Date.now()) {
    wx.removeStorageSync(key)
    return defaultValue
  }
  return item.value === undefined ? defaultValue : item.value
}

export const removeStorage = (key) => {
  wx.removeStorageSync(key)
}

export const getArrayStorage = (key) => {
  const value = getStorage(key, [])
  return Array.isArray(value) ? value : []
}

export const toggleArrayItem = (key, id) => {
  const list = getArrayStorage(key)
  const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  setStorage(key, next)
  return next
}

export const getObjectStorage = (key) => {
  const value = getStorage(key, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

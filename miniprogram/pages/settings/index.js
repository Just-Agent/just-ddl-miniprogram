import { STORAGE_KEY } from '../../constants/storage-key.js'
import { getLanguage, setLanguage } from '../../utils/i18n.js'
import { getObjectStorage, setStorage } from '../../utils/storage.js'
import { loadManifest, refreshAll } from '../../services/ddl-service.js'

Page({
  data: {
    language: 'zh',
    manifest: null,
    cacheUpdatedAt: '',
    privacyVisible: false,
  },
  onShow() {
    this.loadSettings()
  },
  async loadSettings() {
    const language = getLanguage()
    const cache = getObjectStorage(STORAGE_KEY.DATA_CACHE)
    const cacheUpdatedAt = cache.updatedAt ? new Date(cache.updatedAt).toLocaleString() : '暂无缓存'
    const manifest = await loadManifest().catch(() => null)
    this.setData({ language, manifest, cacheUpdatedAt })
  },
  switchLanguage(event) {
    const language = event.currentTarget.dataset.value
    setLanguage(language)
    this.setData({ language })
    wx.showToast({ title: language === 'zh' ? '已切换中文' : 'English UI', icon: 'none' })
  },
  async refresh() {
    await refreshAll()
    await this.loadSettings()
    wx.showToast({ title: '数据已刷新', icon: 'success' })
  },
  clearCache() {
    setStorage(STORAGE_KEY.DATA_CACHE, {})
    this.loadSettings()
    wx.showToast({ title: '缓存已清理', icon: 'success' })
  },
  showPrivacy() {
    this.setData({ privacyVisible: true })
  },
  hidePrivacy() {
    this.setData({ privacyVisible: false })
  },
})

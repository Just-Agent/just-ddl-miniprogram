import config from '../../utils/config.js'
import { STORAGE_KEY } from '../../constants/storage-key.js'
import { getStorage, setStorage } from '../../utils/storage.js'
import { loadAllFavoriteItems } from '../../services/ddl-service.js'
import { getFavoriteEvents, getFavoriteTopics, toggleFavoriteEvent } from '../../services/favorites-service.js'

Page({
  data: {
    loading: true,
    organizeMode: 'topic',
    viewMode: 'list',
    visualMode: 'vivid',
    favoriteTopics: [],
    favoriteEvents: [],
    items: [],
    groups: [],
    assetBaseUrl: config.assetBaseUrl,
  },
  onShow() {
    this.loadMine()
  },
  async loadMine() {
    const favoriteTopics = getFavoriteTopics()
    const favoriteEvents = getFavoriteEvents()
    const organizeMode = getStorage('just-ddl:organizeMode', 'topic')
    const viewMode = getStorage(STORAGE_KEY.VIEW_MODE, 'list')
    const visualMode = getStorage(STORAGE_KEY.VISUAL_MODE, 'vivid')
    this.setData({ loading: true, favoriteTopics, favoriteEvents, organizeMode, viewMode, visualMode })
    try {
      const items = await loadAllFavoriteItems({ favoriteTopics, favoriteEvents })
      this.setData({ items: this.markFavorites(items, favoriteEvents) })
      this.rebuildGroups()
    } catch (error) {
      wx.showToast({ title: '我的 DDL 加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  markFavorites(items, favoriteEvents) {
    return items.map((item) => ({ ...item, favorite: favoriteEvents.includes(item.id) }))
  },
  rebuildGroups() {
    const items = [...this.data.items]
    if (this.data.organizeMode === 'name') {
      items.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
      this.setData({ groups: [{ id: 'name', name: '按名称排序', color: '#0f766e', items }] })
      return
    }
    if (this.data.organizeMode === 'time') {
      items.sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))
      this.setData({ groups: [{ id: 'time', name: '按时间排序', color: '#0f766e', items }] })
      return
    }
    const map = new Map()
    items.forEach((item) => {
      const id = item.topicId || 'unknown'
      if (!map.has(id)) map.set(id, { id, name: item.topicName || id, color: item.topicColor || '#0f766e', items: [] })
      map.get(id).items.push(item)
    })
    this.setData({ groups: [...map.values()] })
  },
  setOrganize(event) {
    const organizeMode = event.currentTarget.dataset.value
    setStorage('just-ddl:organizeMode', organizeMode)
    this.setData({ organizeMode })
    this.rebuildGroups()
  },
  setViewMode(event) {
    setStorage(STORAGE_KEY.VIEW_MODE, event.detail.value)
    this.setData({ viewMode: event.detail.value })
  },
  setVisualMode(event) {
    setStorage(STORAGE_KEY.VISUAL_MODE, event.detail.value)
    this.setData({ visualMode: event.detail.value })
  },
  openEvent(event) {
    wx.navigateTo({ url: `/subpackages/topic/event/index?topicId=${event.detail.topicId}&id=${event.detail.id}` })
  },
  toggleEvent(event) {
    toggleFavoriteEvent(event.detail.id)
    this.loadMine()
  },
  copySource(event) {
    wx.setClipboardData({ data: event.detail.url })
  },
  goPlaza() {
    wx.switchTab({ url: '/pages/plaza/index' })
  },
})

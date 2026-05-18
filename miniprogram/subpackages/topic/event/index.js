import config from '../../../utils/config.js'
import { loadManifest, loadTopicDetail } from '../../../services/ddl-service.js'
import { getFavoriteEvents, toggleFavoriteEvent } from '../../../services/favorites-service.js'

Page({
  data: {
    topicId: '',
    id: '',
    topic: null,
    item: null,
    favorite: false,
    assetBaseUrl: config.assetBaseUrl,
  },
  onLoad(query) {
    this.setData({ topicId: query.topicId || '', id: query.id || '' })
    this.loadEvent()
  },
  async loadEvent() {
    try {
      const [manifest, detail] = await Promise.all([
        loadManifest().catch(() => null),
        loadTopicDetail(this.data.topicId),
      ])
      const item = (detail.items || []).find((entry) => entry.id === this.data.id)
      if (!item) throw new Error('Event not found')
      const favorite = getFavoriteEvents().includes(item.id)
      this.setData({
        topic: detail.topic,
        item,
        favorite,
        assetBaseUrl: (manifest && manifest.baseAssetUrl) || config.assetBaseUrl,
      })
      wx.setNavigationBarTitle({ title: item.title })
    } catch (error) {
      wx.showToast({ title: '事件加载失败', icon: 'none' })
    }
  },
  toggleFavorite() {
    toggleFavoriteEvent(this.data.id)
    this.setData({ favorite: getFavoriteEvents().includes(this.data.id) })
  },
  copySource() {
    wx.setClipboardData({ data: this.data.item.url })
  },
})

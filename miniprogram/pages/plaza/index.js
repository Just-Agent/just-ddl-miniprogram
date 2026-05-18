import { loadManifest, loadTopics, refreshAll } from '../../services/ddl-service.js'
import { getFavoriteTopics, toggleFavoriteTopic } from '../../services/favorites-service.js'

Page({
  data: {
    loading: true,
    query: '',
    manifest: null,
    topics: [],
    filteredTopics: [],
    favoriteTopics: [],
    stats: { topics: 0, items: 0 },
  },
  onLoad() {
    this.loadData()
  },
  onShow() {
    this.decorateTopics()
  },
  async loadData(force = false) {
    this.setData({ loading: true })
    try {
      const [manifest, topics] = await Promise.all([loadManifest(force), loadTopics(force)])
      getApp().globalData.dataVersion = manifest.dataVersion || ''
      this.setData({
        manifest,
        topics,
        stats: { topics: manifest.topicsCount || topics.length, items: manifest.itemsCount || 0 },
      })
      this.decorateTopics()
    } catch (error) {
      wx.showToast({ title: '数据暂不可用', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  decorateTopics() {
    const favoriteTopics = getFavoriteTopics()
    const query = this.data.query.trim().toLowerCase()
    const filteredTopics = (this.data.topics || [])
      .filter((topic) => {
        if (!query) return true
        return [topic.name, topic.description, topic.category, ...(topic.tags || [])].join(' ').toLowerCase().includes(query)
      })
      .map((topic) => ({ ...topic, favorite: favoriteTopics.includes(topic.id) }))
    this.setData({ favoriteTopics, filteredTopics })
  },
  handleSearch(event) {
    this.setData({ query: event.detail.value || '' })
    this.decorateTopics()
  },
  openTopic(event) {
    wx.navigateTo({ url: `/subpackages/topic/detail/index?id=${event.detail.id}` })
  },
  toggleTopic(event) {
    toggleFavoriteTopic(event.detail.id)
    this.decorateTopics()
  },
  copyRepo(event) {
    const repo = event.detail.repo
    wx.setClipboardData({ data: `https://github.com/${repo}` })
  },
  async refresh() {
    await refreshAll()
    await this.loadData(true)
    wx.showToast({ title: '已刷新', icon: 'success' })
  },
})

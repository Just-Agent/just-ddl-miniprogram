import config from '../../../utils/config.js'
import { STORAGE_KEY } from '../../../constants/storage-key.js'
import { getStorage, setStorage } from '../../../utils/storage.js'
import { loadManifest, loadTopicDetail } from '../../../services/ddl-service.js'
import { getFavoriteEvents, getFavoriteTopics, getPinnedSubtopics, toggleFavoriteEvent, toggleFavoriteTopic, togglePinnedSubtopic } from '../../../services/favorites-service.js'
import { sortByDeadline } from '../../../utils/date.js'

Page({
  data: {
    topicId: '',
    topic: null,
    items: [],
    groups: [],
    favoriteTopic: false,
    favoriteEvents: [],
    pinnedSubtopics: [],
    collapsedSubtopics: [],
    viewMode: 'grid',
    visualMode: 'vivid',
    assetBaseUrl: config.assetBaseUrl,
  },
  onLoad(query) {
    this.setData({ topicId: query.id || '' })
    this.loadDetail()
  },
  onShow() {
    if (this.data.topicId) this.decorateState()
  },
  async loadDetail(force = false) {
    try {
      const [manifest, detail] = await Promise.all([
        loadManifest().catch(() => null),
        loadTopicDetail(this.data.topicId, force),
      ])
      const assetBaseUrl = (manifest && manifest.baseAssetUrl) || config.assetBaseUrl
      this.setData({
        topic: detail.topic,
        items: sortByDeadline(detail.items || []),
        assetBaseUrl,
        viewMode: getStorage(STORAGE_KEY.VIEW_MODE, 'grid'),
        visualMode: getStorage(STORAGE_KEY.VISUAL_MODE, 'vivid'),
      })
      wx.setNavigationBarTitle({ title: detail.topic?.name || '专题详情' })
      this.decorateState()
    } catch (error) {
      wx.showToast({ title: '专题加载失败', icon: 'none' })
    }
  },
  decorateState() {
    const favoriteEvents = getFavoriteEvents()
    const favoriteTopic = getFavoriteTopics().includes(this.data.topicId)
    const pinnedSubtopics = getPinnedSubtopics(this.data.topicId)
    const items = this.data.items.map((item) => ({ ...item, favorite: favoriteEvents.includes(item.id) }))
    const groupsMap = new Map()
    items.forEach((item) => {
      const id = item.subtopic || item.type || 'general'
      const name = item.subtopicName || item.tags?.[0] || item.type || 'General'
      if (!groupsMap.has(id)) groupsMap.set(id, { id, name, items: [] })
      groupsMap.get(id).items.push(item)
    })
    const groups = [...groupsMap.values()].map((group) => ({
      ...group,
      items: sortByDeadline(group.items),
      nextTitle: sortByDeadline(group.items).find((item) => item.status !== 'ended')?.title || '',
      pinned: pinnedSubtopics.includes(group.id),
      collapsed: this.data.collapsedSubtopics.includes(group.id),
    })).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.name.localeCompare(b.name, 'zh-Hans-CN'))
    this.setData({ favoriteEvents, favoriteTopic, pinnedSubtopics, groups, items })
  },
  setViewMode(event) {
    setStorage(STORAGE_KEY.VIEW_MODE, event.detail.value)
    this.setData({ viewMode: event.detail.value })
  },
  setVisualMode(event) {
    setStorage(STORAGE_KEY.VISUAL_MODE, event.detail.value)
    this.setData({ visualMode: event.detail.value })
  },
  toggleTopic() {
    toggleFavoriteTopic(this.data.topicId)
    this.decorateState()
  },
  toggleEvent(event) {
    toggleFavoriteEvent(event.detail.id)
    this.decorateState()
  },
  togglePin(event) {
    togglePinnedSubtopic(this.data.topicId, event.detail.id)
    this.decorateState()
  },
  toggleCollapse(event) {
    const id = event.detail.id
    const current = this.data.collapsedSubtopics
    const collapsedSubtopics = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    this.setData({ collapsedSubtopics })
    this.decorateState()
  },
  openEvent(event) {
    wx.navigateTo({ url: `/subpackages/topic/event/index?topicId=${event.detail.topicId}&id=${event.detail.id}` })
  },
  copySource(event) {
    wx.setClipboardData({ data: event.detail.url })
  },
  copyRepo() {
    wx.setClipboardData({ data: `https://github.com/${this.data.topic.repo}` })
  },
})

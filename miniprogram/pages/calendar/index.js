import config from '../../utils/config.js'
import { STORAGE_KEY } from '../../constants/storage-key.js'
import { getStorage, setStorage } from '../../utils/storage.js'
import { loadSearchIndex, loadTopics } from '../../services/ddl-service.js'
import { getFavoriteEvents, toggleFavoriteEvent } from '../../services/favorites-service.js'
import { sortByDeadline, withinDays } from '../../utils/date.js'

Page({
  data: {
    period: 30,
    items: [],
    topicsMap: {},
    favoriteEvents: [],
    assetBaseUrl: config.assetBaseUrl,
  },
  onShow() {
    this.loadCalendar()
  },
  async loadCalendar() {
    const period = Number(getStorage(STORAGE_KEY.PERIOD, 30))
    const favoriteEvents = getFavoriteEvents()
    try {
      const [indexItems, topics] = await Promise.all([loadSearchIndex(), loadTopics()])
      const topicsMap = topics.reduce((map, topic) => ({ ...map, [topic.id]: topic }), {})
      const items = sortByDeadline(indexItems)
        .filter((item) => withinDays(item.deadline, period))
        .map((item) => ({
          ...item,
          favorite: favoriteEvents.includes(item.id),
          topicName: topicsMap[item.topicId]?.name || item.topicId,
          topicColor: topicsMap[item.topicId]?.color || '#0f766e',
          dateRange: item.deadline,
          location: '',
          tags: item.tags || [],
          url: item.sourceUrl,
          source: item.source,
        }))
      this.setData({ period, favoriteEvents, items, topicsMap })
    } catch (error) {
      wx.showToast({ title: '日历加载失败', icon: 'none' })
    }
  },
  setPeriod(event) {
    const period = Number(event.currentTarget.dataset.value)
    setStorage(STORAGE_KEY.PERIOD, period)
    this.setData({ period })
    this.loadCalendar()
  },
  openEvent(event) {
    wx.navigateTo({ url: `/subpackages/topic/event/index?topicId=${event.detail.topicId}&id=${event.detail.id}` })
  },
  toggleEvent(event) {
    toggleFavoriteEvent(event.detail.id)
    this.loadCalendar()
  },
  copySource(event) {
    wx.setClipboardData({ data: event.detail.url })
  },
})

import { formatShortDate } from '../../utils/date.js'

Component({
  properties: {
    item: {
      type: Object,
      value: {},
      observer(value) {
        this.updateDisplay(value)
      },
    },
    topicColor: { type: String, value: '#0f766e' },
    topicName: { type: String, value: '' },
    favorite: { type: Boolean, value: false },
    viewMode: { type: String, value: 'list' },
    visualMode: { type: String, value: 'vivid' },
    assetBaseUrl: { type: String, value: '' },
  },
  data: {
    dateText: '',
    sourceMode: '官方页面',
  },
  lifetimes: {
    attached() {
      this.updateDisplay(this.properties.item)
    },
  },
  methods: {
    updateDisplay(item) {
      const shared = /calendar|eventslist|schedule/i.test(`${item.sourceUrl || item.url || ''}`)
      this.setData({
        dateText: formatShortDate(item.deadline),
        sourceMode: shared ? '共享赛历' : '官方页面',
      })
    },
    handleOpen() {
      this.triggerEvent('open', { id: this.properties.item.id, topicId: this.properties.item.topicId })
    },
    handleFavorite() {
      this.triggerEvent('togglefavorite', { id: this.properties.item.id })
    },
    handleSource() {
      this.triggerEvent('source', { url: this.properties.item.url, title: this.properties.item.title })
    },
  },
})

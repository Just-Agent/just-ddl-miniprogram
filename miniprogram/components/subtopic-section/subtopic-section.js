Component({
  properties: {
    group: { type: Object, value: {} },
    topic: { type: Object, value: {} },
    pinned: { type: Boolean, value: false },
    collapsed: { type: Boolean, value: false },
    viewMode: { type: String, value: 'grid' },
    visualMode: { type: String, value: 'vivid' },
    assetBaseUrl: { type: String, value: '' },
  },
  methods: {
    togglePin() {
      this.triggerEvent('pin', { id: this.properties.group.id })
    },
    toggleCollapse() {
      this.triggerEvent('collapse', { id: this.properties.group.id })
    },
    handleOpen(event) {
      this.triggerEvent('open', event.detail)
    },
    handleFavorite(event) {
      this.triggerEvent('togglefavorite', event.detail)
    },
    handleSource(event) {
      this.triggerEvent('source', event.detail)
    },
  },
})

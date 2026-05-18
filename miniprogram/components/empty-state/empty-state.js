Component({
  properties: {
    title: { type: String, value: '暂无内容' },
    description: { type: String, value: '' },
    action: { type: String, value: '' },
  },
  methods: {
    handleAction() {
      this.triggerEvent('action')
    },
  },
})

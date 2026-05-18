Component({
  properties: {
    image: {
      type: String,
      value: '',
      observer() { this.updateImageUrl() },
    },
    assetBaseUrl: {
      type: String,
      value: '',
      observer() { this.updateImageUrl() },
    },
    label: { type: String, value: '官方来源' },
    mode: { type: String, value: '官方页面' },
    color: { type: String, value: '#0f766e' },
    title: { type: String, value: '' },
  },
  data: {
    imageUrl: '',
  },
  lifetimes: {
    attached() {
      this.updateImageUrl()
    },
  },
  methods: {
    updateImageUrl() {
      const { image, assetBaseUrl } = this.properties
      if (!image) {
        this.setData({ imageUrl: '' })
        return
      }
      const imageUrl = /^https?:\/\//.test(image)
        ? image
        : `${assetBaseUrl || ''}${image}`
      this.setData({ imageUrl })
    },
    handleOpen() {
      this.triggerEvent('source')
    },
  },
})

Component({
  properties: {
    topic: {
      type: Object,
      value: {},
      observer(value) {
        this.setData({ initial: value && value.name ? value.name.slice(0, 1) : 'J' })
      },
    },
    favorite: { type: Boolean, value: false },
  },
  data: {
    initial: 'J',
  },
  methods: {
    handleOpen() {
      this.triggerEvent('open', { id: this.properties.topic.id })
    },
    handleFavorite() {
      this.triggerEvent('togglefavorite', { id: this.properties.topic.id })
    },
    handleRepo() {
      this.triggerEvent('repo', { repo: this.properties.topic.repo })
    },
  },
})

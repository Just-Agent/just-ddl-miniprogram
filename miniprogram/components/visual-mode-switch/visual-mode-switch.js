Component({
  properties: {
    value: { type: String, value: 'vivid' },
  },
  methods: {
    choose(event) {
      this.triggerEvent('change', { value: event.currentTarget.dataset.value })
    },
  },
})

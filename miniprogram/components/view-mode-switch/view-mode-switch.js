Component({
  properties: {
    value: { type: String, value: 'list' },
  },
  methods: {
    choose(event) {
      this.triggerEvent('change', { value: event.currentTarget.dataset.value })
    },
  },
})

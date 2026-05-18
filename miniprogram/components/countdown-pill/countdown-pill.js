import { getCountdown } from '../../utils/date.js'

Component({
  properties: {
    deadline: {
      type: String,
      value: '',
      observer() {
        this.updateCountdown()
      },
    },
    vivid: { type: Boolean, value: false },
  },
  data: {
    countdown: { ended: false, days: 0, hours: '00', minutes: '00' },
  },
  lifetimes: {
    attached() {
      this.updateCountdown()
      this.timer = setInterval(() => this.updateCountdown(), 60000)
    },
    detached() {
      if (this.timer) clearInterval(this.timer)
    },
  },
  methods: {
    updateCountdown() {
      this.setData({ countdown: getCountdown(this.properties.deadline) })
    },
  },
})

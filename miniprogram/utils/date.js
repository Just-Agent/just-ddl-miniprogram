export const DAY_MS = 24 * 60 * 60 * 1000

export const parseTime = (value) => {
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER
}

export const getCountdown = (deadline) => {
  const diff = parseTime(deadline) - Date.now()
  if (diff <= 0) return { ended: true, days: 0, hours: '00', minutes: '00', totalMs: diff }
  const days = Math.floor(diff / DAY_MS)
  const hours = Math.floor((diff % DAY_MS) / (60 * 60 * 1000)).toString().padStart(2, '0')
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)).toString().padStart(2, '0')
  return { ended: false, days, hours, minutes, totalMs: diff }
}

export const formatShortDate = (deadline) => {
  const time = parseTime(deadline)
  if (!Number.isFinite(time) || time === Number.MAX_SAFE_INTEGER) return ''
  const date = new Date(time)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

export const sortByDeadline = (items) => [...items].sort((a, b) => {
  const delta = parseTime(a.deadline) - parseTime(b.deadline)
  return delta || String(a.title || '').localeCompare(String(b.title || ''), 'zh-Hans-CN')
})

export const withinDays = (deadline, days) => {
  const time = parseTime(deadline)
  const now = Date.now()
  return time >= now && time <= now + days * DAY_MS
}

export default {
  ddl: {
    manifest: 'miniprogram/manifest.json',
    topics: 'miniprogram/topics.json',
    topicDetail: (topicId) => `miniprogram/topics/${topicId}.json`,
    searchIndex: 'miniprogram/search-index.json',
  },
  cloud: {
    login: 'login',
    syncPreferences: 'syncPreferences',
    subscribeReminder: 'subscribeReminder',
    sendDeadlineReminders: 'sendDeadlineReminders',
  },
}

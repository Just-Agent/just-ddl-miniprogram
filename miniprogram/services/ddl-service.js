import api from '../utils/api.js'
import config from '../utils/config.js'
import request from '../utils/request.js'
import { STORAGE_KEY } from '../constants/storage-key.js'
import { getObjectStorage, setStorage } from '../utils/storage.js'
import { sortByDeadline } from '../utils/date.js'

const CACHE_TTL = 6 * 60 * 60 * 1000

const readCache = () => getObjectStorage(STORAGE_KEY.DATA_CACHE)

const writeCache = (patch) => {
  const next = { ...readCache(), ...patch, updatedAt: Date.now() }
  setStorage(STORAGE_KEY.DATA_CACHE, next, CACHE_TTL)
  return next
}

const withCache = async (key, loader, force = false) => {
  const cache = readCache()
  if (!force && cache[key]) return cache[key]
  try {
    const data = await loader()
    writeCache({ [key]: data })
    return data
  } catch (error) {
    if (cache[key]) return cache[key]
    throw error
  }
}

export const resolveAssetUrl = (previewImage, manifest) => {
  if (!previewImage) return ''
  if (/^https?:\/\//.test(previewImage)) return previewImage
  const base = (manifest && manifest.baseAssetUrl) || config.assetBaseUrl
  return `${base.replace(/\/$/, '')}/${previewImage.replace(/^\//, '')}`
}

export const loadManifest = (force = false) => withCache('manifest', () => request.get(api.ddl.manifest, {}, { silent: true }), force)

export const loadTopics = async (force = false) => {
  const payload = await withCache('topics', () => request.get(api.ddl.topics, {}, { silent: true }), force)
  return payload.topics || []
}

export const loadTopicDetail = async (topicId, force = false) => {
  const key = `topic:${topicId}`
  return withCache(key, () => request.get(api.ddl.topicDetail(topicId), {}, { silent: true }), force)
}

export const loadSearchIndex = async (force = false) => {
  const payload = await withCache('searchIndex', () => request.get(api.ddl.searchIndex, {}, { silent: true }), force)
  return payload.items || []
}

export const refreshAll = async () => {
  const [manifest, topics, searchIndex] = await Promise.all([
    loadManifest(true),
    loadTopics(true),
    loadSearchIndex(true),
  ])
  getApp().globalData.dataVersion = manifest.dataVersion || ''
  return { manifest, topics, searchIndex }
}

export const loadAllFavoriteItems = async ({ favoriteTopics = [], favoriteEvents = [] }) => {
  const searchIndex = await loadSearchIndex()
  const topicIds = new Set(favoriteTopics)
  searchIndex.forEach((item) => {
    if (favoriteEvents.includes(item.id)) topicIds.add(item.topicId)
  })
  const details = await Promise.all([...topicIds].map((topicId) => loadTopicDetail(topicId).catch(() => null)))
  const itemMap = new Map()
  details.filter(Boolean).forEach((detail) => {
    const topic = detail.topic || {}
    ;(detail.items || []).forEach((item) => {
      if (favoriteTopics.includes(item.topicId) || favoriteEvents.includes(item.id)) {
        itemMap.set(item.id, {
          ...item,
          topicName: topic.name || item.topicId,
          topicColor: topic.color || '#0f766e',
          topicCategory: topic.category || '',
        })
      }
    })
  })
  return sortByDeadline([...itemMap.values()])
}

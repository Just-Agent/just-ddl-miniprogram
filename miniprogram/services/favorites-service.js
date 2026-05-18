import { STORAGE_KEY } from '../constants/storage-key.js'
import { getArrayStorage, getObjectStorage, setStorage, toggleArrayItem } from '../utils/storage.js'

export const getFavoriteTopics = () => getArrayStorage(STORAGE_KEY.FAV_TOPICS)
export const getFavoriteEvents = () => getArrayStorage(STORAGE_KEY.FAV_EVENTS)
export const toggleFavoriteTopic = (id) => toggleArrayItem(STORAGE_KEY.FAV_TOPICS, id)
export const toggleFavoriteEvent = (id) => toggleArrayItem(STORAGE_KEY.FAV_EVENTS, id)

export const getPinnedSubtopics = (topicId) => {
  const map = getObjectStorage(STORAGE_KEY.PINNED_SUBTOPICS)
  return Array.isArray(map[topicId]) ? map[topicId] : []
}

export const togglePinnedSubtopic = (topicId, subtopicId) => {
  const map = getObjectStorage(STORAGE_KEY.PINNED_SUBTOPICS)
  const current = Array.isArray(map[topicId]) ? map[topicId] : []
  const next = current.includes(subtopicId)
    ? current.filter((id) => id !== subtopicId)
    : [...current, subtopicId]
  setStorage(STORAGE_KEY.PINNED_SUBTOPICS, { ...map, [topicId]: next })
  return next
}

import { STORAGE_KEY } from '../constants/storage-key.js'
import { getStorage, setStorage } from './storage.js'

export const getLanguage = () => getStorage(STORAGE_KEY.LANGUAGE, 'zh')

export const setLanguage = (language) => {
  setStorage(STORAGE_KEY.LANGUAGE, language === 'en' ? 'en' : 'zh')
}

export const t = (key, language = getLanguage()) => {
  const zh = {
    source: '来源',
    official: '官方链接',
    copyLink: '复制链接',
    favorite: '收藏',
    favorited: '已收藏',
    list: '长卡列表',
    grid: '多列卡片',
    vivid: 'Vivid',
    simple: 'Simple',
    empty: '还没有内容',
    refresh: '刷新数据',
  }
  const en = {
    source: 'Source',
    official: 'Official',
    copyLink: 'Copy link',
    favorite: 'Favorite',
    favorited: 'Favorited',
    list: 'List',
    grid: 'Grid',
    vivid: 'Vivid',
    simple: 'Simple',
    empty: 'Nothing yet',
    refresh: 'Refresh',
  }
  return (language === 'en' ? en : zh)[key] || key
}

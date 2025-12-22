const STORAGE_KEY = 'marryme-app-data'

function nowISO() {
  return new Date().toISOString()
}

function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const defaultState = () => ({
  meta: { title: 'MarryMe Backup', createdAt: nowISO(), updatedAt: nowISO(), version: '1.0.0' },
  dashboard: { notes: '', lastViewed: null },
  tasks: [],
  notes: [],
  guests: [],
  contacts: [],
  seating: { tables: [] },
  budget: [],
  settings: { 
    currency: 'USD', 
    locale: 'en', 
    autosave: true,
    venueCoords: null // { lat: number, lng: number }
  },
  activity: []
})

let state = defaultState()
let listeners = []

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read storage', e)
    return null
  }
}

function writeStorage(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (e) {
    console.error('Failed to write storage', e)
  }
}

function notify() {
  listeners.forEach((cb) => {
    try { cb(state) } catch (e) { console.error(e) }
  })
}

function init() {
  const found = readStorage()
  if (found) {
    state = Object.assign(defaultState(), found)
  } else {
    state = defaultState()
    writeStorage(state)
  }
  // detect legacy key
  try {
    const legacy = localStorage.getItem('demo-app-data')
    if (legacy) {
      // keep legacy present for migration UI; do not auto-migrate here
      state._legacyDetected = true
    }
  } catch (e) {
    // ignore
  }
  notify()
}

function getState() {
  // return a deep copy to avoid accidental mutation
  return JSON.parse(JSON.stringify(state))
}

function saveState(newState) {
  state = Object.assign(defaultState(), newState)
  state.meta.updatedAt = nowISO()
  writeStorage(state)
  notify()
}

function addItem(collection, item) {
  if (!state[collection] || !Array.isArray(state[collection])) state[collection] = []
  const it = Object.assign({}, item)
  if (!it.id) it.id = generateId(collection + '_')
  if (!it.createdAt) it.createdAt = nowISO()
  state[collection].push(it)
  state.meta.updatedAt = nowISO()
  writeStorage(state)
  notify()
  return it
}

function updateItem(collection, id, patch) {
  const arr = state[collection]
  if (!arr || !Array.isArray(arr)) return null
  const idx = arr.findIndex((x) => x.id === id)
  if (idx === -1) return null
  arr[idx] = Object.assign({}, arr[idx], patch)
  state.meta.updatedAt = nowISO()
  writeStorage(state)
  notify()
  return arr[idx]
}

function removeItem(collection, id) {
  const arr = state[collection]
  if (!arr || !Array.isArray(arr)) return false
  const idx = arr.findIndex((x) => x.id === id)
  if (idx === -1) return false
  arr.splice(idx, 1)
  state.meta.updatedAt = nowISO()
  writeStorage(state)
  notify()
  return true
}

function exportBackup() {
  return JSON.parse(JSON.stringify(state))
}

function importBackup(obj, { mode = 'merge' } = {}) {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid backup object')
  const src = JSON.parse(JSON.stringify(obj))
  if (mode === 'replace') {
    state = Object.assign(defaultState(), src)
    state.meta.updatedAt = nowISO()
    writeStorage(state)
    notify()
    return
  }
  // merge - file-wins for arrays and objects
  const merged = Object.assign({}, state)
  Object.keys(src).forEach((key) => {
    const val = src[key]
    if (Array.isArray(val)) {
      const map = {}
      (merged[key] || []).forEach((it) => { if (it && it.id) map[it.id] = it })
      val.forEach((it) => { if (it && it.id) map[it.id] = it; else { const newId = generateId(key + '_'); it.id = newId; map[newId] = it } })
      merged[key] = Object.values(map)
    } else if (val && typeof val === 'object') {
      merged[key] = Object.assign({}, merged[key] || {}, val)
    } else {
      merged[key] = val
    }
  })
  state = Object.assign(defaultState(), merged)
  state.meta.updatedAt = nowISO()
  writeStorage(state)
  notify()
}

function onChange(cb) {
  listeners.push(cb)
  return () => {
    const i = listeners.indexOf(cb)
    if (i !== -1) listeners.splice(i, 1)
  }
}

export default {
  init,
  getState,
  saveState,
  addItem,
  updateItem,
  removeItem,
  exportBackup,
  importBackup,
  onChange,
  _STORAGE_KEY: STORAGE_KEY
}

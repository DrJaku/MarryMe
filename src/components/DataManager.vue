<template>
  <div>
    <div class="mb-3">
      <button class="btn btn-primary me-2" @click="saveToLocal">Save to LocalStorage</button>
      <button class="btn btn-outline-secondary me-2" @click="loadFromLocal">Load from LocalStorage</button>
      <button class="btn btn-success me-2" @click="exportJSON">Export JSON</button>
      <button class="btn btn-warning me-2" @click="$refs.jsonFile.click()">Import JSON</button>
      <button class="btn btn-info me-2" @click="exportXLSX">Export XLSX</button>
      <button class="btn btn-dark me-2" @click="$refs.xlsxFile.click()">Import XLSX</button>
      <button class="btn btn-danger" @click="clearData">Clear</button>
    </div>

    <input ref="jsonFile" type="file" accept="application/json" class="d-none" @change="handleJSONImport" />
    <input ref="xlsxFile" type="file" accept=".xlsx,.xls" class="d-none" @change="handleXLSXImport" />

    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Data (editable JSON)</h5>
        <textarea v-model="jsonText" rows="10" class="form-control"></textarea>
        <div class="mt-3 text-end">
          <button class="btn btn-outline-primary" @click="applyJson">Apply JSON</button>
        </div>
      </div>
    </div>

    <div class="mt-3">
      <h6>Preview</h6>
      <pre class="small">{{ items }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'

const STORAGE_KEY = 'demo-app-data'

const items = ref([
  { id: 1, name: 'Sample item', value: 100 }
])

const jsonText = ref(JSON.stringify(items.value, null, 2))

watch(items, (v) => {
  jsonText.value = JSON.stringify(v, null, 2)
}, { deep: true })

function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  alert('Saved to localStorage')
}

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    alert('No saved data in localStorage')
    return
  }
  try {
    items.value = JSON.parse(raw)
  } catch (e) {
    alert('Failed to parse saved data')
  }
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(items.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleJSONImport(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result)
      items.value = parsed
    } catch (err) {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(f)
  e.target.value = ''
}

function exportXLSX() {
  try {
    const ws = XLSX.utils.json_to_sheet(items.value)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, 'data.xlsx')
  } catch (err) {
    alert('Failed to export XLSX: ' + err)
  }
}

function handleXLSXImport(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = new Uint8Array(ev.target.result)
      const wb = XLSX.read(data, { type: 'array' })
      const first = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(first, { defval: null })
      items.value = json
    } catch (err) {
      alert('Failed to read XLSX file')
    }
  }
  reader.readAsArrayBuffer(f)
  e.target.value = ''
}

function applyJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    items.value = parsed
  } catch (err) {
    alert('Invalid JSON in editor')
  }
}

function clearData() {
  if (confirm('Clear all data?')) {
    items.value = []
  }
}

// expose to template
const refs = { items, jsonText, saveToLocal, loadFromLocal, exportJSON, exportXLSX, handleJSONImport, handleXLSXImport, applyJson, clearData }

for (const k in refs) {
  // no-op to satisfy linter-like usage when compiled; template accesses individual names
}
</script>

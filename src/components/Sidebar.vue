<template>
  <aside class="col-12 col-md-2 d-flex flex-column border-end bg-light py-3 min-vh-100">
    <div class="d-flex gap-2 mb-3 px-2">
      <button class="btn btn-sm btn-outline-secondary w-100" @click="handleAction('save')">Save</button>
      <button class="btn btn-sm btn-outline-secondary w-100" @click="handleAction('import')">Import</button>
      <button class="btn btn-sm btn-outline-secondary w-100" @click="handleAction('export')">Export</button>
    </div>
    
    <div class="menu-flex p-2 mb-3 flex-grow-1 overflow-auto">
      <button 
        v-for="item in menuItems" 
        :key="item.key" 
        class="btn w-100 my-1 text-start d-flex align-items-center gap-2"
        :class="route.path === item.path ? 'btn-primary' : 'btn-light'"
        @click="navigate(item.path)"
      >
        <i :class="item.icon"></i>
        {{ item.label }}
      </button>
    </div>

    <div class="px-2 mt-auto">
      <button 
        class="btn w-100 d-flex align-items-center justify-content-center gap-2"
        :class="route.path === '/preferences' ? 'btn-primary' : 'btn-outline-dark'"
        @click="navigate('/preferences')"
      >
        <i class="fa-solid fa-gear"></i>
        Preferences
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import store from '../utils/store'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'fa-solid fa-chart-line' },
  { key: 'todo', label: 'To Do List', path: '/todo', icon: 'fa-solid fa-list-check' },
  { key: 'notes', label: 'Notes', path: '/notes', icon: 'fa-solid fa-note-sticky' },
  { key: 'guests', label: 'Guest List', path: '/guests', icon: 'fa-solid fa-users' },
  { key: 'seating', label: 'Seating Chart', path: '/seating', icon: 'fa-solid fa-chair' },
  { key: 'contacts', label: 'Contacts & Vendors', path: '/contacts', icon: 'fa-solid fa-address-book' },
  { key: 'budget', label: 'Budget', path: '/budget', icon: 'fa-solid fa-money-bill-wave' }
]

function navigate(path) {
  router.push(path)
}

function handleAction(action) {
  if (action === 'save') {
    store.saveState(store.getState())
    toast.success('Data saved to LocalStorage')
  } else if (action === 'export') {
    const data = store.exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-plan-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  } else if (action === 'import') {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result)
          store.importBackup(json, { mode: 'replace' })
          toast.success('Data imported successfully')
        } catch (err) {
          toast.error('Invalid backup file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }
}
</script>

<style scoped>
.menu-flex {
  max-height: calc(100vh - 200px);
}
</style>
<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white py-3 border-bottom">
            <h4 class="mb-0">Wedding Preferences</h4>
          </div>
          <div class="card-body p-4">
            <form @submit.prevent="saveSettings">
              <!-- Wedding Date -->
              <div class="mb-4">
                <label class="form-label fw-bold">Wedding Date</label>
                <VueDatePicker 
                  v-model="settings.weddingDate"
                  :teleport="true"
                  format="yyyy-MM-dd HH:mm"
                  placeholder="Select Wedding Date"
                />
                <div class="form-text">This will be used for the countdown on your dashboard.</div>
              </div>

              <!-- Invitation Image URL -->
              <div class="mb-4">
                <label class="form-label fw-bold">Invitation Image URL</label>
                <input 
                  type="url" 
                  class="form-control" 
                  v-model="settings.invitationImage"
                  placeholder="https://example.com/image.jpg"
                >
                <div class="form-text">Provide a link to your digital invitation image.</div>
              </div>

              <!-- Venue Location -->
              <div class="mb-4">
                <label class="form-label fw-bold">Venue Name</label>
                <textarea 
                  class="form-control mb-3" 
                  rows="2" 
                  v-model="settings.venue"
                  placeholder="Enter the name of your wedding venue"
                ></textarea>
                
                <div class="map-picker-container border rounded bg-light overflow-hidden">
                  <div class="p-2 bg-white border-bottom d-flex gap-2">
                    <input 
                      type="text" 
                      class="form-control form-control-sm" 
                      placeholder="Search for a location..."
                      v-model="searchQuery"
                      @keyup.enter="searchLocation"
                    >
                    <button 
                      type="button" 
                      class="btn btn-sm btn-primary" 
                      @click="searchLocation"
                      :disabled="isSearching"
                    >
                      <i v-if="!isSearching" class="fa-solid fa-magnifying-glass"></i>
                      <span v-else class="spinner-border spinner-border-sm"></span>
                    </button>
                  </div>
                  <div id="prefMap" style="height: 300px; width: 100%;"></div>
                  <div class="p-2 small text-muted bg-white border-top d-flex align-items-center justify-content-between">
                    <div>
                      <span v-if="settings.venueCoords">
                        Selected: {{ settings.venueCoords.lat.toFixed(4) }}, {{ settings.venueCoords.lng.toFixed(4) }}
                      </span>
                      <span v-else>Click on the map to set the venue location</span>
                    </div>
                    <button 
                      v-if="settings.venueCoords"
                      type="button" 
                      class="btn btn-link text-danger btn-sm p-0 text-decoration-none" 
                      @click="clearCoords"
                    >
                      <i class="fa-solid fa-trash-can me-1"></i>
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>

              <hr class="my-4">

              <div class="d-flex justify-content-end gap-2">
                <button v-if="isDirty" type="button" class="btn btn-light" :disabled="isSaving" @click="$router.push('/dashboard')">Cancel</button>
                <button type="submit" class="btn btn-primary px-4" :disabled="!isDirty || isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {{ isSaving ? 'Saving...' : 'Save Settings' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Exit Warning Modal -->
    <div class="modal fade" id="exitWarningModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Unsaved Changes</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body py-4">
            You have unsaved changes in your settings. If you leave now, these changes will be lost.
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Back to Settings</button>
            <button type="button" class="btn btn-danger px-4" data-bs-dismiss="modal" @click="confirmExit">Exit without saving</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import * as bootstrap from 'bootstrap'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import store from '../utils/store'

// Fix for default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const router = useRouter()
const isSaving = ref(false)
const initialSettings = ref({})
const settings = ref({
  weddingDate: '',
  invitationImage: '',
  venue: '',
  venueCoords: null
})

// Leaflet map logic
const mapContainer = ref(null)
const searchQuery = ref('')
const isSearching = ref(false)
let map = null
let marker = null

function clearCoords() {
  settings.value.venueCoords = null
  if (marker) {
    map.removeLayer(marker)
    marker = null
  }
}

async function searchLocation() {
  if (!searchQuery.value || isSearching.value) return
  
  isSearching.value = true
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=1`)
    const data = await response.json()
    
    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0]
      const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) }
      
      // Update store/settings
      settings.value.venueCoords = newPos
      // If venue name is empty, auto-fill it with the search result's name
      if (!settings.value.venue) {
        settings.value.venue = display_name
      }

      // Update Map
      map.setView([newPos.lat, newPos.lng], 16)
      if (marker) {
        marker.setLatLng([newPos.lat, newPos.lng])
      } else {
        marker = L.marker([newPos.lat, newPos.lng]).addTo(map)
      }
    } else {
      toast.info('No results found for that location.')
    }
  } catch (error) {
    toast.error('Error searching for location.')
  } finally {
    isSearching.value = false
  }
}

function initMap() {
  if (map) return
  
  const initialPos = settings.value.venueCoords || { lat: 51.505, lng: -0.09 }
  
  map = L.map('prefMap').setView([initialPos.lat, initialPos.lng], 13)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  if (settings.value.venueCoords) {
    marker = L.marker([initialPos.lat, initialPos.lng]).addTo(map)
  }

  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    if (marker) {
      marker.setLatLng(e.latlng)
    } else {
      marker = L.marker(e.latlng).addTo(map)
    }
    settings.value.venueCoords = { lat, lng }
  })
}

const isDirty = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(initialSettings.value)
})

onMounted(() => {
  const state = store.getState()
  if (state.settings) {
    const saved = {
      weddingDate: state.settings.weddingDate || '',
      invitationImage: state.settings.invitationImage || '',
      venue: state.settings.venue || '',
      venueCoords: state.settings.venueCoords || null
    }
    settings.value = JSON.parse(JSON.stringify(saved))
    initialSettings.value = JSON.parse(JSON.stringify(saved))
  }
  nextTick(() => {
    initMap()
  })
})

function saveSettings() {
  isSaving.value = true
  try {
    const currentState = store.getState()
    currentState.settings = { ...currentState.settings, ...settings.value }
    store.saveState(currentState)
    initialSettings.value = JSON.parse(JSON.stringify(settings.value))
    
    toast.success('Settings saved successfully!', {
      autoClose: 2000,
      position: toast.POSITION.TOP_RIGHT,
    })
    
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  } catch (error) {
    toast.error('Failed to save settings.')
    isSaving.value = false
  }
}

// Navigation Guard
const showExitModal = ref(false)
let pendingPath = null

onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && !isSaving.value) {
    pendingPath = to.path
    const modalEl = document.getElementById('exitWarningModal')
    const modal = new bootstrap.Modal(modalEl)
    modal.show()
    next(false)
  } else {
    next()
  }
})

function confirmExit() {
  initialSettings.value = JSON.parse(JSON.stringify(settings.value))
  router.push(pendingPath)
}
</script>
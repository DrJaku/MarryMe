<template>
  <div class="container-fluid py-4">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-white p-3 rounded shadow-sm">
      <div class="d-flex flex-wrap align-items-center gap-3">
        <!-- <h4 class="mb-0 fw-bold me-2">Guest List</h4> -->
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="addNewGuest">
          <i class="fa-solid fa-user-plus"></i>
          New Guest
        </button>
        <button class="btn btn-outline-secondary d-flex align-items-center gap-2" @click="showManageCategoriesModal">
          <i class="fa-solid fa-tags"></i>
          Manage Categories
        </button>
        <div class="vr h-100 d-none d-md-block"></div>
        
        <!-- Filters -->
        <div class="d-flex gap-2">
          <select v-model="filters.category" class="form-select form-select-sm shadow-none w-auto">
            <option value="all">All Categories</option>
            <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="filters.side" class="form-select form-select-sm shadow-none w-auto">
            <option value="all">Both Sides</option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </select>
          <select v-model="filters.rsvp" class="form-select form-select-sm shadow-none w-auto">
            <option value="all">All RSVP</option>
            <option value="unlikely">Unlikely</option>
            <option value="likely">Likely</option>
            <option value="definitely">Definitely</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      <div class="search-box">
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-white border-end-0">
            <i class="fa-solid fa-magnifying-glass text-muted"></i>
          </span>
          <input 
            v-model="filters.search" 
            type="text" 
            class="form-control border-start-0 shadow-none" 
            placeholder="Search by name..."
          >
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th @click="toggleSort('firstName')" class="cursor-pointer">
                First Name <i v-if="sortBy === 'firstName'" :class="sortIcon"></i>
              </th>
              <th @click="toggleSort('lastName')" class="cursor-pointer">
                Last Name <i v-if="sortBy === 'lastName'" :class="sortIcon"></i>
              </th>
              <th @click="toggleSort('category')" class="cursor-pointer">
                Category <i v-if="sortBy === 'category'" :class="sortIcon"></i>
              </th>
              <th @click="toggleSort('side')" class="cursor-pointer">
                Side <i v-if="sortBy === 'side'" :class="sortIcon"></i>
              </th>
              <th @click="toggleSort('rsvp')" class="cursor-pointer">
                RSVP Probability <i v-if="sortBy === 'rsvp'" :class="sortIcon"></i>
              </th>
              <th class="text-center">Extras</th>
              <th style="min-width: 200px;">Notes</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guest in sortedGuests" :key="guest.id">
              <!-- First Name -->
              <td>
                <div v-if="editingCell === `${guest.id}-firstName`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(guest, 'firstName')" 
                    @keyup.enter="saveEdit(guest, 'firstName')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter first name..."
                  >
                </div>
                <div v-else @click="startEdit(guest, 'firstName')" class="editable-cell text-truncate" :class="{'placeholder-text': !guest.firstName}">
                  {{ guest.firstName || 'Enter first name...' }}
                </div>
              </td>

              <!-- Last Name -->
              <td>
                <div v-if="editingCell === `${guest.id}-lastName`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(guest, 'lastName')" 
                    @keyup.enter="saveEdit(guest, 'lastName')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter last name..."
                  >
                </div>
                <div v-else @click="startEdit(guest, 'lastName')" class="editable-cell text-truncate" :class="{'placeholder-text': !guest.lastName}">
                  {{ guest.lastName || 'Enter last name...' }}
                </div>
              </td>

              <!-- Category -->
              <td>
                <select 
                  v-model="guest.category" 
                  @change="saveToStore"
                  class="form-select form-select-sm border-2 bg-transparent shadow-none"
                >
                  <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </td>

              <!-- Side -->
              <td>
                <select 
                  v-model="guest.side" 
                  @change="saveToStore"
                  class="form-select form-select-sm border-2 bg-transparent shadow-none fw-bold"
                  :style="{ color: guest.side === 'bride' ? 'var(--side-bride)' : 'var(--side-groom)' }"
                >
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                </select>
              </td>

              <!-- RSVP -->
              <td>
                <select 
                  v-model="guest.rsvp" 
                  @change="saveToStore"
                  class="form-select form-select-sm border-2 bg-transparent shadow-none fw-bold"
                  :style="{ color: getRSVPColor(guest.rsvp) }"
                >
                  <option value="unlikely">Unlikely</option>
                  <option value="likely">Likely</option>
                  <option value="definitely">Definitely</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </td>

              <!-- Extras -->
              <td>
                <div class="d-flex align-items-center justify-content-center gap-2">
                  <button 
                    class="btn btn-xs btn-outline-secondary p-0 px-1" 
                    @click="updateExtras(guest, -1)"
                    :disabled="guest.extras <= 0"
                  >
                    <i class="fa-solid fa-minus x-small"></i>
                  </button>
                  <span class="extras-badge">{{ guest.extras }}</span>
                  <button 
                    class="btn btn-xs btn-outline-secondary p-0 px-1" 
                    @click="updateExtras(guest, 1)"
                    :disabled="guest.extras >= 9"
                  >
                    <i class="fa-solid fa-plus x-small"></i>
                  </button>
                </div>
              </td>

              <!-- Notes -->
              <td>
                <div v-if="editingCell === `${guest.id}-notes`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(guest, 'notes')" 
                    @keyup.enter="saveEdit(guest, 'notes')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Write a note..."
                  >
                </div>
                <div v-else @click="startEdit(guest, 'notes')" class="editable-cell text-muted small italic" :class="{'placeholder-text': !guest.notes}">
                  {{ guest.notes || 'Write a note...' }}
                </div>
              </td>

              <!-- Actions -->
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger border-0" @click="deleteGuest(guest.id)">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredGuests.length === 0">
              <td colspan="8" class="text-center py-5">
                <div class="text-muted opacity-25 display-1 mb-3">
                  <i class="fa-solid fa-users-slash"></i>
                </div>
                <h5>No guests found</h5>
                <p class="text-muted small">Try adjusting your filters or add a new guest.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="mt-4 bg-white p-4 rounded shadow-sm">
      <!-- RSVP Counts (Row 1) -->
      <div class="guest-counts-wrap mb-4">
        <div class="text-center">
          <div class="small text-muted mb-1">Unlikely</div>
          <div class="guest-count-number" :style="{color: '#e74c3c'}">
            <strong>{{ guestStats.unlikely.main }}</strong>
            <span class="small fw-normal opacity-75"> +{{ guestStats.unlikely.extras }}</span>
          </div>
        </div>
        <div class="text-center">
          <div class="small text-muted mb-1">Likely</div>
          <div class="guest-count-number" :style="{color: '#f1c40f'}">
            <strong>{{ guestStats.likely.main }}</strong>
            <span class="small fw-normal opacity-75"> +{{ guestStats.likely.extras }}</span>
          </div>
        </div>
        <div class="text-center">
          <div class="small text-muted mb-1">Definitely</div>
          <div class="guest-count-number" :style="{color: '#196f3d'}">
            <strong>{{ guestStats.definitely.main }}</strong>
            <span class="small fw-normal opacity-75"> +{{ guestStats.definitely.extras }}</span>
          </div>
        </div>
        <div class="text-center">
          <div class="small text-muted mb-1">Confirmed</div>
          <div class="guest-count-number" :style="{color: '#27ae60'}">
            <strong>{{ guestStats.confirmed.main }}</strong>
            <span class="small fw-normal opacity-75"> +{{ guestStats.confirmed.extras }}</span>
          </div>
        </div>
      </div>

      <!-- Totals (Row 2) -->
      <div class="d-flex justify-content-center border-top pt-4">
        <div class="text-center">
          <div class="small text-muted text-uppercase tracked-labels mb-2">Total Guests Invited</div>
          <div class="display-6 text-primary">
            <span class="fs-10 fw-noraml">{{ guestStats.total.main }}</span>
            <span class="fs-4 fw-normal opacity-75"> +{{ guestStats.total.extras }}</span>
            <strong class="opacity-75 fw-bold"> = {{ guestStats.total.main + guestStats.total.extras }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Categories Modal -->
    <div class="modal fade" id="manageCategoriesModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Manage Guest Categories</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <div class="mb-4">
              <label class="form-label small fw-bold">Add New Category</label>
              <div class="input-group">
                <input v-model="newCategoryName" type="text" class="form-control shadow-none" placeholder="Enter category name..." @keyup.enter="addCategory">
                <button class="btn btn-primary" @click="addCategory">Add</button>
              </div>
            </div>

            <label class="form-label small fw-bold mb-2">Existing Categories</label>
            <div class="list-group">
              <draggable 
                v-model="categories" 
                item-key="index"
                handle=".drag-handle"
                tag="div"
                @end="saveCategories"
              >
                <template #item="{ element: cat, index }">
                  <div class="list-group-item d-flex align-items-center gap-3">
                    <!-- <div class="drag-handle cursor-move text-muted">
                      <i class="fa-solid fa-grip-vertical"></i>
                    </div> -->
                    <div v-if="editingCategoryIndex === index" class="flex-grow-1">
                      <input 
                        v-model="editingCategoryName" 
                        @blur="saveCategoryRename(index, cat)"
                        @keyup.enter="saveCategoryRename(index, cat)"
                        @keyup.esc="cancelCategoryRename"
                        type="text" 
                        class="form-control form-control-sm shadow-none"
                        autofocus
                      >
                    </div>
                    <span v-else class="flex-grow-1 cursor-pointer" @click="startCategoryRename(index, cat)" title="Click to rename">{{ cat }}</span>
                    <button class="btn btn-sm btn-outline-danger border-0" @click="deleteCategory(index, cat)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </template>
              </draggable>
              
              <!-- Other (Undeletable) -->
              <div class="list-group-item d-flex align-items-center gap-3 bg-transparent bg-opacity-50">
                <!-- <div class="text-muted opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-grip-vertical"></i>
                </div> -->
                <span class="flex-grow-1 text-muted">Other</span>
                <button class="btn btn-sm btn-outline-danger border-0 disabled opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-dark w-100" @click="saveCategories">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import * as bootstrap from 'bootstrap'
import { toast } from 'vue3-toastify'
import store from '../utils/store'

const guests = ref([])
const categories = ref([])
const newCategoryName = ref('')
const filters = ref({
  search: '',
  category: 'all',
  side: 'all',
  rsvp: 'all'
})

const editingCell = ref(null)
const editValue = ref('')
const editInput = ref(null)

const editingCategoryIndex = ref(null)
const editingCategoryName = ref('')

const sortBy = ref('firstName')
const sortOrder = ref('asc')

const allCategories = computed(() => [...categories.value, 'Other'])

onMounted(() => {
  const state = store.getState()
  guests.value = state.guests || []
  categories.value = state.guestCategories || ['Family', 'Friend', 'Work']
})

const filteredGuests = computed(() => {
  return guests.value.filter(g => {
    const nameMatch = (g.firstName + ' ' + g.lastName).toLowerCase().includes(filters.value.search.toLowerCase())
    const categoryMatch = filters.value.category === 'all' || g.category === filters.value.category
    const sideMatch = filters.value.side === 'all' || g.side === filters.value.side
    const rsvpMatch = filters.value.rsvp === 'all' || g.rsvp === filters.value.rsvp
    return nameMatch && categoryMatch && sideMatch && rsvpMatch
  })
})

const sortedGuests = computed(() => {
  return [...filteredGuests.value].sort((a, b) => {
    let valA = a[sortBy.value]?.toLowerCase() || ''
    let valB = b[sortBy.value]?.toLowerCase() || ''
    
    if (sortBy.value === 'rsvp') {
      const priority = { confirmed: 4, definitely: 3, likely: 2, unlikely: 1 }
      valA = priority[a.rsvp] || 0
      valB = priority[b.rsvp] || 0
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const guestStats = computed(() => {
  const gs = filteredGuests.value
  
  const getCountsForRSVP = (rsvpType) => {
    const subset = gs.filter(g => g.rsvp === rsvpType)
    return {
      main: subset.length,
      extras: subset.reduce((acc, g) => acc + (Number(g.extras) || 0), 0)
    }
  }

  const unlikely = getCountsForRSVP('unlikely')
  const likely = getCountsForRSVP('likely')
  const definitely = getCountsForRSVP('definitely')
  const confirmed = getCountsForRSVP('confirmed')

  const totalMain = gs.length
  const totalExtras = gs.reduce((acc, g) => acc + (Number(g.extras) || 0), 0)

  return {
    unlikely,
    likely,
    definitely,
    confirmed,
    total: {
      main: totalMain,
      extras: totalExtras
    }
  }
})

const sortIcon = computed(() => sortOrder.value === 'asc' ? 'fa-solid fa-sort-up ms-1' : 'fa-solid fa-sort-down ms-1')

function toggleSort(key) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
}

function addNewGuest() {
  const newGuest = {
    id: 'guest_' + Date.now(),
    firstName: '',
    lastName: '',
    category: 'Other',
    side: 'bride',
    rsvp: 'unlikely',
    extras: 0,
    notes: ''
  }
  guests.value.push(newGuest)
  saveToStore()
  
  // Auto edit the first name of the new row
  nextTick(() => {
    startEdit(newGuest, 'firstName')
  })
}

function deleteGuest(id) {
  guests.value = guests.value.filter(g => g.id !== id)
  saveToStore()
}

function startEdit(guest, field) {
  editingCell.value = `${guest.id}-${field}`
  editValue.value = guest[field]
  nextTick(() => {
    if (editInput.value) editInput.value.focus()
  })
}

function saveEdit(guest, field) {
  if (editingCell.value === `${guest.id}-${field}`) {
    guest[field] = editValue.value
    saveToStore()
    editingCell.value = null
  }
}

function cancelEdit() {
  editingCell.value = null
}

function updateExtras(guest, delta) {
  const newVal = guest.extras + delta
  if (newVal >= 0 && newVal <= 9) {
    guest.extras = newVal
    saveToStore()
  }
}

function showManageCategoriesModal() {
  const modal = new bootstrap.Modal(document.getElementById('manageCategoriesModal'))
  modal.show()
}

function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name || name.toLowerCase() === 'other') return
  if (categories.value.includes(name)) {
    toast.error('Category already exists')
    return
  }
  categories.value.push(name)
  newCategoryName.value = ''
  saveToStore()
}

function deleteCategory(index, catName) {
  // Move guests in this category to 'Other'
  guests.value.forEach(g => {
    if (g.category === catName) g.category = 'Other'
  })
  categories.value.splice(index, 1)
  saveToStore()
}

function startCategoryRename(index, name) {
  editingCategoryIndex.value = index
  editingCategoryName.value = name
}

function saveCategoryRename(index, oldName) {
  const newName = editingCategoryName.value.trim()
  if (newName && newName !== oldName && !categories.value.includes(newName)) {
    categories.value[index] = newName
    guests.value.forEach(g => {
      if (g.category === oldName) g.category = newName
    })
    saveToStore()
  }
  editingCategoryIndex.value = null
}

function cancelCategoryRename() {
  editingCategoryIndex.value = null
}

function saveCategories() {
  saveToStore()
  bootstrap.Modal.getInstance(document.getElementById('manageCategoriesModal')).hide()
}

function getRSVPColor(rsvp) {
  const colors = {
    unlikely: '#e74c3c',
    likely: '#f1c40f',
    definitely: '#196f3d',
    confirmed: '#27ae60'
  }
  return colors[rsvp] || 'inherit'
}

function saveToStore() {
  const state = store.getState()
  state.guests = guests.value
  state.guestCategories = categories.value
  store.saveState(state)
}
</script>

<style scoped>
.editable-cell {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  min-height: 1.5rem;
}
.editable-cell:hover {
  background-color: rgba(0,0,0,0.05);
}
.placeholder-text {
  color: #adb5bd !important;
  font-style: italic;
  font-size: 0.9rem;
}
.extras-badge {
  font-weight: bold;
  min-width: 1.5rem;
  text-align: center;
}
.btn-xs {
  font-size: 0.75rem;
  line-height: 1;
}
.x-small {
  font-size: 0.6rem;
}
.cursor-pointer {
  cursor: pointer;
}
.search-box {
  width: 250px;
}
@media (max-width: 768px) {
  .search-box { width: 100%; }
}

.guest-counts-wrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.guest-count-number strong {
  font-size: 1.5rem;
}

.tracked-labels {
  letter-spacing: 0.05em;
  font-weight: 600;
}

:root {
  --side-bride: #d63384;
  --side-groom: #0d6efd;
}

/* Local overrides to use theme colors if provided in requirement, 
   otherwise using standard bootstrap or specified hex codes */
</style>
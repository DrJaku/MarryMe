<template>
  <div class="container-fluid py-4">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-white p-3 rounded shadow-sm">
      <div class="d-flex flex-wrap align-items-center gap-3">
        <!-- <h4 class="mb-0 fw-bold me-2">Contacts & Vendors</h4> -->
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="addNewVendor">
          <i class="fa-solid fa-plus"></i>
          New Vendor
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
          <select v-model="filters.status" class="form-select form-select-sm shadow-none w-auto">
            <option value="all">All Statuses</option>
            <option value="not_contacted">Not contacted yet</option>
            <option value="contacted">Contacted</option>
            <option value="price_estimation">Got price estimation</option>
            <option value="booked">Booked</option>
            <option value="not_booked">Not booked</option>
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
    <div class="card shadow-sm border-0 overflow-hidden mb-4">
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
              <th @click="toggleSort('email')" class="cursor-pointer">
                Email <i v-if="sortBy === 'email'" :class="sortIcon"></i>
              </th>
              <th @click="toggleSort('phone')" class="cursor-pointer">
                Phone Number <i v-if="sortBy === 'phone'" :class="sortIcon"></i>
              </th>
              <th>Profile / Website</th>
              <th @click="toggleSort('status')" class="cursor-pointer">
                Status <i v-if="sortBy === 'status'" :class="sortIcon"></i>
              </th>
              <th class="text-center">Notes</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vendor in sortedVendors" :key="vendor.id">
              <!-- First Name -->
              <td>
                <div v-if="editingCell === `${vendor.id}-firstName`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(vendor, 'firstName')" 
                    @keyup.enter="saveEdit(vendor, 'firstName')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter first name..."
                  >
                </div>
                <div v-else @click="startEdit(vendor, 'firstName')" class="editable-cell text-truncate" :class="{'placeholder-text': !vendor.firstName}">
                  {{ vendor.firstName || 'Enter first name...' }}
                </div>
              </td>

              <!-- Last Name -->
              <td>
                <div v-if="editingCell === `${vendor.id}-lastName`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(vendor, 'lastName')" 
                    @keyup.enter="saveEdit(vendor, 'lastName')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter last name..."
                  >
                </div>
                <div v-else @click="startEdit(vendor, 'lastName')" class="editable-cell text-truncate" :class="{'placeholder-text': !vendor.lastName}">
                  {{ vendor.lastName || 'Enter last name...' }}
                </div>
              </td>

              <!-- Category -->
              <td>
                <select 
                  v-model="vendor.category" 
                  @change="saveToStore"
                  class="form-select form-select-sm border-0 bg-transparent shadow-none"
                >
                  <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </td>

              <!-- Email -->
              <td>
                <div v-if="editingCell === `${vendor.id}-email`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(vendor, 'email')" 
                    @keyup.enter="saveEdit(vendor, 'email')"
                    @keyup.esc="cancelEdit"
                    type="email" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter email..."
                  >
                </div>
                <div v-else @click="startEdit(vendor, 'email')" class="editable-cell text-truncate" :class="{'placeholder-text': !vendor.email}">
                  {{ vendor.email || 'Enter email...' }}
                </div>
              </td>

              <!-- Phone -->
              <td>
                <div v-if="editingCell === `${vendor.id}-phone`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(vendor, 'phone')" 
                    @keyup.enter="saveEdit(vendor, 'phone')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter phone..."
                  >
                </div>
                <div v-else @click="startEdit(vendor, 'phone')" class="editable-cell text-truncate" :class="{'placeholder-text': !vendor.phone}">
                  {{ vendor.phone || 'Enter phone...' }}
                </div>
              </td>

              <!-- Website -->
              <td>
                <div v-if="editingCell === `${vendor.id}-website`" class="input-group input-group-sm">
                  <input 
                    v-model="editValue" 
                    @blur="saveEdit(vendor, 'website')" 
                    @keyup.enter="saveEdit(vendor, 'website')"
                    @keyup.esc="cancelEdit"
                    type="text" 
                    class="form-control"
                    ref="editInput"
                    placeholder="Enter website..."
                  >
                </div>
                <div v-else @click="startEdit(vendor, 'website')" class="editable-cell text-truncate text-primary" :class="{'placeholder-text': !vendor.website}">
                  <a v-if="vendor.website" :href="formatUrl(vendor.website)" target="_blank" class="text-decoration-none" @click.stop>{{ vendor.website }}</a>
                  <span v-else>Enter website...</span>
                </div>
              </td>

              <!-- Status -->
              <td>
                <select 
                  :value="vendor.status" 
                  @change="onStatusChange(vendor, $event.target.value)"
                  class="form-select form-select-sm border-0 bg-transparent shadow-none fw-bold"
                  :style="{ color: getStatusColor(vendor.status) }"
                >
                  <option value="not_contacted">Not contacted yet</option>
                  <option value="contacted">Contacted</option>
                  <option value="price_estimation">Got price estimation</option>
                  <option value="booked">Booked</option>
                  <option value="not_booked">Not booked</option>
                </select>
              </td>

              <!-- Notes -->
              <td class="text-center">
                <button 
                  class="btn btn-sm" 
                  :class="vendor.notes ? 'btn-info text-white' : 'btn-outline-secondary border-0'"
                  @click="openNotesModal(vendor)"
                  title="View/Edit Notes"
                >
                  <i class="fa-solid fa-note-sticky"></i>
                </button>
              </td>

              <!-- Actions -->
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger border-0" @click="deleteVendor(vendor.id)">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredVendors.length === 0">
              <td colspan="9" class="text-center py-5">
                <div class="text-muted opacity-25 display-1 mb-3">
                  <i class="fa-solid fa-address-book"></i>
                </div>
                <h5>No vendors found</h5>
                <p class="text-muted small">Try adjusting your filters or add a new vendor.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category Checklist Summary -->
    <div class="bg-white p-4 rounded shadow-sm border-0">
      <h6 class="fw-bold mb-4 text-uppercase tracked-labels border-bottom pb-2">Category Booking Status</h6>
      <div class="row row-cols-1 row-cols-md-2 g-3">
        <div v-for="cat in checklistCategories" :key="cat" class="col">
          <div class="d-flex align-items-center gap-3 p-2 rounded hover-light">
            <div class="form-check mb-0">
              <input 
                class="form-check-input" 
                type="checkbox" 
                :checked="isCategoryBooked(cat)" 
                disabled
              >
            </div>
            <span 
              class="fw-medium" 
              :class="{ 'text-decoration-line-through text-muted opacity-50': isCategoryBooked(cat) }"
            >
              {{ cat }}
            </span>
            <span v-if="isCategoryBooked(cat)" class="badge bg-success bg-opacity-10 text-success small ms-auto px-2">
              <i class="fa-solid fa-check-circle me-1"></i> Booked
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Confirmation Modal -->
    <div class="modal fade" id="bookingConfirmationModal" tabindex="-1" ref="bookingModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title fw-bold">Confirm Booking</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <div class="d-flex align-items-start gap-3">
              <div class="text-success display-6">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <p class="mb-3">You are booking <strong>{{ pendingVendor?.firstName }} {{ pendingVendor?.lastName }}</strong> for the <strong>{{ pendingVendor?.category }}</strong> category.</p>
                
                <div class="form-check p-3 bg-light rounded border">
                  <input 
                    class="form-check-input ms-0 me-2" 
                    type="checkbox" 
                    v-model="moveOthersToNotBooked" 
                    id="moveOthersCheck"
                  >
                  <label class="form-check-label fw-medium" for="moveOthersCheck">
                    Set all other vendors in this category to "Not booked"
                  </label>
                  <p class="small text-muted mb-0 mt-1">This will automatically decline other candidates in the <strong>{{ pendingVendor?.category }}</strong> category.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-success px-4 fw-bold" @click="confirmBooking">Book Vendor</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vendor Notes Modal -->
    <div class="modal fade" id="vendorNotesModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Vendor Notes: {{ activeVendor?.firstName }} {{ activeVendor?.lastName }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <textarea 
              v-model="tempNotes" 
              class="form-control shadow-none" 
              rows="10" 
              placeholder="Write any details, price estimations, or contact logs here..."
            ></textarea>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary px-4" @click="saveNotes">Save Notes</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Categories Modal -->
    <div class="modal fade" id="manageCategoriesModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Manage Vendor Categories</h5>
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
                    <div class="drag-handle cursor-move text-muted">
                      <i class="fa-solid fa-grip-vertical"></i>
                    </div>
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
              <div class="list-group-item d-flex align-items-center gap-3 bg-light bg-opacity-50">
                <div class="text-muted opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <span class="flex-grow-1 text-muted">Other (Default)</span>
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

const vendors = ref([])
const categories = ref([])
const newCategoryName = ref('')
const filters = ref({
  search: '',
  category: 'all',
  status: 'all'
})

const editingCell = ref(null)
const editValue = ref('')
const editInput = ref(null)

const editingCategoryIndex = ref(null)
const editingCategoryName = ref('')

const sortBy = ref('firstName')
const sortOrder = ref('asc')

const activeVendor = ref(null)
const tempNotes = ref('')
const pendingVendor = ref(null)
const moveOthersToNotBooked = ref(true)
let bookingModal = null

const allCategories = computed(() => [...categories.value, 'Other'])
const checklistCategories = computed(() => categories.value)

onMounted(() => {
  const state = store.getState()
  vendors.value = state.vendors || []
  categories.value = state.vendorCategories || ['Photographer', 'Producer', 'DJ']
})

const filteredVendors = computed(() => {
  return vendors.value.filter(v => {
    const nameMatch = (v.firstName + ' ' + v.lastName).toLowerCase().includes(filters.value.search.toLowerCase())
    const categoryMatch = filters.value.category === 'all' || v.category === filters.value.category
    const statusMatch = filters.value.status === 'all' || v.status === filters.value.status
    return nameMatch && categoryMatch && statusMatch
  })
})

const sortedVendors = computed(() => {
  return [...filteredVendors.value].sort((a, b) => {
    let valA = a[sortBy.value]?.toLowerCase() || ''
    let valB = b[sortBy.value]?.toLowerCase() || ''
    
    if (sortBy.value === 'status') {
      const priority = { booked: 5, price_estimation: 4, contacted: 3, not_contacted: 2, not_booked: 1 }
      valA = priority[a.status] || 0
      valB = priority[b.status] || 0
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
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

function addNewVendor() {
  const newVendor = {
    id: 'vendor_' + Date.now(),
    firstName: '',
    lastName: '',
    category: 'Other',
    email: '',
    phone: '',
    website: '',
    status: 'not_contacted',
    notes: ''
  }
  vendors.value.push(newVendor)
  saveToStore()
  
  nextTick(() => {
    startEdit(newVendor, 'firstName')
  })
}

function deleteVendor(id) {
  vendors.value = vendors.value.filter(v => v.id !== id)
  saveToStore()
}

function startEdit(vendor, field) {
  editingCell.value = `${vendor.id}-${field}`
  editValue.value = vendor[field]
  nextTick(() => {
    if (editInput.value) editInput.value.focus()
  })
}

function saveEdit(vendor, field) {
  if (editingCell.value === `${vendor.id}-${field}`) {
    vendor[field] = editValue.value
    saveToStore()
    editingCell.value = null
  }
}

function cancelEdit() {
  editingCell.value = null
}

function onStatusChange(vendor, newStatus) {
  if (newStatus === 'booked') {
    pendingVendor.value = vendor
    moveOthersToNotBooked.value = true
    bookingModal = new bootstrap.Modal(document.getElementById('bookingConfirmationModal'))
    bookingModal.show()
  } else {
    vendor.status = newStatus
    saveToStore()
  }
}

function openNotesModal(vendor) {
  activeVendor.value = vendor
  tempNotes.value = vendor.notes || ''
  const modal = new bootstrap.Modal(document.getElementById('vendorNotesModal'))
  modal.show()
}

function saveNotes() {
  if (activeVendor.value) {
    activeVendor.value.notes = tempNotes.value
    saveToStore()
    bootstrap.Modal.getInstance(document.getElementById('vendorNotesModal')).hide()
    toast.success('Notes updated')
  }
}

function confirmBooking() {
  if (!pendingVendor.value) return
  
  const vendor = pendingVendor.value
  vendor.status = 'booked'
  
  if (moveOthersToNotBooked.value) {
    vendors.value.forEach(v => {
      if (v.id !== vendor.id && v.category === vendor.category) {
        v.status = 'not_booked'
      }
    })
  }
  
  saveToStore()
  if (bookingModal) bookingModal.hide()
  pendingVendor.value = null
  toast.success(`Booked ${vendor.firstName} ${vendor.lastName}!`)
}

function isCategoryBooked(catName) {
  return vendors.value.some(v => v.category === catName && v.status === 'booked')
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
  vendors.value.forEach(v => {
    if (v.category === catName) v.category = 'Other'
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
    vendors.value.forEach(v => {
      if (v.category === oldName) v.category = newName
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

function getStatusColor(status) {
  const colors = {
    not_contacted: '#f39c12',
    contacted: '#f1c40f',
    price_estimation: '#3498db',
    booked: '#2ecc71',
    not_booked: '#e74c3c'
  }
  return colors[status] || 'inherit'
}

function formatUrl(url) {
  if (!url) return '#'
  return url.startsWith('http') ? url : `https://${url}`
}

function saveToStore() {
  const state = store.getState()
  state.vendors = vendors.value
  state.vendorCategories = categories.value
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
.cursor-pointer {
  cursor: pointer;
}
.search-box {
  width: 250px;
}
@media (max-width: 768px) {
  .search-box { width: 100%; }
}

.tracked-labels {
  letter-spacing: 0.05em;
  font-weight: 600;
}

.hover-light:hover {
  background-color: #f8f9fa;
}

.form-check-input:disabled {
  opacity: 1;
}

.form-check-input:disabled:checked {
  background-color: #198754;
  border-color: #198754;
}
</style>
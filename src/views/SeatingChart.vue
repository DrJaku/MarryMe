<template>
  <div class="container-fluid seating-layout">
    <div class="row g-0">
      <!-- Left Content (Main Seating Area) -->
      <div class="col position-relative main-content d-flex flex-column">
        <!-- Sticky Header with Tabs -->
        <div class="p-4 pb-0 bg-transparent">
          <h2 class="font-fancy mb-3">Seating Chart</h2>
          
          <ul class="nav nav-tabs border-0 gap-2 mb-4">
            <li class="nav-item">
              <button 
                class="nav-link rounded-pill px-4 fw-bold shadow-sm" 
                :class="activeTab === 'tables' ? 'active-tab bg-white text-primary border-primary' : 'bg-light text-muted border-0'"
                @click="activeTab = 'tables'"
              >
                <i class="fa-solid fa-table-list me-2"></i> Tables List
              </button>
            </li>
            <li class="nav-item">
              <button 
                class="nav-link rounded-pill px-4 fw-bold shadow-sm" 
                :class="activeTab === 'layout' ? 'active-tab bg-white text-primary border-primary' : 'bg-light text-muted border-0'"
                @click="activeTab = 'layout'"
              >
                <i class="fa-solid fa-map me-2"></i> Layout View
              </button>
            </li>
          </ul>
        </div>

        <!-- Tab Content -->
        <div class="flex-grow-1 overflow-hidden d-flex flex-column px-4">
          <!-- Tables List Tab -->
          <div v-if="activeTab === 'tables'" class="h-100 d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-3 px-1">
              <h5 class="mb-0 fw-bold text-muted">Tables ({{ tables.length }})</h5>
              <button class="btn btn-sm btn-primary rounded-pill px-3 shadow-sm" @click="addNewTable">
                <i class="fa-solid fa-plus me-1"></i> Add Table
              </button>
            </div>

            <div class="tables-scroll-container pb-4">
              <div class="d-inline-flex gap-2 h-100 align-items-start px-1">
                <div 
                  v-for="(table, tIdx) in tables" 
                  :key="table.id" 
                  class="table-card bg-white rounded-4 shadow-sm border-0 d-flex flex-column"
                >
                  <!-- Table Header -->
                  <div class="table-card-header p-3 border-bottom position-relative">
                    <span class="table-number badge rounded-pill bg-secondary position-absolute top-1 start-0 translate-middle-y ms-3">
                      #{{ tIdx + 1 }}
                    </span>
                    
                    <div class="mt-3">
                      <div v-if="editingTableId === table.id" class="mb-2">
                        <input 
                          v-model="editTableName" 
                          @blur="saveTableName(table)"
                          @keyup.enter="saveTableName(table)"
                          @keyup.esc="editingTableId = null"
                          class="form-control form-control-sm shadow-none fw-bold"
                          ref="tableNameInput"
                        >
                      </div>
                      <h6 v-else @click="startEditTable(table)" class="mb-1 fw-bold text-truncate cursor-pointer hover-bg-light p-1 rounded">
                        {{ table.name || 'Unnamed Table' }}
                      </h6>
                      
                      <div class="d-flex align-items-center justify-content-between">
                        <div class="small text-muted d-flex align-items-center gap-2">
                          Capacity:
                          <div class="d-flex align-items-center bg-light rounded-pill px-2">
                            <button 
                              class="btn btn-xs text-secondary p-0" 
                              @click="updateCapacity(table, -1)"
                            >
                              <i class="fa-solid fa-minus x-small"></i>
                            </button>
                            <span class="mx-2 fw-bold" style="min-width: 15px; text-align: center;">{{ table.capacity }}</span>
                            <button 
                              class="btn btn-xs text-secondary p-0" 
                              @click="updateCapacity(table, 1)"
                            >
                              <i class="fa-solid fa-plus x-small"></i>
                            </button>
                          </div>
                        </div>
                        <div class="small text-muted" :class="{ 'text-danger fw-bold': getOccupiedSlots(table.id) > table.capacity }">
                          {{ getOccupiedSlots(table.id) }}/{{ table.capacity }} Slots
                        </div>
                      </div>
                    </div>

                    <button class="btn btn-xs btn-outline-danger border-0 position-absolute top-0 end-0 m-2 opacity-50 hover-opacity-100" @click="deleteTable(table.id)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>

                  <!-- Assigned Guests List -->
                  <div class="table-card-body flex-grow-1 p-2 bg-light bg-opacity-50 min-vh-25">
                    <draggable 
                      :model-value="getGuestsByTable(table.id)"
                      group="guests"
                      item-key="id"
                      class="guest-slots-container h-100"
                      ghost-class="ghost-guest"
                      chosen-class="chosen-guest"
                      @add="(evt) => handleGuestAdd(evt, table.id)"
                      :move="(evt) => checkMove(evt, table)"
                      @start="drag = true"
                      @end="drag = false"
                    >
                      <template #item="{ element: guest }">
                        <div class="guest-row d-flex align-items-center gap-2 p-2 rounded mb-1 bg-white shadow-xs cursor-move" :data-id="guest.id">
                          <div class="status-circle flex-shrink-0" :style="{ backgroundColor: getRSVPColor(guest.rsvp) }"></div>
                          <div class="flex-grow-1 text-truncate small fw-medium">
                            {{ guest.firstName }} {{ guest.lastName }}
                          </div>
                          <div v-if="guest.extras > 0" class="extras-tag flex-shrink-0">+{{ guest.extras }}</div>
                          <button class="btn btn-xs text-danger border-0 p-0 ms-1 opacity-50 hover-opacity-100" @click.stop="unassignGuest(guest)">
                            <i class="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </template>
                      <template #footer>
                        <div v-if="getOccupiedSlots(table.id) < table.capacity" class="guest-slot mb-1 rounded bg-white border border-dashed d-flex align-items-center justify-content-center p-3 small text-muted opacity-50">
                          <div class="text-center">
                            <i class="fa-solid fa-plus-circle d-block mb-1"></i>
                            <span class="italic">Drop guest ({{ table.capacity - getOccupiedSlots(table.id) }} free)</span>
                          </div>
                        </div>
                        <div v-else class="p-2 text-center text-danger small fw-bold">
                          <i class="fa-solid fa-ban me-1"></i> Table Full
                        </div>
                      </template>
                    </draggable>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Layout View Tab -->
          <div v-else class="h-100 d-flex flex-column">
            <!-- Layout Header -->
            <div class="d-flex align-items-center justify-content-between mb-3 px-1">
              <h5 class="mb-0 fw-bold text-muted">Venue Layout</h5>
              <div class="d-flex align-items-center gap-3">
                <!-- Add Label -->
                <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm" @click="addNewVenueItem('label')">
                  <i class="fa-solid fa-font me-1"></i> Add Label
                </button>
                
                <!-- Add Venue Item -->
                <div class="d-flex align-items-center btn-outline-primary rounded-pill p-1 shadow-sm border border-primary">
                  <span class="small fw-bold px-3 text-primary border-end border-primary border-opacity-25">Add Venue Item</span>
                  <button class="btn btn-sm btn-light rounded-circle ms-2" style="width: 28px; height: 28px; padding: 0;" @click="addNewVenueItem('item', 'rect')" title="Add Rectangle Item">
                    <i class="fa-regular fa-square text-primary" style="font-size: 0.8rem;"></i>
                  </button>
                  <button class="btn btn-sm btn-light rounded-circle ms-1" style="width: 28px; height: 28px; padding: 0;" @click="addNewVenueItem('item', 'circle')" title="Add Circular Item">
                    <i class="fa-regular fa-circle text-primary" style="font-size: 0.8rem;"></i>
                  </button>
                </div>
                
                <div class="d-flex align-items-center btn-primary rounded-pill p-1 shadow-sm" style="background-color: #0d6efd;">
                  <span class="small px-3 text-white border-end border-white border-opacity-25">Add Table</span>
                  <button class="btn btn-sm btn-light rounded-circle ms-2" style="width: 28px; height: 28px; padding: 0;" @click="addNewTable('rect')" title="Add Rectangle Table">
                    <i class="fa-regular fa-square text-primary" style="font-size: 0.8rem;"></i>
                  </button>
                  <button class="btn btn-sm btn-light rounded-circle ms-1" style="width: 28px; height: 28px; padding: 0;" @click="addNewTable('circle')" title="Add Circular Table">
                    <i class="fa-regular fa-circle text-primary" style="font-size: 0.8rem;"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Venue Workspace -->
            <div 
              class="venue-container flex-grow-1 bg-light rounded-4 border p-4 position-relative shadow-inner"
              @dragover="hoveredTableId = null"
            >
              <div 
                class="venue-workspace h-100 w-100 bg-white shadow-sm rounded-3 position-relative" 
                style="background-color:white !important" 
                ref="venueRef"
                @dragover.stop
              >
                <div 
                  v-for="table in positionedTables" 
                  :key="table.id"
                  class="interact-table shadow-sm border position-absolute d-flex flex-column align-items-center justify-content-center"
                  :class="[
                    table.shape === 'circle' ? 'rounded-circle' : 'rounded-3', 
                    { 
                      'border-primary': draggingId === table.id, 
                      'border-0': table.type === 'label'
                    }
                  ]"
                  :style="{
                    left: table.x + 'px',
                    top: table.y + 'px',
                    width: table.width + 'px',
                    height: table.height + 'px',
                    backgroundColor: table.type === 'label' ? 'transparent' : (table.type === 'item' ? 'var(--item-bg)' : 'var(--pink-beige)'),
                    zIndex: draggingId === table.id ? 2500 : (hoveredTableId === table.id ? 3000 : (activeGuestMenuId === table.id ? 1500 : 100))
                  }"
                  :data-interact-id="table.id"
                  :data-type="table.type || 'table'"
                  @mousedown="draggingId = table.id"
                  @mouseup="draggingId = null"
                >
                  <!-- Drag Target for Guests -->
                  <draggable 
                    v-if="!table.type || table.type === 'table'"
                    :list="[]"
                    group="guests"
                    item-key="id"
                    class="position-absolute w-100 h-100 guest-drop-zone"
                    :style="{ zIndex: drag ? 3100 : 5 }"
                    @add="(evt) => handleLayoutGuestAdd(evt, table.id)"
                    :move="(evt) => checkMove(evt, table)"
                  >
                    <template #item="{}"><div></div></template>
                    <template #footer>
                      <div 
                        class="w-100 h-100 d-flex align-items-center justify-content-center drop-indicator-container"
                        @dragenter="hoveredTableId = table.id"
                        @dragleave="hoveredTableId = null"
                        @drop="hoveredTableId = null"
                      >
                        <div v-if="drag && hoveredTableId === table.id" class="drop-indicator rounded-circle shadow-sm pulse">
                           <i class="fa-solid fa-user-plus text-primary"></i>
                        </div>
                      </div>
                    </template>
                  </draggable>

                  <div class="table-info-overlay text-center px-2 w-100 h-100 d-flex flex-column justify-content-center" style="z-index: 10;" @mousedown.stop @touchstart.stop>
                    <div v-if="editingTableId === table.id" class="px-2">
                      <input 
                        v-model="editTableName" 
                        @blur="saveTableName(table)"
                        @keyup.enter="saveTableName(table)"
                        class="form-control form-control-sm text-center fw-bold bg-white"
                        style="font-size: 0.75rem;"
                        ref="layoutNameInput"
                      >
                    </div>
                    <div v-else @click="startEditTableInLayout(table)" class="fw-bold small text-truncate cursor-pointer hover-bg-white-50 p-1 rounded">
                      {{ table.name }}
                    </div>
                    
                    <div class="d-flex align-items-center justify-content-center gap-1 mt-1">
                      <template v-if="!table.type || table.type === 'table'">
                        <!-- Seated Guests Dropdown -->
                        <div class="dropdown">
                          <button class="btn btn-xs btn-white shadow-xs rounded-pill fw-bold d-flex align-items-center" type="button" @click.stop="toggleGuestMenu(table.id)">
                            <i class="fa-solid fa-users me-1"></i> {{ getGuestsByTable(table.id).length }} / {{ table.capacity }}
                          </button>
                          <ul class="dropdown-menu shadow-lg border-0 p-2 guest-dropdown-custom" v-if="activeGuestMenuId === table.id">
                            <li class="px-2 py-1 border-bottom mb-1 d-flex align-items-center justify-content-between">
                              <span class="fw-bold x-small text-uppercase tracked-labels">Seated Guests</span>
                              <button class="btn btn-xs p-0 text-muted" @click.stop="activeGuestMenuId = null"><i class="fa-solid fa-xmark"></i></button>
                            </li>
                            <div class="guest-list-scrollable" style="max-height: 200px; overflow-y: auto;">
                              <li v-if="getGuestsByTable(table.id).length === 0" class="px-2 py-3 text-center text-muted x-small italic">
                                No guests seated
                              </li>
                              <li v-for="guest in getGuestsByTable(table.id)" :key="guest.id" class="px-2 py-1 rounded d-flex align-items-center justify-content-between hover-bg-light">
                                <div class="d-flex align-items-center gap-2 text-truncate pe-2">
                                  <div class="status-circle" :style="{ backgroundColor: getRSVPColor(guest.rsvp) }"></div>
                                  <span class="x-small text-truncate">{{ guest.firstName }} {{ guest.lastName }}</span>
                                </div>
                                <button class="btn btn-xs text-danger p-0 border-0 bg-transparent" @click.stop="unassignGuest(guest)">
                                  <i class="fa-solid fa-circle-xmark"></i>
                                </button>
                              </li>
                            </div>
                          </ul>
                        </div>
                      </template>
                      
                      <button 
                        class="btn btn-xs btn-white shadow-xs rounded-pill" 
                        :class="(table.type === 'label' || table.type === 'item') ? 'text-secondary' : 'text-danger'"
                        @click="deleteTable(table.id)"
                      >
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Unpositioned Tables Strip -->
            <div 
              class="unpositioned-strip-container mt-3 px-1 border-top pt-3 bg-white bg-opacity-50 rounded-3"
              id="unpositioned-dropzone"
            >
              <h6 class="fw-bold text-muted x-small text-uppercase tracked-labels mb-2 d-flex align-items-center gap-2">
                <i class="fa-solid fa-box-archive"></i> Unpositioned Tables
                <span class="badge bg-secondary opacity-50 x-small">{{ unpositionedTables.length }}</span>
              </h6>
              <div class="unpositioned-strip d-flex gap-2 overflow-auto pb-3 pt-1">
                <div v-if="unpositionedTables.length === 0" class="py-4 px-4 bg-white rounded-3 border border-dashed text-muted x-small italic w-100 text-center">
                  All tables are placed in the layout. Drag here to unposition.
                </div>
                <div v-for="table in unpositionedTables" :key="table.id" class="unpositioned-card bg-white rounded-3 border p-3 shadow-xs d-flex align-items-center gap-3">
                  <div class="flex-grow-1" style="max-width: 120px;">
                    <input 
                      v-if="editingTableId === table.id"
                      v-model="editTableName" 
                      @blur="saveTableName(table)"
                      @keyup.enter="saveTableName(table)"
                      class="form-control form-control-sm x-small fw-bold border-0 bg-light px-1"
                      ref="stripNameInput"
                    >
                    <div v-else @click="startEditTableInStrip(table)" class="fw-bold x-small text-truncate cursor-pointer hover-bg-light p-1 rounded">{{ table.name }}</div>
                  </div>
                  <div class="d-flex gap-1">
                    <button class="btn btn-xs btn-outline-primary rounded-1 py-1" @click="placeTable(table, 'rect')" title="Place as Rectangle">
                      <i class="fa-regular fa-square"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-primary rounded-1 py-1" @click="placeTable(table, 'circle')" title="Place as Circle">
                      <i class="fa-regular fa-circle"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-danger border-0" @click="deleteTable(table.id)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Guest Menu -->
      <div 
        class="col-12 col-md-3 guest-menu-sidebar min-vh-100 border-start bg-white d-flex flex-column"
        @dragover="hoveredTableId = null"
      >
        <!-- Search & Filter Header -->
        <div class="p-3 border-bottom shadow-sm bg-white sticky-top z-101">
          <div class="input-group input-group-sm mb-3">
            <span class="input-group-text bg-white border-end-0">
              <i class="fa-solid fa-magnifying-glass text-muted small"></i>
            </span>
            <input 
              v-model="filters.search" 
              type="text" 
              class="form-control border-start-0 shadow-none" 
              placeholder="Search guests..."
            >
          </div>
          
          <div class="btn-group btn-group-sm w-100 mb-1">
            <button 
              class="btn" 
              :class="filters.side === 'all' ? 'btn-dark' : 'btn-outline-dark'"
              @click="filters.side = 'all'"
            >Both Sides</button>
            <button 
              class="btn" 
              :class="filters.side === 'bride' ? 'btn-dark' : 'btn-outline-dark'"
              @click="filters.side = 'bride'"
            >Bride</button>
            <button 
              class="btn" 
              :class="filters.side === 'groom' ? 'btn-dark' : 'btn-outline-dark'"
              @click="filters.side = 'groom'"
            >Groom</button>
          </div>

          <div class="rsvp-filters mt-2 px-1">
            <div class="row g-2">
              <div v-for="status in rsvpOptions" :key="status" class="col-6">
                <div class="form-check mb-0">
                  <input 
                    class="form-check-input custom-check" 
                    type="checkbox" 
                    :id="'filter-' + status"
                    v-model="filters.rsvp"
                    :value="status"
                    :style="{ backgroundColor: filters.rsvp.includes(status) ? getRSVPColor(status) : 'transparent', borderColor: getRSVPColor(status) }"
                  >
                  <label 
                    class="form-check-label x-small-label text-capitalize cursor-pointer" 
                    :for="'filter-' + status"
                    :style="{ color: getRSVPColor(status) }"
                  >
                    {{ status }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrollable Guest List -->
        <div class="flex-grow-1 overflow-auto p-2">
          <div v-for="category in groupedGuests" :key="category.name" class="mb-3">
            <h6 class="category-header px-2 py-1 mb-2 rounded bg-light small fw-bold text-uppercase tracked-labels">
              {{ category.name }}
            </h6>
            
            <draggable 
              :list="category.guests"
              :group="{ name: 'guests', pull: 'clone', put: false }"
              item-key="id"
              ghost-class="ghost-guest"
              chosen-class="chosen-guest"
              :clone="el => el"
              @start="drag = true"
              @end="drag = false"
            >
              <template #item="{ element: guest }">
                <div 
                  class="guest-row d-flex align-items-center gap-2 p-2 rounded mb-1 bg-white shadow-xs cursor-grab"
                  :class="{ 'opacity-50': guest.tableId }"
                  :data-id="guest.id"
                >
                  <!-- Status Dot -->
                  <div 
                    class="status-circle flex-shrink-0" 
                    :style="{ backgroundColor: getRSVPColor(guest.rsvp) }"
                    data-bs-toggle="tooltip"
                    :title="capitalize(guest.rsvp)"
                  ></div>

                  <!-- Side Icon -->
                  <div class="side-icon flex-shrink-0">
                    <i 
                      v-if="guest.side === 'bride'" 
                      class="fa-solid fa-person-dress" 
                      style="color: #d63384;"
                      data-bs-toggle="tooltip"
                      title="Bride Side"
                    ></i>
                    <i 
                      v-else 
                      class="fa-solid fa-person" 
                      style="color: #0d6efd;"
                      data-bs-toggle="tooltip"
                      title="Groom Side"
                    ></i>
                  </div>

                  <!-- Name -->
                  <div class="flex-grow-1 text-truncate small fw-medium">
                    {{ guest.firstName }} {{ guest.lastName }}
                    <span v-if="guest.tableId" class="x-small text-primary ms-1">(Assigned)</span>
                  </div>

                  <!-- Extras -->
                  <div v-if="guest.extras > 0" class="extras-tag flex-shrink-0">
                    +{{ guest.extras }}
                  </div>
                </div>
              </template>
            </draggable>
          </div>

          <!-- Empty State -->
          <div v-if="groupedGuests.length === 0" class="text-center py-5 opacity-50">
            <i class="fa-solid fa-users-slash d-block mb-2 fs-3"></i>
            <span class="small">No guests found</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Table Confirmation Modal -->
  <div class="modal fade" id="deleteTableModal" tabindex="-1" aria-hidden="true" ref="deleteModalEl">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">Delete Table?</h5>
          <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body py-4">
          <div v-if="tableToDeleteGuestsCount > 0" class="alert alert-warning border-0 rounded-4 mb-0">
            <div class="d-flex gap-3">
              <i class="fa-solid fa-triangle-exclamation fs-4 mt-1"></i>
              <div>
                <p class="mb-1 fw-bold">Warning: Table Occupied</p>
                <p class="mb-0 small opacity-75">
                  This table has <strong>{{ tableToDeleteGuestsCount }}</strong> guest(s) assigned. 
                  Deleting it will unassign all of them and move them back to the guest list.
                </p>
              </div>
            </div>
          </div>
          <p v-else class="mb-0 text-muted">
            Are you sure you want to delete this table? This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger rounded-pill px-4 shadow-sm" @click="confirmDeleteTable">
            Delete Table
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as bootstrap from 'bootstrap'
import draggable from 'vuedraggable'
import interact from 'interactjs'
import { toast } from 'vue3-toastify'
import store from '../utils/store'

const guests = ref([])
const categories = ref([])
const tables = ref([])
const activeTab = ref('tables')
const rsvpOptions = ['confirmed', 'definitely', 'likely', 'unlikely']
const filters = ref({
  search: '',
  side: 'all',
  rsvp: ['confirmed', 'definitely']
})

const editingTableId = ref(null)
const editTableName = ref('')
const tableNameInput = ref(null)
const drag = ref(false)
const draggingId = ref(null)
const venueRef = ref(null)
const layoutNameInput = ref(null)
const stripNameInput = ref(null)
const activeGuestMenuId = ref(null)
const hoveredTableId = ref(null)

// Delete Table Modal State
const deleteModalEl = ref(null)
let deleteModalInstance = null
const tableToDeleteId = ref(null)
const tableToDeleteGuestsCount = ref(0)

onMounted(() => {
  const state = store.getState()
  guests.value = state.guests || []
  categories.value = state.guestCategories || []
  tables.value = state.seating?.tables || []
  
  initTooltips()
  
  if (deleteModalEl.value) {
    deleteModalInstance = new bootstrap.Modal(deleteModalEl.value)
  }

  initInteract()

  // Close guest menu when clicking outside
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      activeGuestMenuId.value = null
    }
  })
})

function initInteract() {
  interact('.interact-table')
    .draggable({
      listeners: {
        move(event) {
          const id = event.target.getAttribute('data-interact-id')
          const table = tables.value.find(t => t.id === id)
          if (table) {
            table.x += event.dx
            table.y += event.dy
          }
        },
        end(event) {
          const id = event.target.getAttribute('data-interact-id')
          const type = event.target.getAttribute('data-type')
          
          // Check if dropped near the bottom strip
          const stripEl = document.getElementById('unpositioned-dropzone')
          if (stripEl && type !== 'item') {
            const stripRect = stripEl.getBoundingClientRect()
            if (event.clientY > stripRect.top) {
              unplaceTable(id)
            }
          }
          saveSeatingToStore()
        }
      },
      // Removed restriction to allow dragging to unpositioned area
    })
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move(event) {
          const id = event.target.getAttribute('data-interact-id')
          const table = tables.value.find(t => t.id === id)
          if (table) {
            table.width = event.rect.width
            table.height = event.rect.height
            table.x += event.deltaRect.left
            table.y += event.deltaRect.top
          }
        },
        end() {
          saveSeatingToStore()
        }
      },
      modifiers: [
        interact.modifiers.restrictEdges({
          restriction: 'parent'
        }),
        interact.modifiers.restrictSize({
          min: { width: 80, height: 80 }
        })
      ]
    })
}

// Re-init interact when switching to layout tab
watch(activeTab, (val) => {
  if (val === 'layout') {
    nextTick(() => {
      initInteract()
    })
  }
})

const initTooltips = () => {
  nextTick(() => {
    // Cleanup existing tooltips to prevent memory leaks and orphans
    const tooltips = document.querySelectorAll('.tooltip')
    tooltips.forEach(t => t.remove())
    
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(el => {
      // Dispose old instance if exists
      const old = bootstrap.Tooltip.getInstance(el)
      if (old) old.dispose()
      return new bootstrap.Tooltip(el, {
        customClass: 'seating-layout-tooltip'
      })
    })
  })
}

// Watch filters or guest list changes to re-init tooltips
watch([() => filters.value.search, () => filters.value.side, () => filters.value.rsvp], () => {
  initTooltips()
}, { deep: true })

const filteredGuests = computed(() => {
  return guests.value.filter(g => {
    const nameMatch = (g.firstName + ' ' + g.lastName).toLowerCase().includes(filters.value.search.toLowerCase())
    const sideMatch = filters.value.side === 'all' || g.side === filters.value.side
    const rsvpMatch = filters.value.rsvp.includes(g.rsvp)
    return nameMatch && sideMatch && rsvpMatch
  })
})

const groupedGuests = computed(() => {
  const allCats = [...categories.value, 'Other']
  const groups = []

  allCats.forEach(cat => {
    const catGuests = filteredGuests.value.filter(g => g.category === cat)
    if (catGuests.length > 0) {
      groups.push({
        name: cat,
        guests: catGuests
      })
    }
  })

  return groups
})

function getRSVPColor(rsvp) {
  const colors = {
    unlikely: '#e74c3c',
    likely: '#f1c40f',
    definitely: '#196f3d',
    confirmed: '#27ae60'
  }
  return colors[rsvp] || '#adb5bd'
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function addNewTable(shape = null) {
  const newId = 'table_' + Date.now()
  const tableCount = tables.value.length + 1
  const newTable = {
    id: newId,
    name: `New Table #${tableCount}`,
    capacity: 10,
    assignedGuestIds: []
  }

  if (shape) {
    newTable.shape = shape
    newTable.x = 20
    newTable.y = 20
    newTable.width = shape === 'circle' ? 150 : 150
    newTable.height = shape === 'circle' ? 150 : 100
  }

  tables.value.push(newTable)
  saveSeatingToStore()
  
  if (shape) {
    toast.success(`Table added to layout`)
  }
}

const positionedTables = computed(() => {
  return tables.value.filter(t => t.x !== undefined && t.y !== undefined)
})

const unpositionedTables = computed(() => {
  return tables.value.filter(t => (t.x === undefined || t.y === undefined) && t.type !== 'item')
})

function placeTable(table, shape) {
  table.shape = shape
  table.x = 20
  table.y = 20
  table.width = 120
  table.height = 120
  saveSeatingToStore()
  toast.success(`Table placed in layout`)
}



function deleteTable(id) {
  const table = tables.value.find(t => t.id === id)
  if (!table) return

  const assignedCount = getGuestsByTable(id).length
  
  if (assignedCount === 0) {
    // Skip warning for empty tables
    tableToDeleteId.value = id
    confirmDeleteTable()
    return
  }

  tableToDeleteId.value = id
  tableToDeleteGuestsCount.value = assignedCount
  
  if (deleteModalInstance) {
    deleteModalInstance.show()
  }
}

function confirmDeleteTable() {
  const id = tableToDeleteId.value
  const table = tables.value.find(t => t.id === id)
  if (!table) return

  const assignedGuests = getGuestsByTable(id)
  
  // Unassign all guests
  assignedGuests.forEach(guest => {
    unassignGuest(guest)
  })

  tables.value = tables.value.filter(t => t.id !== id)
  saveSeatingToStore()
  
  if (deleteModalInstance) {
    deleteModalInstance.hide()
  }
  
  toast.success(`Table "${table.name}" deleted`)
  tableToDeleteId.value = null
}

function startEditTable(table) {
  editingTableId.value = table.id
  editTableName.value = table.name
  nextTick(() => {
    if (tableNameInput.value) tableNameInput.value[0]?.focus()
  })
}

function saveTableName(table) {
  if (editingTableId.value === table.id) {
    table.name = editTableName.value.trim() || (table.type === 'item' ? 'Venue Item' : 'Unnamed Table')
    editingTableId.value = null
    saveSeatingToStore()
  }
}

function startEditTableInLayout(table) {
  editingTableId.value = table.id
  editTableName.value = table.name
  nextTick(() => {
    if (layoutNameInput.value) {
      const inputs = Array.isArray(layoutNameInput.value) ? layoutNameInput.value : [layoutNameInput.value]
      inputs[0]?.focus()
    }
  })
}

function startEditTableInStrip(table) {
  editingTableId.value = table.id
  editTableName.value = table.name
  nextTick(() => {
    if (stripNameInput.value) {
      const inputs = Array.isArray(stripNameInput.value) ? stripNameInput.value : [stripNameInput.value]
      inputs[0]?.focus()
    }
  })
}

function addNewVenueItem(type = 'item', shape = 'rect') {
  const newId = (type === 'label' ? 'label_' : 'item_') + Date.now()
  const itemCount = tables.value.filter(t => t.type === type).length + 1
  const newItem = {
    id: newId,
    name: type === 'label' ? `Text Label #${itemCount}` : `New Item #${itemCount}`,
    type: type,
    shape: shape,
    x: 100,
    y: 100,
    width: type === 'label' ? 150 : (shape === 'circle' ? 150 : 150),
    height: type === 'label' ? 100 : (shape === 'circle' ? 150 : 100)
  }
  tables.value.push(newItem)
  saveSeatingToStore()
  toast.success(`${type === 'label' ? 'Label' : 'Venue item'} added`)
}

function toggleGuestMenu(id) {
  activeGuestMenuId.value = activeGuestMenuId.value === id ? null : id
}

function handleLayoutGuestAdd(evt, tableId) {
  // For safety, clear hover
  hoveredTableId.value = null
  
  // Find guest in our local ref
  const guestId = evt.item.dataset.id
  const guest = guests.value.find(g => g.id === guestId)
  
  if (guest) {
    assignGuestToTable(guest, tableId)
  }
}

function unplaceTable(id) {
  const table = tables.value.find(t => t.id === id)
  if (table) {
    delete table.x
    delete table.y
    delete table.width
    delete table.height
    delete table.shape
    saveSeatingToStore()
    toast.info(`Table "${table.name}" moved to unpositioned list`)
  }
}

function updateCapacity(table, delta) {
  const occupied = getOccupiedSlots(table.id)
  const newCapacity = table.capacity + delta
  
  if (newCapacity < 1) return
  
  if (newCapacity < occupied) {
    toast.error(`Cannot reduce capacity below occupied slots (${occupied}).`, {
      position: 'bottom-right',
      autoClose: 3000
    })
    return
  }
  
  table.capacity = newCapacity
  saveSeatingToStore()
}

function getOccupiedSlots(tableId, excludeGuestId = null) {
  return guests.value
    .filter(g => g.tableId === tableId && g.id !== excludeGuestId)
    .reduce((total, g) => total + 1 + (g.extras || 0), 0)
}

function getGuestsByTable(tableId) {
  return guests.value.filter(g => g.tableId === tableId)
}

function checkMove(evt, table) {
  const guest = evt.draggedContext.element
  if (!guest) return false

  const requiredSlots = 1 + (guest.extras || 0)
  const currentOccupied = getOccupiedSlots(table.id, guest.id)
  
  if (currentOccupied + requiredSlots > table.capacity) {
    // We trigger the toast if it's the specific target they are hovering over
    // To avoid toast spam, we use a simple check
    if (!evt.to.dataset.fullToastShown) {
      toast.error(`Not enough space at ${table.name}. Needs ${requiredSlots} slots.`, {
        position: 'top-center',
        autoClose: 2000
      })
      evt.to.dataset.fullToastShown = 'true'
      setTimeout(() => { delete evt.to.dataset.fullToastShown }, 3000)
    }
    return false
  }
  return true
}

function handleGuestAdd(evt, tableId) {
  // In vuedraggable v4, the added element is in evt.item._underlying_node_
  // or we can find it in our guests array by some property
  const guestId = evt.item.dataset.id
  const guest = guests.value.find(g => g.id === guestId)
  
  if (guest) {
    assignGuestToTable(guest, tableId)
  } else {
    // Fallback if dataset.id isn't available
    const underlying = evt.item.__draggable_context?.element
    if (underlying) assignGuestToTable(underlying, tableId)
  }
}

function assignGuestToTable(guest, tableId) {
  const table = tables.value.find(t => t.id === tableId)
  if (!table) return

  const requiredSlots = 1 + (guest.extras || 0)
  const currentOccupied = getOccupiedSlots(tableId, guest.id)

  if (currentOccupied + requiredSlots > table.capacity) {
    toast.error(`Not enough space at ${table.name}. Needs ${requiredSlots} slots but only ${table.capacity - currentOccupied} available.`, {
      position: 'top-center'
    })
    return false
  }

  // Update guest locally
  const guestIdx = guests.value.findIndex(g => g.id === guest.id)
  if (guestIdx !== -1) {
    guests.value[guestIdx].tableId = tableId
    saveSeatingToStore()
    // Update global state via store directly to ensure persistence
    store.updateItem('guests', guest.id, { tableId })
    toast.success(`${guest.firstName} assigned to ${table.name}`)
    return true
  }
  return false
}

function unassignGuest(guest) {
  const guestIdx = guests.value.findIndex(g => g.id === guest.id)
  if (guestIdx !== -1) {
    guests.value[guestIdx].tableId = null
    saveSeatingToStore()
    store.updateItem('guests', guest.id, { tableId: null })
  }
}

// Since vuedraggable with cloning is tricky for "assignment", 
// I'll use a simpler 'end' event or handle it via a custom drop implementation if needed.
// However, I can use @add on the target draggable.
function onGuestAdded(evt, table) {
  // Prevent vuedraggable from actually adding the item to the list 
  // because our list is computed from the main guests array
  const guest = evt.clone.__vue_instance__?.props?.element || evt.item._underlying_node_
  
  // Actually, vuedraggable v4 provides the added element in evt.clone or evt.item
  // Let's use the underlying data if possible.
}

function saveSeatingToStore() {
  const state = store.getState()
  state.seating = state.seating || {}
  state.seating.tables = JSON.parse(JSON.stringify(tables.value))
  store.saveState(state)
}
</script>

<style scoped>
.seating-layout {
  height: 100vh;
  overflow: hidden;
}

.main-content {
  overflow-y: auto;
  height: 100vh;
}

.guest-menu-sidebar {
  box-shadow: 1px 0 25px #dabcb2 !important; /* Pink shadow styling to match left sidebar */
  z-index: 100;
  max-width: 320px; /* Approximately same width as sidebar menu */
}

.guest-row {
  border: 1px solid rgba(0,0,0,0.02);
  transition: transform 0.1s ease;
}

.guest-row:hover {
  background-color: var(--pink-beige) !important;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

.status-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.side-icon {
  width: 14px;
  text-align: center;
}

.extras-tag {
  background: var(--pink-beige);
  color: var(--secondary-blue);
  font-size: 0.65rem;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: bold;
}

.category-header {
  letter-spacing: 0.05em;
  font-size: 0.7rem !important;
}

.tracked-labels {
  letter-spacing: 0.05em;
  font-weight: 600;
}

.z-101 {
  z-index: 101;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.tables-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  scrollbar-width: auto;
  scrollbar-color: #dabcb2 transparent;
  padding-bottom: 20px;
}

.tables-scroll-container::-webkit-scrollbar {
  height: 12px;
}

.tables-scroll-container::-webkit-scrollbar-thumb {
  background-color: #dabcb2;
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.table-card {
  width: 300px;
  height: 100%;
  max-height: 750px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.min-vh-25 {
  min-height: 25vh;
}

.ghost-guest {
  opacity: 0.5;
  background: var(--pink-beige) !important;
  border: 2px dashed var(--secondary-blue) !important;
}

.chosen-guest {
  box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
  transform: scale(1.02);
}

.cursor-move {
  cursor: move;
}

.table-card-body {
  overflow-y: auto;
}

.guest-slot {
  min-height: 40px;
  border-style: dashed !important;
  border-width: 1px !important;
}

.table-number {
  font-size: 0.7rem;
  padding: 0.4em 0.8em;
}

.venue-container {
  background-color: --pink-beige !important;
}

.shadow-inner {
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
}

.interact-table {
  touch-action: none;
  user-select: none;
  z-index: 10;
  overflow: visible;
  border-width: 2px !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.interact-table:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
  z-index: 11;
}

.guest-dropdown {
  min-width: 200px;
  z-index: 1000;
}

.unpositioned-strip {
  scrollbar-width: thin;
}

.unpositioned-card {
  flex-shrink: 0;
  min-width: 180px;
  background-color: var(--secondary-white) !important;
}

.unpositioned-strip-container {
  min-height: 200px;
  z-index: 50;
}

.guest-drop-zone {
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.table-info-overlay {
  transition: opacity 0.2s ease;
}

/* Ensure nothing blocks the drop zone during guest dragging */
.interact-table[style*="zIndex: 3000"] .table-info-overlay,
.interact-table[style*="zIndex: 1500"] .table-info-overlay {
  /* Keep overlay visible but non-blocking */
}

/* If a guest is being dragged, make sure table interiors don't steal the drop event */
.seating-layout :deep(.guest-drop-zone) {
  background-color: transparent;
}

.drop-indicator-container {
  pointer-events: none;
}

.drop-indicator {
  width: 40px;
  height: 40px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--secondary-blue);
  z-index: 10;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(13, 110, 253, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); }
}

.pulse {
  animation: pulse 1.5s infinite;
}

.guest-dropdown-custom {
  display: block;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  z-index: 2100;
}

.border-dashed {
  border-style: dashed !important;
}

.hover-bg-white-50:hover {
  background-color: rgba(255,255,255,0.5);
}

.btn-white {
  background-color: white;
  border: 1px solid #dee2e6;
  color: var(--secondary-blue);
}

.btn-white:hover {
  background-color: #f8f9fa;
}

.guest-list-scrollable::-webkit-scrollbar {
  width: 4px;
}

.guest-list-scrollable::-webkit-scrollbar-thumb {
  background-color: #dabcb2;
  border-radius: 10px;
}

.hover-bg-light:hover {
  background-color: #f8f9fa;
}

.active-tab {
  transform: translateY(-2px);
}

.btn-xs {
  padding: 0.1rem 0.3rem;
  line-height: 1;
}

.x-small-label {
  font-size: 0.65rem;
  font-weight: 600;
}

.custom-check {
  width: 0.8rem;
  height: 0.8rem;
  margin-top: 0.2rem;
  box-shadow: none !important;
}

.custom-check:checked {
  border-color: transparent !important;
}

</style>

<style>
/* Global styles for tooltips since they are rendered outside the app root */
.seating-layout-tooltip .tooltip-inner {
  background-color: #FFF0F5 !important; /* Lavender Blush (Pink-almost white) */
  color: #333B54 !important; /* var(--section-text) hardcoded for global block */
  border: 1px solid #dabcb2;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-weight: 700;
  font-size: 0.75rem;
  padding: 6px 12px;
}

.seating-layout-tooltip.bs-tooltip-auto[data-popper-placement^=top] .tooltip-arrow::before, 
.seating-layout-tooltip.bs-tooltip-top .tooltip-arrow::before {
  border-top-color: #dabcb2 !important;
}

.seating-layout-tooltip.bs-tooltip-auto[data-popper-placement^=bottom] .tooltip-arrow::before, 
.seating-layout-tooltip.bs-tooltip-bottom .tooltip-arrow::before {
  border-bottom-color: #dabcb2 !important;
}
</style>
<template>
  <div class="container-fluid py-4">
    <!-- Header Area -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-white p-3 rounded shadow-sm">
      <div class="d-flex flex-wrap align-items-center gap-3">
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="addNewExpense">
          <i class="fa-solid fa-plus"></i>
          New Expense
        </button>
        <button class="btn btn-outline-secondary d-flex align-items-center gap-2" @click="showManageCategoriesModal">
          <i class="fa-solid fa-tags"></i>
          Manage Categories
        </button>
        <div class="vr h-100 d-none d-md-block"></div>
        
        <!-- Filters -->
        <div class="d-flex gap-2 align-items-center">
          <select v-model="filters.category" class="form-select form-select-sm shadow-none w-auto">
            <option value="all">All Categories</option>
            <option v-for="cat in categories" :key="cat.name" :value="cat.name">{{ cat.name }}</option>
            <option value="Uncategorized">Uncategorized</option>
          </select>
          
          <!-- Status Filter (Black Radio Buttons Style) -->
          <div class="btn-group btn-group-sm">
            <button 
              v-for="opt in statusFilterOptions" 
              :key="opt.value"
              class="btn" 
              :class="filters.status === opt.value ? 'btn-dark' : 'btn-outline-dark'"
              @click="filters.status = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
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
            placeholder="Search expenses..."
          >
        </div>
      </div>
    </div>

    <!-- Main Body: Category Tables -->
    <div v-for="(group, index) in groupedExpenses" :key="group.name" class="mb-4">
      <div class="card shadow-sm border-0 overflow-hidden">
        <div 
          class="card-header bg-white border-0 d-flex align-items-center justify-content-between cursor-pointer py-3"
          @click="toggleCategoryCollapse(group.name)"
        >
          <div class="d-flex align-items-center gap-3">
            <i 
              class="fa-solid fa-chevron-right transition-all" 
              :class="{ 'rotate-90': !collapsedCategories.includes(group.name) }"
            ></i>
            <h5 class="mb-0 fw-bold">{{ group.name }}</h5>
            <span v-if="group.budget > 0" class="badge rounded-pill bg-info bg-opacity-10 text-info">
              Budget: {{ formatCurrency(group.budget) }}
            </span>
          </div>
          <div class="text-muted small">
            Spent: {{ formatCurrency(getGroupTotal(group.expenses)) }} 
            <span v-if="group.budget > 0">
              ({{ Math.round((getGroupTotal(group.expenses) / group.budget) * 100) }}%)
            </span>
          </div>
        </div>

        <div v-show="!collapsedCategories.includes(group.name)" class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 border-top">
              <thead class="table-light">
                <tr>
                  <th style="width: 40px;"></th>
                  <th>Expense Name</th>
                  <th style="width: 200px;">Amount</th>
                  <th style="width: 150px;">Status</th>
                  <th class="text-end" style="width: 100px;">Actions</th>
                </tr>
              </thead>
              <draggable 
                v-model="group.expenses" 
                tag="tbody"
                item-key="id"
                handle=".drag-handle"
                group="expenses"
                @change="onDragChange($event, group.name)"
              >
                <template #item="{ element: expense }">
                  <tr>
                    <td>
                      <div class="drag-handle cursor-move text-muted opacity-50">
                        <i class="fa-solid fa-grip-vertical"></i>
                      </div>
                    </td>
                    <td>
                      <div v-if="editingCell === `${expense.id}-name`" class="input-group input-group-sm">
                        <input 
                          v-model="editValue" 
                          @blur="saveEdit(expense, 'name')" 
                          @keyup.enter="saveEdit(expense, 'name')"
                          @keyup.esc="cancelEdit"
                          type="text" 
                          class="form-control"
                          ref="editInput"
                        >
                      </div>
                      <div v-else @click="startEdit(expense, 'name')" class="editable-cell text-truncate" :class="{'placeholder-text': !expense.name}">
                        {{ expense.name || 'Enter expense name...' }}
                      </div>
                    </td>
                    <td>
                      <div v-if="editingCell === `${expense.id}-amount`" class="input-group input-group-sm">
                        <span class="input-group-text">$</span>
                        <input 
                          v-model.number="editValue" 
                          @blur="saveEdit(expense, 'amount')" 
                          @keyup.enter="saveEdit(expense, 'amount')"
                          @keyup.esc="cancelEdit"
                          type="number" 
                          class="form-control"
                          ref="editInput"
                        >
                      </div>
                      <div v-else @click="startEdit(expense, 'amount')" class="editable-cell fw-medium">
                        {{ formatCurrency(expense.amount) }}
                      </div>
                    </td>
                    <td>
                      <select 
                        v-model="expense.status" 
                        class="form-select form-select-sm shadow-none border-0 bg-transparent"
                        :class="expense.status === 'paid' ? 'text-success fw-bold' : 'text-danger'"
                        @change="saveToStore"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-danger border-0" @click="deleteExpense(expense.id)">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </template>
              </draggable>
              <tfoot v-if="group.expenses.length === 0">
                <tr>
                  <td colspan="5" class="text-center py-4 text-muted small italic">
                    No expenses in this category. Drag an item here or add a new one.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Overall/Totals Section -->
    <div class="card shadow-sm border-0 mt-5 bg-dark text-white">
      <div class="card-body p-0">
        <table class="table table-dark mb-0 align-middle">
          <tbody>
            <tr>
              <td style="width: 40px;"></td>
              <td class="fw-bold fs-5">TOTAL ESTIMATED COSTS</td>
              <td style="width: 200px;" class="fw-bold fs-5 text-info">
                {{ formatCurrency(totalEstimatedCosts) }}
              </td>
              <td style="width: 150px;">
                <span class="badge" :class="totalPending > 0 ? 'bg-warning text-dark' : 'bg-success'">
                  {{ totalPending > 0 ? 'Pending: ' + formatCurrency(totalPending) : 'All Paid' }}
                </span>
              </td>
              <td style="width: 100px;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-3 text-end px-3">
      <div v-if="weddingBudget > 0">
        <div class="d-flex align-items-center justify-content-end gap-3">
          <div class="flex-grow-1 text-start d-none d-md-block">
            <div class="progress" style="height: 10px;">
              <div 
                class="progress-bar" 
                role="progressbar" 
                :style="{ width: Math.min(100, (totalEstimatedCosts / weddingBudget) * 100) + '%' }"
                :class="totalEstimatedCosts > weddingBudget ? 'bg-danger' : 'bg-success'"
              ></div>
            </div>
          </div>
          <h5 class="mb-0">
            Total out of wedding budget: 
            <span :class="totalEstimatedCosts > weddingBudget ? 'text-danger' : 'text-success'">
              {{ formatCurrency(totalEstimatedCosts) }} / {{ formatCurrency(weddingBudget) }}
            </span>
            <small class="text-muted ms-2">({{ Math.round((totalEstimatedCosts / weddingBudget) * 100) }}%)</small>
          </h5>
        </div>
      </div>
      <div v-else class="text-muted">
        Budget needs to be set. 
        <router-link to="/preferences" class="text-primary text-decoration-none fw-bold ms-1">
          Set it in Preferences <i class="fa-solid fa-arrow-right small"></i>
        </router-link>
      </div>
    </div>

    <!-- Manage Categories Modal -->
    <div class="modal fade" id="manageCategoriesModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Manage Budget Categories</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <div class="input-group mb-3">
              <input 
                v-model="newCategoryName" 
                type="text" 
                class="form-control" 
                placeholder="Category name..."
                @keyup.enter="addCategory"
              >
              <button class="btn btn-primary" @click="addCategory">Add</button>
            </div>

            <div class="list-group">
              <div v-for="(cat, idx) in categories" :key="idx" class="list-group-item d-flex align-items-center gap-3">
                <div class="flex-grow-1">
                  <div v-if="editingCategoryIndex === idx" class="d-flex gap-2">
                    <input v-model="editingCategoryName" class="form-control form-control-sm" @keyup.enter="saveCategoryRename(idx, cat.name)">
                    <input v-model.number="editingCategoryBudget" type="number" class="form-control form-control-sm w-25" placeholder="Budget">
                  </div>
                  <div v-else class="d-flex justify-content-between align-items-center">
                    <span>{{ cat.name }}</span>
                    <span class="small text-muted">Budget: {{ formatCurrency(cat.budget) }}</span>
                  </div>
                </div>
                <div class="d-flex gap-1">
                  <button v-if="editingCategoryIndex === idx" class="btn btn-sm btn-success" @click="saveCategoryRename(idx, cat.name)">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button v-else class="btn btn-sm btn-outline-secondary border-0" @click="startCategoryRename(idx, cat)">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger border-0" @click="deleteCategory(idx, cat.name)">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-dark w-100" data-bs-dismiss="modal" @click="saveToStore">Save Changes</button>
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

const expenses = ref([])
const categories = ref([])
const weddingBudget = ref(0)
const collapsedCategories = ref([])

const filters = ref({
  search: '',
  category: 'all',
  status: 'all'
})

const statusFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Unpaid', value: 'unpaid' }
]

const newCategoryName = ref('')
const editingCategoryIndex = ref(null)
const editingCategoryName = ref('')
const editingCategoryBudget = ref(0)

const editingCell = ref(null)
const editValue = ref('')
const editInput = ref(null)

onMounted(() => {
  const state = store.getState()
  expenses.value = state.budget || []
  categories.value = state.budgetCategories || []
  weddingBudget.value = state.settings?.weddingBudget || 0
})

const filteredExpenses = computed(() => {
  return expenses.value.filter(e => {
    const searchMatch = e.name.toLowerCase().includes(filters.value.search.toLowerCase())
    const categoryMatch = filters.value.category === 'all' || e.category === filters.value.category
    const statusMatch = filters.value.status === 'all' || e.status === filters.value.status
    return searchMatch && categoryMatch && statusMatch
  })
})

const groupedExpenses = computed(() => {
  const groups = []
  
  // Named categories
  categories.value.forEach(cat => {
    groups.push({
      name: cat.name,
      budget: cat.budget,
      expenses: filteredExpenses.value.filter(e => e.category === cat.name)
    })
  })
  
  // Uncategorized
  const uncategorized = filteredExpenses.value.filter(e => e.category === 'Uncategorized' || !e.category)
  if (uncategorized.length > 0 || groups.length === 0) {
    groups.push({
      name: 'Uncategorized',
      budget: 0,
      expenses: uncategorized
    })
  }
  
  return groups
})

const totalEstimatedCosts = computed(() => {
  return expenses.value.reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
})

const totalPending = computed(() => {
  return expenses.value.filter(e => e.status !== 'paid').reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
})

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function getGroupTotal(exps) {
  return exps.reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
}

function toggleCategoryCollapse(name) {
  const idx = collapsedCategories.value.indexOf(name)
  if (idx === -1) collapsedCategories.value.push(name)
  else collapsedCategories.value.splice(idx, 1)
}

function addNewExpense() {
  const newExp = {
    id: 'exp_' + Date.now(),
    name: '',
    amount: 0,
    status: 'unpaid',
    category: filters.value.category !== 'all' ? filters.value.category : 'Uncategorized',
    createdAt: new Date().toISOString()
  }
  expenses.value.push(newExp)
  saveToStore()
  
  nextTick(() => {
    startEdit(newExp, 'name')
  })
}

function deleteExpense(id) {
  expenses.value = expenses.value.filter(e => e.id !== id)
  saveToStore()
  toast.success('Expense deleted')
}

function startEdit(expense, field) {
  editingCell.value = `${expense.id}-${field}`
  editValue.value = expense[field]
  nextTick(() => {
    if (editInput.value) editInput.value.focus()
  })
}

function saveEdit(expense, field) {
  if (editingCell.value === `${expense.id}-${field}`) {
    expense[field] = editValue.value
    saveToStore()
    editingCell.value = null
  }
}

function cancelEdit() {
  editingCell.value = null
}

function onDragChange(event, categoryName) {
  if (event.added) {
    const expense = event.added.element
    expense.category = categoryName
    saveToStore()
  }
}

// Category Management
function showManageCategoriesModal() {
  const modal = new bootstrap.Modal(document.getElementById('manageCategoriesModal'))
  modal.show()
}

function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name || name.toLowerCase() === 'uncategorized') return
  if (categories.value.some(c => c.name === name)) {
    toast.error('Category already exists')
    return
  }
  categories.value.push({ name, budget: 0 })
  newCategoryName.value = ''
  saveToStore()
}

function deleteCategory(idx, name) {
  expenses.value.forEach(e => {
    if (e.category === name) e.category = 'Uncategorized'
  })
  categories.value.splice(idx, 1)
  saveToStore()
}

function startCategoryRename(idx, cat) {
  editingCategoryIndex.value = idx
  editingCategoryName.value = cat.name
  editingCategoryBudget.value = cat.budget
}

function saveCategoryRename(idx, oldName) {
  const newName = editingCategoryName.value.trim()
  if (newName && !categories.value.some((c, i) => i !== idx && c.name === newName)) {
    categories.value[idx].name = newName
    categories.value[idx].budget = Number(editingCategoryBudget.value) || 0
    expenses.value.forEach(e => {
      if (e.category === oldName) e.category = newName
    })
    saveToStore()
  }
  editingCategoryIndex.value = null
}

function saveToStore() {
  const state = store.getState()
  state.budget = expenses.value
  state.budgetCategories = categories.value
  store.saveState(state)
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.cursor-move { cursor: move; }
.rotate-90 { transform: rotate(90deg); }
.transition-all { transition: all 0.2s ease-in-out; }

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

.search-box {
  width: 250px;
}
@media (max-width: 768px) {
  .search-box { width: 100%; }
}

.fs-10 { font-size: 0.8rem; }
.italic { font-style: italic; }

.table-dark {
  --bs-table-bg: #212529;
  --bs-table-border-color: #373b3e;
}
</style>
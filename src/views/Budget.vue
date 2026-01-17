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
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-info" @click="expandAll">
            <i class="fa-solid fa-expand me-1"></i> Expand All
          </button>
          <button class="btn btn-sm btn-outline-info" @click="collapseAll">
            <i class="fa-solid fa-compress me-1"></i> Collapse All
          </button>
        </div>
        <div class="vr h-100 d-none d-md-block"></div>
        
        <!-- Filters -->
        <div class="d-flex gap-2 align-items-center">
         
          
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

           <select v-model="filters.category" class="form-select form-select-sm shadow-none w-auto" style="line-height: 1.51;">
            <option value="all">All Categories</option>
            <option v-for="cat in categories" :key="cat.name" :value="cat.name">{{ cat.name }}</option>
            <option value="Uncategorized">Uncategorized</option>
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
            <h5 class="mb-0 fw-bold">{{ group.name }} <span class="text-muted fw-normal ms-2">(₪{{ group.budget }})</span></h5>
          </div>
          <div class="d-flex text-center align-items-center">
            <div style="width: 130px;" class="flex-shrink-0"></div> <!-- Status placeholder -->
            <div style="width: 130px;" class="flex-shrink-0 small text-secondary text-center px-4 pe-0">{{ formatCurrency(getSummary(group.expenses).estimation) }}</div>
            <div style="width: 130px;" class="flex-shrink-0 small text-primary text-center px-4 pe-0">{{ formatCurrency(getSummary(group.expenses).due) }}</div>
            <div style="width: 130px;" class="flex-shrink-0 small text-success text-center px-4 pe-0">{{ formatCurrency(getSummary(group.expenses).paid) }}</div>
            <div style="width: 130px;" class="flex-shrink-0 small text-dark fw-bold text-center px-4 pe-0">{{ formatCurrency(getSummary(group.expenses).total) }}</div>
            <div style="width: 80px;" class="flex-shrink-0"></div> <!-- Actions placeholder -->
          </div>
        </div>

        <div v-show="!collapsedCategories.includes(group.name)" class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 border-top">
              <thead class="table-light">
                <tr>
                  <th style="width: 40px;"></th>
                  <th>Description</th>
                  <th style="width: 130px;" class="text-center">Status</th>
                  <th style="width: 130px;" class="text-center">Estimation</th>
                  <th style="width: 130px;" class="text-center">Amount Due</th>
                  <th style="width: 130px;" class="text-center">Amount Paid</th>
                  <th style="width: 130px;" class="text-center">Total</th>
                  <th class="text-end" style="width: 80px;">Actions</th>
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
                        {{ expense.name || 'Enter expense description...' }}
                      </div>
                    </td>
                    <!-- Status -->
                    <td>
                      <select 
                        v-model="expense.paymentStatus" 
                        class="form-select form-select-sm shadow-none border-0 bg-transparent fw-medium"
                        :class="getStatusClass(expense.paymentStatus)"
                        @change="handleStatusChange(expense)"
                      >
                        <option value="estimated">Estimated</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partially">Partially Paid</option>
                        <option value="paid">All Paid</option>
                      </select>
                    </td>
                    <!-- Estimation -->
                    <td style="width: 130px;" class="px-2">
                      <div v-if="editingCell === `${expense.id}-estimation`" class="input-group input-group-sm">
                        <input 
                          v-model.number="editValue" 
                          @blur="saveEdit(expense, 'estimation')" 
                          @keyup.enter="saveEdit(expense, 'estimation')"
                          @keyup.esc="cancelEdit"
                          type="number" 
                          class="form-control text-center"
                          ref="editInput"
                        >
                      </div>
                      <div v-else @click="startEdit(expense, 'estimation')" class="editable-cell text-secondary text-center">
                        {{ formatCurrency(expense.estimation) }}
                      </div>
                    </td>
                    <!-- Due -->
                    <td style="width: 130px;" class="px-2">
                      <div v-if="editingCell === `${expense.id}-due`" class="input-group input-group-sm">
                        <input 
                          v-model.number="editValue" 
                          @blur="saveEdit(expense, 'due')" 
                          @keyup.enter="saveEdit(expense, 'due')"
                          @keyup.esc="cancelEdit"
                          type="number" 
                          class="form-control text-center"
                          ref="editInput"
                        >
                      </div>
                      <div v-else @click="startEdit(expense, 'due')" class="editable-cell text-primary text-center">
                        {{ formatCurrency(expense.due) }}
                      </div>
                    </td>
                    <!-- Paid -->
                    <td style="width: 130px;" class="px-2">
                      <div v-if="editingCell === `${expense.id}-paid`" class="input-group input-group-sm">
                        <input 
                          v-model.number="editValue" 
                          @blur="saveEdit(expense, 'paid')" 
                          @keyup.enter="saveEdit(expense, 'paid')"
                          @keyup.esc="cancelEdit"
                          type="number" 
                          class="form-control text-center"
                          ref="editInput"
                        >
                      </div>
                      <div v-else @click="startEdit(expense, 'paid')" class="editable-cell text-success text-center">
                        {{ formatCurrency(expense.paid) }}
                      </div>
                    </td>
                    <!-- Total -->
                    <td style="width: 130px;" class="px-2">
                      <div class="editable-cell fw-bold text-dark no-edit text-center">
                        {{ formatCurrency((Number(expense.due) || 0) + (Number(expense.paid) || 0)) }}
                      </div>
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
                  <td colspan="8" class="text-center py-4 text-muted small italic">
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
    <div class="card shadow-sm border-0 mt-5 bg-white">
      <div class="card-body p-0">
        <table class="table mb-0 align-middle border-top border-bottom border-4 border-access">
          <tbody>
            <tr class="bg-light bg-opacity-50">
              <td style="width: 40px;"></td>
              <td class="fw-bold fs-5 py-3">OVERALL TOTALS</td>
              <td style="width: 130px;"></td>
              <td style="width: 130px;" class="fw-bold fs-5 text-secondary text-center px-2">
                {{ formatCurrency(totalEstimatedCosts) }}
              </td>
              <td style="width: 130px;" class="fw-bold fs-5 text-primary text-center px-2">
                {{ formatCurrency(totalDue) }}
              </td>
              <td style="width: 130px;" class="fw-bold fs-5 text-success text-center px-2">
                {{ formatCurrency(totalPaid) }}
              </td>
              <td style="width: 130px;" class="fw-bold fs-5 text-dark text-center px-2">
                {{ formatCurrency(totalCalculated) }}
              </td>
              <td style="width: 80px;" class="text-end"></td>
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
                :style="{ width: Math.min(100, (totalCalculated / weddingBudget) * 100) + '%' }"
                :class="totalCalculated > weddingBudget ? 'bg-danger' : 'bg-success'"
              ></div>
            </div>
          </div>
          <h5 class="mb-0">
            Total out of wedding budget: 
            <span :class="totalCalculated > weddingBudget ? 'text-danger' : 'text-success'">
              {{ formatCurrency(weddingBudget) }} / {{ formatCurrency(totalCalculated) }}
            </span>
            <small class="text-muted ms-0 me-2">({{ Math.round((totalCalculated / weddingBudget) * 100) }}%)</small>
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
              <draggable 
                v-model="categories" 
                item-key="name"
                handle=".cat-drag-handle"
                @change="saveToStore"
              >
                <template #item="{ element: cat, index: idx }">
                  <div class="list-group-item d-flex align-items-center gap-3 border-start-0 border-end-0 rounded-0">
                    <div class="cat-drag-handle cursor-move text-muted opacity-50">
                      <i class="fa-solid fa-grip-vertical"></i>
                    </div>
                    
                    <div class="flex-grow-1">
                      <div v-if="editingCategoryIndex === idx" class="d-flex gap-2">
                        <input 
                          v-if="editingCategoryField === 'name'"
                          v-model="editingCategoryName" 
                          class="form-control form-control-sm" 
                          @blur="saveCategoryRename(idx, cat.name)"
                          @keyup.enter="saveCategoryRename(idx, cat.name)"
                          @keyup.esc="editingCategoryIndex = null"
                          ref="catEditInput"
                        >
                        <input 
                          v-else-if="editingCategoryField === 'budget'"
                          v-model.number="editingCategoryBudget" 
                          type="number" 
                          class="form-control form-control-sm w-50" 
                          @blur="saveCategoryRename(idx, cat.name)"
                          @keyup.enter="saveCategoryRename(idx, cat.name)"
                          @keyup.esc="editingCategoryIndex = null"
                          ref="catEditInput"
                        >
                      </div>
                      <div v-else class="d-flex justify-content-between align-items-center">
                        <span @click="startCategoryRename(idx, cat, 'name')" class="cursor-pointer hover-bg-light px-1 rounded">{{ cat.name }}</span>
                        <span @click="startCategoryRename(idx, cat, 'budget')" class="small text-muted cursor-pointer hover-bg-light px-1 rounded">
                          Budget: {{ formatCurrency(cat.budget) }}
                        </span>
                      </div>
                    </div>
                    
                    <button class="btn btn-sm btn-outline-danger border-0" @click="deleteCategory(idx, cat.name)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </template>
              </draggable>

              <!-- Read-only Uncategorized -->
              <div class="list-group-item d-flex align-items-center gap-3  border-top-0 border-start-0 border-end-0 rounded-0">
                <div class="text-muted opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-lock"></i>
                </div>
                <div class="flex-grow-1 d-flex justify-content-between align-items-center">
                  <span class="text-muted">Uncategorized</span>
                  <!-- <span class="small text-muted">Fixed</span> -->
                </div>
                <button class="btn btn-sm btn-outline-danger border-0 disabled opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
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
  { label: 'Entirely Paid', value: 'paid' },
  { label: 'Payment Due', value: 'due' }
]

const newCategoryName = ref('')
const editingCategoryIndex = ref(null)
const editingCategoryField = ref(null) // 'name' or 'budget'
const editingCategoryName = ref('')
const editingCategoryBudget = ref(0)
const catEditInput = ref(null)

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
    const statusMatch = (() => {
  if (filters.value.status === 'all') return true

  if (filters.value.status === 'paid') {
    return e.paymentStatus === 'paid'
  }

  if (filters.value.status === 'due') {
    return e.paymentStatus !== 'paid'
  }

  return true
})()
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
  return expenses.value.reduce((acc, e) => acc + (Number(e.estimation) || 0), 0)
})

const totalPaid = computed(() => {
  return expenses.value.reduce((acc, e) => acc + (Number(e.paid) || 0), 0)
})

const totalDue = computed(() => {
  return expenses.value.reduce((acc, e) => acc + (Number(e.due) || 0), 0)
})

const totalCalculated = computed(() => {
  return totalDue.value + totalPaid.value
})

function formatCurrency(val) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(val || 0)
}

function getSummary(exps) {
  const estimation = exps.reduce((acc, e) => acc + (Number(e.estimation) || 0), 0)
  const due = exps.reduce((acc, e) => acc + (Number(e.due) || 0), 0)
  const paid = exps.reduce((acc, e) => acc + (Number(e.paid) || 0), 0)
  const total = due + paid
  return { estimation, paid, due, total }
}

function toggleCategoryCollapse(name) {
  const idx = collapsedCategories.value.indexOf(name)
  if (idx === -1) collapsedCategories.value.push(name)
  else collapsedCategories.value.splice(idx, 1)
}

function expandAll() {
  collapsedCategories.value = []
}

function collapseAll() {
  const allNames = groupedExpenses.value.map(g => g.name)
  collapsedCategories.value = allNames
}

function getStatusClass(status) {
  switch (status) {
    case 'estimated': return 'text-secondary';
    case 'unpaid': return 'text-danger';
    case 'partially': return 'text-warning';
    case 'paid': return 'text-success';
    default: return 'text-muted';
  }
}

function handleStatusChange(expense) {
  if (expense.paymentStatus === 'paid') {
    // Make amount paid equal to due + current paid
    expense.paid = (Number(expense.paid) || 0) + (Number(expense.due) || 0)
    expense.due = 0
  } else if (expense.paymentStatus === 'unpaid') {
    expense.due = (Number(expense.due) || 0) + (Number(expense.paid) || 0)
    expense.paid = 0
  }
  saveToStore()
}

function addNewExpense() {
  const newExp = {
    id: 'exp_' + Date.now(),
    name: '',
    estimation: 0,
    due: 0,
    paid: 0,
    paymentStatus: 'estimated',
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

function startCategoryRename(idx, cat, field) {
  editingCategoryIndex.value = idx
  editingCategoryField.value = field
  editingCategoryName.value = cat.name
  editingCategoryBudget.value = cat.budget
  nextTick(() => {
    if (catEditInput.value) catEditInput.value.focus()
  })
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
.editable-cell:hover:not(.no-edit) {
  background-color: rgba(0,0,0,0.05);
}
.editable-cell.no-edit {
  cursor: default;
}
.placeholder-text {
  color: #adb5bd !important;
  font-style: italic;
  font-size: 0.9rem;
}

.hover-bg-light:hover {
  background-color: #f8f9fa;
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
  --bs-table-bg: #fdf5f5;
  --bs-table-border-color: #F8E0D8;
  --bs-table-box-shadow: 3px 3px 3px 1px #F8E0D8;
}
</style>
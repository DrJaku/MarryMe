<template>
  <div class="container py-4">
    <!-- Header with Add and Filter -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-white p-3 rounded shadow-sm">
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="showAddTaskModal">
          <i class="fa-solid fa-plus"></i>
          Add Task
        </button>
        <button class="btn btn-outline-secondary d-flex align-items-center gap-2" @click="showManageCategoriesModal">
          <i class="fa-solid fa-tags"></i>
          Manage Categories
        </button>
        <div class="vr h-100"></div>
        <div class="btn-group btn-group-sm">
          <button 
            v-for="f in filterOptions" 
            :key="f.value"
            class="btn" 
            :class="currentFilter === f.value ? 'btn-dark' : 'btn-outline-dark'"
            @click="currentFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>
        <button 
          class="btn btn-sm btn-outline-info" 
          @click="applyDeadlineSort"
          title="Sort by Deadline"
        >
          <i class="fa-solid fa-clock"></i>
          <span class="ms-1 d-none d-md-inline">Sort by Deadline</span>
        </button>
      </div>
      
      <div class="small text-muted">
        Total Tasks: {{ filteredTasks.length }}
      </div>
    </div>

    <!-- Grouped Tasks -->
     <div class="card shadow-sm border-100 p-4 bg-white">
    <div v-if="categories.length === 0" class="text-center py-5">
      <div class="mb-3 text-muted display-1 opacity-25">
        <i class="fa-solid fa-clipboard-list"></i>
      </div>
      <h5>No tasks yet</h5>
      <p class="text-muted small">Start planning your special day by adding your first task.</p>
    </div>

    <div v-for="category in groupedTasks" :key="category.name" class="mb-5">
      <div class="d-flex align-items-center gap-2 mb-3">
        <h5 class="mb-0 fw-bold">{{ category.name }}</h5>
        <span class="badge rounded-pill bg-secondary bg-opacity-10 text-secondary">{{ category.tasks.length }}</span>
      </div>

      <draggable 
        v-model="category.tasks" 
        item-key="id"
        handle=".drag-handle"
        group="tasks"
        @change="onDragChange($event, category.name)"
        class="list-group"
      >
        <template #item="{ element: task }">
          <div 
            class="list-group-item list-group-item-action  border-top border-bottom border-5 mb-2 rounded shadow-xs"
            :style="{ borderColor: task.color || '#dee2e6' }"
          >
            <div class="d-flex align-items-center gap-3">
              <div class="drag-handle cursor-move text-muted opacity-50">
                <i class="fa-solid fa-grip-vertical"></i>
              </div>
              
              <div class="form-check mb-0">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :checked="task.status === 'done'"
                  @change="toggleTaskStatus(task)"
                >
              </div>

              <div class="flex-grow-1">
                <!-- Inline Title Edit -->
                <div v-if="editingTaskId === task.id" class="mb-1">
                  <input 
                    v-model="editingTitle" 
                    v-click-outside="() => saveTaskRename(task)"
                    @keyup.enter="saveTaskRename(task)"
                    @keyup.esc="cancelRename"
                    type="text" 
                    class="form-control form-control-sm shadow-none"
                    ref="editInput"
                  >
                </div>
                <div 
                  v-else
                  class="task-title fw-medium cursor-pointer" 
                  :class="{ 'text-decoration-line-through text-muted': task.status === 'done' }"
                  @click="startRename(task)"
                  title="Click to rename"
                >
                  {{ task.title }}
                </div>

                <!-- Inline Date Edit -->
                <div class="small d-flex align-items-center gap-1 cursor-pointer" :class="getDeadlineClass(task.deadline)">
                  <i class="fa-regular fa-calendar"></i>
                  <VueDatePicker 
                    v-model="task.deadline" 
                    :enable-time-picker="false" 
                    auto-apply
                    @update:model-value="saveToStore"
                    placeholder="Set deadline"
                    text-input
                  >
                    <template #trigger>
                      <span class="hover-underline">{{ task.deadline ? formatDate(task.deadline) : 'No deadline' }}</span>
                    </template>
                  </VueDatePicker>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-light" @click="prepareSubTask(task)" title="Add Sub-task">
                  <i class="fa-solid fa-sitemap small"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger" @click="deleteTask(task.id)">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
                <div class="color-picker-wrapper" title="Change color">
                  <input 
                    type="color" 
                    v-model="task.color" 
                    @input="saveToStore"
                    class="circle-color-input"
                  >
                </div>
              </div>
            </div>

            <!-- Subtasks -->
            <div v-if="task.subtasks && task.subtasks.length > 0" class="ms-5 mt-2 border-start border-2 ps-3 py-1">
              <div v-for="sub in task.subtasks" :key="sub.id" class="d-flex align-items-center gap-2 mb-1">
                <input 
                  class="form-check-input small-check" 
                  type="checkbox" 
                  v-model="sub.done"
                  @change="saveToStore"
                >
                <div v-if="editingSubTaskId === sub.id" class="flex-grow-1">
                  <input 
                    v-model="editingSubTaskTitle" 
                    v-click-outside="() => saveSubTaskRename(task, sub)"
                    @keyup.enter="saveSubTaskRename(task, sub)"
                    @keyup.esc="cancelSubTaskRename"
                    type="text" 
                    class="form-control form-control-sm py-0 shadow-none"
                    autofocus
                  >
                </div>
                <span 
                  v-else
                  class="small flex-grow-1 cursor-pointer" 
                  :class="{ 'text-decoration-line-through text-muted': sub.done }"
                  @click="startSubTaskRename(sub)"
                  title="Click to rename"
                >
                  {{ sub.title }}
                </span>
                <button class="btn btn-link btn-sm text-muted p-0 ms-auto" @click="deleteSubTask(task, sub.id)">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
    </div>

    <!-- Modals -->
    <!-- Add Task Modal -->
    <div class="modal fade" id="addTaskModal" tabindex="-1" ref="modalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">New Wedding Task</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <form @submit.prevent="addTask">
              <div class="mb-3">
                <label class="form-label small fw-bold">Task Description</label>
                <input v-model="newTask.title" type="text" class="form-control shadow-none" placeholder="What needs to be done?" required>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label small fw-bold">Category</label>
                  <select v-model="newTask.category" class="form-select shadow-none">
                    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                    <option value="Uncategorized">Uncategorized</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label small fw-bold">Color Code</label>
                  <input v-model="newTask.color" type="color" class="form-control form-control-color w-100 shadow-none">
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label small fw-bold">Deadline (Optional)</label>
                <VueDatePicker 
                  v-model="newTask.deadline" 
                  :enable-time-picker="false" 
                  auto-apply
                  placeholder="Select date"
                />
              </div>
              <div class="d-flex justify-content-end">
                <button type="submit" class="btn btn-primary px-4">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Subtask Modal -->
    <div class="modal fade" id="subTaskModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h6 class="modal-title fw-bold">Add Sub-task to "{{ parentTask?.title }}"</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-3">
            <input 
              v-model="newSubTaskTitle" 
              @keyup.enter="addSubTask" 
              type="text" 
              class="form-control" 
              placeholder="Sub-task description..."
              autofocus
            >
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-primary" @click="addSubTask">Add Sub-task</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Categories Modal -->
    <div class="modal fade" id="manageCategoriesModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Manage Categories</h5>
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

            <label class="form-label small fw-bold mb-2">Existing Categories (Drag to reorder)</label>
            <div class="list-group">
              <draggable 
                v-model="categories" 
                item-key="index"
                handle=".drag-handle"
                tag="div"
              >
                <template #item="{ element: cat, index }">
                  <div class="list-group-item d-flex align-items-center gap-3">
                    <div class="drag-handle cursor-move text-muted">
                      <i class="fa-solid fa-grip-vertical"></i>
                    </div>
                    <div v-if="editingCategoryIndex === index" class="flex-grow-1">
                      <input 
                        v-model="editingCategoryName" 
                        v-click-outside="() => saveCategoryRename(index, cat)"
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
              <!-- Permanent Uncategorized -->
              <div class="list-group-item d-flex align-items-center gap-3 bg-white border-top-0">
                <div class="text-muted opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <span class="flex-grow-1  text-muted">Uncategorized</span>
                <button class="btn btn-sm btn-outline-danger border-0 disabled opacity-25" style="cursor: not-allowed">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-dark w-100" @click="saveCategories">Save Category Order</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Category Confirmation Modal -->
    <div class="modal fade" id="deleteCategoryModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-danger">Delete Category?</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <p>Are you sure you want to delete the category <strong>"{{ categoryToDelete?.name }}"</strong>?</p>
            <p class="text-muted small mb-0">All tasks in this category will be moved to <strong>Uncategorized</strong>. This action cannot be undone.</p>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" @click="confirmDeleteCategory">Delete Category</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Task Confirmation Modal -->
    <div class="modal fade" id="deleteTaskModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-danger">Delete Task?</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            <p>Are you sure you want to delete <strong>"{{ taskToDelete?.title }}"</strong>?</p>
            <p class="text-muted small mb-0">This will also delete all associated sub-tasks.</p>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" @click="confirmDeleteTask">Delete Task</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import * as bootstrap from 'bootstrap'
import { toast } from 'vue3-toastify'
import store from '../utils/store'

const tasks = ref([])
const categories = ref([])
const currentFilter = ref('all')
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'To-Do', value: 'todo' },
  { label: 'Done', value: 'done' }
]

const newTask = ref({
  title: '',
  category: 'General',
  color: '#3498db',
  deadline: null
})

const parentTask = ref(null)
const newSubTaskTitle = ref('')
const newCategoryName = ref('')
const editingTaskId = ref(null)
const editingTitle = ref('')
const editInput = ref(null)
const editingSubTaskId = ref(null)
const editingSubTaskTitle = ref('')
const editingCategoryIndex = ref(null)
const editingCategoryName = ref('')
const categoryToDelete = ref(null)
const taskToDelete = ref(null)

// Custom directive to handle clicks outside of an element
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('mousedown', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutside);
  },
};

onMounted(() => {
  const state = store.getState()
  tasks.value = state.tasks || []
  categories.value = state.taskCategories || ['General', 'Venue', 'Dress', 'Food', 'Guest List']
})

const filteredTasks = computed(() => {
  if (currentFilter.value === 'all') return tasks.value
  return tasks.value.filter(t => t.status === currentFilter.value)
})

const groupedTasks = computed(() => {
  const groups = {}
  // Initialize groups based on defined categories to maintain order
  categories.value.forEach(cat => {
    groups[cat] = []
  })
  
  // All tasks not in current categories go to 'Uncategorized'
  const uncategorizedTasks = []

  filteredTasks.value.forEach(t => {
    const cat = t.category
    if (cat !== 'Uncategorized' && groups[cat]) {
      groups[cat].push(t)
    } else {
      uncategorizedTasks.push(t)
    }
  })
  
  const result = categories.value.map(name => ({
    name,
    tasks: groups[name]
  }))

  // Always include Uncategorized at the end
  result.push({
    name: 'Uncategorized',
    tasks: uncategorizedTasks
  })

  return result.filter(group => group.tasks.length > 0 || categories.value.includes(group.name) || group.name === 'Uncategorized')
})

function showAddTaskModal() {
  const modal = new bootstrap.Modal(document.getElementById('addTaskModal'))
  modal.show()
}

function showManageCategoriesModal() {
  const modal = new bootstrap.Modal(document.getElementById('manageCategoriesModal'))
  modal.show()
}

function startRename(task) {
  editingTaskId.value = task.id
  editingTitle.value = task.title
  nextTick(() => {
    if (editInput.value) editInput.value.focus()
  })
}

function cancelRename() {
  editingTaskId.value = null
  editingTitle.value = ''
}

function saveTaskRename(task) {
  if (editingTaskId.value !== task.id) return
  const title = editingTitle.value.trim()
  
  if (title && title !== task.title) {
    const exists = tasks.value.some(t => t.id !== task.id && t.title.toLowerCase() === title.toLowerCase())
    if (exists) {
      toast.error('Another task with this title already exists.')
      editingTitle.value = task.title // reset
    } else {
      task.title = title
      saveToStore()
    }
  }
  editingTaskId.value = null
}

function startSubTaskRename(sub) {
  editingSubTaskId.value = sub.id
  editingSubTaskTitle.value = sub.title
}

function cancelSubTaskRename() {
  editingSubTaskId.value = null
  editingSubTaskTitle.value = ''
}

function saveSubTaskRename(task, sub) {
  if (editingSubTaskId.value !== sub.id) return
  const title = editingSubTaskTitle.value.trim()
  
  if (title && title !== sub.title) {
    const exists = task.subtasks.some(s => s.id !== sub.id && s.title.toLowerCase() === title.toLowerCase())
    if (exists) {
      toast.error('Another sub-task with this title already exists.')
      editingSubTaskTitle.value = sub.title
    } else {
      sub.title = title
      saveToStore()
    }
  }
  editingSubTaskId.value = null
}

function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name || name.toLowerCase() === 'uncategorized') {
    if (name.toLowerCase() === 'uncategorized') toast.error('"Uncategorized" is a reserved name.')
    return
  }
  
  const exists = categories.value.some(c => c.toLowerCase() === name.toLowerCase())
  if (exists) {
    toast.error('A category with this name already exists.')
    return
  }
  
  categories.value.push(name)
  newCategoryName.value = ''
}

function deleteCategory(index, catName) {
  categoryToDelete.value = { index, name: catName }
  const modal = new bootstrap.Modal(document.getElementById('deleteCategoryModal'))
  modal.show()
}

function confirmDeleteCategory() {
  if (!categoryToDelete.value) return
  
  const { index, name } = categoryToDelete.value
  
  // Explicitly update tasks to 'Uncategorized'
  tasks.value.forEach(t => {
    if (t.category === name) {
      t.category = 'Uncategorized'
    }
  })
  
  categories.value.splice(index, 1)
  saveToStore()
  toast.success(`Category "${name}" deleted`)
  
  bootstrap.Modal.getInstance(document.getElementById('deleteCategoryModal')).hide()
  categoryToDelete.value = null
}

function saveCategories() {
  saveToStore()
  bootstrap.Modal.getInstance(document.getElementById('manageCategoriesModal')).hide()
}

function startCategoryRename(index, name) {
  editingCategoryIndex.value = index
  editingCategoryName.value = name
}

function cancelCategoryRename() {
  editingCategoryIndex.value = null
  editingCategoryName.value = ''
}

function saveCategoryRename(index, oldName) {
  if (editingCategoryIndex.value !== index) return
  const newName = editingCategoryName.value.trim()
  
  if (newName && newName !== oldName) {
    if (newName.toLowerCase() === 'uncategorized') {
      toast.error('"Uncategorized" is a reserved name.')
      editingCategoryName.value = oldName
    } else {
      const exists = categories.value.some((c, i) => i !== index && c.toLowerCase() === newName.toLowerCase())
      if (exists) {
        toast.error('Another category with this name already exists.')
        editingCategoryName.value = oldName
      } else {
        // Update the category list
        categories.value[index] = newName
        // Update all tasks that were in the old category
        tasks.value.forEach(t => {
          if (t.category === oldName) {
            t.category = newName
          }
        })
        saveToStore()
        toast.success(`Category renamed to "${newName}"`)
      }
    }
  }
  editingCategoryIndex.value = null
}

function applyDeadlineSort() {
  const sortFn = (a, b) => {
    if (a.deadline && !b.deadline) return -1
    if (!a.deadline && b.deadline) return 1
    if (!a.deadline && !b.deadline) return 0
    return new Date(a.deadline) - new Date(b.deadline)
  }

  // Group tasks by category to maintain their current category buckets
  const groups = {}
  categories.value.forEach(cat => groups[cat] = [])
  const uncategorized = []

  tasks.value.forEach(t => {
    if (groups[t.category]) groups[t.category].push(t)
    else uncategorized.push(t)
  })

  // Sort each group and flatten back into the master list
  const sortedMasterList = []
  categories.value.forEach(cat => {
    groups[cat].sort(sortFn).forEach(t => sortedMasterList.push(t))
  })
  uncategorized.sort(sortFn).forEach(t => sortedMasterList.push(t))

  tasks.value = sortedMasterList
  saveToStore()
  toast.success('Tasks sorted by deadline')
}

function addTask() {
  const title = newTask.value.title.trim()
  const exists = tasks.value.some(t => t.title.toLowerCase() === title.toLowerCase())
  if (exists) {
    toast.error('A task with this title already exists.')
    return
  }

  const task = {
    ...newTask.value,
    title,
    id: 'task_' + Date.now(),
    status: 'todo',
    subtasks: [],
    createdAt: new Date().toISOString()
  }
  tasks.value.push(task)
  saveToStore()
  
  // Reset and close
  newTask.value = { title: '', category: 'General', color: '#3498db', deadline: null }
  bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide()
}

function deleteTask(id) {
  const task = tasks.value.find(t => t.id === id)
  if (!task) return
  taskToDelete.value = task
  const modal = new bootstrap.Modal(document.getElementById('deleteTaskModal'))
  modal.show()
}

function confirmDeleteTask() {
  if (!taskToDelete.value) return
  tasks.value = tasks.value.filter(t => t.id !== taskToDelete.value.id)
  saveToStore()
  toast.success('Task deleted')
  bootstrap.Modal.getInstance(document.getElementById('deleteTaskModal')).hide()
  taskToDelete.value = null
}

function toggleTaskStatus(task) {
  task.status = task.status === 'done' ? 'todo' : 'done'
  saveToStore()
}

function prepareSubTask(task) {
  parentTask.value = task
  newSubTaskTitle.value = ''
  const modal = new bootstrap.Modal(document.getElementById('subTaskModal'))
  modal.show()
}

function addSubTask() {
  const title = newSubTaskTitle.value.trim()
  if (!title || !parentTask.value) return
  
  if (!parentTask.value.subtasks) parentTask.value.subtasks = []
  
  const exists = parentTask.value.subtasks.some(s => s.title.toLowerCase() === title.toLowerCase())
  if (exists) {
    toast.error('A sub-task with this title already exists for this task.')
    return
  }

  parentTask.value.subtasks.push({
    id: 'sub_' + Date.now(),
    title,
    done: false
  })
  
  saveToStore()
  bootstrap.Modal.getInstance(document.getElementById('subTaskModal')).hide()
}

function deleteSubTask(task, subId) {
  task.subtasks = task.subtasks.filter(s => s.id !== subId)
  saveToStore()
}

function onDragChange(event, categoryName) {
  if (event.added) {
    const task = event.added.element
    task.category = categoryName
  }

  // Rebuild the master tasks array to maintain the new global order
  // This approach preserves the order across all categories as shown on screen
  const newMasterList = []
  groupedTasks.value.forEach(group => {
    group.tasks.forEach(task => {
      newMasterList.push(task)
    })
  })
  
  tasks.value = newMasterList
  saveToStore()
}

function saveToStore() {
  const currentState = store.getState()
  currentState.tasks = tasks.value
  currentState.taskCategories = categories.value
  store.saveState(currentState)
}

function getDeadlineClass(deadline) {
  if (!deadline) return 'text-muted'
  const now = new Date()
  const date = new Date(deadline)
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffTime < 0) return 'text-danger fw-bold' // Passed
  if (diffDays <= 30) return 'deadline-warning fw-medium' // Less than a month
  return 'text-muted'
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.list-group-item {
  background-color: var(--pink-beige) !important;
  color: var(--section-text) !important;
}
.cursor-move { cursor: move; }
.shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.small-check { transform: scale(0.85); }
.task-title { font-size: 1.05rem; }
.list-group-item:hover { background-color: #fbfbfb; }
.deadline-warning { color: #fd7e14 !important; } /* Bootstrap Orange */
.cursor-pointer { cursor: pointer; }
.hover-underline:hover { text-decoration: underline; }

#manageCategoriesModal .list-group-item {
  background-color: #ffffff !important;
  color: inherit !important;
}

/* Circle Color Picker */
.color-picker-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid #dee2e6;
}
.circle-color-input {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}
</style>
<template>
  <div class="container py-4">
    <!-- Header with Add and Filter -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-white p-3 rounded shadow-sm">
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="showAddTaskModal">
          <i class="fa-solid fa-plus"></i>
          Add Task
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
      </div>
      
      <div class="small text-muted">
        Total Tasks: {{ filteredTasks.length }}
      </div>
    </div>

    <!-- Grouped Tasks -->
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
        @change="onDragChange($event, category.name)"
        class="list-group"
      >
        <template #item="{ element: task }">
          <div 
            class="list-group-item list-group-item-action border-start border-4 mb-2 rounded shadow-xs"
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
                <div 
                  class="task-title fw-medium" 
                  :class="{ 'text-decoration-line-through text-muted': task.status === 'done' }"
                >
                  {{ task.title }}
                </div>
                <div v-if="task.deadline" class="small text-muted d-flex align-items-center gap-1">
                  <i class="fa-regular fa-calendar"></i>
                  {{ formatDate(task.deadline) }}
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-light" @click="prepareSubTask(task)" title="Add Sub-task">
                  <i class="fa-solid fa-sitemap small"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger" @click="deleteTask(task.id)">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>

            <!-- Subtasks -->
            <div v-if="task.subtasks && task.subtasks.length > 0" class="ms-5 mt-2 border-start ps-3 py-1">
              <div v-for="sub in task.subtasks" :key="sub.id" class="d-flex align-items-center gap-2 mb-1">
                <input 
                  class="form-check-input small-check" 
                  type="checkbox" 
                  v-model="sub.done"
                  @change="saveToStore"
                >
                <span class="small" :class="{ 'text-decoration-line-through text-muted': sub.done }">
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
                  <input v-model="newTask.category" type="text" class="form-control shadow-none" placeholder="e.g. Venue, Dress" list="categoryOptions">
                  <datalist id="categoryOptions">
                    <option v-for="c in categories" :key="c" :value="c" />
                  </datalist>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import * as bootstrap from 'bootstrap'
import store from '../utils/store'

const tasks = ref([])
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

onMounted(() => {
  const state = store.getState()
  tasks.value = state.tasks || []
})

const filteredTasks = computed(() => {
  if (currentFilter.value === 'all') return tasks.value
  return tasks.value.filter(t => t.status === currentFilter.value)
})

const groupedTasks = computed(() => {
  const groups = {}
  filteredTasks.value.forEach(t => {
    const cat = t.category || 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(t)
  })
  
  return Object.keys(groups).map(name => ({
    name,
    tasks: groups[name]
  }))
})

const categories = computed(() => {
  const set = new Set(tasks.value.map(t => t.category || 'General'))
  return Array.from(set)
})

function showAddTaskModal() {
  const modal = new bootstrap.Modal(document.getElementById('addTaskModal'))
  modal.show()
}

function addTask() {
  const task = {
    ...newTask.value,
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
  if (confirm('Delete this task?')) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    saveToStore()
  }
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
  if (!newSubTaskTitle.value || !parentTask.value) return
  
  if (!parentTask.value.subtasks) parentTask.value.subtasks = []
  parentTask.value.subtasks.push({
    id: 'sub_' + Date.now(),
    title: newSubTaskTitle.value,
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
  // Re-sync the main tasks array based on the new order within categories
  // vuedraggable handles the local category sorting, but we need to update the source
  const updatedTasks = []
  
  // Get all categories in order (to maintain category groupings)
  const catNames = Array.from(new Set(tasks.value.map(t => t.category || 'General')))
  
  // This is a simplified sync; in a production app we'd handle cross-category drags or explicit sort keys
  saveToStore()
}

function saveToStore() {
  const currentState = store.getState()
  currentState.tasks = tasks.value
  store.saveState(currentState)
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.cursor-move { cursor: move; }
.shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.small-check { transform: scale(0.85); }
.task-title { font-size: 1.05rem; }
.list-group-item:hover { background-color: #fbfbfb; }
</style>
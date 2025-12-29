<template>
  <div class="container-fluid py-4">
    <!-- Draggable Notes Grid -->
    <draggable 
      v-model="notes" 
      item-key="id"
      class="row g-3"
      @end="saveToStore"
      ghost-class="ghost-card"
      :animation="200"
      draggable=".draggable-item"
    >
      <template #header>
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
          <div 
            class="note-card add-card h-100 d-flex align-items-center justify-content-center cursor-pointer shadow-sm"
            @click="openAddModal"
          >
            <i class="fa-solid fa-plus display-4 text-secondary opacity-25"></i>
          </div>
        </div>
      </template>
      <template #item="{ element: note }">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 draggable-item">
            <div 
              class="note-card h-100 p-4 shadow-sm d-flex flex-column justify-content-center align-items-center text-center position-relative cursor-pointer"
              @click="openEditModal(note)"
            >
              <h5 class="note-title fw-bold mb-0 text-break">{{ note.title }}</h5>
              
              <!-- Delete Button -->
              <button 
                class="btn btn-sm btn-light text-danger delete-btn position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                @click.stop="confirmDelete(note)"
                title="Delete Note"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </template>
    </draggable>

    <!-- Note Modal -->
    <div class="modal fade" id="noteModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow" style="background-color: #F8E0D8;">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">{{ isEditing ? 'Edit Note' : 'New Note' }}</h5>
            <!-- <button type="button" class="btn-close" data-bs-dismiss="modal"></button> -->
          </div>
          <div class="modal-body py-4">
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted">Title</label>
              <input 
                v-model="currentNote.title" 
                type="text" 
                class="form-control shadow-none " 
                placeholder="Enter a title for your note..."
                autofocus
              >
            </div>
            <div class="mb-0">
              <label class="form-label small fw-bold text-muted">Content</label>
              <textarea 
                v-model="currentNote.content" 
                class="form-control shadow-none" 
                rows="16" 
                placeholder="Write your thoughts here..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary px-4" @click="saveNote">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteNoteModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-danger">Delete Note?</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-4">
            Are you sure you want to delete the note <strong>"{{ noteToDelete?.title }}"</strong>?
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger px-4" @click="deleteNote">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import * as bootstrap from 'bootstrap'
import { toast } from 'vue3-toastify'
import store from '../utils/store'

const notes = ref([])
const currentNote = ref({ id: null, title: '', content: '' })
const isEditing = ref(false)
const noteToDelete = ref(null)

onMounted(() => {
  const state = store.getState()
  notes.value = state.notes || []
})

function saveToStore() {
  const state = store.getState()
  state.notes = notes.value
  store.saveState(state)
}

function openAddModal() {
  isEditing.value = false
  currentNote.value = { id: null, title: '', content: '' }
  const modal = new bootstrap.Modal(document.getElementById('noteModal'))
  modal.show()
}

function openEditModal(note) {
  isEditing.value = true
  currentNote.value = JSON.parse(JSON.stringify(note)) // Deep copy
  const modal = new bootstrap.Modal(document.getElementById('noteModal'))
  modal.show()
}

function saveNote() {
  if (!currentNote.value.title.trim()) {
    toast.warning('Please provide a title for the note.')
    return
  }

  if (isEditing.value) {
    const index = notes.value.findIndex(n => n.id === currentNote.value.id)
    if (index !== -1) {
      notes.value[index] = { ...currentNote.value }
    }
  } else {
    const newNote = {
      ...currentNote.value,
      id: 'note_' + Date.now(),
      createdAt: new Date().toISOString()
    }
    notes.value.unshift(newNote)
  }

  saveToStore()
  bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide()
  toast.success('Note saved')
}

function confirmDelete(note) {
  noteToDelete.value = note
  const modal = new bootstrap.Modal(document.getElementById('deleteNoteModal'))
  modal.show()
}

function deleteNote() {
  if (noteToDelete.value) {
    notes.value = notes.value.filter(n => n.id !== noteToDelete.value.id)
    saveToStore()
    toast.success('Note deleted')
    bootstrap.Modal.getInstance(document.getElementById('deleteNoteModal')).hide()
    noteToDelete.value = null
  }
}
</script>

<style scoped>
.note-card {
  background-color: #F8E0D8;
  border-radius: 1.5rem;
  min-height: 350px;
  transition: transform 0.2s, box-shadow 0.2s;
  border: none;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}

.add-card {
  background-color: #fff;
  border: 2px dashed #F8E0D8;
}

.add-card:hover {
  border-color: #adb5bd;
  background-color: #f8f9fa;
}

.cursor-pointer {
  cursor: pointer;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-card:hover .delete-btn {
  opacity: 1;
}

.ghost-card .note-card {
  opacity: 0.5;
  background-color: #e9ecef;
}
</style>
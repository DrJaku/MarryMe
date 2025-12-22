<template>
  <div class="container py-4">
    <header class="mb-4">
      <h1 class="h3"><i class="fa-solid fa-table-list me-2"></i>Demo: Data Manager</h1>
      <p class="text-muted">Local storage + JSON / XLSX import & export</p>
    </header>

    <DataManager />
  </div>
</template>

<script setup>
import DataManager from './components/DataManager.vue'
</script>

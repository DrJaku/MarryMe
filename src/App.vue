<template>
  <div v-if="isLoginPage" class="min-vh-100">
    <router-view />
  </div>
  <div v-else class="container-fluid overflow-hidden">
    <div class="row flex-nowrap">
      <Sidebar />
      <main 
        class="col min-vh-100 overflow-auto"
        :class="route.path === '/seating' ? 'p-0' : 'py-3'"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login' || route.path === '/')
</script>

<style>
/* Global body background is handled in theme.css */
</style>

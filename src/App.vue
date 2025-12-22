<template>
  <div v-if="isLoginPage" class="min-vh-100">
    <router-view />
  </div>
  <div v-else class="container-fluid overflow-hidden">
    <div class="row flex-nowrap">
      <Sidebar />
      <main class="col py-3 min-vh-100 overflow-auto">
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
body {
  background-color: #f8f9fa;
}
</style>

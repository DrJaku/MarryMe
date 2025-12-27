import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Preferences from '../views/Preferences.vue'
import TodoList from '../views/TodoList.vue'
import GuestList from '../views/GuestList.vue'
import VendorList from '../views/VendorList.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/preferences', name: 'Preferences', component: Preferences },
  { path: '/todo', name: 'Todo', component: TodoList },
  { path: '/guests', name: 'Guests', component: GuestList },
  { path: '/contacts', name: 'Vendors', component: VendorList }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  const authenticated = sessionStorage.getItem('marryme-authenticated') === '1'
  if (authRequired && !authenticated) return next('/login')
  if (to.path === '/login' && authenticated) return next('/dashboard')
  next()
})

export default router

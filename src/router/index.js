import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Preferences from '../views/Preferences.vue'
import TodoList from '../views/TodoList.vue'
import GuestList from '../views/GuestList.vue'
import VendorList from '../views/VendorList.vue'
import Notes from '../views/Notes.vue'
import BudgetList from '../views/Budget.vue'
import SeatingChart from '../views/SeatingChart.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/preferences', name: 'Preferences', component: Preferences },
  { path: '/todo', name: 'Todo', component: TodoList },
  { path: '/guests', name: 'Guests', component: GuestList },
  { path: '/notes', name: 'Notes', component: Notes },
  { path: '/seating', name: 'Seating', component: SeatingChart },
  { path: '/contacts', name: 'Vendors', component: VendorList },
  { path: '/budget', name: 'Budget', component: BudgetList }
]

const router = createRouter({
  history: createWebHashHistory(),
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

<template>
  <div class="container-fluid">
    <div class="row g-3">
          <div class="col-12 col-lg-3">
            <div class="card viz-card h-100 p-3 d-flex flex-column position-relative pt-5">
              <h6 class="section-header-floating">Tasks</h6>
              <!-- Chart.js donut for tasks -->
              <div class="w-100 d-flex flex-column" style="flex:1; position:relative;">
                <div class="flex-grow-1 d-flex align-items-center justify-content-center">
                  <canvas ref="taskCanvas" class="task-canvas" width="220" height="220" style="width:220px; height:220px; max-width:100%; max-height:220px;"></canvas>
                </div>

                <div class="d-flex justify-content-center gap-4 mt-4 text-muted counts-row">
                  <div class="text-center"><div class="small text-muted">To-Do</div><div><strong>{{ taskBreakdown[0] }}</strong></div></div>
                  <div class="text-center"><div class="small text-muted">Done</div><div><strong>{{ taskBreakdown[1] }}</strong></div></div>
                </div>

              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="card viz-card h-100 p-4 d-flex flex-column">
              <h1 v-if="!countdown.reached"class="text-muted text-center w-100 mb-4 font-fancy">Your Special Moment Is Coming In:</h1>
              <div class="d-flex align-items-center justify-content-center flex-grow-1">
                <div class="text-center w-100">
                  <div v-if="hasWeddingDate">
                    <div v-if="countdown.reached" class="h1 text-muted font-fancy" style="font-size: 4.75em;">Wedding day is here!</div>
                    <div v-else class="countdown-container">
                      <!-- Row 1: Months, Weeks, Days -->
                      <div class="countdown-row primary-row mb-4">
                        <div class="countdown-item font-techno">
                          <span class="value">{{ countdown.months }}</span>
                          <span class="label">months</span>
                        </div>
                        <div class="separator invisible">:</div>
                        <div class="countdown-item font-techno">
                          <span class="value">{{ countdown.weeks }}</span>
                          <span class="label">weeks</span>
                        </div>
                        <div class="separator invisible">:</div>
                        <div class="countdown-item font-techno">
                          <span class="value">{{ countdown.days }}</span>
                          <span class="label">days</span>
                        </div>
                      </div>
                      <!-- Row 2: Hours, Minutes, Seconds -->
                      <div class="countdown-row secondary-row align-items-start">
                        <div class="countdown-item font-techno">
                          <span class="value">{{ String(countdown.hours).padStart(2, '0') }}</span>
                          <span class="label">hours</span>
                        </div>
                        <div class="separator">:</div>
                        <div class="countdown-item font-techno">
                          <span class="value">{{ String(countdown.minutes).padStart(2, '0') }}</span>
                          <span class="label">minutes</span>
                        </div>
                        <div class="separator">:</div>
                        <div class="countdown-item font-techno">
                          <span class="value">{{ String(countdown.seconds).padStart(2, '0') }}</span>
                          <span class="label">seconds</span>
                        </div>
                      </div>
                      <!-- Wedding Date Label -->
                      <div class="mt-4 wedding-date-footer">
                        {{ formattedWeddingDate }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="small text-muted mt-3">no wedding date set yet • <a href="#" @click.prevent="goToPreferences">add wedding date</a></div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-3">
            <div class="card viz-card h-100 p-3 d-flex flex-column position-relative pt-5">
              <h6 class="section-header-floating">Invitation Photo</h6>
              <div class="d-flex align-items-center justify-content-center flex-grow-1">
                <div class="text-center">
                  <div v-if="hasInvitationImage">
                    <img :src="state?.settings?.invitationImage" alt="invitation" class="invitation-placeholder mx-auto mb-2" style="object-fit: cover; max-width: 100%; max-height: 100%; width: 100%; height: 100%;" />
                  </div>
                  <div v-else class="my-2 small text-muted">no image added yet • <a href="#" @click.prevent="goToPreferences">add invitation image</a></div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6" ref="venueCol">
            <div class="card p-0 thin-card overflow-hidden" ref="venueCard" style="position:relative">
              <div class="venue-inner w-100 h-100 d-flex flex-column">
                  <h6 class="section-header-floating text-truncate" style="max-width: 90%;">
                    {{ state?.settings?.venue || 'Venue Location' }}
                  </h6>
                  <div class="venue-body flex-grow-1 w-100 h-100" style="z-index: 0;">
                    <div v-if="state?.settings?.venueCoords" id="venueMap" style="width: 100%; height: 100%; min-height: 200px;"></div>
                    <div v-else class="venue-placeholder d-flex align-items-center justify-content-center small text-muted text-center w-100 h-100 p-5">
                      <span class="mt-4">no venue location added yet • <a href="#" @click.prevent="goToPreferences">add venue location</a></span>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="card p-3 thin-card d-flex align-items-center position-relative pt-5">
              <div style="width:100%; display:flex; flex-direction:column; height:100%">
                <h6 class="section-header-floating">Guests</h6>
                <div class="mb-2">
                  <canvas ref="guestCanvas" class="guest-canvas" width="400" height="40" style="width:100%; height:40px"></canvas>
                </div>

                <div class="mt-auto guest-counts-wrap">
                  <div class="text-center">
                    <div class="small text-muted">Unlikely</div>
                    <div class="guest-count-number">
                      <strong :style="{color: '#e74c3c'}">{{ guestStats.unlikely.main }}</strong>
                      <span class="small-extras" :style="{color: '#e74c3c'}">+{{ guestStats.unlikely.extras }}</span>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="small text-muted">Likely</div>
                    <div class="guest-count-number">
                      <strong :style="{color: '#f1c40f'}">{{ guestStats.likely.main }}</strong>
                      <span class="small-extras" :style="{color: '#f1c40f'}">+{{ guestStats.likely.extras }}</span>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="small text-muted">Definitely</div>
                    <div class="guest-count-number">
                      <strong :style="{color: '#196f3d'}">{{ guestStats.definitely.main }}</strong>
                      <span class="small-extras" :style="{color: '#196f3d'}">+{{ guestStats.definitely.extras }}</span>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="small text-muted">Confirmed</div>
                    <div class="guest-count-number">
                      <strong :style="{color: '#27ae60'}">{{ guestStats.confirmed.main }}</strong>
                      <span class="small-extras" :style="{color: '#27ae60'}">+{{ guestStats.confirmed.extras }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-center mt-2 total-guests">
                  Total Guests Invited: 
                  <span class="total-guests-number">
                    {{ guestStats.total.main }}
                    <span class="small fw-normal opacity-75"> +{{ guestStats.total.extras }}</span>
                    <strong class="ms-1">= {{ totalGuests }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- bottom spacer (removed Data & tools) -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import store from '../utils/store'

// Fix for default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const state = ref(store.getState() || {})

function refresh(s) {
  if (s) {
    state.value = JSON.parse(JSON.stringify(s))
  }
}

let unsub
onMounted(() => {
  store.init()
  refresh(store.getState())
  unsub = store.onChange((s) => { refresh(s); nextTick(() => { updateTaskChart(); updateGuestChart(); initDashboardMap() }) })
})
onUnmounted(() => { if (unsub) unsub() })

const router = useRouter()

function goToPreferences() {
  router.push('/preferences')
}

const tasksDue = computed(() => {
  const now = new Date()
  const limit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const tasks = state.value.tasks || []
  return tasks.filter((t) => {
    if (!t || t.status === 'done') return false
    if (!t.due) return true
    const d = new Date(t.due)
    return d >= now && d <= limit
  }).length
})

const rsvpPercent = computed(() => {
  const guests = state.value.guests || []
  const invited = guests.length
  if (invited === 0) return 0
  const yes = guests.filter(g => g && g.rsvp === 'yes').length
  return Math.round((yes / invited) * 100)
})

const budgetSummary = computed(() => {
  const items = state.value.budget || []
  const total = items.reduce((s, it) => s + (Number(it.cost) || 0), 0)
  const spent = items.reduce((s, it) => s + ((it.paid) ? (Number(it.cost) || 0) : 0), 0)
  return { total, spent }
})

const pendingPayments = computed(() => {
  const items = state.value.budget || []
  return items.filter(it => !it.paid).length
})

// guest stats including extras
const guestStats = computed(() => {
  const guests = state.value.guests || []
  
  const getCountsForRSVP = (rsvpTypes) => {
    const subset = guests.filter(g => g && rsvpTypes.includes(g.rsvp))
    return {
      main: subset.length,
      extras: subset.reduce((acc, g) => acc + (Number(g.extras) || 0), 0)
    }
  }

  const unlikely = getCountsForRSVP(['unlikely'])
  const likely = getCountsForRSVP(['likely'])
  const definitely = getCountsForRSVP(['definitely'])
  const confirmed = getCountsForRSVP(['confirmed', 'yes'])

  const totalMain = guests.length
  const totalExtras = guests.reduce((acc, g) => acc + (Number(g.extras) || 0), 0)

  return {
    unlikely,
    likely,
    definitely,
    confirmed,
    total: {
      main: totalMain,
      extras: totalExtras
    }
  }
})

// for chart.js (using total people: main + extras)
const guestCounts = computed(() => {
  const s = guestStats.value
  return [
    s.unlikely.main + s.unlikely.extras,
    s.likely.main + s.likely.extras,
    s.definitely.main + s.definitely.extras,
    s.confirmed.main + s.confirmed.extras
  ]
})

const guestPercent = computed(() => {
  const counts = guestCounts.value
  const total = counts.reduce((s,n)=>s+n,0) || 1
  return {
    unlikely: Math.round((counts[0]/total)*100),
    likely: Math.round((counts[1]/total)*100),
    definitely: Math.round((counts[2]/total)*100),
    confirmed: Math.round((counts[3]/total)*100)
  }
})

const totalGuests = computed(() => {
  const s = guestStats.value.total
  return s.main + s.extras
})

// countdown
const countdown = ref({
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  reached: false
})

function updateCountdown() {
  const settings = state.value.settings || {}
  const target = settings.weddingDate ? new Date(settings.weddingDate) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 120)
  const diff = target - Date.now()
  
  if (diff <= 0) {
    countdown.value.reached = true
    return
  }
  
  const totalDays = Math.floor(diff / (1000*60*60*24))
  countdown.value.months = Math.floor(totalDays / 30)
  countdown.value.weeks = Math.floor((totalDays % 30) / 7)
  countdown.value.days = Math.floor((totalDays % 30) % 7)
  countdown.value.hours = Math.floor((diff / (1000*60*60)) % 24)
  countdown.value.minutes = Math.floor((diff / (1000*60)) % 60)
  countdown.value.seconds = Math.floor((diff / 1000) % 60)
  countdown.value.reached = false
}

let countdownInterval = null
onMounted(() => {
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
  // create charts after DOM ready
  nextTick(() => {
    createTaskChart()
    createGuestChart()
    initDashboardMap()
  })
})
onUnmounted(() => { if (countdownInterval) clearInterval(countdownInterval) })

// has venue and invitation helpers
const hasVenue = computed(() => !!(state.value.settings && state.value.settings.venue))
const hasInvitationImage = computed(() => !!(state.value.settings && state.value.settings.invitationImage))
const hasWeddingDate = computed(() => !!(state.value.settings && state.value.settings.weddingDate))

const formattedWeddingDate = computed(() => {
  const dateStr = state.value.settings?.weddingDate
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
})

// tasks breakdown
const tasksCount = computed(() => (state.value.tasks || []).length)
const taskBreakdown = computed(() => {
  const tasks = state.value.tasks || []
  if (tasks.length === 0) return [0, 0]
  const todo = tasks.filter(t => t && t.status !== 'done').length
  const done = tasks.filter(t => t && t.status === 'done').length
  return [todo, done]
})

// Chart.js instances
const taskCanvas = ref(null)
const guestCanvas = ref(null)
let taskChart = null
let guestChart = null

// plugin to draw the center number inside the donut
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    if (!chart || !chart.ctx) return
    const ctx = chart.ctx
    const txt = String(tasksCount.value || 0)
    ctx.save()
    const fontSize = Math.round((chart.height || 220) / 8)
    ctx.font = `bold ${fontSize}px sans-serif`
ctx.fillStyle = 'rgb(23, 27, 38)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cx = (chart.chartArea.left + chart.chartArea.right) / 2
    const cy = (chart.chartArea.top + chart.chartArea.bottom) / 2
    ctx.fillText(txt, cx, cy)
    ctx.restore()
  }
}

function createTaskChart() {
  if (!taskCanvas.value) return
  const ctx = taskCanvas.value.getContext('2d')
  const data = taskBreakdown.value
  // if all zeros, show an empty gray donut visually but keep breakdown values as 0
  const total = data.reduce((s, n) => s + n, 0)
  const displayData = total === 0 ? [1, 0] : data
  const colors = total === 0 ? ['#e9ecef', '#f8f9fA'] : ['lightcoral', '#C2E8CE']
  taskChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['To do', 'Done'],
      datasets: [{ data: displayData, backgroundColor: colors, borderWidth: 2, borderColor: '#dee2e6' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { enabled: true } }
    }
    ,
    plugins: [centerTextPlugin]
  })
}

function updateTaskChart() {
  if (!taskChart) return
  const data = taskBreakdown.value
  const total = data.reduce((s, n) => s + n, 0)
  if (total === 0) {
    taskChart.data.datasets[0].data = [1, 0]
    taskChart.data.datasets[0].backgroundColor = ['#e9ecef', '#f8f9fA']
  } else {
    taskChart.data.datasets[0].data = data
    taskChart.data.datasets[0].backgroundColor = ['#ff6384', '#36a2eb']
  }
  taskChart.update()
}

function createGuestChart() {
  if (!guestCanvas.value) return
  const ctx = guestCanvas.value.getContext('2d')
  const counts = guestCounts.value
  // create stacked horizontal bar with four types: unlikely, likely, definitely, confirmed
  guestChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [''],
      datasets: [
        { label: 'Unlikely', data: [counts[0]], backgroundColor: '#e74c3c' },
        { label: 'Likely', data: [counts[1]], backgroundColor: '#f1c40f' },
        { label: 'Definitely', data: [counts[2]], backgroundColor: '#196f3d' },
        { label: 'Confirmed', data: [counts[3]], backgroundColor: '#27ae60' }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true, ticks: { display: false }, grid: { display: false } }, y: { stacked: true, grid: { display: false }, ticks: { display: false } } },
      plugins: { legend: { display: false }, tooltip: { enabled: true } }
    }
  })
}

function updateGuestChart() {
  if (!guestChart) return
  const counts = guestCounts.value
  guestChart.data.datasets[0].data = [counts[0]]
  guestChart.data.datasets[1].data = [counts[1]]
  guestChart.data.datasets[2].data = [counts[2]]
  guestChart.data.datasets[3].data = [counts[3]]
  guestChart.update()
}

// Venue map logic
let dashboardMap = null
function initDashboardMap() {
  const coords = state.value.settings?.venueCoords
  if (!coords) return
  
  if (dashboardMap) {
    dashboardMap.remove()
  }

  dashboardMap = L.map('venueMap').setView([coords.lat, coords.lng], 15)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
  }).addTo(dashboardMap)
  
  L.marker([coords.lat, coords.lng]).addTo(dashboardMap)
}


</script>

<style scoped>
.countdown-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.countdown-row {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
}
.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 8rem;
}
.separator {
  font-size: 4.0rem;
  font-weight: 800;
  line-height: 1;
  color: var(--section-text);
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
}
.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.countdown-item .value {
  font-weight: 800;
  line-height: 1;
}
.countdown-item .label {
  color: var(--secondary-blue);
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Row 1 sizing */
.primary-row .value {
  font-size: 6.5rem;
}
.primary-row .separator {
  font-size: 6.5rem;
}

/* Row 2 sizing */
.secondary-row .value {
  font-size: 4.0rem;
}

.wedding-date-footer {
  font-size: 1.1rem;
  color: var(--secondary-blue);
  font-weight: 400;
  border-top: 1px solid rgba(23, 27, 38, 0.1);
  padding-top: 1.5rem;
  width: 100%;
}

.viz-card{min-height:340px}
@media (min-width: 992px) {
  .viz-card{min-height:680px}
}
.invitation-placeholder{width:120px;height:120px;border:2px dashed #ccc;margin:0 auto}
.map-placeholder{height:140px;border:2px dashed #ccc}
.thin-card{min-height:200px}
.menu-flex{max-height:60vh;overflow:auto}
/* ensure thin cards align */
.thin-card{display:flex;align-items:center}
.thin-card .map-placeholder{height:120px}
.viz-card svg{height:100%;max-height:520px}

/* Counts row below the pie: larger numbers and more spacing */
.counts-row{margin-top:1.5rem}
.counts-row strong{font-size:1.4rem;line-height:1}
.task-canvas{display:block}

/* Guests card: center bottom counts */
.guest-counts-wrap{margin:0 auto 8px; display:flex; justify-content:space-between; align-items:center; width:100%; max-width:520px; padding:0 12px}
.guest-counts-wrap > .text-center{flex:1}
.guest-counts{font-size:1.1rem}
.guest-count-number strong{font-size:1.2rem}
.small-extras { font-size: 0.8rem; opacity: 0.8; font-weight: normal; margin-left: 1px; }
.guest-canvas{display:block}

/* Total guests styling */
.total-guests{font-size:0.95rem;color:#495057;line-height:1.5}
.total-guests-number{font-size:1.1rem;margin-left:8px;color:#2b2b2b;display:inline-block;line-height:1}

.section-header-floating {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.85);
  padding: 0.25rem 1.25rem;
  border-radius: 50rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  font-weight: 600;
  z-index: 10;
  white-space: nowrap;
  margin: 0;
}

/* Venue centering */
.venue-inner{position:relative;height:100%;min-height:200px}
.venue-body{height:100%;width:100%}
.venue-placeholder{height:100%;min-height:200px}
</style>

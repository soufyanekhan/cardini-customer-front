import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// The API answered 401: the token is no longer valid, send the customer back to login.
window.addEventListener('auth:expired', () => {
  router.push({ name: 'login', query: { expired: '1' } })
})

app.mount('#app')

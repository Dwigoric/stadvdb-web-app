// Package imports
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Vue imports
import App from './App.vue'
import router from './router'

// Vuetify
import './assets/main.css'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Build app
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(
    createVuetify({
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: { mdi }
        }
    })
)

app.mount('#app')

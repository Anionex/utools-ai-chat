import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlusX from 'vue-element-plus-x'
// Element Plus X 组件使用内嵌样式，无需单独导入CSS
import App from './App.vue'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlusX)
app.mount('#app')



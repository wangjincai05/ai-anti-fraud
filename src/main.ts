import { createApp } from 'vue'
import { setupResponsive } from '@/utils/responsive'
import './styles/global.scss'
import App from './App.vue'

// rem 响应式适配：必须在 createApp 之前设置根 font-size，
// 避免首屏渲染时尺寸跳变
setupResponsive()

createApp(App).mount('#app')

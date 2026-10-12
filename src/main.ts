import { createApp } from 'vue'
import { setupResponsive } from '@/utils/responsive'
import { validateEnv } from '@/env'
import './styles/global.scss'
import App from './App.vue'

// 启动校验：必填环境变量缺失/非法时给出明确提示（不阻断挂载，避免整屏空白）
const { ok, errors } = validateEnv()
if (!ok) {
  console.error('[env] 环境变量校验失败：\n' + errors.map((e) => '  - ' + e).join('\n'))
}

// rem 响应式适配：必须在 createApp 之前设置根 font-size，
// 避免首屏渲染时尺寸跳变
setupResponsive()

createApp(App).mount('#app')

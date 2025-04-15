import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import router from '@/router/index'
import locale from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import '@/assets/index.less'
import VConsole from 'vconsole';

// if (process.env.MODE === 'debug') {
  // window.vConsole = new VConsole();
// }
createApp(App)
  .use(router)
  .use(ElementPlus, { locale })
  .mount('#app')

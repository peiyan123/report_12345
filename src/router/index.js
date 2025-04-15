import { createRouter, createWebHistory } from "vue-router";
 
const routes = [
  {
    path: "/", //路径描述
    name: "index",
    redirect: '/main',
    children:[
      {
        path: 'main',
        name: 'main',
        meta: { title: '北京12345' },
        component: () => import('../views/main/index.vue')
      }
    ]
  },
]
 
const router = createRouter({
  history: createWebHistory(), // 跳转方式
  routes : routes // 路由配置
})

router.beforeEach(async(to) => {
  const title = (to.meta.title ? to.meta.title : '科技日报')
  document.title = title
})

export default router

import { createRouter, createWebHashHistory } from "vue-router"

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/SplashScreen.vue"),
    },
    {
      path: "/landing",
      name: "landing",
      component: () => import("@/pages/Landing.vue"),
    },
  ],
})

export default router

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
    {
      path: "/app",
      component: () => import("@/components/AppLayout.vue"),
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/pages/Home.vue"),
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("@/pages/Settings.vue"),
        },
        {
          path: "settings/loaf",
          name: "settings-loaf",
          component: () => import("@/pages/settings/LNProfile.vue"),
        },
        {
          path: "settings/ncm",
          name: "settings-ncm",
          component: () => import("@/pages/settings/3RDAccount.vue"),
        },
        {
          path: "settings/appearance",
          name: "settings-appearance",
          component: () => import("@/pages/settings/Appearance.vue"),
        },
        {
          path: "settings/privacy",
          name: "settings-privacy",
          component: () => import("@/pages/settings/Privacy.vue"),
        },
        {
          path: "settings/about",
          name: "settings-about",
          component: () => import("@/pages/settings/About.vue"),
        },
      ],
    },
  ],
})

export default router

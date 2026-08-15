import { createRouter, createWebHistory } from 'vue-router';
import { useSession } from './session';
import HomeView from './views/HomeView.vue';
import AuthView from './views/AuthView.vue';
import AreaView from './views/AreaView.vue';
import ListingView from './views/ListingView.vue';
import AdminView from './views/AdminView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/listings/:id', component: ListingView },
    { path: '/auth/login', component: AuthView, props: { mode: 'login' } },
    {
      path: '/auth/registro',
      component: AuthView,
      props: { mode: 'register' },
    },
    {
      path: '/owner',
      component: AreaView,
      props: { area: 'OWNER' },
      meta: { requiresAuth: true, role: 'OWNER' },
    },
    {
      path: '/admin',
      component: AdminView,
      meta: { requiresAuth: true, role: 'ADMIN' },
    },
  ],
});

router.beforeEach(async (to) => {
  const session = useSession();
  if (session.status.value === 'unknown') {
    await session.restore();
  }
  if (to.meta.requiresAuth && !session.isAuthenticated.value)
    return { path: '/auth/login', query: { redirect: to.fullPath } };
  if (to.meta.role && session.role.value !== to.meta.role)
    return session.role.value === 'ADMIN'
      ? '/admin'
      : session.role.value === 'OWNER'
        ? '/owner'
        : '/auth/login';
  if (to.path.startsWith('/auth/') && session.isAuthenticated.value)
    return session.role.value === 'ADMIN' ? '/admin' : '/owner';
});

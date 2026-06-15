import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import './index.css';
import { useAuthStore } from './store/auth';
import type { AuthState } from './store/auth';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import CoursesPage from './pages/Courses';
import QuestionsPage from './pages/Questions';
import TagsPage from './pages/Tags';
import StudyProgressPage from './pages/StudyProgress';
import ProgressDetailPage from './pages/ProgressDetail';
import RemindersPage from './pages/Reminders';
import TodosPage from './pages/Todos';
import NotFound from './pages/NotFound';

interface RouterContext {
  auth: AuthState;
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Layout,
  beforeLoad: async ({ context }) => {
    const auth = (context as RouterContext).auth;
    if (!auth.token) {
      throw redirect({ to: '/login' });
    }
    if (!auth.user) {
      try {
        await auth.fetchCurrentUser();
      } catch {
        throw redirect({ to: '/login' });
      }
    }
  },
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: DashboardPage,
});

const coursesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'courses',
  component: CoursesPage,
});

const questionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'questions',
  component: QuestionsPage,
});

const tagsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'tags',
  component: TagsPage,
});

const studyProgressRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'study-progress',
  component: StudyProgressPage,
});

const progressDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'study-progress/$id',
  component: ProgressDetailPage,
});

const remindersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'reminders',
  component: RemindersPage,
});

const todosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'todos',
  component: TodosPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginPage,
  beforeLoad: async ({ context }) => {
    const auth = (context as RouterContext).auth;
    if (auth.token && auth.user) {
      throw redirect({ to: '/' });
    }
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    coursesRoute,
    questionsRoute,
    tagsRoute,
    studyProgressRoute,
    progressDetailRoute,
    remindersRoute,
    todosRoute,
  ]),
  loginRoute,
  notFoundRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    auth: useAuthStore.getState(),
  } as RouterContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuthStore();
  return <RouterProvider router={router} context={{ auth } as RouterContext} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

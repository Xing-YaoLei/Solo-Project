<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Link, usePage, router } from '@inertiajs/vue3'
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Car,
  MessageSquare,
  BookOpen,
  Search,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
  UserCircle,
  ChevronRight,
  Building2,
  Target,
  TrendingUp,
  PieChart,
  BarChart3,
} from 'lucide-vue-next'
import Toast from '../Components/Toast.vue'

const page = usePage()

const user = computed(() => page.props.auth?.user || {})
const currentRoute = computed(() => page.props.routeName || '')
const flash = computed(() => page.props.flash || {})

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const notificationsOpen = ref(false)

const navigation = [
  {
    key: 'dashboard',
    label: '仪表盘',
    route: 'dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    key: 'test-drives',
    label: '试驾预约',
    route: 'test-drives.index',
    icon: CalendarCheck,
    badge: page.props.testDrivesPending || 0,
  },
  {
    key: 'customers',
    label: '客户线索',
    route: 'customers.index',
    icon: Users,
    badge: page.props.newLeads || 0,
  },
  {
    key: 'vehicles',
    label: '车辆档案',
    route: 'vehicles.index',
    icon: Car,
    badge: null,
  },
  {
    key: 'followups',
    label: '销售跟进',
    route: 'followups.index',
    icon: MessageSquare,
    badge: page.props.todayFollowups || 0,
  },
  {
    key: 'reviews',
    label: '复盘材料',
    route: 'reviews.index',
    icon: BookOpen,
    badge: page.props.pendingReviews || 0,
  },
]

const notifications = ref([
  { id: 1, title: '新的试驾预约', message: '张先生预约了今天下午3点试驾', type: 'info', time: '5分钟前', read: false },
  { id: 2, title: '客户线索分配', message: '您有3条新的客户线索待跟进', type: 'warning', time: '30分钟前', read: false },
  { id: 3, title: '跟进提醒', message: '李女士的跟进计划即将到期', type: 'danger', time: '2小时前', read: true },
])

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

const isActive = (item) => {
  if (item.route === currentRoute.value) return true
  return currentRoute.value?.startsWith(item.key)
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  if (sidebarOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeSidebar = () => {
  sidebarOpen.value = false
  document.body.style.overflow = ''
}

const handleLogout = () => {
  router.post(route('logout'), {}, {
    onSuccess: () => {
      router.visit(route('login'))
    },
  })
}

const toggleUserMenu = (e) => {
  e.stopPropagation()
  userMenuOpen.value = !userMenuOpen.value
  notificationsOpen.value = false
}

const toggleNotifications = (e) => {
  e.stopPropagation()
  notificationsOpen.value = !notificationsOpen.value
  userMenuOpen.value = false
}

const closeDropdowns = () => {
  userMenuOpen.value = false
  notificationsOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
  document.body.style.overflow = ''
})

defineSlots()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm hidden lg:flex flex-col transform transition-transform"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="flex items-center gap-3 px-5 h-16 border-b border-gray-100 shrink-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Car class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-base font-bold text-gray-900 leading-tight">汽车销售</h1>
          <p class="text-[11px] text-gray-500">管理系统</p>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">主导航</p>
        <Link
          v-for="item in navigation"
          :key="item.key"
          :href="route(item.route)"
          :class="[
            'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive(item)
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          ]"
        >
          <span
            v-if="isActive(item)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-600"
          />
          <component
            :is="item.icon"
            :class="[
              'w-5 h-5 shrink-0 transition-colors',
              isActive(item) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
            ]"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.badge && item.badge > 0"
            :class="[
              'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full',
              isActive(item) ? 'bg-blue-600 text-white' : 'bg-red-500 text-white',
            ]"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
          <ChevronRight
            v-if="isActive(item)"
            class="w-4 h-4 text-blue-600 opacity-60"
          />
        </Link>
      </nav>

      <div class="p-3 border-t border-gray-100 shrink-0">
        <div class="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <TrendingUp class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">本月业绩</p>
              <p class="text-xs text-gray-500">目标达成率</p>
            </div>
          </div>
          <div class="flex items-end gap-2">
            <span class="text-2xl font-bold text-gray-900">{{ page.props.stats?.monthRate || 68 }}%</span>
            <div class="flex-1 h-2 rounded-full bg-white/80 overflow-hidden mb-1">
              <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" :style="{ width: `${page.props.stats?.monthRate || 68}%` }" />
            </div>
          </div>
        </div>
      </div>
    </aside>

    <Transition name="mobile-sidebar">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 lg:hidden"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeSidebar" />
        <aside class="absolute inset-y-0 left-0 w-72 bg-white border-r border-gray-200 shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Car class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-base font-bold text-gray-900 leading-tight">汽车销售</h1>
                <p class="text-[11px] text-gray-500">管理系统</p>
              </div>
            </div>
            <button
              type="button"
              @click="closeSidebar"
              class="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">主导航</p>
            <Link
              v-for="item in navigation"
              :key="item.key"
              :href="route(item.route)"
              @click="closeSidebar"
              :class="[
                'group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                isActive(item)
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <span
                v-if="isActive(item)"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-600"
              />
              <component
                :is="item.icon"
                :class="[
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive(item) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
                ]"
              />
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="item.badge && item.badge > 0"
                :class="[
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full',
                  isActive(item) ? 'bg-blue-600 text-white' : 'bg-red-500 text-white',
                ]"
              >
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
            </Link>
          </nav>
        </aside>
      </div>
    </Transition>

    <div class="lg:pl-64 flex flex-col min-h-screen">
      <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div class="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 h-16">
          <button
            type="button"
            @click="toggleSidebar"
            class="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu class="w-5 h-5" />
          </button>

          <div class="lg:hidden flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Car class="w-4 h-4 text-white" />
            </div>
            <span class="text-sm font-bold text-gray-900">销售管理</span>
          </div>

          <div class="hidden md:flex flex-1 max-w-xl mx-auto">
            <label class="relative w-full">
              <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="搜索客户、车辆、订单..."
                class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
              />
              <kbd class="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 border border-gray-200 rounded-md bg-white">
                ⌘K
              </kbd>
            </label>
          </div>

          <div class="flex items-center gap-1 lg:gap-2 ml-auto">
            <div class="relative">
              <button
                type="button"
                @click="toggleNotifications"
                class="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Bell class="w-5 h-5" />
                <span
                  v-if="unreadCount > 0"
                  class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white"
                >
                  {{ unreadCount > 9 ? '9+' : unreadCount }}
                </span>
              </button>

              <Transition name="dropdown">
                <div
                  v-if="notificationsOpen"
                  class="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden"
                >
                  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 class="font-semibold text-gray-900">通知中心</h3>
                    <span class="text-xs text-blue-600 font-medium cursor-pointer hover:underline">全部已读</span>
                  </div>
                  <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    <div
                      v-for="n in notifications"
                      :key="n.id"
                      :class="['p-4 hover:bg-gray-50 transition-colors cursor-pointer', n.read ? 'opacity-70' : '']"
                    >
                      <div class="flex items-start gap-3">
                        <span class="mt-0.5 w-2 h-2 rounded-full shrink-0" :class="{
                          'bg-blue-500': n.type === 'info',
                          'bg-yellow-500': n.type === 'warning',
                          'bg-red-500': n.type === 'danger',
                          'bg-gray-400': !n.type,
                        }" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900">{{ n.title }}</p>
                          <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ n.message }}</p>
                          <p class="text-[11px] text-gray-400 mt-1">{{ n.time }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <button type="button" class="w-full text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      查看全部通知
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="relative">
              <button
                type="button"
                @click="toggleUserMenu"
                class="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div v-if="user?.avatar" class="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden ring-2 ring-gray-200">
                  <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-gray-200">
                  <span class="text-sm font-bold text-white">{{ user?.name?.charAt?.(0) || 'U' }}</span>
                </div>
                <div class="hidden lg:block text-left">
                  <p class="text-sm font-semibold text-gray-900 leading-tight">{{ user?.name || '用户' }}</p>
                  <p class="text-[11px] text-gray-500">{{ user?.role_name || user?.position || '销售顾问' }}</p>
                </div>
                <ChevronDown class="hidden lg:block w-4 h-4 text-gray-400" />
              </button>

              <Transition name="dropdown">
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden"
                >
                  <div class="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                    <div class="flex items-center gap-3">
                      <div v-if="user?.avatar" class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200">
                        <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                      </div>
                      <div v-else class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-gray-200">
                        <span class="text-xl font-bold text-white">{{ user?.name?.charAt?.(0) || 'U' }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-base font-bold text-gray-900 truncate">{{ user?.name || '用户' }}</p>
                        <p class="text-sm text-gray-500 truncate">{{ user?.email || '' }}</p>
                        <span class="inline-flex items-center mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {{ user?.role_name || user?.position || '销售顾问' }}
                        </span>
                      </div>
                    </div>
                    <div v-if="user?.store" class="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-white border border-gray-100">
                      <Building2 class="w-4 h-4 text-gray-400 shrink-0" />
                      <span class="text-xs text-gray-600 truncate">{{ user.store.name || user.store }}</span>
                    </div>
                  </div>

                  <div class="py-2">
                    <Link
                      :href="route('dashboard')"
                      @click="userMenuOpen = false"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle class="w-4 h-4 text-gray-400" />
                      个人资料
                    </Link>
                    <button
                      type="button"
                      @click="handleLogout"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut class="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1">
        <Toast />
        <div class="px-4 lg:px-6 py-4 lg:py-6 pb-24 lg:pb-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.mobile-sidebar-enter-active,
.mobile-sidebar-leave-active {
  transition: all 0.3s ease;
}
.mobile-sidebar-enter-from,
.mobile-sidebar-leave-to {
  opacity: 0;
}
.mobile-sidebar-enter-from aside,
.mobile-sidebar-leave-to aside {
  transform: translateX(-100%);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>

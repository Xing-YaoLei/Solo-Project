<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="logo-title">培训续费系统</h2>
    </div>
    <n-menu
      :value="activeMenu"
      :options="menuOptions"
      @update:value="handleSelect"
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="220"
      class="sidebar-menu"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import {
  HomeOutline,
  PeopleOutline,
  BookOutline,
  DocumentTextOutline,
  AlarmOutline,
  BarChartOutline,
  SettingsOutline,
} from '@vicons/ionicons5'

const emit = defineEmits(['menu-select'])
const route = useRoute()
const collapsed = ref(false)

const activeMenu = computed(() => route.path)

const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = [
  {
    label: '工作台',
    key: '/dashboard',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '续费跟进台',
    key: '/followups',
    icon: renderIcon(PeopleOutline),
  },
  {
    label: '提醒规则',
    key: '/reminder-rules',
    icon: renderIcon(AlarmOutline),
  },
  {
    label: '课程管理',
    key: '/courses',
    icon: renderIcon(BookOutline),
  },
  {
    label: '作业管理',
    key: '/assignments',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: '月底复盘',
    key: '/reports',
    icon: renderIcon(BarChartOutline),
  },
  {
    label: '系统设置',
    key: '/settings',
    icon: renderIcon(SettingsOutline),
  },
]

const handleSelect = (key: string) => {
  emit('menu-select', key)
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo-title {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
}
</style>

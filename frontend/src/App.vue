<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon :size="24"><Van /></el-icon>
        <span class="app-title">试驾预约任务分派台</span>
      </div>
      <el-menu mode="horizontal" :default-active="activeMenu" router class="header-menu">
        <el-menu-item index="/dispatch">
          <el-icon><Grid /></el-icon>
          <span>分派台</span>
        </el-menu-item>
        <el-menu-item index="/monthly-review">
          <el-icon><DataAnalysis /></el-icon>
          <span>月度复盘</span>
        </el-menu-item>
        <el-menu-item index="/no-show-alert">
          <el-icon><Bell /></el-icon>
          <span>爽约提醒</span>
          <el-badge v-if="noShowCount > 0" :value="noShowCount" class="no-show-badge" />
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getNoShowAlerts } from './api/noshow'

const route = useRoute()
const noShowCount = ref(0)

const activeMenu = computed(() => route.path)

onMounted(async () => {
  try {
    const res = await getNoShowAlerts()
    noShowCount.value = res.length
  } catch {
    noShowCount.value = 0
  }
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
.app-container { height: 100%; }
.app-header { display: flex; align-items: center; background: #1d1e1f; color: #fff; padding: 0 24px; }
.header-left { display: flex; align-items: center; gap: 10px; margin-right: 40px; }
.app-title { font-size: 18px; font-weight: 600; letter-spacing: 1px; }
.header-menu { flex: 1; background: transparent; border-bottom: none; }
.header-menu .el-menu-item { color: #ccc; border-bottom: none; }
.header-menu .el-menu-item.is-active { color: #409eff; border-bottom-color: #409eff; }
.header-menu .el-menu-item:hover { color: #fff; background: rgba(255,255,255,0.08); }
.app-main { background: #f0f2f5; padding: 20px; min-height: 0; overflow: auto; }
.no-show-badge { margin-left: 6px; }
</style>

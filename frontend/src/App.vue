<template>
  <div class="app-container">
    <el-container class="main-layout">
      <el-header class="app-header">
        <div class="header-left">
          <el-icon class="logo-icon"><DataAnalysis /></el-icon>
          <h1 class="app-title">青少年培训续费跟进风险监测图</h1>
        </div>
        <div class="header-right">
          <el-tag v-if="currentUser.role === 'MANAGER'" type="warning" effect="dark">
            管理层视图
          </el-tag>
          <el-tag v-else type="primary" effect="dark">
            一线员工视图
          </el-tag>
          <el-dropdown @command="handleUserChange" class="user-dropdown">
            <span class="user-name">
              <el-icon><User /></el-icon>
              {{ currentUser.realName }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="manager">切换到管理层</el-dropdown-item>
                <el-dropdown-item command="consultant">切换到一线员工</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container class="content-wrap">
        <el-aside width="220px" class="app-aside">
          <el-menu
            :default-active="activeMenu"
            router
            class="side-menu"
            background-color="#001529"
            text-color="#b9bdc5"
            active-text-color="#ffd04b"
          >
            <el-menu-item index="/dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>总览仪表盘</span>
            </el-menu-item>
            <el-menu-item index="/analysis">
              <el-icon><TrendCharts /></el-icon>
              <span>分析区</span>
            </el-menu-item>
            <el-menu-item index="/students">
              <el-icon><User /></el-icon>
              <span>学员管理</span>
            </el-menu-item>
            <el-menu-item index="/batches">
              <el-icon><Files /></el-icon>
              <span>批次管理</span>
            </el-menu-item>
            <el-menu-item index="/rules">
              <el-icon><Setting /></el-icon>
              <span>提醒规则</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="app-main">
          <div v-if="delayedBatches.length > 0" class="delay-warning">
            <el-alert
              v-for="batch in delayedBatches"
              :key="batch.batchId"
              :title="`数据延迟同步：${batch.batchName} - 预期同步时间 ${formatTime(batch.expectedSyncTime)}`"
              type="warning"
              show-icon
              :closable="false"
            />
          </div>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getDelayedBatches } from '@/api/batch'

const route = useRoute()
const userStore = useUserStore()

const currentUser = computed(() => userStore.user)
const activeMenu = computed(() => route.path)
const delayedBatches = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const handleUserChange = (cmd) => {
  userStore.setRole(cmd)
}

const loadDelayedBatches = async () => {
  try {
    const res = await getDelayedBatches()
    if (res.code === 200) {
      delayedBatches.value = res.data
    }
  } catch (e) {
    console.warn('加载延迟批次失败，使用模拟数据')
  }
}

onMounted(() => {
  loadDelayedBatches()
})
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.main-layout {
  height: 100%;
}

.app-header {
  background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .logo-icon {
      font-size: 28px;
    }

    .app-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: white;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-name {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

.content-wrap {
  height: calc(100vh - 60px);
}

.app-aside {
  background: #001529;
  overflow-y: auto;

  .side-menu {
    border-right: none;
  }
}

.app-main {
  background: #f0f2f5;
  padding: 16px;
  overflow-y: auto;
}

.delay-warning {
  margin-bottom: 16px;

  :deep(.el-alert) {
    margin-bottom: 8px;
  }
}
</style>

<template>
  <div class="public-share-page">
    <div class="share-header">
      <div class="brand flex-center">
        <el-icon :size="28" color="#409eff"><DataBoard /></el-icon>
        <span class="brand-name">Solo 漏斗看板 · 数据分享</span>
      </div>
      <el-tag v-if="shareData.hideSensitive" type="info" effect="light" size="small">
        <el-icon><Lock /></el-icon>已隐藏敏感字段
      </el-tag>
    </div>

    <div v-if="loading" class="loading-area flex-center">
      <el-icon :size="40" class="is-loading"><Loading /></el-icon>
      <span class="loading-text">数据加载中...</span>
    </div>

    <div v-else-if="error" class="error-area flex-center">
      <el-result icon="warning" title="链接无效或已过期" :sub-title="errorMsg">
        <template #extra>
          <el-button type="primary" @click="goLogin">去登录</el-button>
        </template>
      </el-result>
    </div>

    <div v-else class="share-content">
      <div class="summary-row mb-20">
        <h2 class="share-title">{{ shareData.title }}</h2>
        <p class="share-time">分享时间: {{ formatTime(shareData.exportTime) }}</p>
      </div>

      <el-row :gutter="16" class="mb-20">
        <el-col :span="8">
          <el-card class="stat-card card-shadow">
            <div class="stat-label">总评估数</div>
            <div class="stat-value">{{ shareData.summary?.total || 0 }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card card-shadow">
            <div class="stat-label">上架成功</div>
            <div class="stat-value">{{ shareData.summary?.success || 0 }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card card-shadow">
            <div class="stat-label">整体转化率</div>
            <div class="stat-value">{{ shareData.summary?.conversionRate || '0%' }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="card-shadow mb-20">
        <template #header>
          <div class="card-title">
            <el-icon color="#409eff"><Histogram /></el-icon>
            <span>漏斗阶段数据</span>
          </div>
        </template>
        <el-table :data="stagesView" stripe border>
          <el-table-column prop="name" label="阶段" width="120" />
          <el-table-column prop="count" label="数量(辆)" width="120" align="right" />
          <el-table-column prop="conversionRate" label="阶段转化率(%)" width="140" align="right" />
          <el-table-column label="阶段进度" min-width="200">
            <template #default="{ row }">
              <el-progress :percentage="Number(row.conversionRate)" :color="row.color" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="footer-info">
        <el-divider />
        <div class="footer-text">
          <el-icon><InfoFilled /></el-icon>
          本分享链接由 Solo 漏斗看板系统生成，数据仅供参考，不包含价格、客户等敏感信息。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, DataBoard, Lock, Histogram, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(false)
const errorMsg = ref('')

const shareData = reactive({
  title: '',
  exportTime: '',
  hideSensitive: true,
  summary: { total: 0, success: 0, conversionRate: '0%' },
  stages: []
})

const stageColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
const stageNames = ['评估', '报价', '资料收集', '金融审批', '上架成功']

const stagesView = computed(() => {
  const counts = [320, 280, 235, 198, 165]
  return counts.map((count, i) => ({
    name: stageNames[i],
    count,
    color: stageColors[i],
    conversionRate: i === 0 ? '100.00' : (counts[i] / counts[i - 1] * 100).toFixed(2)
  }))
})

onMounted(() => {
  setTimeout(() => {
    loading.value = false
    const token = route.params.token
    if (!token || token.length < 4) {
      error.value = true
      errorMsg.value = '分享链接参数无效'
      return
    }
    shareData.title = `漏斗数据报告 - ${dayjs().format('YYYY-MM-DD')}`
    shareData.exportTime = new Date().toISOString()
    shareData.hideSensitive = true
    shareData.summary = {
      total: 320,
      success: 165,
      conversionRate: (165 / 320 * 100).toFixed(2) + '%'
    }
  }, 800)
})

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}
function goLogin() {
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.public-share-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}
.share-header {
  max-width: 1100px;
  margin: 0 auto 20px;
  background: #fff;
  padding: 14px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);

  .brand { gap: 8px; }
  .brand-name { font-size: 16px; font-weight: 600; color: #303133; }
}
.share-content {
  max-width: 1100px;
  margin: 0 auto;
}
.loading-area,
.error-area {
  min-height: 60vh;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
  max-width: 1100px;
  margin: 40px auto;
}
.loading-text { font-size: 14px; color: #909399; }
.summary-row {
  background: #fff;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  .share-title { margin: 0 0 4px; font-size: 22px; font-weight: 600; color: #303133; }
  .share-time { margin: 0; font-size: 13px; color: #909399; }
}
.stat-card :deep(.el-card__body) { padding: 16px 20px; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; }
.card-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.footer-info {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}
.footer-text {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #909399; justify-content: center;
}
</style>

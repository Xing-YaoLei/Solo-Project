<template>
  <div class="threshold-config">
    <div class="config-header">
      <h2 class="page-title">阈值配置</h2>
      <div class="operator-row">
        <span class="operator-label">操作人：</span>
        <el-input v-model="updatedBy" style="width: 180px" size="large" />
      </div>
    </div>

    <el-tabs v-model="activeGroup" type="card" class="group-tabs">
      <el-tab-pane
        v-for="tab in groupTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      />
    </el-tabs>

    <div class="config-cards">
      <el-card
        v-for="item in filteredConfigs"
        :key="item.configKey"
        shadow="hover"
        class="config-card"
      >
        <div class="card-top">
          <div class="card-name">{{ item.configName }}</div>
          <el-tag size="small" type="info">{{ item.configKey }}</el-tag>
        </div>
        <div class="card-desc">{{ item.description }}</div>
        <div class="card-editor">
          <span class="value-label">当前值：</span>
          <el-input-number
            v-model="item.configValue"
            :step="getStep(item)"
            :min="0"
            :precision="getPrecision(item)"
            size="large"
            controls-position="right"
            class="value-input"
          />
          <span class="unit-text">{{ item.configUnit }}</span>
        </div>
        <div class="card-footer">
          <el-button type="primary" @click="saveConfig(item)" :loading="item._saving">
            保存
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/index.js'

const groupTabs = [
  { key: 'reminder', label: '提醒规则' },
  { key: 'progress', label: '进度预警' },
  { key: 'score', label: '成绩预警' },
  { key: 'attendance', label: '出勤预警' },
  { key: 'funnel', label: '漏斗预警' },
]

const activeGroup = ref('reminder')
const configs = ref([])
const updatedBy = ref('运营人员')

const filteredConfigs = computed(() =>
  configs.value.filter((c) => c.configGroup === activeGroup.value)
)

const getStep = (item) => {
  const unit = item.configUnit
  if (unit === '%' || unit === '分') return 1
  if (unit === '天') return 1
  if (unit === '次') return 1
  return 0.1
}

const getPrecision = (item) => {
  const unit = item.configUnit
  if (unit === '%' || unit === '分' || unit === '天' || unit === '次') return 0
  return 1
}

const fetchConfigs = async () => {
  try {
    const res = await request.get('/threshold')
    configs.value = (res || []).map((c) => ({ ...c, _saving: false }))
  } catch (e) {
    ElMessage.error('获取配置失败')
  }
}

const saveConfig = async (item) => {
  item._saving = true
  try {
    await request.put('/threshold', {
      configKey: item.configKey,
      configValue: item.configValue,
      updatedBy: updatedBy.value,
    })
    ElMessage.success(`「${item.configName}」保存成功`)
  } catch (e) {
    ElMessage.error(`「${item.configName}」保存失败`)
  } finally {
    item._saving = false
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.threshold-config {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.operator-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operator-label {
  font-size: 15px;
  color: #606266;
  white-space: nowrap;
}

.group-tabs {
  margin-bottom: 24px;
}

.config-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 20px;
}

.config-card {
  padding: 4px 0;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
  line-height: 1.5;
}

.card-editor {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.value-label {
  font-size: 15px;
  color: #606266;
  white-space: nowrap;
}

.value-input {
  width: 200px;
}

.unit-text {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

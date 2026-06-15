<template>
  <div class="reminder-rule-panel">
    <el-row :gutter="16">
      <el-col :span="10">
        <h3 class="section-title">提醒规则</h3>
        <div v-loading="rulesLoading">
          <el-card
            v-for="rule in rules"
            :key="rule.id"
            shadow="hover"
            class="rule-card"
            :class="{ active: selectedRule?.id === rule.id }"
            @click="selectRule(rule)"
          >
            <div class="rule-header">
              <span class="rule-name">{{ rule.ruleName }}</span>
              <el-switch v-model="rule.isActive" @change="onToggleRule(rule)" @click.stop />
            </div>
            <div class="rule-meta">
              <el-tag size="small" type="info">{{ rule.ruleType }}</el-tag>
              <span class="rule-threshold">阈值: {{ rule.thresholdValue }} ({{ rule.comparison }})</span>
              <span class="rule-priority">优先级: {{ rule.priority }}</span>
            </div>
          </el-card>
          <el-empty v-if="!rulesLoading && rules.length === 0" description="暂无规则" />
        </div>
      </el-col>
      <el-col :span="14">
        <h3 class="section-title">触发日志</h3>
        <div v-if="selectedRule">
          <el-descriptions :column="2" border size="small" class="rule-detail">
            <el-descriptions-item label="规则名称">{{ selectedRule.ruleName }}</el-descriptions-item>
            <el-descriptions-item label="规则类型">{{ selectedRule.ruleType }}</el-descriptions-item>
            <el-descriptions-item label="阈值">{{ selectedRule.thresholdValue }}</el-descriptions-item>
            <el-descriptions-item label="比较方式">{{ selectedRule.comparison }}</el-descriptions-item>
          </el-descriptions>
          <el-table :data="triggerLogs" v-loading="logsLoading" size="small" class="log-table">
            <el-table-column prop="triggeredAt" label="触发时间" width="160" />
            <el-table-column prop="triggerValue" label="触发值" width="100" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'resolved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="180">
              <template #default="{ row }">
                <div v-if="row.remarks && row.remarks.length">
                  <div v-for="(r, i) in row.remarks" :key="i" class="remark-item">
                    <span class="remark-text">{{ r.remark }}</span>
                    <span class="remark-meta">— {{ r.operator }} {{ r.createdAt }}</span>
                  </div>
                </div>
                <span v-else class="no-remark">暂无</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRemarkDialog(row)">添加备注</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="请选择一条规则" />

        <el-divider />
        <h3 class="section-title">异常日志</h3>
        <div class="anomaly-filter">
          <el-date-picker
            v-model="anomalyDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="small"
            @change="fetchAnomalies"
          />
        </div>
        <el-table :data="anomalies" v-loading="anomaliesLoading" size="small">
          <el-table-column prop="detectedAt" label="检测时间" width="160" />
          <el-table-column prop="anomalyType" label="异常类型" width="120" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column label="备注" min-width="180">
            <template #default="{ row }">
              <div v-if="row.remarks && row.remarks.length">
                <div v-for="(r, i) in row.remarks" :key="i" class="remark-item">
                  <span class="remark-text">{{ r.remark }}</span>
                  <span class="remark-meta">— {{ r.operator }} {{ r.createdAt }}</span>
                </div>
              </div>
              <span v-else class="no-remark">暂无</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openRemarkDialog(row)">添加备注</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <el-dialog v-model="remarkDialogVisible" title="添加备注" width="440px" destroy-on-close>
      <el-form :model="remarkForm" label-width="80px">
        <el-form-item label="备注">
          <el-input v-model="remarkForm.remark" type="textarea" :rows="3" placeholder="请输入备注内容" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="remarkForm.operator" placeholder="请输入操作人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="remarkSubmitting" @click="submitRemark">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/index.js'

const rules = ref([])
const rulesLoading = ref(false)
const selectedRule = ref(null)
const triggerLogs = ref([])
const logsLoading = ref(false)
const anomalies = ref([])
const anomaliesLoading = ref(false)
const anomalyDateRange = ref(null)

const remarkDialogVisible = ref(false)
const remarkSubmitting = ref(false)
const remarkForm = ref({ triggerLogId: null, remark: '', operator: '' })
let remarkTargetSource = null

async function fetchRules() {
  rulesLoading.value = true
  try {
    const res = await request.get('/reminder/rules')
    rules.value = res.rules ?? res ?? []
  } catch (e) {
    console.error('fetchRules error', e)
  } finally {
    rulesLoading.value = false
  }
}

async function selectRule(rule) {
  selectedRule.value = rule
  logsLoading.value = true
  try {
    const res = await request.get(`/reminder/rules/${rule.id}`)
    triggerLogs.value = res.triggerLogs ?? res ?? []
  } catch (e) {
    console.error('fetchRuleDetail error', e)
    triggerLogs.value = []
  } finally {
    logsLoading.value = false
  }
}

async function onToggleRule(rule) {
  try {
    await request.put(`/reminder/rules/${rule.id}`, { isActive: rule.isActive })
    ElMessage.success('状态已更新')
  } catch (e) {
    rule.isActive = !rule.isActive
    ElMessage.error('更新失败')
  }
}

async function fetchAnomalies() {
  anomaliesLoading.value = true
  try {
    const params = {}
    if (anomalyDateRange.value && anomalyDateRange.value.length === 2) {
      params.startDate = anomalyDateRange.value[0]
      params.endDate = anomalyDateRange.value[1]
    }
    const res = await request.get('/reminder/anomalies', { params })
    anomalies.value = res.anomalies ?? res ?? []
  } catch (e) {
    console.error('fetchAnomalies error', e)
  } finally {
    anomaliesLoading.value = false
  }
}

function openRemarkDialog(row) {
  remarkForm.value = { triggerLogId: row.id, remark: '', operator: '' }
  remarkTargetSource = row
  remarkDialogVisible.value = true
}

async function submitRemark() {
  if (!remarkForm.value.remark.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  remarkSubmitting.value = true
  try {
    await request.post('/reminder/remark', {
      triggerLogId: remarkForm.value.triggerLogId,
      remark: remarkForm.value.remark,
      operator: remarkForm.value.operator,
    })
    ElMessage.success('备注已添加')
    if (remarkTargetSource) {
      if (!remarkTargetSource.remarks) remarkTargetSource.remarks = []
      remarkTargetSource.remarks.push({
        remark: remarkForm.value.remark,
        operator: remarkForm.value.operator,
        createdAt: new Date().toLocaleString(),
      })
    }
    remarkDialogVisible.value = false
  } catch (e) {
    ElMessage.error('添加失败')
  } finally {
    remarkSubmitting.value = false
  }
}

onMounted(() => {
  fetchRules()
  fetchAnomalies()
})
</script>

<style scoped>
.reminder-rule-panel {
  padding: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.rule-card {
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.rule-card.active {
  border-color: #409EFF;
}
.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rule-name {
  font-weight: 600;
  font-size: 14px;
}
.rule-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}
.rule-detail {
  margin-bottom: 16px;
}
.log-table {
  margin-top: 8px;
}
.anomaly-filter {
  margin-bottom: 12px;
}
.remark-item {
  margin-bottom: 4px;
}
.remark-text {
  font-size: 13px;
  color: #303133;
}
.remark-meta {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
}
.no-remark {
  color: #C0C4CC;
  font-size: 13px;
}
</style>

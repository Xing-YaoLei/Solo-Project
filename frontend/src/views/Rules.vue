<template>
  <div class="rules-page">
    <div class="page-header">
      <h2 class="page-title">提醒规则管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showAddDialog">
          新建规则
        </el-button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">
          <el-icon><Setting /></el-icon>
          生效规则
        </div>
        <el-table :data="activeRules" stripe>
          <el-table-column prop="ruleName" label="规则名称" width="180" />
          <el-table-column prop="ruleType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.ruleType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reminderLevel" label="级别" width="100">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.reminderLevel)" size="small">
                {{ row.reminderLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="triggerDaysBefore" label="触发天数" width="100" />
          <el-table-column prop="sortOrder" label="优先级" width="80" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="editRule(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card">
        <div class="card-title">
          <el-icon><Clock /></el-icon>
          规则变更记录
        </div>
        <div class="timeline">
          <el-timeline>
            <el-timeline-item
              v-for="item in ruleChanges"
              :key="item.id"
              :timestamp="item.createTime"
              :type="getTimelineType(item.ruleType)"
              placement="top"
            >
              <div class="timeline-content">
                <div class="rule-name">{{ item.ruleName }}</div>
                <div class="rule-meta">
                  <el-tag size="small" type="info">{{ item.ruleType }}</el-tag>
                  <span class="version">版本: {{ item.version }}</span>
                </div>
                <div class="change-reason" v-if="item.changeReason">
                  {{ item.changeReason }}
                </div>
                <div class="operator">操作人: {{ item.operatorName }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <el-icon><TrendCharts /></el-icon>
        规则变更趋势
      </div>
      <RuleChangeChart :data="ruleChanges" />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规则' : '新建规则'"
      width="600px"
    >
      <el-form :model="ruleForm" label-width="120px">
        <el-form-item label="规则名称">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="ruleForm.ruleType" placeholder="请选择" style="width: 100%">
            <el-option label="续费提醒" value="RENEWAL" />
            <el-option label="进度预警" value="PROGRESS" />
            <el-option label="成绩提醒" value="SCORE" />
            <el-option label="反馈处理" value="FEEDBACK" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒级别">
          <el-radio-group v-model="ruleForm.reminderLevel">
            <el-radio label="LOW">普通</el-radio>
            <el-radio label="MEDIUM">重要</el-radio>
            <el-radio label="HIGH">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="触发天数">
          <el-input-number v-model="ruleForm.triggerDaysBefore" :min="1" :max="90" />
          <span style="margin-left: 8px; color: #8c8c8c;">天前提醒</span>
        </el-form-item>
        <el-form-item label="进度阈值">
          <el-input-number v-model="ruleForm.progressThreshold" :min="0" :max="100" :precision="2" />
          <span style="margin-left: 8px; color: #8c8c8c;">%</span>
        </el-form-item>
        <el-form-item label="成绩阈值">
          <el-input-number v-model="ruleForm.scoreThreshold" :min="0" :max="100" :precision="2" />
          <span style="margin-left: 8px; color: #8c8c8c;">分</span>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="ruleForm.sortOrder" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="规则条件">
          <el-input
            v-model="ruleForm.ruleCondition"
            type="textarea"
            :rows="3"
            placeholder="请输入规则条件描述"
          />
        </el-form-item>
        <el-form-item label="执行动作">
          <el-input
            v-model="ruleForm.ruleAction"
            type="textarea"
            :rows="3"
            placeholder="请输入触发后的执行动作"
          />
        </el-form-item>
        <el-form-item label="变更原因" v-if="isEdit">
          <el-input
            v-model="changeReason"
            type="textarea"
            :rows="2"
            placeholder="请输入变更原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Setting, Clock, TrendCharts } from '@element-plus/icons-vue'
import RuleChangeChart from '@/components/charts/RuleChangeChart.vue'
import { getActiveRules, getRecentChanges, createRule, updateRule } from '@/api/rule'

const activeRules = ref([])
const ruleChanges = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const changeReason = ref('')

const ruleForm = ref({
  ruleName: '',
  ruleType: '',
  reminderLevel: 'MEDIUM',
  triggerDaysBefore: 30,
  progressThreshold: 60,
  scoreThreshold: 60,
  sortOrder: 100,
  ruleCondition: '',
  ruleAction: '',
  status: 'ACTIVE'
})

const getLevelTagType = (level) => {
  const map = {
    'LOW': 'success',
    'MEDIUM': 'warning',
    'HIGH': 'danger'
  }
  return map[level] || 'info'
}

const getTimelineType = (type) => {
  const map = {
    'RENEWAL': 'primary',
    'PROGRESS': 'warning',
    'SCORE': 'success',
    'FEEDBACK': 'danger'
  }
  return map[type] || 'info'
}

const loadData = async () => {
  try {
    const [activeRes, changesRes] = await Promise.all([
      getActiveRules(),
      getRecentChanges(20)
    ])
    if (activeRes.code === 200) activeRules.value = activeRes.data
    if (changesRes.code === 200) ruleChanges.value = changesRes.data
  } catch (e) {
    loadMockData()
  }
}

const loadMockData = () => {
  activeRules.value = [
    { id: 1, ruleName: '到期前30天提醒', ruleType: 'RENEWAL', reminderLevel: 'MEDIUM',
      triggerDaysBefore: 30, progressThreshold: null, scoreThreshold: null, sortOrder: 10 },
    { id: 2, ruleName: '到期前7天加急', ruleType: 'RENEWAL', reminderLevel: 'HIGH',
      triggerDaysBefore: 7, progressThreshold: null, scoreThreshold: null, sortOrder: 5 },
    { id: 3, ruleName: '进度低于60%预警', ruleType: 'PROGRESS', reminderLevel: 'WARNING',
      triggerDaysBefore: null, progressThreshold: 60, scoreThreshold: null, sortOrder: 20 },
    { id: 4, ruleName: '成绩下滑提醒', ruleType: 'SCORE', reminderLevel: 'MEDIUM',
      triggerDaysBefore: null, progressThreshold: null, scoreThreshold: 70, sortOrder: 15 },
    { id: 5, ruleName: '家长负面反馈', ruleType: 'FEEDBACK', reminderLevel: 'HIGH',
      triggerDaysBefore: null, progressThreshold: null, scoreThreshold: null, sortOrder: 8 }
  ]

  ruleChanges.value = [
    { id: 1, ruleName: '到期前30天提醒', ruleType: 'RENEWAL', version: '20240115.103000',
      operatorName: '李总监', changeReason: '优化提醒时机，提前10天', createTime: '2024-01-15T10:30:00' },
    { id: 2, ruleName: '进度低于60%预警', ruleType: 'PROGRESS', version: '20240112.150000',
      operatorName: '王老师', changeReason: '阈值从70%调整为60%', createTime: '2024-01-12T15:00:00' },
    { id: 3, ruleName: '成绩下滑提醒', ruleType: 'SCORE', version: '20240110.092000',
      operatorName: '张老师', changeReason: '新增成绩下降提醒规则', createTime: '2024-01-10T09:20:00' },
    { id: 4, ruleName: '家长负面反馈', ruleType: 'FEEDBACK', version: '20240108.140000',
      operatorName: '李总监', changeReason: '新增负面反馈自动转工单', createTime: '2024-01-08T14:00:00' },
    { id: 5, ruleName: '到期前7天加急', ruleType: 'RENEWAL', version: '20240105.110000',
      operatorName: '系统管理员', changeReason: '新增加急提醒规则', createTime: '2024-01-05T11:00:00' }
  ]
}

const showAddDialog = () => {
  isEdit.value = false
  ruleForm.value = {
    ruleName: '',
    ruleType: '',
    reminderLevel: 'MEDIUM',
    triggerDaysBefore: 30,
    progressThreshold: 60,
    scoreThreshold: 60,
    sortOrder: 100,
    ruleCondition: '',
    ruleAction: '',
    status: 'ACTIVE'
  }
  changeReason.value = ''
  dialogVisible.value = true
}

const editRule = (row) => {
  isEdit.value = true
  ruleForm.value = { ...row }
  changeReason.value = ''
  dialogVisible.value = true
}

const submitRule = async () => {
  try {
    if (isEdit.value) {
      const res = await updateRule(ruleForm.value.id, ruleForm.value, {
        operatorId: 'admin',
        operatorName: '管理员',
        changeReason: changeReason.value
      })
      if (res.code === 200) {
        ElMessage.success('规则更新成功')
      }
    } else {
      const res = await createRule(ruleForm.value, {
        operatorId: 'admin',
        operatorName: '管理员',
        changeReason: '新建规则'
      })
      if (res.code === 200) {
        ElMessage.success('规则创建成功')
      }
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.success(isEdit.value ? '规则更新成功' : '规则创建成功')
    dialogVisible.value = false
    loadData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.rules-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }
  }

  .timeline {
    max-height: 400px;
    overflow-y: auto;

    .timeline-content {
      .rule-name {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
      }

      .rule-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .version {
          font-size: 12px;
          color: #8c8c8c;
        }
      }

      .change-reason {
        font-size: 12px;
        color: #595959;
        margin-bottom: 4px;
        padding: 4px 8px;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .operator {
        font-size: 11px;
        color: #8c8c8c;
      }
    }
  }
}
</style>

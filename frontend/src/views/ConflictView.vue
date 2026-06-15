<template>
  <div class="page-container">
    <h3 class="page-title">冲突检测</h3>

    <div class="filter-bar">
      <el-form inline>
        <el-form-item label="日期">
          <el-date-picker v-model="filterDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" @change="loadConflicts" />
        </el-form-item>
        <el-form-item label="老师">
          <el-select v-model="filterTeacher" placeholder="全部" clearable style="width: 140px" @change="loadConflicts">
            <el-option v-for="t in teacherList" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadConflicts">检测冲突</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      v-if="conflicts.length"
      :title="`检测到 ${conflictCount} 组冲突`"
      type="error"
      show-icon
      :closable="false"
      class="conflict-summary"
    />

    <div v-for="group in conflicts" :key="group.key" class="conflict-group">
      <div class="group-header">
        <el-icon color="#E53E3E"><WarningFilled /></el-icon>
        <span>{{ group.date }} - {{ group.teacherName }} - {{ group.timeSlot }}</span>
        <el-tag type="danger" size="small">{{ group.items.length }} 个冲突</el-tag>
      </div>
      <el-table :data="group.items" size="small" class="conflict-table">
        <el-table-column prop="studentName" label="学生" width="100" />
        <el-table-column prop="subject" label="科目" width="80" />
        <el-table-column prop="trialDate" label="日期" width="110" />
        <el-table-column prop="timeSlot" label="时段" width="120" />
        <el-table-column prop="campus" label="校区" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/appointments/${row.id}`)">查看详情</el-button>
            <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="warning" link size="small" @click="openReschedule(row)">改约</el-button>
            <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="danger" link size="small" @click="handleCancelOne(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-empty v-if="!conflicts.length && !loading" description="暂无冲突" />

    <RescheduleDialog v-model="showReschedule" :original-data="rescheduleData" @success="loadConflicts" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appointmentApi } from '@/api/appointment'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag.vue'
import RescheduleDialog from '@/components/RescheduleDialog.vue'

const loading = ref(false)
const conflicts = ref([])
const filterDate = ref(dayjs().format('YYYY-MM-DD'))
const filterTeacher = ref('')
const showReschedule = ref(false)
const rescheduleData = ref({})

const teacherList = ref([
  { id: 1, name: '王老师' },
  { id: 2, name: '李老师' },
  { id: 3, name: '张老师' },
  { id: 4, name: '赵老师' },
  { id: 5, name: '陈老师' }
])

const conflictCount = computed(() => conflicts.value.reduce((sum, g) => sum + g.items.length, 0))

onMounted(() => {
  loadConflicts()
})

async function loadConflicts() {
  loading.value = true
  try {
    const params = {}
    if (filterDate.value) params.date = filterDate.value
    if (filterTeacher.value) params.teacherId = filterTeacher.value
    const res = await appointmentApi.getConflicts(params)
    conflicts.value = res.data || []
  } finally {
    loading.value = false
  }
}

function openReschedule(row) {
  rescheduleData.value = { ...row }
  showReschedule.value = true
}

async function handleCancelOne(row) {
  try {
    await ElMessageBox.confirm('确认取消该预约以解决冲突？', '取消预约', { type: 'warning' })
    await appointmentApi.update(row.id, { status: 'CANCELLED' })
    ElMessage.success('取消成功，冲突已解决')
    loadConflicts()
  } catch { /* ignore */ }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
}
.conflict-summary {
  margin-bottom: 16px;
}
.conflict-group {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
  border-left: 4px solid var(--color-danger);
}
.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}
.conflict-table {
  margin-top: 8px;
}
</style>

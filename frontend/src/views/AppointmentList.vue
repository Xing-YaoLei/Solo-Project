<template>
  <div class="page-container">
    <h3 class="page-title">预约任务分派台</h3>

    <div class="filter-bar">
      <el-form :model="store.filters" inline>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="store.filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="校区">
          <el-select v-model="store.filters.campus" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="c in dictStore.campusOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="store.filters.subject" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in dictStore.subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="store.filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in dictStore.statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            <el-option label="冲突" value="CONFLICT">
              <span style="color: #E53E3E; font-weight: 600">⚠ 冲突</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="老师">
          <el-select v-model="store.filters.teacher" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in teacherList" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <BatchOperationBar
      v-if="selectedIds.length"
      :selected-count="selectedIds.length"
      @batch-confirm="handleBatchConfirm"
      @batch-cancel="handleBatchCancel"
      @clear-selection="clearSelection"
    />

    <div class="table-card">
      <div class="action-bar">
        <div class="action-left">
          <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="primary" @click="showCreateForm = true">
            <el-icon><Plus /></el-icon>新建预约
          </el-button>
          <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="success" :disabled="!selectedIds.length" @click="handleBatchConfirm">
            批量确认
          </el-button>
          <el-button v-permission="['ADMIN', 'RECEPTIONIST']" type="danger" :disabled="!selectedIds.length" @click="handleBatchCancel">
            批量取消
          </el-button>
        </div>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>导出Excel
        </el-button>
      </div>

      <el-table
        ref="tableRef"
        :data="store.list"
        v-loading="store.loading"
        @selection-change="handleSelectionChange"
        :row-class-name="rowClassName"
        stripe
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="subject" label="科目" width="80" />
        <el-table-column prop="trialDate" label="试听日期" width="110" />
        <el-table-column prop="timeSlot" label="时段" width="120" />
        <el-table-column prop="teacherName" label="老师" width="80" />
        <el-table-column prop="campus" label="校区" width="100" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/appointments/${row.id}`)">详情</el-button>
            <el-button
              v-permission="['ADMIN', 'RECEPTIONIST']"
              v-if="row.status === 'PENDING' || row.status === 'CONFIRMED'"
              type="warning" link size="small"
              @click="openReschedule(row)"
            >改约</el-button>
            <el-button
              v-permission="['ADMIN', 'RECEPTIONIST']"
              v-if="row.status !== 'CANCELLED' && row.status !== 'COMPLETED'"
              type="danger" link size="small"
              @click="handleCancel(row)"
            >取消</el-button>
            <el-button
              v-permission="['ADMIN', 'RECEPTIONIST']"
              v-if="row.status === 'CONFIRMED' && !row.attendanceStatus"
              type="success" link size="small"
              @click="handleCheckIn(row)"
            >签到</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="store.pagination.page"
        v-model:page-size="store.pagination.pageSize"
        :total="store.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="table-pagination"
        @size-change="handleSearch"
        @current-change="store.fetchList"
      />
    </div>

    <AppointmentForm v-model="showCreateForm" @success="store.fetchList" />
    <RescheduleDialog v-model="showReschedule" :original-data="rescheduleData" @success="store.fetchList" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppointmentStore } from '@/stores/appointment'
import { useDictStore } from '@/stores/dict'
import { appointmentApi } from '@/api/appointment'
import { attendanceApi } from '@/api/attendance'
import * as XLSX from 'xlsx'
import StatusTag from '@/components/StatusTag.vue'
import BatchOperationBar from '@/components/BatchOperationBar.vue'
import AppointmentForm from '@/components/AppointmentForm.vue'
import RescheduleDialog from '@/components/RescheduleDialog.vue'

const store = useAppointmentStore()
const dictStore = useDictStore()
const tableRef = ref(null)
const selectedIds = ref([])
const showCreateForm = ref(false)
const showReschedule = ref(false)
const rescheduleData = ref({})

const teacherList = ref([
  { id: 1, name: '王老师' },
  { id: 2, name: '李老师' },
  { id: 3, name: '张老师' },
  { id: 4, name: '赵老师' },
  { id: 5, name: '陈老师' }
])

onMounted(() => {
  store.fetchList()
})

function handleSearch() {
  store.pagination.page = 1
  store.fetchList()
}

function handleReset() {
  store.resetFilters()
  store.fetchList()
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function clearSelection() {
  tableRef.value?.clearSelection()
}

function rowClassName({ row }) {
  return row.status === 'CONFLICT' ? 'conflict-row' : ''
}

function openReschedule(row) {
  rescheduleData.value = { ...row }
  showReschedule.value = true
}

async function handleBatchConfirm() {
  try {
    await ElMessageBox.confirm(`确认批量确认 ${selectedIds.value.length} 条预约？`, '批量确认', { type: 'warning' })
    await appointmentApi.batchConfirm(selectedIds.value)
    ElMessage.success('批量确认成功')
    clearSelection()
    store.fetchList()
  } catch { /* ignore cancel */ }
}

async function handleBatchCancel() {
  try {
    await ElMessageBox.confirm(`确认批量取消 ${selectedIds.value.length} 条预约？`, '批量取消', { type: 'warning' })
    await appointmentApi.batchCancel(selectedIds.value)
    ElMessage.success('批量取消成功')
    clearSelection()
    store.fetchList()
  } catch { /* ignore cancel */ }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确认取消该预约？', '取消预约', { type: 'warning' })
    await appointmentApi.update(row.id, { status: 'CANCELLED' })
    ElMessage.success('取消成功')
    store.fetchList()
  } catch { /* ignore cancel */ }
}

async function handleCheckIn(row) {
  try {
    await attendanceApi.checkIn(row.id, { status: 'CHECKED_IN' })
    ElMessage.success('签到成功')
    store.fetchList()
  } catch { /* ignore */ }
}

function handleExport() {
  if (!store.list.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const data = store.list.map(r => ({
    学生姓名: r.studentName,
    科目: r.subject,
    试听日期: r.trialDate,
    时段: r.timeSlot,
    老师: r.teacherName,
    校区: r.campus,
    状态: dictStore.getStatusLabel(r.status)
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '预约列表')
  XLSX.writeFile(wb, '预约列表.xlsx')
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--text-primary);
}
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.action-left {
  display: flex;
  gap: 8px;
}
.table-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>

<template>
  <div class="dispatch-board">
    <div class="board-toolbar">
      <el-date-picker
        v-model="store.selectedDate"
        type="date"
        placeholder="选择日期"
        value-format="YYYY-MM-DD"
        @change="store.loadDispatch"
      />
      <el-button type="primary" :icon="Refresh" @click="store.loadDispatch()" :loading="store.loading">
        刷新
      </el-button>
      <el-button type="success" :icon="Plus" @click="showCreateDialog = true">
        新建预约
      </el-button>
    </div>

    <div class="board-content">
      <div class="board-list">
        <el-table
          :data="store.dispatchList"
          highlight-current-row
          @current-change="handleSelect"
          v-loading="store.loading"
          stripe
          size="small"
          height="100%"
        >
          <el-table-column prop="customerName" label="客户" width="90" />
          <el-table-column prop="brand" label="品牌" width="70" />
          <el-table-column prop="model" label="车型" width="80" />
          <el-table-column prop="startTime" label="时段" width="100">
            <template #default="{ row }">{{ row.startTime }}-{{ row.endTime }}</template>
          </el-table-column>
          <el-table-column prop="appointmentStatus" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="statusType(row.appointmentStatus)" size="small">{{ statusLabel(row.appointmentStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignedTo" label="负责人" width="80" />
          <el-table-column prop="salesPerson" label="销售" width="80" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.feedbackId" link type="primary" size="small" @click.stop="openFeedback(row)">
                反馈
              </el-button>
              <el-button v-else link type="success" size="small" @click.stop="openFeedback(row)">
                填反馈
              </el-button>
              <el-button
                v-if="canMarkNoShow(row)"
                link type="danger" size="small" @click.stop="confirmMarkNoShow(row)"
              >
                标记爽约
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="store.selectedAppointment" class="board-detail">
        <div class="detail-panels">
          <VehicleArchive :vehicle="vehicleData" />
          <SalesFollowUp :data="salesData" />
          <AppointmentSlots :data="store.selectedAppointment" />
        </div>
      </div>
      <div v-else class="board-detail board-detail-empty">
        <el-empty description="请选择一条预约查看详情" />
      </div>
    </div>

    <FeedbackEditor
      v-if="showFeedbackEditor"
      :appointment="feedbackTarget"
      @close="showFeedbackEditor = false"
      @saved="onFeedbackSaved"
    />

    <el-dialog v-model="showCreateDialog" title="新建试驾预约" width="520px">
      <el-form :model="createForm" label-width="80px" size="default">
        <el-form-item label="车辆ID">
          <el-input-number v-model="createForm.vehicleId" :min="1" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="createForm.customerName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="createForm.customerPhone" />
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker v-model="createForm.appointmentDate" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-select v-model="createForm.startTime" start="08:00" step="00:30" end="20:00" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-select v-model="createForm.endTime" start="08:00" step="00:30" end="20:00" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="createForm.assignedTo" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { useDispatchStore } from '../stores/dispatch'
import { createAppointment } from '../api/appointment'
import { markNoShow } from '../api/noshow'
import VehicleArchive from '../components/VehicleArchive.vue'
import SalesFollowUp from '../components/SalesFollowUp.vue'
import AppointmentSlots from '../components/AppointmentSlots.vue'
import FeedbackEditor from '../components/FeedbackEditor.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useDispatchStore()
const showCreateDialog = ref(false)
const showFeedbackEditor = ref(false)
const feedbackTarget = ref(null)

const createForm = ref({
  vehicleId: null,
  customerName: '',
  customerPhone: '',
  appointmentDate: '',
  startTime: '',
  endTime: '',
  assignedTo: '',
  status: 'PENDING'
})

const vehicleData = computed(() => {
  const sel = store.selectedAppointment
  if (!sel) return null
  return {
    vin: sel.vin, brand: sel.brand, model: sel.model, year: sel.year,
    color: sel.color, price: sel.price, vehicleStatus: sel.vehicleStatus, mileage: sel.mileage
  }
})

const salesData = computed(() => {
  const sel = store.selectedAppointment
  if (!sel) return null
  return {
    customerName: sel.customerName, customerPhone: sel.customerPhone,
    leadSource: sel.leadSource, leadStatus: sel.leadStatus,
    salesPerson: sel.salesPerson, followUpNote: sel.followUpNote
  }
})

function handleSelect(row) {
  store.selectAppointment(row)
}

function openFeedback(row) {
  feedbackTarget.value = row
  showFeedbackEditor.value = true
}

function onFeedbackSaved() {
  showFeedbackEditor.value = false
  store.loadDispatch()
}

function canMarkNoShow(row) {
  return row.appointmentStatus === 'CONFIRMED' || row.appointmentStatus === 'PENDING'
}

function confirmMarkNoShow(row) {
  ElMessageBox.confirm(
    `确认将「${row.customerName}」的预约标记为爽约？将通知负责人「${row.assignedTo}」并生成爽约日志。`,
    '标记爽约',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await markNoShow(row.appointmentId)
      ElMessage.success('已标记爽约，已通知负责人')
      store.loadDispatch()
    } catch {
      ElMessage.error('标记爽约失败')
    }
  }).catch(() => {})
}

async function handleCreate() {
  try {
    await createAppointment(createForm.value)
    ElMessage.success('预约创建成功')
    showCreateDialog.value = false
    store.loadDispatch()
  } catch {
    ElMessage.error('创建失败')
  }
}

function statusType(status) {
  const map = {
    'PENDING': 'info', 'CONFIRMED': 'warning', 'COMPLETED': 'success',
    'CANCELLED': 'danger', 'NO_SHOW': 'danger'
  }
  return map[status] || 'info'
}

function statusLabel(status) {
  const map = { 'PENDING': '待确认', 'CONFIRMED': '已确认', 'COMPLETED': '已完成', 'CANCELLED': '已取消', 'NO_SHOW': '爽约' }
  return map[status] || status
}

onMounted(() => {
  store.loadDispatch()
})
</script>

<style scoped>
.dispatch-board { height: 100%; display: flex; flex-direction: column; }
.board-toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.board-content { flex: 1; display: flex; gap: 16px; min-height: 0; }
.board-list { width: 680px; min-width: 560px; }
.board-detail { flex: 1; min-width: 0; }
.board-detail-empty { display: flex; align-items: center; justify-content: center; }
.detail-panels { display: flex; flex-direction: column; gap: 12px; height: 100%; }
</style>

<template>
  <div class="no-show-alert-page">
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="section-header">
              <el-icon><Bell /></el-icon>
              <span>爽约提醒 — 待处理</span>
              <el-badge :value="openAlerts.length" type="danger" />
            </div>
          </template>

          <el-table :data="openAlerts" stripe size="small" v-loading="loading">
            <el-table-column prop="appointmentId" label="预约ID" width="80" />
            <el-table-column prop="responsiblePerson" label="负责人" width="100" />
            <el-table-column prop="reason" label="原因">
              <template #default="{ row }">{{ row.reason || '待填写' }}</template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="170" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openHandleDialog(row)">
                  处理
                </el-button>
                <el-button link type="info" size="small" @click="viewLogs(row)">
                  日志
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <NoShowLogPanel :logs="currentLogs" />
      </el-col>
    </el-row>

    <el-dialog v-model="showHandleDialog" title="处理爽约" width="480px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="爽约原因">
          <el-input v-model="handleForm.reason" type="textarea" :rows="3" placeholder="请填写爽约原因" />
        </el-form-item>
        <el-form-item label="处理动作">
          <el-input v-model="handleForm.handleAction" type="textarea" :rows="3" placeholder="请填写处理动作" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="handleForm.closedBy" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="handling">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getNoShowAlerts, handleNoShow, getNoShowLogsByAppointment } from '../api/noshow'
import NoShowLogPanel from '../components/NoShowLogPanel.vue'
import { ElMessage } from 'element-plus'

const openAlerts = ref([])
const currentLogs = ref([])
const loading = ref(false)
const handling = ref(false)
const showHandleDialog = ref(false)
const handleForm = ref({ logId: null, reason: '', handleAction: '', closedBy: '' })

async function loadAlerts() {
  loading.value = true
  try {
    openAlerts.value = await getNoShowAlerts()
  } catch {
    openAlerts.value = []
  } finally {
    loading.value = false
  }
}

function openHandleDialog(row) {
  handleForm.value = { logId: row.id, reason: '', handleAction: '', closedBy: '' }
  showHandleDialog.value = true
}

async function viewLogs(row) {
  try {
    currentLogs.value = await getNoShowLogsByAppointment(row.appointmentId)
  } catch {
    currentLogs.value = []
  }
}

async function handleSave() {
  if (!handleForm.value.reason || !handleForm.value.handleAction || !handleForm.value.closedBy) {
    ElMessage.warning('请完整填写原因、处理动作和处理人')
    return
  }
  handling.value = true
  try {
    await handleNoShow(
      handleForm.value.logId,
      handleForm.value.reason,
      handleForm.value.handleAction,
      handleForm.value.closedBy
    )
    ElMessage.success('处理完成，已写入日志')
    showHandleDialog.value = false
    loadAlerts()
  } catch {
    ElMessage.error('处理失败')
  } finally {
    handling.value = false
  }
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.no-show-alert-page { height: 100%; }
.section-header { display: flex; align-items: center; gap: 8px; font-weight: 600; }
</style>

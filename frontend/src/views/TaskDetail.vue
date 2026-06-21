<template>
  <div>
    <div style="margin-bottom:16px;">
      <el-page-header :content="`任务详情 - ${taskInfo?.task?.taskNo || ''}`" @back="router.push('/tasks')">
        <template #content>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;font-weight:600;">任务详情</span>
            <span style="font-size:16px;color:#6b7280;">{{ taskInfo?.task?.taskNo }}</span>
            <span v-if="taskInfo?.task" :class="['status-tag', `status-${taskInfo.task.taskStatus}`]" style="font-size:13px;">
              {{ getDict('taskStatus', taskInfo.task.taskStatus) }}
            </span>
          </div>
        </template>
      </el-page-header>
    </div>

    <div class="action-bar" v-if="taskInfo?.task">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:1;">
        <el-button type="primary" :icon="VideoPlay" :disabled="!canStartAssess" @click="handleStartAssess">开始评估</el-button>
        <el-button type="success" :icon="Money" :disabled="!canQuote" @click="openQuoteDialog">发起报价</el-button>
        <el-button type="warning" :icon="Warning" :disabled="!canFlagMissing" @click="openMissingDialog">标记资料缺失</el-button>
        <el-button type="info" :icon="UploadFilled" :disabled="!canSupplement" @click="handleSupplement">客户补料</el-button>
        <el-button type="danger" :icon="Promotion" :disabled="!canEscalate" @click="openEscalateDialog">升级处理</el-button>
        <el-button type="primary" :icon="Check" :disabled="!canDeal" @click="openDealDialog">确认成交</el-button>
        <el-button type="success" :icon="CircleCheck" :disabled="!canNormalClose" @click="openCloseDialog('NORMAL')">完成收购</el-button>
        <el-button :icon="CircleClose" :disabled="!canRejectClose" @click="openCloseDialog('REJECT')">放弃收购</el-button>
        <el-button type="info" :icon="Close" :disabled="isClosed" @click="doCancelTask">取消任务</el-button>
        <el-button :icon="UploadMaterial" @click="openUploadDialog">上传资料</el-button>
      </div>
      <el-tag type="info" effect="plain">任务创建于 {{ formatTime(taskInfo.task.createTime) }}</el-tag>
    </div>

    <div class="detail-layout">
      <div class="detail-column">
        <div class="detail-column-header">
          <span><el-icon style="margin-right:6px;vertical-align:-2px;"><Van /></el-icon>车辆档案</span>
          <el-tag size="small" type="primary" effect="plain">{{ getDict('vehicleStatus', taskInfo?.task?.vehicleStatus) }}</el-tag>
        </div>
        <div class="detail-column-body">
          <div v-if="taskInfo?.vehicle" class="info-grid" style="grid-template-columns:1fr;">
            <div style="background:#eff6ff;padding:12px;border-radius:8px;margin-bottom:10px;">
              <div style="font-size:18px;font-weight:600;color:#1e40af;">
                {{ taskInfo.vehicle.brand }} {{ taskInfo.vehicle.series }}
              </div>
              <div style="color:#374151;margin-top:4px;">{{ taskInfo.vehicle.model }}</div>
              <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
                <el-tag size="small" type="info" effect="plain" v-if="taskInfo.vehicle.plateNo">{{ taskInfo.vehicle.plateNo }}</el-tag>
                <el-tag size="small" effect="plain" v-if="taskInfo.vehicle.color">{{ taskInfo.vehicle.color }}</el-tag>
                <el-tag size="small" effect="plain" v-if="taskInfo.vehicle.registerDate">{{ taskInfo.vehicle.registerDate }}上牌</el-tag>
                <el-tag size="small" effect="plain" v-if="taskInfo.vehicle.mileage">{{ (taskInfo.vehicle.mileage/10000).toFixed(1) }}万公里</el-tag>
              </div>
            </div>

            <div class="info-item"><span class="info-label">VIN车架号</span><span class="info-value" style="font-family:monospace;">{{ taskInfo.vehicle.vin || '-' }}</span></div>
            <div class="info-item"><span class="info-label">排放标准</span><span class="info-value">{{ taskInfo.vehicle.emissionStandard || '-' }}</span></div>
            <div class="info-item"><span class="info-label">变速箱</span><span class="info-value">{{ taskInfo.vehicle.transmission || '-' }}</span></div>
            <div class="info-item"><span class="info-label">排量</span><span class="info-value">{{ taskInfo.vehicle.displacement ? taskInfo.vehicle.displacement + 'L' : '-' }}</span></div>
            <div class="info-item"><span class="info-label">燃油类型</span><span class="info-value">{{ taskInfo.vehicle.fuelType || '-' }}</span></div>
            <div class="info-item"><span class="info-label">车身类型</span><span class="info-value">{{ taskInfo.vehicle.bodyType || '-' }}</span></div>
            <div class="info-item"><span class="info-label">驱动方式</span><span class="info-value">{{ taskInfo.vehicle.driveType || '-' }}</span></div>
            <div class="info-item"><span class="info-label">发动机号</span><span class="info-value">{{ taskInfo.vehicle.engineNo || '-' }}</span></div>
            <div class="info-item"><span class="info-label">车辆性质</span><span class="info-value">{{ taskInfo.vehicle.vehicleUsage || '-' }}</span></div>
            <div class="info-item"><span class="info-label">保险</span>
              <span class="info-value">
                <el-tag size="small" :type="taskInfo.vehicle.hasInsurance ? 'success' : 'info'" effect="plain">
                  {{ taskInfo.vehicle.hasInsurance ? `有 ${taskInfo.vehicle.insuranceExpire || ''}到期` : '无' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item"><span class="info-label">年检</span>
              <span class="info-value">
                <el-tag size="small" :type="taskInfo.vehicle.hasAnnualInspection ? 'success' : 'info'" effect="plain">
                  {{ taskInfo.vehicle.hasAnnualInspection ? `有 ${taskInfo.vehicle.annualInspectionExpire || ''}到期` : '无' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item"><span class="info-label">原车主</span><span class="info-value">{{ taskInfo.vehicle.ownerName || '-' }} {{ taskInfo.vehicle.ownerPhone || '' }}</span></div>
            <div v-if="taskInfo.vehicle.remark" class="info-item" style="grid-column:1/-1;">
              <span class="info-label">备注</span><span class="info-value" style="color:#dc2626;">{{ taskInfo.vehicle.remark }}</span>
            </div>
          </div>

          <el-divider content-position="left">任务信息</el-divider>
          <div v-if="taskInfo?.task" class="info-grid" style="grid-template-columns:1fr;">
            <div class="info-item"><span class="info-label">客户信息</span><span class="info-value">{{ taskInfo.task.customerName }} {{ taskInfo.task.customerPhone }}</span></div>
            <div class="info-item"><span class="info-label">来源渠道</span><span class="info-value">{{ getDict('sourceType', taskInfo.task.sourceType) }} {{ taskInfo.task.sourceDetail ? '(' + taskInfo.task.sourceDetail + ')' : '' }}</span></div>
            <div class="info-item"><span class="info-label">负责团队</span>
              <span class="info-value">
                <span style="margin-right:10px;">销:{{ taskInfo.salesName || '-' }}</span>
                <span style="margin-right:10px;">评:{{ taskInfo.assessorName || '-' }}</span>
                <span>经:{{ taskInfo.managerName || '-' }}</span>
              </span>
            </div>
            <div class="info-item"><span class="info-label">期望价</span><span class="info-value" style="font-size:16px;font-weight:600;">{{ formatPrice(taskInfo.task.expectedPrice) }}</span></div>
            <div v-if="taskInfo.task.finalPrice" class="info-item">
              <span class="info-label">成交收购价</span><span class="info-value" style="font-size:18px;font-weight:700;color:#dc2626;">{{ formatPrice(taskInfo.task.finalPrice) }}</span>
            </div>
            <div v-if="taskInfo.task.missingMaterials" class="info-item">
              <span class="info-label">缺失材料</span>
              <span class="info-value">
                <el-tag v-for="m in parseJSON(taskInfo.task.missingMaterials)" :key="m" size="small" type="warning" effect="dark" style="margin-right:4px;margin-bottom:4px;">
                  {{ getMaterialName(m) }}
                </el-tag>
              </span>
            </div>
            <div v-if="taskInfo.task.escalateReason" class="info-item" style="grid-column:1/-1;">
              <span class="info-label">升级原因</span><span class="info-value" style="color:#dc2626;">{{ taskInfo.task.escalateReason }}</span>
            </div>
            <div v-if="taskInfo.task.closeReason" class="info-item" style="grid-column:1/-1;">
              <span class="info-label">处理结论</span><span class="info-value">{{ taskInfo.task.closeReason }}</span>
            </div>
          </div>

          <el-divider content-position="left">状态流转日志</el-divider>
          <div v-for="log in taskInfo?.statusLogList || []" :key="log.id" class="timeline-item">
            <div class="timeline-time">{{ formatTime(log.actionTime) }} · {{ log.operatorName }}</div>
            <div class="timeline-content" style="font-weight:500;">{{ getDict('actionType', log.actionType) }}</div>
            <div class="timeline-operator">
              <span v-if="log.fromStatus">{{ getDict('taskStatus', log.fromStatus) }} → </span>
              <span style="color:#2563eb;">{{ getDict('taskStatus', log.toStatus) }}</span>
            </div>
            <div v-if="log.actionRemark" style="color:#6b7280;font-size:12px;margin-top:2px;">{{ log.actionRemark }}</div>
          </div>
        </div>
      </div>

      <div class="detail-column">
        <div class="detail-column-header">
          <span><el-icon style="margin-right:6px;vertical-align:-2px;"><Money /></el-icon>报价历史</span>
          <el-tag size="small" type="success" effect="plain" v-if="taskInfo?.quoteList?.length">共 {{ taskInfo.quoteList.length }} 轮</el-tag>
        </div>
        <div class="detail-column-body">
          <el-empty v-if="!taskInfo?.quoteList?.length" description="暂无报价记录" :image-size="100" />
          <div v-for="q in taskInfo?.quoteList || []" :key="q.id" class="quote-item">
            <div class="quote-item-header">
              <div>
                <el-tag size="small" :type="getQuoteTagType(q.quoteType)">{{ getDict('quoteType', q.quoteType) }}</el-tag>
                <span style="margin-left:8px;font-weight:600;">第 {{ q.quoteRound }} 轮</span>
              </div>
              <div class="quote-meta">{{ store.getUserName(q.quoteBy) }} · {{ formatTime(q.quoteTime) }}</div>
            </div>
            <div class="quote-price">
              {{ formatPrice(q.quotePrice) }}
              <span v-if="q.customerCounterPrice" style="font-size:13px;font-weight:400;color:#6b7280;margin-left:10px;">
                客户还价: <span style="color:#f59e0b;font-weight:600;">{{ formatPrice(q.customerCounterPrice) }}</span>
              </span>
            </div>
            <div class="quote-response" v-if="q.customerResponse">
              客户回应:
              <el-tag size="small" :type="getResponseTagType(q.customerResponse)">{{ getDict('customerResponse', q.customerResponse) }}</el-tag>
            </div>
            <div v-if="q.remark" style="color:#6b7280;font-size:12px;margin-top:4px;">{{ q.remark }}</div>
          </div>
        </div>
      </div>

      <div class="detail-column">
        <div class="detail-column-header">
          <span><el-icon style="margin-right:6px;vertical-align:-2px;"><Folder /></el-icon>金融资料</span>
          <div>
            <el-tag size="small" type="success" effect="plain" style="margin-right:6px;">
              齐全 {{ materialStats.ready }}/{{ materialStats.total || 0 }}
            </el-tag>
            <el-tag size="small" type="warning" effect="plain" v-if="materialStats.missing">
              缺 {{ materialStats.missing }}
            </el-tag>
          </div>
        </div>
        <div class="detail-column-body">
          <el-empty v-if="!taskInfo?.materialList?.length" description="暂无资料上传" :image-size="100" />
          <div v-for="m in taskInfo?.materialList || []" :key="m.id"
               :class="['material-item', { missing: m.isMissing === 1, verified: m.isVerified === 1 }]">
            <div class="material-info">
              <el-icon v-if="m.isMissing === 1" style="color:#f59e0b;"><WarningFilled /></el-icon>
              <el-icon v-else-if="m.isVerified === 1" style="color:#10b981;"><CircleCheckFilled /></el-icon>
              <el-icon v-else style="color:#3b82f6;"><Document /></el-icon>
              <span style="font-weight:500;">{{ m.materialName }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-direction:column;align-items:flex-end;">
              <div>
                <span class="material-status" v-if="m.isMissing === 1" style="background:#fef3c7;color:#d97706;">缺失待补</span>
                <span class="material-status" v-else-if="m.isVerified === 1" style="background:#dcfce7;color:#16a34a;">已核验</span>
                <span class="material-status" v-else style="background:#dbeafe;color:#2563eb;">待核验</span>
                <el-tag v-if="m.isOriginal === 1" size="small" type="success" effect="plain" style="margin-left:4px;">原件</el-tag>
              </div>
              <div style="font-size:11px;color:#9ca3af;">{{ formatTime(m.uploadTime) }}</div>
              <div v-if="!m.isMissing && !m.isVerified && !isClosed">
                <el-button type="primary" link size="small" @click="handleVerifyMaterial(m)">核验</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="quoteDialogVisible" title="发起报价" width="500px">
      <el-form :model="quoteForm" label-width="100px">
        <el-form-item label="报价类型">
          <el-select v-model="quoteForm.quoteType" style="width:100%;">
            <el-option v-for="s in dict.quoteType || []" :key="s.code" :label="s.desc" :value="s.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="报价金额"><el-input-number v-model="quoteForm.quotePrice" :min="0" :step="1000" :precision="0" style="width:100%;" /></el-form-item>
        <el-form-item label="客户回应">
          <el-select v-model="quoteForm.customerResponse" placeholder="可稍后填写" clearable style="width:100%;">
            <el-option v-for="s in dict.customerResponse || []" :key="s.code" :label="s.desc" :value="s.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户还价" v-if="quoteForm.customerResponse === 'COUNTER'">
          <el-input-number v-model="quoteForm.customerCounterPrice" :min="0" :step="1000" :precision="0" style="width:100%;" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="quoteForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quoteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuote">提交报价</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="missingDialogVisible" title="标记资料缺失" width="600px">
      <el-form :model="missingForm" label-width="100px">
        <el-form-item label="缺失资料">
          <el-checkbox-group v-model="missingForm.missingMaterials">
            <el-checkbox v-for="m in dict.materialType || []" :key="m.code" :value="m.code" style="margin-bottom:8px;">{{ m.desc }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="missingForm.remark" type="textarea" :rows="2" placeholder="请说明缺失情况" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="missingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMissing">确认标记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="escalateDialogVisible" title="升级处理" width="500px">
      <el-form :model="escalateForm" label-width="100px">
        <el-form-item label="升级原因"><el-input v-model="escalateForm.reason" type="textarea" :rows="3" placeholder="请详细说明升级原因，如价格争议、车况复杂等" /></el-form-item>
        <el-form-item label="升级给">
          <el-select v-model="escalateForm.targetUserId" filterable placeholder="选择处理人" style="width:100%;">
            <el-option v-for="u in managerUsers" :key="u.id" :label="u.realName + ' (经理)'" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="escalateDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitEscalate">确认升级</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dealDialogVisible" title="确认成交" width="500px">
      <el-form :model="dealForm" label-width="100px">
        <el-form-item label="最终收购价"><el-input-number v-model="dealForm.finalPrice" :min="0" :step="1000" :precision="0" style="width:100%;" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="dealForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dealDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDeal">确认成交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="closeDialogVisible" :title="closeForm.closeType === 'NORMAL' ? '完成收购入库' : '放弃收购'" width="600px">
      <el-form :model="closeForm" label-width="110px">
        <template v-if="closeForm.closeType === 'NORMAL'">
          <el-form-item label="入库日期" required><el-date-picker v-model="closeForm.inboundDate" type="date" value-format="YYYY-MM-DD" style="width:100%;" /></el-form-item>
          <el-form-item label="收购价" required><el-input-number v-model="closeForm.finalPrice" :min="0" :step="1000" :precision="0" style="width:100%;" /></el-form-item>
          <el-form-item label="期望销售价"><el-input-number v-model="closeForm.expectedSalePrice" :min="0" :step="1000" :precision="0" style="width:100%;" /></el-form-item>
          <el-form-item label="仓库位置"><el-input v-model="closeForm.warehouseLocation" placeholder="如:A区-015" /></el-form-item>
        </template>
        <el-form-item label="关闭结论" required>
          <el-input v-model="closeForm.closeReason" type="textarea" :rows="3" :placeholder="closeForm.closeType === 'NORMAL' ? '如:资料齐全，完成收购入库' : '如:价格未谈拢，客户不卖了'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button :type="closeForm.closeType === 'NORMAL' ? 'primary' : 'danger'" @click="submitClose">确认关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传金融资料" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="资料类型">
          <el-select v-model="uploadForm.materialType" filterable style="width:100%;" @change="onMaterialTypeChange">
            <el-option v-for="m in dict.materialType || []" :key="m.code" :label="m.desc" :value="m.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="资料名称"><el-input v-model="uploadForm.materialName" /></el-form-item>
        <el-form-item label="是否原件"><el-switch v-model="uploadForm.isOriginal" /></el-form-item>
        <el-form-item label="文件链接"><el-input v-model="uploadForm.fileUrl" placeholder="如为模拟数据可留空，系统会自动标记为已提供" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="uploadForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Money, Warning, UploadFilled, Promotion, Check, CircleCheck, CircleClose, Close, UploadMaterial, WarningFilled, CircleCheckFilled, Document } from '@element-plus/icons-vue'
import {
  getTaskDetail, startAssess, addQuote, flagMissing, submitSupplement,
  escalate, confirmDeal, closeTask, cancelTask as apiCancelTask, uploadMaterial, verifyMaterial,
  listUsersByRole
} from '../api'
import { useAppStore } from '../store/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const dict = computed(() => store.dict)
const taskId = computed(() => Number(route.params.id))

const taskInfo = ref(null)
const managerUsers = ref([])

const getDict = (type, code) => store.getDictItem(type, code)
const formatPrice = (p) => p ? `¥${Number(p).toLocaleString()}` : '-'
const formatTime = (t) => t ? String(t).slice(0, 16).replace('T', ' ') : ''
const parseJSON = (s) => {
  try { return typeof s === 'string' ? JSON.parse(s) : (s || []) } catch { return [] }
}
const getMaterialName = (type) => getDict('materialType', type)
const getQuoteTagType = (t) => ({ INITIAL: 'info', COUNTER: 'warning', FINAL: 'success' }[t] || '')
const getResponseTagType = (r) => ({ ACCEPT: 'success', REJECT: 'danger', COUNTER: 'warning', PENDING: 'info' }[r] || '')

const isClosed = computed(() => {
  const s = taskInfo.value?.task?.taskStatus
  return ['NORMAL_CLOSED', 'REJECT_CLOSED', 'CANCELLED'].includes(s)
})
const status = computed(() => taskInfo.value?.task?.taskStatus || '')

const canStartAssess = computed(() => !isClosed.value && ['PENDING'].includes(status.value))
const canQuote = computed(() => !isClosed.value && ['PENDING', 'ASSESSING', 'QUOTING', 'SUPPLEMENTING', 'ESCALATED'].includes(status.value))
const canFlagMissing = computed(() => !isClosed.value && ['ASSESSING', 'QUOTING', 'SUPPLEMENTING', 'ESCALATED'].includes(status.value))
const canSupplement = computed(() => ['MATERIAL_MISSING', 'SUPPLEMENTING'].includes(status.value))
const canEscalate = computed(() => !isClosed.value && !['ESCALATED'].includes(status.value) && !['PENDING'].includes(status.value))
const canDeal = computed(() => !isClosed.value && ['QUOTING', 'ASSESSING', 'SUPPLEMENTING', 'ESCALATED'].includes(status.value))
const canNormalClose = computed(() => !isClosed.value && ['DEALING', 'QUOTING', 'ESCALATED', 'SUPPLEMENTING'].includes(status.value))
const canRejectClose = computed(() => !isClosed.value)

const materialStats = computed(() => {
  const list = taskInfo.value?.materialList || []
  return {
    total: list.length,
    ready: list.filter(m => m.isMissing !== 1).length,
    missing: list.filter(m => m.isMissing === 1).length
  }
})

const loadDetail = async () => {
  const { data } = await getTaskDetail(taskId.value)
  taskInfo.value = data
}

const handleStartAssess = async () => {
  await startAssess({ taskId: taskId.value, operatorId: store.currentUser.id })
  ElMessage.success('已开始评估')
  loadDetail()
}

const quoteDialogVisible = ref(false)
const quoteForm = reactive({ quoteType: 'INITIAL', quotePrice: 0, customerResponse: '', customerCounterPrice: null, remark: '' })
const openQuoteDialog = () => {
  Object.assign(quoteForm, { quoteType: 'INITIAL', quotePrice: taskInfo.value?.task?.expectedPrice || 0, customerResponse: '', customerCounterPrice: null, remark: '' })
  quoteDialogVisible.value = true
}
const submitQuote = async () => {
  if (!quoteForm.quotePrice || quoteForm.quotePrice <= 0) return ElMessage.warning('请输入报价金额')
  await addQuote({ taskId: taskId.value, ...quoteForm, quoteBy: store.currentUser.id })
  ElMessage.success('报价已提交')
  quoteDialogVisible.value = false
  loadDetail()
}

const missingDialogVisible = ref(false)
const missingForm = reactive({ missingMaterials: [], remark: '' })
const openMissingDialog = () => {
  const existing = parseJSON(taskInfo.value?.task?.missingMaterials || '[]')
  missingForm.missingMaterials = [...existing]
  missingForm.remark = ''
  missingDialogVisible.value = true
}
const submitMissing = async () => {
  if (!missingForm.missingMaterials.length) return ElMessage.warning('请选择缺失的资料')
  await flagMissing({ taskId: taskId.value, operatorId: store.currentUser.id, ...missingForm })
  ElMessage.success('已标记资料缺失')
  missingDialogVisible.value = false
  loadDetail()
}

const handleSupplement = async () => {
  await ElMessageBox.confirm('确认客户已提交补充材料？', '提示', { type: 'info' })
  await submitSupplement({ taskId: taskId.value, operatorId: store.currentUser.id })
  ElMessage.success('已记录补充材料')
  loadDetail()
}

const escalateDialogVisible = ref(false)
const escalateForm = reactive({ reason: '', targetUserId: null })
const openEscalateDialog = () => {
  escalateForm.reason = ''
  escalateForm.targetUserId = null
  escalateDialogVisible.value = true
}
const submitEscalate = async () => {
  if (!escalateForm.reason) return ElMessage.warning('请填写升级原因')
  await escalate({ taskId: taskId.value, operatorId: store.currentUser.id, targetRole: 'MANAGER', ...escalateForm })
  ElMessage.success('已升级处理')
  escalateDialogVisible.value = false
  loadDetail()
}

const dealDialogVisible = ref(false)
const dealForm = reactive({ finalPrice: 0, remark: '' })
const openDealDialog = () => {
  dealForm.finalPrice = taskInfo.value?.task?.expectedPrice || 0
  dealForm.remark = ''
  dealDialogVisible.value = true
}
const submitDeal = async () => {
  if (!dealForm.finalPrice || dealForm.finalPrice <= 0) return ElMessage.warning('请输入最终收购价')
  await confirmDeal({ taskId: taskId.value, finalPrice: dealForm.finalPrice, operatorId: store.currentUser.id, remark: dealForm.remark })
  ElMessage.success('已确认成交')
  dealDialogVisible.value = false
  loadDetail()
}

const closeDialogVisible = ref(false)
const closeForm = reactive({ closeType: 'NORMAL', closeReason: '', finalPrice: null, inboundDate: '', expectedSalePrice: null, warehouseLocation: '' })
const openCloseDialog = (type) => {
  Object.assign(closeForm, {
    closeType: type,
    closeReason: '',
    finalPrice: taskInfo.value?.task?.finalPrice || null,
    inboundDate: new Date().toISOString().slice(0, 10),
    expectedSalePrice: null,
    warehouseLocation: ''
  })
  closeDialogVisible.value = true
}
const submitClose = async () => {
  if (!closeForm.closeReason) return ElMessage.warning('请填写关闭结论')
  if (closeForm.closeType === 'NORMAL') {
    if (!closeForm.inboundDate) return ElMessage.warning('请选择入库日期')
    if (!closeForm.finalPrice) return ElMessage.warning('请填写收购价')
  }
  await closeTask({ taskId: taskId.value, operatorId: store.currentUser.id, ...closeForm })
  ElMessage.success(`已${closeForm.closeType === 'NORMAL' ? '完成收购' : '放弃收购'}`)
  closeDialogVisible.value = false
  loadDetail()
}

const doCancelTask = async () => {
  await ElMessageBox.confirm('确认取消此任务？取消后不可恢复。', '警告', { type: 'warning' })
  const { value } = await ElMessageBox.prompt('请输入取消原因', '取消任务', { inputType: 'textarea' }).catch(() => ({}))
  if (!value) return ElMessage.warning('请输入原因')
  await apiCancelTask({ taskId: taskId.value, operatorId: store.currentUser.id, reason: value })
  ElMessage.success('任务已取消')
  loadDetail()
}

const uploadDialogVisible = ref(false)
const uploadForm = reactive({ materialType: '', materialName: '', fileUrl: '', fileSize: null, isOriginal: 0, remark: '' })
const openUploadDialog = () => {
  Object.assign(uploadForm, { materialType: '', materialName: '', fileUrl: '', fileSize: null, isOriginal: 0, remark: '' })
  uploadDialogVisible.value = true
}
const onMaterialTypeChange = (v) => { uploadForm.materialName = getDict('materialType', v) }
const submitUpload = async () => {
  if (!uploadForm.materialType) return ElMessage.warning('请选择资料类型')
  if (!uploadForm.materialName) return ElMessage.warning('请输入资料名称')
  await uploadMaterial({ taskId: taskId.value, uploadBy: store.currentUser.id, uploadTime: new Date().toISOString(), ...uploadForm, fileUrl: uploadForm.fileUrl || `simulated://${Date.now()}` })
  ElMessage.success('资料已上传')
  uploadDialogVisible.value = false
  loadDetail()
}

const handleVerifyMaterial = async (m) => {
  await verifyMaterial({ materialId: m.id, operatorId: store.currentUser.id })
  ElMessage.success('核验完成')
  loadDetail()
}

onMounted(async () => {
  const { data } = await listUsersByRole('MANAGER')
  managerUsers.value = data || []
  loadDetail()
})
</script>

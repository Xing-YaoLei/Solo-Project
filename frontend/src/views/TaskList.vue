<template>
  <div>
    <div class="page-card">
      <div class="page-card-header">
        <div class="page-card-title">
          <el-icon style="vertical-align:-2px;margin-right:6px;"><Tickets /></el-icon>
          收购任务分派台
        </div>
        <div>
          <el-button type="primary" @click="openCreate">
            <el-icon style="margin-right:4px;"><Plus /></el-icon>新建任务
          </el-button>
        </div>
      </div>
      <div class="page-card-body">
        <div class="filter-bar">
          <el-input v-model="query.keyword" placeholder="搜索任务单号/客户名" clearable style="width:220px;" :prefix-icon="Search" @change="loadData" />
          <el-select v-model="query.taskStatus" placeholder="任务状态" clearable style="width:160px;" @change="loadData">
            <el-option v-for="s in dict.taskStatus || []" :key="s.code" :label="s.desc" :value="s.code" />
          </el-select>
          <el-select v-model="query.sourceType" placeholder="来源类型" clearable style="width:140px;" @change="loadData">
            <el-option v-for="s in dict.sourceType || []" :key="s.code" :label="s.desc" :value="s.code" />
          </el-select>
          <el-select v-model="query.isActive" placeholder="是否活跃" clearable style="width:120px;" @change="loadData">
            <el-option label="活跃中" :value="1" />
            <el-option label="已关闭" :value="0" />
          </el-select>
          <el-select v-model="query.salesId" placeholder="业务员" clearable filterable style="width:140px;" @change="loadData">
            <el-option v-for="u in salesUsers" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
          <el-select v-model="query.assessorId" placeholder="评估师" clearable filterable style="width:140px;" @change="loadData">
            <el-option v-for="u in assessorUsers" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
          <el-button @click="resetFilter">重置</el-button>
        </div>

        <el-table :data="tableData.list || []" stripe style="width:100%" @row-click="gotoDetail">
          <el-table-column prop="taskNo" label="任务单号" width="140" fixed="left">
            <template #default="{ row }">
              <span style="color:#2563eb;font-weight:500;">{{ row.taskNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="车辆信息" min-width="200">
            <template #default="{ row }">
              <div style="line-height:1.5;">
                <div style="font-weight:500;">
                  {{ row.vehicleBrand }} {{ row.vehicleSeries }} {{ row.vehicleModel ? row.vehicleModel.slice(0, 10) : '' }}
                </div>
                <div style="color:#6b7280;font-size:12px;">
                  <span v-if="row.plateNo" style="margin-right:8px;">{{ row.plateNo }}</span>
                  <span>VIN: {{ row.vin?.slice(-6) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sourceTypeDesc" label="来源" width="110" />
          <el-table-column label="客户" width="150">
            <template #default="{ row }">
              <div style="line-height:1.4;">
                <div>{{ row.customerName }}</div>
                <div style="color:#6b7280;font-size:12px;">{{ row.customerPhone }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="当前状态" width="140">
            <template #default="{ row }">
              <span :class="['status-tag', `status-${row.taskStatus}`]">{{ row.taskStatusDesc }}</span>
            </template>
          </el-table-column>
          <el-table-column label="负责团队" min-width="200">
            <template #default="{ row }">
              <div class="tag-row">
                <el-tag v-if="row.salesName" type="primary" effect="plain" size="small">销:{{ row.salesName }}</el-tag>
                <el-tag v-if="row.assessorName" type="success" effect="plain" size="small">评:{{ row.assessorName }}</el-tag>
                <el-tag v-if="row.managerName" type="warning" effect="plain" size="small">经:{{ row.managerName }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="180" align="right">
            <template #default="{ row }">
              <div style="line-height:1.5;text-align:right;">
                <div style="color:#6b7280;font-size:12px;">期望:{{ formatPrice(row.expectedPrice) }}</div>
                <div v-if="row.finalPrice" style="color:#dc2626;font-weight:600;">成交:{{ formatPrice(row.finalPrice) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="关闭时间" width="160">
            <template #default="{ row }">{{ formatTime(row.closeTime) || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click.stop="gotoDetail(row)">
                <el-icon><EditPen /></el-icon>
                {{ row.isActive ? '处理' : '查看' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top:16px;text-align:right;">
          <el-pagination
            v-model:current-page="query.pageNum"
            v-model:page-size="query.pageSize"
            :total="tableData.total || 0"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="createVisible" title="新建收购任务" width="900px" top="5vh" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="车辆档案" name="vehicle">
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="VIN车架号" prop="vin"><el-input v-model="createForm.vin" maxlength="17" placeholder="17位车架号" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="车牌号" prop="plateNo"><el-input v-model="createForm.plateNo" placeholder="例如:粤B12345" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="品牌" prop="brand"><el-input v-model="createForm.brand" placeholder="如:宝马" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="车系" prop="series"><el-input v-model="createForm.series" placeholder="如:3系" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="车型规格" prop="model"><el-input v-model="createForm.model" placeholder="如:2020款 325Li" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="颜色"><el-input v-model="createForm.color" placeholder="如:白色" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="上牌日期"><el-date-picker v-model="createForm.registerDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%;" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="里程(公里)"><el-input-number v-model="createForm.mileage" :min="0" :step="1000" style="width:100%;" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="变速箱"><el-select v-model="createForm.transmission" placeholder="选择" clearable style="width:100%;"><el-option label="自动" value="自动" /><el-option label="手动" value="手动" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="排量(L)"><el-input-number v-model="createForm.displacement" :min="0" :step="0.1" :precision="1" style="width:100%;" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="燃油类型"><el-select v-model="createForm.fuelType" placeholder="选择" clearable style="width:100%;"><el-option label="汽油" value="汽油" /><el-option label="柴油" value="柴油" /><el-option label="混动" value="混动" /><el-option label="纯电" value="纯电" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="车身类型"><el-select v-model="createForm.bodyType" placeholder="选择" clearable style="width:100%;"><el-option label="轿车" value="轿车" /><el-option label="SUV" value="SUV" /><el-option label="MPV" value="MPV" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="排放标准"><el-input v-model="createForm.emissionStandard" placeholder="如:国VI" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="车主姓名"><el-input v-model="createForm.ownerName" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="车主电话"><el-input v-model="createForm.ownerPhone" /></el-form-item></el-col>
              <el-col :span="24"><el-form-item label="备注"><el-input v-model="createForm.remark" type="textarea" :rows="2" /></el-form-item></el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane label="任务信息" name="task">
            <el-row :gutter="16">
              <el-col :span="12"><el-form-item label="客户姓名" prop="customerName"><el-input v-model="createForm.customerName" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="客户电话" prop="customerPhone"><el-input v-model="createForm.customerPhone" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="来源类型" prop="sourceType">
                <el-select v-model="createForm.sourceType" placeholder="选择" style="width:100%;">
                  <el-option v-for="s in dict.sourceType || []" :key="s.code" :label="s.desc" :value="s.code" />
                </el-select>
              </el-form-item></el-col>
              <el-col :span="12"><el-form-item label="来源详情"><el-input v-model="createForm.sourceDetail" placeholder="平台名称/介绍人" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="车辆状况">
                <el-select v-model="createForm.vehicleStatus" placeholder="选择" clearable style="width:100%;">
                  <el-option v-for="s in dict.vehicleStatus || []" :key="s.code" :label="s.desc" :value="s.code" />
                </el-select>
              </el-form-item></el-col>
              <el-col :span="12"><el-form-item label="客户期望价"><el-input-number v-model="createForm.expectedPrice" :min="0" :step="1000" :precision="0" style="width:100%;" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="负责业务员" prop="salesId">
                <el-select v-model="createForm.salesId" filterable placeholder="选择" style="width:100%;">
                  <el-option v-for="u in salesUsers" :key="u.id" :label="u.realName" :value="u.id" />
                </el-select>
              </el-form-item></el-col>
              <el-col :span="8"><el-form-item label="负责评估师" prop="assessorId">
                <el-select v-model="createForm.assessorId" filterable placeholder="选择" style="width:100%;">
                  <el-option v-for="u in assessorUsers" :key="u.id" :label="u.realName" :value="u.id" />
                </el-select>
              </el-form-item></el-col>
              <el-col :span="8"><el-form-item label="跟进经理">
                <el-select v-model="createForm.managerId" filterable placeholder="选择" clearable style="width:100%;">
                  <el-option v-for="u in managerUsers" :key="u.id" :label="u.realName" :value="u.id" />
                </el-select>
              </el-form-item></el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { queryTaskPage, createTask, listUsersByRole } from '../api'
import { useAppStore } from '../store/app'

const router = useRouter()
const store = useAppStore()
const dict = computed(() => store.dict)

const query = reactive({
  pageNum: 1, pageSize: 20,
  keyword: '', taskStatus: '', sourceType: '', isActive: '',
  salesId: null, assessorId: null
})
const tableData = ref({ list: [], total: 0 })
const salesUsers = ref([])
const assessorUsers = ref([])
const managerUsers = ref([])

const formatPrice = (p) => p ? `¥${Number(p).toLocaleString()}` : '-'
const formatTime = (t) => t ? String(t).slice(0, 16).replace('T', ' ') : ''

const resetFilter = () => {
  Object.assign(query, { keyword: '', taskStatus: '', sourceType: '', isActive: '', salesId: null, assessorId: null, pageNum: 1 })
  loadData()
}

const loadData = async () => {
  const params = { ...query }
  if (params.keyword) {
    // 搜索交给后端处理
  }
  const { data } = await queryTaskPage(params)
  tableData.value = data
}

const gotoDetail = (row) => router.push(`/tasks/${row.id}`)

const createVisible = ref(false)
const createFormRef = ref()
const createForm = reactive({})
const createRules = {
  vin: [{ required: true, message: '请输入VIN车架号', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  series: [{ required: true, message: '请输入车系', trigger: 'blur' }],
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  customerPhone: [{ required: true, message: '请输入客户电话', trigger: 'blur' }],
  sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }],
  salesId: [{ required: true, message: '请选择业务员', trigger: 'change' }],
  assessorId: [{ required: true, message: '请选择评估师', trigger: 'change' }]
}

const openCreate = () => {
  Object.keys(createForm).forEach(k => delete createForm[k])
  createForm.createBy = store.currentUser.id
  createVisible.value = true
}

const submitCreate = async () => {
  await createFormRef.value.validate()
  const { data } = await createTask(createForm)
  ElMessage.success('任务创建成功')
  createVisible.value = false
  router.push(`/tasks/${data}`)
}

onMounted(async () => {
  const [s, a, m] = await Promise.all([
    listUsersByRole('SALES'),
    listUsersByRole('ASSESSOR'),
    listUsersByRole('MANAGER')
  ])
  salesUsers.value = s.data || []
  assessorUsers.value = a.data || []
  managerUsers.value = m.data || []
  loadData()
})
</script>

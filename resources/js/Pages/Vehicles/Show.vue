<template>
    <AppLayout :title="vehicle.brand + ' ' + vehicle.model">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <Link :href="route('vehicles.index')" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">
                            {{ vehicle.brand }} {{ vehicle.model }} {{ vehicle.year }}款
                        </h1>
                        <div class="flex items-center gap-2 mt-1">
                            <VehicleStatusBadge :status="vehicle.status" />
                            <span class="text-sm text-gray-500">{{ vehicle.plate_no || '待上牌' }}</span>
                            <span class="text-sm text-gray-400 font-mono">VIN: {{ vehicle.vin }}</span>
                            <span v-if="vehicle.missing_documents_count > 0" class="badge-red">
                                缺少{{ vehicle.missing_documents_count }}项资料
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        v-if="can.update"
                        @click="showStatusModal = true"
                        class="btn-secondary text-sm py-1"
                    >
                        变更状态
                    </button>
                    <Link v-if="can.update" :href="route('vehicles.edit', vehicle.id)" class="btn-secondary text-sm py-1">
                        编辑信息
                    </Link>
                    <button v-if="can.report_anomaly" @click="showAnomalyModal = true" class="btn-danger text-sm py-1">
                        上报异常
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-3 space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">车辆信息</h3>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <InfoItem label="颜色" :value="vehicle.color || '未填写'" />
                                <InfoItem label="里程数" :value="vehicle.mileage?.toLocaleString() + ' km'" />
                                <InfoItem label="排量" :value="vehicle.displacement || '未填写'" />
                                <InfoItem label="变速箱" :value="vehicle.transmission || '未填写'" />
                                <InfoItem label="燃油类型" :value="vehicle.fuel_type || '未填写'" />
                                <InfoItem label="首次上牌" :value="vehicle.first_register_date || '未填写'" />
                                <InfoItem label="入库日期" :value="vehicle.arrival_date || '未填写'" />
                                <InfoItem label="库龄" :value="vehicle.days_in_stock !== null ? vehicle.days_in_stock + ' 天' : '-'" />
                                <InfoItem label="车源渠道" :value="vehicle.source || '未填写'" />
                                <InfoItem label="原车主" :value="vehicle.owner_name || '未填写'" />
                                <InfoItem label="联系电话" :value="vehicle.owner_phone || '未填写'" />
                                <InfoItem label="售出日期" :value="vehicle.sold_date || '未售出'" />
                            </div>
                            <div v-if="vehicle.remark" class="mt-4 pt-4 border-t border-gray-200">
                                <div class="label">备注</div>
                                <p class="text-sm text-gray-700">{{ vehicle.remark }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">价格信息</h3>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <div class="label">收购价</div>
                                    <div class="text-xl font-semibold text-gray-900">¥{{ vehicle.purchase_price?.toLocaleString() || '-' }}</div>
                                </div>
                                <div>
                                    <div class="label">整备费用</div>
                                    <div class="text-xl font-semibold text-gray-900">¥{{ vehicle.preparation_cost?.toLocaleString() || '0' }}</div>
                                </div>
                                <div>
                                    <div class="label">总成本</div>
                                    <div class="text-xl font-semibold text-gray-900">¥{{ vehicle.total_cost?.toLocaleString() || '-' }}</div>
                                </div>
                                <div>
                                    <div class="label">预期售价</div>
                                    <div class="text-xl font-semibold text-primary-600">¥{{ vehicle.expected_sale_price?.toLocaleString() || '-' }}</div>
                                </div>
                                <div>
                                    <div class="label">实际售价</div>
                                    <div class="text-xl font-semibold text-green-600">¥{{ vehicle.actual_sale_price?.toLocaleString() || '-' }}</div>
                                </div>
                                <div v-if="vehicle.profit !== null">
                                    <div class="label">利润</div>
                                    <div class="text-xl font-semibold" :class="vehicle.profit >= 0 ? 'text-green-600' : 'text-red-600'">
                                        ¥{{ vehicle.profit?.toLocaleString() }}
                                    </div>
                                </div>
                                <div v-if="vehicle.profit_margin !== null">
                                    <div class="label">利润率</div>
                                    <div class="text-xl font-semibold" :class="vehicle.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'">
                                        {{ vehicle.profit_margin }}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">整备清单</h3>
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-gray-500">
                                    完成 {{ completedPreparationCount }}/{{ vehicle.preparation_items?.length || 0 }}
                                </span>
                                <button v-if="can.add_preparation" @click="showPreparationModal = true" class="btn-primary text-sm py-1">
                                    + 添加项目
                                </button>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead class="table-head">
                                    <tr>
                                        <th class="table-th">分类</th>
                                        <th class="table-th">项目</th>
                                        <th class="table-th">预估费用</th>
                                        <th class="table-th">实际费用</th>
                                        <th class="table-th">状态</th>
                                        <th class="table-th">处理人</th>
                                        <th class="table-th">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="table-body">
                                    <tr v-for="item in vehicle.preparation_items" :key="item.id">
                                        <td class="table-td">
                                            <span class="badge-blue">{{ item.category_label || item.category }}</span>
                                        </td>
                                        <td class="table-td">
                                            <div class="font-medium">{{ item.name }}</div>
                                            <div v-if="item.description" class="text-xs text-gray-500">{{ item.description }}</div>
                                        </td>
                                        <td class="table-td">¥{{ item.estimated_cost?.toLocaleString() || '-' }}</td>
                                        <td class="table-td">¥{{ item.actual_cost?.toLocaleString() || '-' }}</td>
                                        <td class="table-td">
                                            <span :class="getPreparationStatusClass(item.status)">{{ item.status_label }}</span>
                                        </td>
                                        <td class="table-td text-sm">{{ item.handler?.name || '-' }}</td>
                                        <td class="table-td">
                                            <button @click="editPreparation(item)" class="table-link text-sm">编辑</button>
                                        </td>
                                    </tr>
                                    <tr v-if="!vehicle.preparation_items?.length">
                                        <td colspan="7" class="table-td text-center text-gray-500 py-8">暂无整备项目</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">试驾记录</h3>
                            <button v-if="can.add_test_drive" @click="showTestDriveModal = true" class="btn-primary text-sm py-1">
                                + 新增试驾
                            </button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead class="table-head">
                                    <tr>
                                        <th class="table-th">试驾时间</th>
                                        <th class="table-th">试驾人</th>
                                        <th class="table-th">里程</th>
                                        <th class="table-th">时长</th>
                                        <th class="table-th">评分</th>
                                        <th class="table-th">陪同人</th>
                                        <th class="table-th">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="table-body">
                                    <tr v-for="drive in vehicle.test_drives" :key="drive.id">
                                        <td class="table-td text-sm">{{ formatDateTime(drive.drive_at) }}</td>
                                        <td class="table-td">
                                            <div class="font-medium">{{ drive.driver_name }}</div>
                                            <div v-if="drive.driver_phone" class="text-xs text-gray-500">{{ drive.driver_phone }}</div>
                                        </td>
                                        <td class="table-td text-sm">{{ drive.actual_mileage ? drive.actual_mileage + ' km' : '-' }}</td>
                                        <td class="table-td text-sm">{{ drive.duration_minutes ? drive.duration_minutes + ' 分钟' : '-' }}</td>
                                        <td class="table-td">
                                            <span class="text-yellow-500">{{ '★'.repeat(drive.rating || 0) }}</span>
                                            <span class="text-gray-300">{{ '★'.repeat(5 - (drive.rating || 0)) }}</span>
                                        </td>
                                        <td class="table-td text-sm">{{ drive.accompanier?.name || '-' }}</td>
                                        <td class="table-td">
                                            <button @click="viewTestDrive(drive)" class="table-link text-sm">查看</button>
                                        </td>
                                    </tr>
                                    <tr v-if="!vehicle.test_drives?.length">
                                        <td colspan="7" class="table-td text-center text-gray-500 py-8">暂无试驾记录</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">报价历史</h3>
                            <button v-if="can.add_quote" @click="showQuoteModal = true" class="btn-primary text-sm py-1">
                                + 新增报价
                            </button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead class="table-head">
                                    <tr>
                                        <th class="table-th">时间</th>
                                        <th class="table-th">阶段</th>
                                        <th class="table-th">报价</th>
                                        <th class="table-th">还价</th>
                                        <th class="table-th">最终价</th>
                                        <th class="table-th">状态</th>
                                        <th class="table-th">报价人</th>
                                        <th class="table-th">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="table-body">
                                    <tr v-for="quote in vehicle.quote_histories" :key="quote.id">
                                        <td class="table-td text-sm">{{ formatDateTime(quote.created_at) }}</td>
                                        <td class="table-td"><span class="badge-blue">{{ quote.stage_label }}</span></td>
                                        <td class="table-td font-medium">¥{{ quote.quote_price?.toLocaleString() }}</td>
                                        <td class="table-td text-sm">{{ quote.counter_offer ? '¥' + quote.counter_offer.toLocaleString() : '-' }}</td>
                                        <td class="table-td text-sm text-green-600 font-medium">
                                            {{ quote.final_price ? '¥' + quote.final_price.toLocaleString() : '-' }}
                                        </td>
                                        <td class="table-td">
                                            <span :class="getQuoteStatusClass(quote.status)">{{ quote.status_label }}</span>
                                        </td>
                                        <td class="table-td text-sm">{{ quote.quoter?.name || '-' }}</td>
                                        <td class="table-td">
                                            <button @click="editQuote(quote)" class="table-link text-sm">编辑</button>
                                        </td>
                                    </tr>
                                    <tr v-if="!vehicle.quote_histories?.length">
                                        <td colspan="8" class="table-td text-center text-gray-500 py-8">暂无报价记录</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">金融资料</h3>
                            <button v-if="can.add_finance_doc" @click="showFinanceDocModal = true" class="btn-primary text-sm py-1">
                                + 添加资料
                            </button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead class="table-head">
                                    <tr>
                                        <th class="table-th">类型</th>
                                        <th class="table-th">标题/编号</th>
                                        <th class="table-th">签发日期</th>
                                        <th class="table-th">到期日期</th>
                                        <th class="table-th">状态</th>
                                        <th class="table-th">核验人</th>
                                        <th class="table-th">附件</th>
                                        <th class="table-th">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="table-body">
                                    <tr v-for="doc in vehicle.finance_documents" :key="doc.id">
                                        <td class="table-td"><span class="badge-blue">{{ doc.type_label }}</span></td>
                                        <td class="table-td">
                                            <div class="font-medium">{{ doc.title }}</div>
                                            <div v-if="doc.reference_no" class="text-xs text-gray-500">{{ doc.reference_no }}</div>
                                        </td>
                                        <td class="table-td text-sm">{{ doc.issue_date || '-' }}</td>
                                        <td class="table-td text-sm">{{ doc.expire_date || '-' }}</td>
                                        <td class="table-td">
                                            <span :class="getFinanceStatusClass(doc.status)">{{ doc.status_label }}</span>
                                        </td>
                                        <td class="table-td text-sm">{{ doc.verifier?.name || '-' }}</td>
                                        <td class="table-td">
                                            <span v-if="doc.attachments?.length" class="badge-green">{{ doc.attachments.length }} 个</span>
                                            <span v-else class="badge-red">无附件</span>
                                        </td>
                                        <td class="table-td">
                                            <div class="flex items-center gap-2">
                                                <button v-if="doc.status !== 'verified'" @click="verifyFinanceDoc(doc)" class="table-link text-sm">核验</button>
                                                <button @click="editFinanceDoc(doc)" class="table-link text-sm">编辑</button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr v-if="!vehicle.finance_documents?.length">
                                        <td colspan="8" class="table-td text-center text-gray-500 py-8">暂无金融资料</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">异常记录</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead class="table-head">
                                    <tr>
                                        <th class="table-th">时间</th>
                                        <th class="table-th">类型</th>
                                        <th class="table-th">标题</th>
                                        <th class="table-th">严重程度</th>
                                        <th class="table-th">状态</th>
                                        <th class="table-th">处理人</th>
                                        <th class="table-th">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="table-body">
                                    <tr v-for="anomaly in vehicle.anomalies" :key="anomaly.id">
                                        <td class="table-td text-sm">{{ formatDateTime(anomaly.created_at) }}</td>
                                        <td class="table-td"><span class="badge-blue">{{ anomaly.type_label }}</span></td>
                                        <td class="table-td font-medium">{{ anomaly.title }}</td>
                                        <td class="table-td">
                                            <span :class="getSeverityClass(anomaly.severity)">{{ anomaly.severity_label }}</span>
                                        </td>
                                        <td class="table-td">
                                            <span :class="getAnomalyStatusClass(anomaly.status)">{{ anomaly.status_label }}</span>
                                        </td>
                                        <td class="table-td text-sm">{{ anomaly.handler?.name || '-' }}</td>
                                        <td class="table-td">
                                            <Link :href="route('anomalies.show', anomaly.id)" class="table-link text-sm">处理</Link>
                                        </td>
                                    </tr>
                                    <tr v-if="!vehicle.anomalies?.length">
                                        <td colspan="7" class="table-td text-center text-gray-500 py-8">暂无异常记录</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">操作日志</h3>
                        </div>
                        <div class="card-body">
                            <div class="space-y-3">
                                <div
                                    v-for="log in vehicle.activity_logs"
                                    :key="log.id"
                                    class="flex items-start gap-3 p-3 bg-gray-50 rounded"
                                >
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-medium">{{ log.user?.name || '系统' }}</span>
                                            <span class="badge-gray">{{ log.action }}</span>
                                            <span class="text-xs text-gray-400">{{ formatDateTime(log.created_at) }}</span>
                                        </div>
                                        <p v-if="log.description" class="mt-1 text-sm text-gray-600">{{ log.description }}</p>
                                        <div v-if="log.before_data || log.after_data" class="mt-2 text-xs">
                                            <details class="cursor-pointer">
                                                <summary class="text-gray-500">查看变更详情</summary>
                                                <div class="mt-2 grid grid-cols-2 gap-4 text-xs">
                                                    <div v-if="log.before_data">
                                                        <div class="text-gray-500 mb-1">变更前：</div>
                                                        <pre class="bg-gray-100 p-2 rounded overflow-auto text-xs">{{ JSON.stringify(log.before_data, null, 2) }}</pre>
                                                    </div>
                                                    <div v-if="log.after_data">
                                                        <div class="text-gray-500 mb-1">变更后：</div>
                                                        <pre class="bg-gray-100 p-2 rounded overflow-auto text-xs">{{ JSON.stringify(log.after_data, null, 2) }}</pre>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">负责人</h3>
                        </div>
                        <div class="card-body space-y-3">
                            <div>
                                <div class="label">评估师</div>
                                <div class="text-sm text-gray-900">{{ vehicle.appraiser?.name || '未分配' }}</div>
                            </div>
                            <div>
                                <div class="label">负责销售</div>
                                <div class="text-sm text-gray-900">{{ vehicle.sales?.name || '未分配' }}</div>
                            </div>
                            <div>
                                <div class="label">创建人</div>
                                <div class="text-sm text-gray-900">{{ vehicle.creator?.name || '-' }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">附件管理</h3>
                        </div>
                        <div class="card-body">
                            <AttachmentUploader
                                attachable-type="App\\Models\\Vehicle"
                                :attachable-id="vehicle.id"
                                category="photo"
                                label="车辆照片"
                                :existing-attachments="vehicle.attachments"
                                can-delete
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal v-model:show="showStatusModal" title="变更车辆状态">
            <form id="statusForm" @submit.prevent="submitStatusChange" class="space-y-4">
                <div>
                    <label class="label">目标状态</label>
                    <select v-model="statusForm.status" class="select-field" required>
                        <option v-for="(label, value) in statuses" :key="value" :value="value">{{ label }}</option>
                    </select>
                </div>
                <div>
                    <label class="label">备注说明</label>
                    <textarea v-model="statusForm.remark" class="textarea-field" rows="3"></textarea>
                </div>
            </form>
            <template #footer>
                <button type="button" @click="showStatusModal = false" class="btn-secondary w-full sm:order-1">取消</button>
                <button type="submit" form="statusForm" class="btn-primary w-full sm:order-2">确认变更</button>
            </template>
        </Modal>

        <Modal v-model:show="showAnomalyModal" title="上报异常">
            <form id="anomalyForm" @submit.prevent="submitAnomaly" class="space-y-4">
                <div>
                    <label class="label">异常类型</label>
                    <select v-model="anomalyForm.type" class="select-field" required>
                        <option value="missing_doc">资料缺失</option>
                        <option value="damage_dispute">车况争议</option>
                        <option value="price_dispute">价格争议</option>
                        <option value="legal_risk">法律风险</option>
                        <option value="other">其他异常</option>
                    </select>
                </div>
                <div>
                    <label class="label">严重程度</label>
                    <select v-model="anomalyForm.severity" class="select-field" required>
                        <option value="low">低</option>
                        <option value="normal">中</option>
                        <option value="high">高</option>
                        <option value="critical">严重</option>
                    </select>
                </div>
                <div>
                    <label class="label">异常标题</label>
                    <input v-model="anomalyForm.title" type="text" class="input-field" required />
                </div>
                <div>
                    <label class="label">详细描述</label>
                    <textarea v-model="anomalyForm.description" class="textarea-field" rows="4" required></textarea>
                </div>
                <AttachmentUploader
                    attachable-type="App\\Models\\Anomaly"
                    :attachable-id="0"
                    category="document"
                    label="相关附件"
                />
            </form>
            <template #footer>
                <button type="button" @click="showAnomalyModal = false" class="btn-secondary w-full sm:order-1">取消</button>
                <button type="submit" form="anomalyForm" class="btn-danger w-full sm:order-2">确认上报</button>
            </template>
        </Modal>

        <Modal v-model:show="showPreparationModal" title="整备项目">
            <form id="preparationForm" @submit.prevent="submitPreparation" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">分类</label>
                        <select v-model="preparationForm.category" class="select-field" required>
                            <option value="exterior">外观</option>
                            <option value="interior">内饰</option>
                            <option value="mechanical">机械</option>
                            <option value="electrical">电器</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">状态</label>
                        <select v-model="preparationForm.status" class="select-field" required>
                            <option value="pending">待处理</option>
                            <option value="in_progress">处理中</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="label">项目名称</label>
                    <input v-model="preparationForm.name" type="text" class="input-field" required />
                </div>
                <div>
                    <label class="label">问题描述</label>
                    <textarea v-model="preparationForm.description" class="textarea-field" rows="3"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">预估费用</label>
                        <input v-model.number="preparationForm.estimated_cost" type="number" step="0.01" min="0" class="input-field" />
                    </div>
                    <div>
                        <label class="label">实际费用</label>
                        <input v-model.number="preparationForm.actual_cost" type="number" step="0.01" min="0" class="input-field" />
                    </div>
                </div>
                <div>
                    <label class="label">处理结果</label>
                    <textarea v-model="preparationForm.resolution" class="textarea-field" rows="2"></textarea>
                </div>
                <AttachmentUploader
                    attachable-type="App\\Models\\PreparationItem"
                    :attachable-id="editingPreparation?.id || 0"
                    category="document"
                    label="相关附件"
                    :existing-attachments="editingPreparation?.attachments || []"
                />
            </form>
            <template #footer>
                <button type="button" @click="showPreparationModal = false" class="btn-secondary w-full sm:order-1">取消</button>
                <button type="submit" form="preparationForm" class="btn-primary w-full sm:order-2">{{ editingPreparation ? '保存修改' : '添加项目' }}</button>
            </template>
        </Modal>

        <Modal v-model:show="showQuoteModal" title="报价记录">
            <form id="quoteForm" @submit.prevent="submitQuote" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">报价阶段</label>
                        <select v-model="quoteForm.stage" class="select-field" required>
                            <option value="initial">初次报价</option>
                            <option value="negotiation">议价中</option>
                            <option value="final">最终报价</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">状态</label>
                        <select v-model="quoteForm.status" class="select-field" required>
                            <option value="pending">待确认</option>
                            <option value="accepted">已接受</option>
                            <option value="rejected">已拒绝</option>
                            <option value="countered">已还价</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="label">报价金额</label>
                        <input v-model.number="quoteForm.quote_price" type="number" step="0.01" min="0" class="input-field" required />
                    </div>
                    <div>
                        <label class="label">还价金额</label>
                        <input v-model.number="quoteForm.counter_offer" type="number" step="0.01" min="0" class="input-field" />
                    </div>
                    <div>
                        <label class="label">最终成交价</label>
                        <input v-model.number="quoteForm.final_price" type="number" step="0.01" min="0" class="input-field" />
                    </div>
                </div>
                <div>
                    <label class="label">议价记录</label>
                    <textarea v-model="quoteForm.negotiation_notes" class="textarea-field" rows="3"></textarea>
                </div>
                <div>
                    <label class="label">备注</label>
                    <textarea v-model="quoteForm.remark" class="textarea-field" rows="2"></textarea>
                </div>
            </form>
            <template #footer>
                <button type="button" @click="showQuoteModal = false" class="btn-secondary w-full sm:order-1">取消</button>
                <button type="submit" form="quoteForm" class="btn-primary w-full sm:order-2">{{ editingQuote ? '保存修改' : '添加报价' }}</button>
            </template>
        </Modal>

        <Modal v-model:show="showFinanceDocModal" title="金融资料">
            <form id="financeDocForm" @submit.prevent="submitFinanceDoc" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">资料类型</label>
                        <select v-model="financeDocForm.type" class="select-field" required>
                            <option value="registration">行驶证</option>
                            <option value="vehicle_cert">车辆登记证</option>
                            <option value="purchase_invoice">购车发票</option>
                            <option value="insurance">保险单</option>
                            <option value="inspection_report">检测报告</option>
                            <option value="maintenance_record">保养记录</option>
                            <option value="other">其他资料</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">状态</label>
                        <select v-model="financeDocForm.status" class="select-field" required>
                            <option value="received">已收到</option>
                            <option value="verified">已核验</option>
                            <option value="missing">资料缺失</option>
                            <option value="expired">已过期</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="label">资料标题</label>
                    <input v-model="financeDocForm.title" type="text" class="input-field" required />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">参考编号</label>
                        <input v-model="financeDocForm.reference_no" type="text" class="input-field" />
                    </div>
                    <div></div>
                    <div>
                        <label class="label">签发日期</label>
                        <input v-model="financeDocForm.issue_date" type="date" class="input-field" />
                    </div>
                    <div>
                        <label class="label">到期日期</label>
                        <input v-model="financeDocForm.expire_date" type="date" class="input-field" />
                    </div>
                </div>
                <div>
                    <label class="label">核验说明</label>
                    <textarea v-model="financeDocForm.verification_notes" class="textarea-field" rows="2"></textarea>
                </div>
                <AttachmentUploader
                    attachable-type="App\\Models\\FinanceDocument"
                    :attachable-id="editingFinanceDoc?.id || 0"
                    category="document"
                    label="资料附件"
                    :existing-attachments="editingFinanceDoc?.attachments || []"
                />
            </form>
            <template #footer>
                <button type="button" @click="showFinanceDocModal = false" class="btn-secondary w-full sm:order-1">取消</button>
                <button type="submit" form="financeDocForm" class="btn-primary w-full sm:order-2">{{ editingFinanceDoc ? '保存修改' : '添加资料' }}</button>
            </template>
        </Modal>

        <Modal v-model:show="showTestDriveModal" title="试驾详情">
            <form id="testDriveForm" @submit.prevent="submitTestDrive" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">试驾时间</label>
                        <input v-model="testDriveForm.drive_at" type="datetime-local" class="input-field" required />
                    </div>
                    <div>
                        <label class="label">时长(分钟)</label>
                        <input v-model.number="testDriveForm.duration_minutes" type="number" min="1" class="input-field" />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">试驾人姓名</label>
                        <input v-model="testDriveForm.driver_name" type="text" class="input-field" required />
                    </div>
                    <div>
                        <label class="label">联系电话</label>
                        <input v-model="testDriveForm.driver_phone" type="text" class="input-field" />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">起始里程(km)</label>
                        <input v-model.number="testDriveForm.start_mileage" type="number" min="0" class="input-field" required />
                    </div>
                    <div>
                        <label class="label">结束里程(km)</label>
                        <input v-model.number="testDriveForm.end_mileage" type="number" min="0" class="input-field" />
                    </div>
                </div>
                <div>
                    <label class="label">试驾路线</label>
                    <input v-model="testDriveForm.route" type="text" class="input-field" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">动力表现</label>
                        <textarea v-model="testDriveForm.performance" class="textarea-field" rows="2"></textarea>
                    </div>
                    <div>
                        <label class="label">刹车情况</label>
                        <textarea v-model="testDriveForm.brake_condition" class="textarea-field" rows="2"></textarea>
                    </div>
                    <div>
                        <label class="label">转向情况</label>
                        <textarea v-model="testDriveForm.steering_condition" class="textarea-field" rows="2"></textarea>
                    </div>
                    <div>
                        <label class="label">异响情况</label>
                        <textarea v-model="testDriveForm.abnormal_noise" class="textarea-field" rows="2"></textarea>
                    </div>
                </div>
                <div>
                    <label class="label">综合评分</label>
                    <div class="flex items-center gap-2">
                        <button v-for="i in 5" :key="i" type="button" @click="testDriveForm.rating = i" class="text-2xl">
                            {{ i <= (testDriveForm.rating || 0) ? '★' : '☆' }}
                        </button>
                    </div>
                </div>
                <div>
                    <label class="label">其他问题</label>
                    <textarea v-model="testDriveForm.other_issues" class="textarea-field" rows="2"></textarea>
                </div>
                <div>
                    <label class="label">综合评价</label>
                    <textarea v-model="testDriveForm.overall_evaluation" class="textarea-field" rows="3"></textarea>
                </div>
                <AttachmentUploader
                    attachable-type="App\\Models\\TestDrive"
                    :attachable-id="editingTestDrive?.id || 0"
                    category="photo"
                    label="相关照片"
                    :existing-attachments="editingTestDrive?.attachments || []"
                />
            </form>
            <template #footer>
                <button type="button" @click="showTestDriveModal = false" class="btn-secondary w-full sm:order-1">取消</button>
                <button type="submit" form="testDriveForm" class="btn-primary w-full sm:order-2">{{ editingTestDrive ? '保存修改' : '添加试驾' }}</button>
            </template>
        </Modal>
    </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';
import VehicleStatusBadge from '@/Components/VehicleStatusBadge.vue';
import Modal from '@/Components/Modal.vue';
import AttachmentUploader from '@/Components/AttachmentUploader.vue';
import InfoItem from '@/Components/InfoItem.vue';

const props = defineProps({
    vehicle: Object,
    can: Object,
});

const statuses = {
    pending: '评估中',
    preparing: '整备中',
    available: '在库',
    sold: '已售',
    cancelled: '已取消',
};

const showStatusModal = ref(false);
const showAnomalyModal = ref(false);
const showPreparationModal = ref(false);
const showQuoteModal = ref(false);
const showFinanceDocModal = ref(false);
const showTestDriveModal = ref(false);

const editingPreparation = ref(null);
const editingQuote = ref(null);
const editingFinanceDoc = ref(null);
const editingTestDrive = ref(null);

const statusForm = reactive({ status: props.vehicle.status, remark: '' });
const anomalyForm = reactive({ type: 'missing_doc', severity: 'normal', title: '', description: '' });
const preparationForm = reactive({
    id: null, category: 'exterior', name: '', description: '',
    estimated_cost: null, actual_cost: null, status: 'pending', resolution: '',
});
const quoteForm = reactive({
    id: null, stage: 'initial', quote_price: null, counter_offer: null,
    final_price: null, status: 'pending', negotiation_notes: '', remark: '',
});
const financeDocForm = reactive({
    id: null, type: 'registration', title: '', reference_no: '',
    issue_date: '', expire_date: '', status: 'received', verification_notes: '',
});
const testDriveForm = reactive({
    id: null, drive_at: '', driver_name: '', driver_phone: '',
    start_mileage: 0, end_mileage: null, duration_minutes: null, route: '',
    performance: '', brake_condition: '', steering_condition: '',
    abnormal_noise: '', other_issues: '', rating: null, overall_evaluation: '',
});

const completedPreparationCount = computed(() => {
    return props.vehicle.preparation_items?.filter(i => i.status === 'completed').length || 0;
});

const formatDateTime = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('zh-CN');
};

const getPreparationStatusClass = (status) => {
    const classes = { pending: 'badge-yellow', in_progress: 'badge-blue', completed: 'badge-green', cancelled: 'badge-gray' };
    return classes[status] || 'badge-gray';
};

const getQuoteStatusClass = (status) => {
    const classes = { pending: 'badge-yellow', accepted: 'badge-green', rejected: 'badge-red', countered: 'badge-blue' };
    return classes[status] || 'badge-gray';
};

const getFinanceStatusClass = (status) => {
    const classes = { received: 'badge-blue', verified: 'badge-green', missing: 'badge-red', expired: 'badge-gray' };
    return classes[status] || 'badge-gray';
};

const getSeverityClass = (severity) => {
    const classes = { low: 'badge-gray', normal: 'badge-yellow', high: 'badge-red', critical: 'badge-red' };
    return classes[severity] || 'badge-gray';
};

const getAnomalyStatusClass = (status) => {
    const classes = { open: 'badge-red', in_progress: 'badge-yellow', escalated: 'badge-purple', resolved: 'badge-green', closed: 'badge-gray' };
    return classes[status] || 'badge-gray';
};

const submitStatusChange = () => {
    router.post(route('vehicles.update-status', props.vehicle.id), statusForm, {
        preserveState: true,
        onSuccess: () => { showStatusModal.value = false; },
    });
};

const submitAnomaly = () => {
    router.post(route('vehicles.anomalies.store', props.vehicle.id), anomalyForm, {
        preserveState: true,
        onSuccess: () => {
            showAnomalyModal.value = false;
            anomalyForm.title = '';
            anomalyForm.description = '';
        },
    });
};

const resetPreparationForm = () => {
    preparationForm.id = null;
    preparationForm.category = 'exterior';
    preparationForm.name = '';
    preparationForm.description = '';
    preparationForm.estimated_cost = null;
    preparationForm.actual_cost = null;
    preparationForm.status = 'pending';
    preparationForm.resolution = '';
};

const editPreparation = (item) => {
    editingPreparation.value = item;
    Object.assign(preparationForm, {
        id: item.id, category: item.category, name: item.name, description: item.description,
        estimated_cost: item.estimated_cost, actual_cost: item.actual_cost,
        status: item.status, resolution: item.resolution,
    });
    showPreparationModal.value = true;
};

const submitPreparation = () => {
    const payload = { ...preparationForm };
    delete payload.id;
    if (editingPreparation.value) {
        router.put(route('vehicles.preparations.update', [props.vehicle.id, editingPreparation.value.id]), payload, {
            preserveState: true,
            onSuccess: () => {
                showPreparationModal.value = false;
                editingPreparation.value = null;
                resetPreparationForm();
            },
        });
    } else {
        router.post(route('vehicles.preparations.store', props.vehicle.id), payload, {
            preserveState: true,
            onSuccess: () => {
                showPreparationModal.value = false;
                resetPreparationForm();
            },
        });
    }
};

const resetQuoteForm = () => {
    editingQuote.value = null;
    quoteForm.id = null;
    quoteForm.stage = 'initial';
    quoteForm.quote_price = null;
    quoteForm.counter_offer = null;
    quoteForm.final_price = null;
    quoteForm.status = 'pending';
    quoteForm.negotiation_notes = '';
    quoteForm.remark = '';
};

const editQuote = (quote) => {
    editingQuote.value = quote;
    Object.assign(quoteForm, {
        id: quote.id, stage: quote.stage, quote_price: quote.quote_price,
        counter_offer: quote.counter_offer, final_price: quote.final_price,
        status: quote.status, negotiation_notes: quote.negotiation_notes, remark: quote.remark,
    });
    showQuoteModal.value = true;
};

const submitQuote = () => {
    const payload = { ...quoteForm };
    delete payload.id;
    if (editingQuote.value) {
        router.put(route('vehicles.quotes.update', [props.vehicle.id, editingQuote.value.id]), payload, {
            preserveState: true,
            onSuccess: () => { showQuoteModal.value = false; resetQuoteForm(); },
        });
    } else {
        router.post(route('vehicles.quotes.store', props.vehicle.id), payload, {
            preserveState: true,
            onSuccess: () => { showQuoteModal.value = false; resetQuoteForm(); },
        });
    }
};

const resetFinanceDocForm = () => {
    editingFinanceDoc.value = null;
    financeDocForm.id = null;
    financeDocForm.type = 'registration';
    financeDocForm.title = '';
    financeDocForm.reference_no = '';
    financeDocForm.issue_date = '';
    financeDocForm.expire_date = '';
    financeDocForm.status = 'received';
    financeDocForm.verification_notes = '';
};

const editFinanceDoc = (doc) => {
    editingFinanceDoc.value = doc;
    Object.assign(financeDocForm, {
        id: doc.id, type: doc.type, title: doc.title, reference_no: doc.reference_no,
        issue_date: doc.issue_date, expire_date: doc.expire_date,
        status: doc.status, verification_notes: doc.verification_notes,
    });
    showFinanceDocModal.value = true;
};

const verifyFinanceDoc = (doc) => {
    const notes = prompt('请输入核验说明（可选）：');
    if (notes === null) return;
    router.post(route('vehicles.finance-documents.verify', [props.vehicle.id, doc.id]), {
        verification_notes: notes,
    }, { preserveState: true });
};

const submitFinanceDoc = () => {
    const payload = { ...financeDocForm };
    delete payload.id;
    if (editingFinanceDoc.value) {
        router.put(route('vehicles.finance-documents.update', [props.vehicle.id, editingFinanceDoc.value.id]), payload, {
            preserveState: true,
            onSuccess: () => { showFinanceDocModal.value = false; resetFinanceDocForm(); },
        });
    } else {
        router.post(route('vehicles.finance-documents.store', props.vehicle.id), payload, {
            preserveState: true,
            onSuccess: () => { showFinanceDocModal.value = false; resetFinanceDocForm(); },
        });
    }
};

const resetTestDriveForm = () => {
    editingTestDrive.value = null;
    Object.assign(testDriveForm, {
        id: null, drive_at: '', driver_name: '', driver_phone: '',
        start_mileage: 0, end_mileage: null, duration_minutes: null, route: '',
        performance: '', brake_condition: '', steering_condition: '',
        abnormal_noise: '', other_issues: '', rating: null, overall_evaluation: '',
    });
};

const viewTestDrive = (drive) => {
    editingTestDrive.value = drive;
    Object.assign(testDriveForm, {
        id: drive.id,
        drive_at: drive.drive_at ? new Date(drive.drive_at).toISOString().slice(0, 16) : '',
        driver_name: drive.driver_name, driver_phone: drive.driver_phone,
        start_mileage: drive.start_mileage, end_mileage: drive.end_mileage,
        duration_minutes: drive.duration_minutes, route: drive.route,
        performance: drive.performance, brake_condition: drive.brake_condition,
        steering_condition: drive.steering_condition, abnormal_noise: drive.abnormal_noise,
        other_issues: drive.other_issues, rating: drive.rating, overall_evaluation: drive.overall_evaluation,
    });
    showTestDriveModal.value = true;
};

const submitTestDrive = () => {
    const payload = { ...testDriveForm };
    delete payload.id;
    if (editingTestDrive.value) {
        router.put(route('vehicles.test-drives.update', [props.vehicle.id, editingTestDrive.value.id]), payload, {
            preserveState: true,
            onSuccess: () => { showTestDriveModal.value = false; resetTestDriveForm(); },
        });
    } else {
        router.post(route('vehicles.test-drives.store', props.vehicle.id), payload, {
            preserveState: true,
            onSuccess: () => { showTestDriveModal.value = false; resetTestDriveForm(); },
        });
    }
};
</script>

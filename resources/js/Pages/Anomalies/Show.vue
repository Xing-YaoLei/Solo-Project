<template>
    <AppLayout :title="'异常 #' + anomaly.id">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <Link :href="route('anomalies.index')" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">异常 #{{ anomaly.id }}</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span :class="getSeverityClass(anomaly.severity)">{{ anomaly.severity_label }}</span>
                            <span :class="getStatusClass(anomaly.status)">{{ anomaly.status_label }}</span>
                            <span class="badge-blue">{{ anomaly.type_label }}</span>
                            <span class="text-sm text-gray-500">来源: {{ anomaly.source_label }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button v-if="can.escalate && anomaly.status !== 'escalated'" @click="escalate" class="btn-secondary text-sm py-1">
                        升级处理
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">异常详情</h3>
                        </div>
                        <div class="card-body space-y-4">
                            <div>
                                <div class="label">标题</div>
                                <div class="text-gray-900 font-medium">{{ anomaly.title }}</div>
                            </div>
                            <div>
                                <div class="label">详细描述</div>
                                <div class="text-gray-700 whitespace-pre-wrap">{{ anomaly.description }}</div>
                            </div>
                            <div v-if="anomaly.resolution">
                                <div class="label">解决方案</div>
                                <div class="text-gray-700 whitespace-pre-wrap">{{ anomaly.resolution }}</div>
                            </div>
                            <div v-if="anomaly.conclusion">
                                <div class="label">最终结论（店长审批）</div>
                                <div class="text-gray-700 whitespace-pre-wrap">{{ anomaly.conclusion }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">处理前后对比</h3>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div class="label mb-2">处理前</div>
                                    <pre v-if="anomaly.before_snapshot" class="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
{{ JSON.stringify(anomaly.before_snapshot, null, 2) }}
                                    </pre>
                                    <div v-else class="text-sm text-gray-500">无记录</div>
                                </div>
                                <div>
                                    <div class="label mb-2">处理后</div>
                                    <pre v-if="anomaly.after_snapshot" class="bg-green-50 p-4 rounded text-xs overflow-auto max-h-96">
{{ JSON.stringify(anomaly.after_snapshot, null, 2) }}
                                    </pre>
                                    <div v-else class="text-sm text-gray-500">尚未处理完成</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">相关附件</h3>
                        </div>
                        <div class="card-body">
                            <AttachmentUploader
                                attachable-type="App\\Models\\Anomaly"
                                :attachable-id="anomaly.id"
                                category="document"
                                label="上传凭证"
                                :existing-attachments="anomaly.attachments"
                                can-delete
                            />
                        </div>
                    </div>

                    <div v-if="can.handle && anomaly.is_open" class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">处理异常</h3>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="handleAnomaly" class="space-y-4">
                                <div>
                                    <label class="label">状态</label>
                                    <select v-model="handleForm.status" class="select-field" required>
                                        <option value="in_progress">处理中</option>
                                        <option value="resolved">已解决</option>
                                        <option v-if="can.approve" value="closed">已关闭</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label">严重程度</label>
                                    <select v-model="handleForm.severity" class="select-field" required>
                                        <option value="low">低</option>
                                        <option value="normal">中</option>
                                        <option value="high">高</option>
                                        <option value="critical">严重</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="label">解决方案</label>
                                    <textarea v-model="handleForm.resolution" class="textarea-field" rows="4" placeholder="请详细描述处理过程和解决方案..."></textarea>
                                </div>
                                <div v-if="can.approve">
                                    <label class="label">最终结论（店长审批）</label>
                                    <textarea v-model="handleForm.conclusion" class="textarea-field" rows="3" placeholder="请填写审批结论..."></textarea>
                                </div>
                                <div class="flex justify-end">
                                    <button type="submit" class="btn-primary">提交处理</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div v-else-if="can.approve && anomaly.status === 'escalated'" class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">店长审批</h3>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="approveAnomaly" class="space-y-4">
                                <div>
                                    <label class="label">审批结论 *</label>
                                    <textarea v-model="approveForm.conclusion" class="textarea-field" rows="4" required placeholder="请填写最终审批结论..."></textarea>
                                </div>
                                <div class="flex justify-end">
                                    <button type="submit" class="btn-success">审批并关闭</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">关联车辆</h3>
                        </div>
                        <div class="card-body" v-if="anomaly.vehicle">
                            <Link :href="route('vehicles.show', anomaly.vehicle.id)" class="block hover:bg-gray-50 rounded p-3 -m-3">
                                <div class="font-medium text-primary-600">{{ anomaly.vehicle.brand }} {{ anomaly.vehicle.model }}</div>
                                <div class="text-sm text-gray-500 mt-1">
                                    车牌: {{ anomaly.vehicle.plate_no || '待上牌' }}
                                </div>
                                <div class="text-xs text-gray-400 font-mono mt-1">
                                    VIN: {{ anomaly.vehicle.vin }}
                                </div>
                            </Link>
                        </div>
                        <div v-else class="card-body text-sm text-gray-500">
                            未关联车辆
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">人员信息</h3>
                        </div>
                        <div class="card-body space-y-3">
                            <div>
                                <div class="label">上报人</div>
                                <div class="text-sm text-gray-900">{{ anomaly.reporter?.name || '-' }}</div>
                            </div>
                            <div>
                                <div class="label">处理人</div>
                                <div class="text-sm text-gray-900">{{ anomaly.handler?.name || '未分配' }}</div>
                            </div>
                            <div>
                                <div class="label">审批人</div>
                                <div class="text-sm text-gray-900">{{ anomaly.approver?.name || '-' }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-lg font-medium text-gray-900">时间信息</h3>
                        </div>
                        <div class="card-body space-y-3">
                            <div>
                                <div class="label">创建时间</div>
                                <div class="text-sm text-gray-900">{{ formatDateTime(anomaly.created_at) }}</div>
                            </div>
                            <div>
                                <div class="label">解决时间</div>
                                <div class="text-sm text-gray-900">{{ formatDateTime(anomaly.resolved_at) }}</div>
                            </div>
                            <div>
                                <div class="label">更新时间</div>
                                <div class="text-sm text-gray-900">{{ formatDateTime(anomaly.updated_at) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { reactive } from 'vue';
import { router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/AppLayout.vue';
import AttachmentUploader from '@/Components/AttachmentUploader.vue';

const props = defineProps({
    anomaly: Object,
    can: Object,
});

const handleForm = reactive({
    status: props.anomaly.status === 'open' ? 'in_progress' : props.anomaly.status,
    severity: props.anomaly.severity,
    resolution: props.anomaly.resolution || '',
    conclusion: '',
});

const approveForm = reactive({
    conclusion: '',
});

const formatDateTime = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('zh-CN');
};

const getSeverityClass = (severity) => {
    const classes = { low: 'badge-gray', normal: 'badge-yellow', high: 'badge-red', critical: 'badge-red' };
    return classes[severity] || 'badge-gray';
};

const getStatusClass = (status) => {
    const classes = { open: 'badge-red', in_progress: 'badge-yellow', escalated: 'badge-purple', resolved: 'badge-green', closed: 'badge-gray' };
    return classes[status] || 'badge-gray';
};

const handleAnomaly = () => {
    router.put(route('anomalies.handle', props.anomaly.id), handleForm, {
        preserveState: true,
    });
};

const approveAnomaly = () => {
    router.post(route('anomalies.approve', props.anomaly.id), approveForm, {
        preserveState: true,
    });
};

const escalate = () => {
    if (!confirm('确定要升级此异常，需要店长介入处理吗？')) return;
    router.post(route('anomalies.escalate', props.anomaly.id), {}, {
        preserveState: true,
    });
};
</script>

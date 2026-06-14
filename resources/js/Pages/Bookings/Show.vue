<template>
    <AppLayout :title="`预约详情 - ${booking.booking_no}`">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <Link :href="route('dashboard')" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                        ← 返回工作台
                    </Link>
                    <h1 class="text-2xl font-bold text-gray-900">
                        预约详情
                        <span class="text-lg font-mono text-gray-500 ml-2">{{ booking.booking_no }}</span>
                    </h1>
                </div>
                <div class="flex gap-2">
                    <Link v-if="booking.can_edit" :href="route('bookings.edit', booking.id)" class="btn-secondary">
                        编辑
                    </Link>
                    <button v-if="booking.status === 'completed' || booking.status === 'cancelled'" @click="closeBooking" class="btn-secondary">
                        关闭记录
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <div class="card">
                        <div class="card-header flex justify-between items-center">
                            <h2 class="text-lg font-semibold">基本信息</h2>
                            <span :class="getStatusBadgeClass(booking.status)">
                                {{ booking.status_label }}
                            </span>
                        </div>
                        <div class="card-body grid grid-cols-2 gap-4">
                            <div>
                                <label class="label">学员姓名</label>
                                <p class="text-gray-900 font-medium">{{ booking.student_name }}</p>
                            </div>
                            <div>
                                <label class="label">年龄 / 性别</label>
                                <p class="text-gray-900">{{ booking.age || '-' }} 岁 / {{ genderLabel }}</p>
                            </div>
                            <div>
                                <label class="label">家长姓名</label>
                                <p class="text-gray-900">{{ booking.parent_name || '-' }}</p>
                            </div>
                            <div>
                                <label class="label">联系电话</label>
                                <p class="text-gray-900 font-mono">{{ booking.phone }}</p>
                            </div>
                            <div>
                                <label class="label">来源渠道</label>
                                <p class="text-gray-900">{{ booking.source_channel || '-' }}</p>
                            </div>
                            <div>
                                <label class="label">来源详情</label>
                                <p class="text-gray-900">{{ booking.source_detail || '-' }}</p>
                            </div>
                            <div>
                                <label class="label">试听课程</label>
                                <p class="text-gray-900">{{ booking.course?.name || '-' }}</p>
                            </div>
                            <div>
                                <label class="label">责任人</label>
                                <p class="text-gray-900">{{ booking.assigned_to?.name || '未分配' }}</p>
                            </div>
                            <div class="col-span-2">
                                <label class="label">备注</label>
                                <p class="text-gray-900 whitespace-pre-wrap">{{ booking.remark || '-' }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header flex justify-between items-center">
                            <h2 class="text-lg font-semibold">时段与容量</h2>
                            <div class="flex items-center gap-2">
                                <span v-if="capacityInfo?.is_full" class="badge badge-danger">已满</span>
                                <span v-else-if="capacityInfo?.is_warning" class="badge badge-warning">预警</span>
                                <span v-else class="badge badge-success">正常</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-4 gap-4">
                                <div>
                                    <label class="label">试听日期</label>
                                    <p class="text-lg font-semibold text-gray-900">{{ booking.trial_date }}</p>
                                </div>
                                <div>
                                    <label class="label">时段</label>
                                    <p class="text-lg font-semibold text-gray-900">{{ booking.time_slot?.name }}</p>
                                </div>
                                <div>
                                    <label class="label">容量</label>
                                    <p class="text-lg font-semibold text-gray-900">
                                        {{ capacityInfo?.booked_count || 0 }} / {{ capacityInfo?.max_capacity || '-' }}
                                    </p>
                                </div>
                                <div>
                                    <label class="label">剩余名额</label>
                                    <p :class="['text-lg font-semibold', capacityInfo?.available_count > 0 ? 'text-green-600' : 'text-red-600']">
                                        {{ capacityInfo?.available_count ?? '-' }}
                                    </p>
                                </div>
                            </div>

                            <div class="mt-4">
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        :class="[
                                            'h-2.5 rounded-full transition-all',
                                            capacityInfo?.is_full ? 'bg-red-500' : capacityInfo?.is_warning ? 'bg-yellow-500' : 'bg-green-500'
                                        ]"
                                        :style="{ width: capacityPercent + '%' }"
                                    />
                                </div>
                                <div class="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0</span>
                                    <span>预警: {{ capacityInfo?.warn_capacity || 0 }}</span>
                                    <span>上限: {{ capacityInfo?.max_capacity || 0 }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="booking.conflicts && booking.conflicts.length > 0" class="card border-red-200">
                        <div class="card-header bg-red-50 border-red-200">
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 class="text-lg font-semibold text-red-800">冲突检测</h2>
                                <span class="badge badge-danger">{{ booking.conflicts.length }} 个冲突</span>
                            </div>
                        </div>
                        <div class="card-body space-y-3">
                            <div v-for="conflict in booking.conflicts" :key="conflict.id" class="p-3 bg-red-50 rounded-lg border border-red-100">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <span class="font-medium text-red-800">{{ conflict.conflict_type_label }}</span>
                                        <p class="text-sm text-red-600 mt-1">{{ conflict.conflict_description }}</p>
                                        <div v-if="conflict.related_booking" class="text-sm text-gray-600 mt-2">
                                            关联预约:
                                            <Link :href="route('bookings.show', conflict.related_booking.id)" class="text-blue-600 hover:underline">
                                                {{ conflict.related_booking.booking_no }} - {{ conflict.related_booking.student_name }}
                                            </Link>
                                        </div>
                                    </div>
                                    <span v-if="conflict.resolved" class="badge badge-success">已解决</span>
                                    <span v-else class="badge badge-danger">未解决</span>
                                </div>
                                <div v-if="conflict.resolved && conflict.resolution_note" class="mt-2 pt-2 border-t border-red-100">
                                    <p class="text-sm text-gray-600">
                                        解决方式: {{ conflict.resolution_note }}
                                    </p>
                                    <p class="text-xs text-gray-400 mt-1">
                                        {{ conflict.resolved_by?.name }} 于 {{ conflict.resolved_at }} 处理
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header flex justify-between items-center">
                            <h2 class="text-lg font-semibold">跟进记录</h2>
                            <button v-if="booking.can_edit" @click="showFollowUpModal = true" class="btn-primary text-xs">
                                添加跟进
                            </button>
                        </div>
                        <div class="card-body">
                            <div v-if="booking.follow_ups && booking.follow_ups.length > 0" class="space-y-4">
                                <div v-for="followUp in booking.follow_ups" :key="followUp.id" class="flex gap-4">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span class="text-blue-600 font-medium text-sm">
                                                {{ followUp.created_by?.name?.charAt(0) || '?' }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium text-gray-900">{{ followUp.created_by?.name }}</span>
                                            <span class="badge badge-info">{{ followUp.type_label }}</span>
                                            <span v-if="followUp.result" :class="getResultBadgeClass(followUp.result)">
                                                {{ followUp.result_label }}
                                            </span>
                                            <span class="text-xs text-gray-400">{{ followUp.follow_up_at }}</span>
                                        </div>
                                        <p class="text-gray-700 mt-1 whitespace-pre-wrap">{{ followUp.content }}</p>
                                        <div v-if="followUp.next_action" class="mt-2 text-sm text-gray-500">
                                            下一步: {{ followUp.next_action }}
                                            <span v-if="followUp.next_follow_up_at"> ({{ followUp.next_follow_up_at }})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-8 text-gray-500">
                                暂无跟进记录
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header flex justify-between items-center">
                            <h2 class="text-lg font-semibold">复盘记录</h2>
                            <button v-if="booking.status === 'completed' && booking.can_edit" @click="showReviewModal = true" class="btn-secondary text-xs">
                                {{ booking.reviewed_at ? '编辑复盘' : '添加复盘' }}
                            </button>
                        </div>
                        <div class="card-body">
                            <div v-if="booking.reviewed_at">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-sm text-gray-500">复盘人: {{ booking.reviewed_by?.name }}</span>
                                    <span class="text-sm text-gray-500">复盘时间: {{ booking.reviewed_at }}</span>
                                </div>
                                <div v-if="booking.review_tags && booking.review_tags.length > 0" class="mb-3">
                                    <div class="flex flex-wrap gap-2">
                                        <span v-for="tag in booking.review_tags" :key="tag" class="badge badge-info">
                                            {{ tag }}
                                        </span>
                                    </div>
                                </div>
                                <p v-if="booking.review_note" class="text-gray-700 whitespace-pre-wrap">{{ booking.review_note }}</p>
                            </div>
                            <div v-else class="text-center py-8 text-gray-500">
                                暂无复盘记录
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">操作面板</h2>
                        </div>
                        <div class="card-body space-y-3">
                            <div v-if="booking.status === 'pending'">
                                <button @click="changeStatus('confirmed')" class="w-full btn-primary justify-center">
                                    确认预约
                                </button>
                            </div>
                            <div v-if="booking.status === 'confirmed' || booking.status === 'pending'">
                                <button @click="showCompleteModal = true" class="w-full btn-primary justify-center">
                                    完成试听
                                </button>
                            </div>
                            <div v-if="['pending', 'confirmed'].includes(booking.status)">
                                <button @click="showEscalateModal = true" class="w-full btn-danger justify-center">
                                    升级复核
                                </button>
                            </div>
                            <div v-if="booking.status === 'escalated'">
                                <button @click="changeStatus('confirmed')" class="w-full btn-primary justify-center">
                                    复核通过
                                </button>
                            </div>
                            <div v-if="booking.status === 'need_info'">
                                <button @click="changeStatus('pending')" class="w-full btn-primary justify-center">
                                    资料已补齐
                                </button>
                            </div>
                            <div v-if="['pending', 'confirmed', 'need_info', 'escalated'].includes(booking.status)">
                                <button @click="showCancelModal = true" class="w-full btn-secondary justify-center text-red-600">
                                    取消预约
                                </button>
                            </div>

                            <div class="pt-3 border-t border-gray-200">
                                <h3 class="text-sm font-medium text-gray-700 mb-2">快速变更状态</h3>
                                <div class="flex flex-wrap gap-2">
                                    <button
                                        v-for="transition in statusTransitions"
                                        :key="transition.value"
                                        @click="changeStatus(transition.value)"
                                        class="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                    >
                                        {{ transition.label }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">到场情况</h2>
                        </div>
                        <div class="card-body">
                            <div v-if="booking.status === 'completed' || booking.status === 'closed'">
                                <div class="flex items-center gap-2 mb-2">
                                    <span v-if="booking.attended" class="badge badge-success">已到场</span>
                                    <span v-else-if="booking.attended === false" class="badge badge-danger">未到场</span>
                                    <span v-else class="badge badge-gray">未记录</span>
                                </div>
                                <p v-if="booking.attendance_note" class="text-sm text-gray-600">
                                    {{ booking.attendance_note }}
                                </p>
                            </div>
                            <div v-else class="text-gray-500 text-sm">
                                试听未完成
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">操作日志</h2>
                            <p class="text-xs text-gray-500">复核依据追踪</p>
                        </div>
                        <div class="card-body max-h-96 overflow-y-auto">
                            <div v-if="auditLogs && auditLogs.length > 0" class="space-y-3">
                                <div v-for="log in auditLogs" :key="log.id" class="text-sm border-l-2 border-gray-200 pl-3 py-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium text-gray-700">{{ log.action_label }}</span>
                                        <span class="text-xs text-gray-400">{{ log.created_at }}</span>
                                    </div>
                                    <p v-if="log.description" class="text-gray-500 text-xs mt-1">{{ log.description }}</p>
                                    <p v-if="log.user" class="text-xs text-gray-400 mt-1">
                                        操作人: {{ log.user.name }}
                                    </p>
                                </div>
                            </div>
                            <div v-else class="text-center py-4 text-gray-500 text-sm">
                                暂无操作日志
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="text-lg font-semibold">创建信息</h2>
                        </div>
                        <div class="card-body text-sm space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500">创建人</span>
                                <span class="text-gray-900">{{ booking.created_by?.name || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">创建时间</span>
                                <span class="text-gray-900">{{ booking.created_at }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">更新时间</span>
                                <span class="text-gray-900">{{ booking.updated_at }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">状态变更时间</span>
                                <span class="text-gray-900">{{ booking.status_updated_at || '-' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showFollowUpModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold">添加跟进记录</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="label">跟进方式</label>
                        <select v-model="followUpForm.type" class="select-field">
                            <option value="call">电话</option>
                            <option value="wechat">微信</option>
                            <option value="visit">到访</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">跟进时间</label>
                        <input v-model="followUpForm.follow_up_at" type="datetime-local" class="input-field" />
                    </div>
                    <div>
                        <label class="label">跟进内容</label>
                        <textarea v-model="followUpForm.content" rows="4" class="input-field" placeholder="请输入跟进内容..."></textarea>
                    </div>
                    <div>
                        <label class="label">跟进结果</label>
                        <select v-model="followUpForm.result" class="select-field">
                            <option value="">请选择</option>
                            <option value="interested">有意向</option>
                            <option value="pending">待定</option>
                            <option value="not_interested">无意向</option>
                            <option value="need_info">需补资料</option>
                            <option value="escalated">需升级</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">下一步行动</label>
                        <input v-model="followUpForm.next_action" type="text" class="input-field" placeholder="下一步计划..." />
                    </div>
                    <div>
                        <label class="label">下次跟进时间</label>
                        <input v-model="followUpForm.next_follow_up_at" type="datetime-local" class="input-field" />
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button @click="showFollowUpModal = false" class="btn-secondary">取消</button>
                    <button @click="submitFollowUp" class="btn-primary">提交</button>
                </div>
            </div>
        </div>

        <div v-if="showCompleteModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold">完成试听</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="label">到场情况</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="completeForm.attended" :value="true" />
                                <span>已到场</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="completeForm.attended" :value="false" />
                                <span>未到场</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="label">备注</label>
                        <textarea v-model="completeForm.attendance_note" rows="3" class="input-field" placeholder="请输入备注..."></textarea>
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button @click="showCompleteModal = false" class="btn-secondary">取消</button>
                    <button @click="submitComplete" class="btn-primary">确认完成</button>
                </div>
            </div>
        </div>

        <div v-if="showCancelModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold">取消预约</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="label">取消原因</label>
                        <textarea v-model="cancelForm.reason" rows="3" class="input-field" placeholder="请输入取消原因..."></textarea>
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button @click="showCancelModal = false" class="btn-secondary">取消</button>
                    <button @click="submitCancel" class="btn-danger">确认取消</button>
                </div>
            </div>
        </div>

        <div v-if="showEscalateModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold">升级复核</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="label">升级原因</label>
                        <textarea v-model="escalateForm.reason" rows="3" class="input-field" placeholder="请输入升级原因..."></textarea>
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button @click="showEscalateModal = false" class="btn-secondary">取消</button>
                    <button @click="submitEscalate" class="btn-danger">确认升级</button>
                </div>
            </div>
        </div>

        <div v-if="showReviewModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold">复盘记录</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="label">复盘标签</label>
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span
                                v-for="tag in availableTags"
                                :key="tag"
                                @click="toggleTag(tag)"
                                :class="[
                                    'px-3 py-1 rounded-full text-sm cursor-pointer border',
                                    reviewForm.review_tags.includes(tag)
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                ]"
                            >
                                {{ tag }}
                            </span>
                        </div>
                        <input
                            v-model="newTag"
                            type="text"
                            class="input-field text-sm"
                            placeholder="输入新标签后回车添加"
                            @keyup.enter="addNewTag"
                        />
                    </div>
                    <div>
                        <label class="label">复盘备注</label>
                        <textarea v-model="reviewForm.review_note" rows="4" class="input-field" placeholder="请输入复盘内容..."></textarea>
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button @click="showReviewModal = false" class="btn-secondary">取消</button>
                    <button @click="submitReview" class="btn-primary">保存</button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Link, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage();
const props = page.props;

const booking = props.booking;
const auditLogs = props.auditLogs;
const statusTransitions = props.statusTransitions;
const capacityInfo = props.capacityInfo;

const showFollowUpModal = ref(false);
const showCompleteModal = ref(false);
const showCancelModal = ref(false);
const showEscalateModal = ref(false);
const showReviewModal = ref(false);

const followUpForm = ref({
    type: 'call',
    content: '',
    follow_up_at: new Date().toISOString().slice(0, 16),
    next_follow_up_at: '',
    next_action: '',
    result: '',
});

const completeForm = ref({
    attended: true,
    attendance_note: '',
});

const cancelForm = ref({
    reason: '',
});

const escalateForm = ref({
    reason: '',
    escalated_to: null,
});

const reviewForm = ref({
    review_note: booking.review_note || '',
    review_tags: booking.review_tags || [],
});

const newTag = ref('');

const availableTags = [
    '高意向',
    '低意向',
    '价格敏感',
    '时间冲突',
    '距离远',
    '教学质量',
    '服务态度',
    '环境好',
    '推荐朋友',
    '需考虑',
];

const genderLabel = computed(() => {
    const labels = { male: '男', female: '女', unknown: '未知' };
    return labels[booking.gender] || '未知';
});

const capacityPercent = computed(() => {
    if (!capacityInfo || !capacityInfo.max_capacity) return 0;
    return Math.min(100, (capacityInfo.booked_count / capacityInfo.max_capacity) * 100);
});

const getStatusBadgeClass = (status) => {
    const classes = {
        pending: 'badge badge-warning',
        confirmed: 'badge badge-info',
        need_info: 'badge badge-warning',
        escalated: 'badge badge-danger',
        completed: 'badge badge-success',
        cancelled: 'badge badge-gray',
        closed: 'badge badge-gray',
    };
    return classes[status] || 'badge badge-gray';
};

const getResultBadgeClass = (result) => {
    const classes = {
        interested: 'badge badge-success',
        pending: 'badge badge-warning',
        not_interested: 'badge badge-gray',
        need_info: 'badge badge-warning',
        escalated: 'badge badge-danger',
    };
    return classes[result] || 'badge badge-gray';
};

const changeStatus = (status) => {
    if (confirm(`确定要将状态变更为${status}吗？`)) {
        router.post(route('bookings.status', booking.id), { status }, {
            onSuccess: () => {
                // 页面会自动刷新
            },
        });
    }
};

const submitFollowUp = () => {
    if (!followUpForm.value.content) {
        alert('请输入跟进内容');
        return;
    }
    router.post(route('bookings.follow-up.store', booking.id), followUpForm.value, {
        onSuccess: () => {
            showFollowUpModal.value = false;
            followUpForm.value.content = '';
        },
    });
};

const submitComplete = () => {
    router.post(route('bookings.complete', booking.id), completeForm.value, {
        onSuccess: () => {
            showCompleteModal.value = false;
        },
    });
};

const submitCancel = () => {
    if (confirm('确定要取消这个预约吗？')) {
        router.post(route('bookings.cancel', booking.id), cancelForm.value, {
            onSuccess: () => {
                showCancelModal.value = false;
            },
        });
    }
};

const submitEscalate = () => {
    if (confirm('确定要升级复核吗？')) {
        router.post(route('bookings.escalate', booking.id), escalateForm.value, {
            onSuccess: () => {
                showEscalateModal.value = false;
            },
        });
    }
};

const submitReview = () => {
    router.post(route('bookings.review', booking.id), reviewForm.value, {
        onSuccess: () => {
            showReviewModal.value = false;
        },
    });
};

const closeBooking = () => {
    if (confirm('确定要关闭这条记录吗？关闭后将无法编辑。')) {
        router.post(route('bookings.close', booking.id), {}, {
            onSuccess: () => {
                // 页面会自动刷新
            },
        });
    }
};

const toggleTag = (tag) => {
    const index = reviewForm.value.review_tags.indexOf(tag);
    if (index > -1) {
        reviewForm.value.review_tags.splice(index, 1);
    } else {
        reviewForm.value.review_tags.push(tag);
    }
};

const addNewTag = () => {
    if (newTag.value.trim() && !reviewForm.value.review_tags.includes(newTag.value.trim())) {
        reviewForm.value.review_tags.push(newTag.value.trim());
    }
    newTag.value = '';
};
</script>

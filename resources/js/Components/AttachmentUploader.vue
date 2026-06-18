<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <label class="label">{{ label }}</label>
            <button
                type="button"
                @click="triggerInput"
                class="btn-secondary text-sm py-1"
            >
                选择文件
            </button>
            <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="handleFileSelect"
            />
        </div>

        <div v-if="previewFiles.length" class="border border-dashed border-gray-300 rounded-md p-4 space-y-2">
            <div v-for="(file, index) in previewFiles" :key="index" class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">{{ file.name }}</span>
                    <span class="text-xs text-gray-400">{{ formatSize(file.size) }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span v-if="uploadingIndex === index" class="text-xs text-primary-600">上传中...</span>
                    <button v-else type="button" @click="removePreview(index)" class="text-red-500 hover:text-red-700 text-sm">
                        移除
                    </button>
                </div>
            </div>
        </div>

        <div v-if="existingAttachments?.length" class="space-y-2">
            <div class="text-sm font-medium text-gray-700">已上传附件：</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div
                    v-for="attachment in existingAttachments"
                    :key="attachment.id"
                    class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2"
                >
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">{{ attachment.filename }}</span>
                        <span v-if="attachment.human_size" class="text-xs text-gray-400">({{ attachment.human_size }})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <a
                            :href="attachment.file_url"
                            target="_blank"
                            rel="noopener"
                            class="text-primary-600 hover:text-primary-700 text-sm"
                        >查看</a>
                        <button
                            v-if="canDelete"
                            type="button"
                            @click="deleteAttachment(attachment)"
                            class="text-red-500 hover:text-red-700 text-sm"
                        >删除</button>
                    </div>
                </div>
            </div>
        </div>

        <input type="hidden" :name="fieldName" :value="JSON.stringify(uploadedIds)" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import { router } from '@inertiajs/vue3';

const props = defineProps({
    label: {
        type: String,
        default: '附件上传',
    },
    fieldName: {
        type: String,
        default: 'attachment_ids',
    },
    attachableType: {
        type: String,
        required: true,
    },
    attachableId: {
        type: [Number, String],
        required: true,
    },
    category: {
        type: String,
        default: 'other',
    },
    existingAttachments: {
        type: Array,
        default: () => [],
    },
    canDelete: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['uploaded', 'deleted']);

const fileInput = ref(null);
const previewFiles = ref([]);
const uploadedIds = ref([]);
const uploadingIndex = ref(-1);

watch(() => props.attachableId, (newId) => {
    if (newId) {
        uploadPendingFiles();
    }
}, { immediate: true });

const triggerInput = () => {
    fileInput.value?.click();
};

const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    previewFiles.value = [...previewFiles.value, ...files];
    uploadPendingFiles();
};

const removePreview = (index) => {
    previewFiles.value.splice(index, 1);
};

const formatSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return bytes.toFixed(2) + ' ' + units[i];
};

const uploadPendingFiles = async () => {
    if (!props.attachableId) return;

    for (let i = 0; i < previewFiles.value.length; i++) {
        if (previewFiles.value[i]._uploaded) continue;

        uploadingIndex.value = i;
        try {
            const formData = new FormData();
            formData.append('file', previewFiles.value[i]);
            formData.append('attachable_type', props.attachableType);
            formData.append('attachable_id', props.attachableId);
            formData.append('category', props.category);

            const response = await axios.post(route('attachments.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data?.data) {
                uploadedIds.value.push(response.data.data.id);
                previewFiles.value[i]._uploaded = true;
                emit('uploaded', response.data.data);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            uploadingIndex.value = -1;
        }
    }

    previewFiles.value = previewFiles.value.filter(f => !f._uploaded);
};

const deleteAttachment = (attachment) => {
    if (!confirm('确定删除此附件吗？')) return;

    router.delete(route('attachments.destroy', attachment.id), {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
            emit('deleted', attachment);
        },
    });
};
</script>

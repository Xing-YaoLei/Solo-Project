<template>
    <div class="flex items-center gap-2">
        <span v-if="status === 'pending'" class="badge-yellow">评估中</span>
        <span v-else-if="status === 'preparing'" class="badge-blue">整备中</span>
        <span v-else-if="status === 'available'" class="badge-green">在库</span>
        <span v-else-if="status === 'sold'" class="badge-gray">已售</span>
        <span v-else-if="status === 'cancelled'" class="badge-red">已取消</span>
        <span v-else class="badge-gray">{{ status }}</span>
    </div>
</template>

<script setup>
defineProps({
    status: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <div>
        <div class="text-sm text-gray-500">{{ label }}</div>
        <div class="mt-1 text-sm font-medium text-gray-900">{{ value }}</div>
    </div>
</template>

<script setup>
defineProps({
    label: {
        type: String,
        required: true,
    },
    value: {
        type: [String, Number],
        default: '',
    },
});
</script>

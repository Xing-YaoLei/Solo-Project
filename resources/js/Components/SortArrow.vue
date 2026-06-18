<template>
    <span class="inline-flex flex-col ml-1">
        <svg
            :class="['w-3 h-3 -mb-1', current === field && dir === 'asc' ? 'text-primary-600' : 'text-gray-300']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        <svg
            :class="['w-3 h-3', current === field && dir === 'desc' ? 'text-primary-600' : 'text-gray-300']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    </span>
</template>

<script setup>
defineProps({
    field: String,
    current: String,
    dir: String,
});
</script>

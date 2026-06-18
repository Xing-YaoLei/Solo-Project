<template>
    <div v-if="links.length > 3" class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                    v-for="link in links"
                    :key="link.label"
                    @click="gotoPage(link.url)"
                    :disabled="!link.url"
                    :class="[
                        'relative inline-flex items-center px-4 py-2 text-sm font-medium',
                        link.active ? 'z-10 bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                        !link.url ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                        link.url ? 'hover:text-gray-700' : '',
                    ]"
                    v-html="link.label"
                ></button>
            </nav>
        </div>
    </div>
</template>

<script setup>
import { router } from '@inertiajs/vue3';

defineProps({
    links: {
        type: Array,
        required: true,
    },
});

const gotoPage = (url) => {
    if (!url) return;
    router.visit(url, { preserveState: true, preserveScroll: true });
};
</script>

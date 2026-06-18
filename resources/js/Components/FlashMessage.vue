<template>
    <div v-if="flash" class="mb-6">
        <div v-if="flash.success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {{ flash.success }}
        </div>
        <div v-if="flash.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {{ flash.error }}
        </div>
    </div>
</template>

<script setup>
import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

const page = usePage();
const flash = computed(() => page.props.flash);
</script>

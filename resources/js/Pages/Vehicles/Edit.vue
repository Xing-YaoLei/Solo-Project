<template>
    <VehiclesCreate
        :vehicle="vehicle"
        :statuses="statuses"
    />
</template>

<script setup>
import VehiclesCreate from './Create.vue';

defineProps({
    vehicle: Object,
    statuses: Object,
});
</script>

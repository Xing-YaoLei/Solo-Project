<template>
    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white border-b border-gray-200">
            <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <span class="text-xl font-bold text-primary-600">二手车收购协同系统</span>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-2">
                            <Link
                                v-for="item in navItems"
                                :key="item.route"
                                :href="route(item.route)"
                                :class="[
                                    'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors',
                                    isActive(item.route)
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                ]"
                            >
                                {{ item.label }}
                            </Link>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="ml-3 relative">
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-600">{{ $page.props.auth.user?.name }}</span>
                                <span v-if="$page.props.auth.user?.role" class="badge-blue">
                                    {{ $page.props.auth.user.role }}
                                </span>
                                <form @submit.prevent="logout" method="POST" class="inline">
                                    <button type="submit" class="btn-secondary text-sm py-1">退出登录</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-full mx-auto py-6 sm:px-6 lg:px-8">
            <FlashMessage />
            <slot />
        </main>
    </div>
</template>

<script setup>
import { router, Link } from '@inertiajs/vue3';
import { computed } from 'vue';
import FlashMessage from './FlashMessage.vue';

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
});

const navItems = computed(() => {
    const items = [
        { route: 'dashboard', label: '首页概览' },
        { route: 'vehicles.index', label: '车辆管理' },
        { route: 'anomalies.index', label: '异常处理' },
    ];

    const user = props.$page?.props?.auth?.user;
    if (user?.roles?.includes('manager') || user?.roles?.includes('finance')) {
        items.push({ route: 'statistics.index', label: '统计分析' });
        items.push({ route: 'statistics.inventory-detail', label: '库存追踪' });
    }

    return items;
});

const isActive = (routeName) => {
    return route().current(routeName) || route().current(routeName + '.*');
};

const logout = () => {
    router.post(route('logout'));
};
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white border-b border-gray-100">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <Link :href="route('dashboard')" class="flex-shrink-0 flex items-center">
                            <span class="text-xl font-bold text-blue-600">试听预约协同台</span>
                        </Link>

                        <div class="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                            <NavLink :href="route('dashboard')" :active="route().current('dashboard')">
                                工作台
                            </NavLink>
                            <NavLink :href="route('bookings.index')" :active="route().current('bookings.*') && !route().current('bookings.create')">
                                预约管理
                            </NavLink>
                            <NavLink :href="route('calendar')" :active="route().current('calendar')">
                                日历视图
                            </NavLink>
                            <NavLink :href="route('statistics')" :active="route().current('statistics')">
                                数据汇总
                            </NavLink>
                            <NavLink :href="route('time-slots.index')" :active="route().current('time-slots.*')">
                                时段配置
                            </NavLink>
                        </div>
                    </div>

                    <div class="hidden sm:flex sm:items-center sm:ms-6">
                        <div class="ms-3 relative">
                            <Dropdown>
                                <template #trigger>
                                    <span class="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                        >
                                            {{ user.name }}
                                            <svg class="ms-2 -me-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                </template>

                                <template #content>
                                    <DropdownLink :href="route('logout')" method="post" as="button">
                                        退出登录
                                    </DropdownLink>
                                </template>
                            </Dropdown>
                        </div>
                    </div>

                    <div class="-me-2 flex items-center sm:hidden">
                        <button @click="showingNavigationDropdown = ! showingNavigationDropdown" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out">
                            <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path :class="{ 'hidden': showingNavigationDropdown, 'inline-flex': ! showingNavigationDropdown }" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                <path :class="{ 'hidden': ! showingNavigationDropdown, 'inline-flex': showingNavigationDropdown }" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div :class="{ 'block': showingNavigationDropdown, 'hidden': ! showingNavigationDropdown }" class="sm:hidden">
                <div class="pt-2 pb-3 space-y-1">
                    <ResponsiveNavLink :href="route('dashboard')" :active="route().current('dashboard')">
                        工作台
                    </ResponsiveNavLink>
                    <ResponsiveNavLink :href="route('bookings.index')" :active="route().current('bookings.*')">
                        预约管理
                    </ResponsiveNavLink>
                    <ResponsiveNavLink :href="route('calendar')" :active="route().current('calendar')">
                        日历视图
                    </ResponsiveNavLink>
                    <ResponsiveNavLink :href="route('statistics')" :active="route().current('statistics')">
                        数据汇总
                    </ResponsiveNavLink>
                    <ResponsiveNavLink :href="route('time-slots.index')" :active="route().current('time-slots.*')">
                        时段配置
                    </ResponsiveNavLink>
                </div>

                <div class="pt-4 pb-1 border-t border-gray-200">
                    <div class="px-4">
                        <div class="font-medium text-base text-gray-800">{{ user.name }}</div>
                        <div class="font-medium text-sm text-gray-500">{{ user.email }}</div>
                    </div>

                    <div class="mt-3 space-y-1">
                        <ResponsiveNavLink :href="route('logout')" method="post" as="button">
                            退出登录
                        </ResponsiveNavLink>
                    </div>
                </div>
            </div>
        </nav>

        <main class="py-6">
            <slot />
        </main>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Link, usePage, useForm, router } from '@inertiajs/vue3';

const page = usePage();
const user = page.props.auth?.user || { name: '用户', email: '' };

const showingNavigationDropdown = ref(false);
</script>

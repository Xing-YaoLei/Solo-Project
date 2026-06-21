<script lang="ts">
	import '../app.css';
	import { trpc } from '$lib/trpc';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getRoleLabel } from '$lib/utils';

	let currentUser: any = null;
	let loading = true;

	onMount(async () => {
		try {
			currentUser = await trpc().user.getCurrent.query();
		} catch (e) {
			if (!$page.url.pathname.startsWith('/login')) {
				await goto('/login');
			}
		} finally {
			loading = false;
		}
	});

	async function handleLogout() {
		await trpc().user.logout.mutate();
		await goto('/login');
	}

	const menuItems = [
		{ name: '总览', path: '/', icon: '📊' },
		{ name: '房源管理', path: '/properties', icon: '🏠' },
		{ name: '房源日历', path: '/calendar', icon: '📅' },
		{ name: '保洁任务', path: '/tasks', icon: '🧹' },
		{ name: '预订 & 证件', path: '/bookings', icon: '📝' },
		{ name: '客诉 & 点评', path: '/complaints', icon: '💬' },
		{ name: '异常单', path: '/anomalies', icon: '⚠️' },
		{ name: '统计报表', path: '/reports', icon: '📈' },
		{ name: '人员管理', path: '/users', icon: '👥' }
	];
</script>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else if $page.url.pathname === '/login'}
	<slot />
{:else if currentUser}
	<div class="flex h-screen bg-gray-100">
		<aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
			<div class="p-6 border-b border-gray-200">
				<h1 class="text-xl font-bold text-brand-700">民宿保洁协同台</h1>
				<p class="text-xs text-gray-500 mt-1">Cleaning Coordination</p>
			</div>
			<nav class="flex-1 overflow-y-auto py-4">
				{#each menuItems as item}
					<a
						href={item.path}
						class="flex items-center px-6 py-3 text-sm transition-colors {
							$page.url.pathname === item.path
								? 'bg-brand-50 text-brand-700 border-r-4 border-brand-600 font-medium'
								: 'text-gray-700 hover:bg-gray-50'
						}"
					>
						<span class="mr-3">{item.icon}</span>
						{item.name}
					</a>
				{/each}
			</nav>
			<div class="p-4 border-t border-gray-200">
				<div class="flex items-center mb-3">
					<div class="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
						{currentUser.realName?.charAt(0) || currentUser.username?.charAt(0)}
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-900">{currentUser.realName || currentUser.username}</p>
						<p class="text-xs text-gray-500">{getRoleLabel(currentUser.role)}</p>
					</div>
				</div>
				<button on:click={handleLogout} class="w-full text-sm text-gray-600 hover:text-red-600 py-2">
					退出登录
				</button>
			</div>
		</aside>

		<main class="flex-1 overflow-y-auto">
			<slot />
		</main>
	</div>
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-gray-500">请先登录...</div>
	</div>
{/if}

<script lang="ts" context="module">
</script>

{#if !loading && currentUser}
	{@const _ = ''}
{/if}

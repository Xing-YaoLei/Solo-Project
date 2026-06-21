<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	let user: any = null;
	let currentPath = '';

	const navItems = [
		{ path: '/', label: '工作台', icon: '📊' },
		{ path: '/sponsors', label: '赞助清单', icon: '🤝' },
		{ path: '/verifications', label: '核销记录', icon: '✅' },
		{ path: '/ticket-types', label: '票种规则', icon: '🎫' },
		{ path: '/orders', label: '购票订单', icon: '📦' },
		{ path: '/seats', label: '座位图', icon: '💺' },
		{ path: '/disputes', label: '异常单', icon: '⚠️' },
		{ path: '/transitions', label: '状态流转', icon: '🔄' },
		{ path: '/export', label: '数据下载', icon: '⬇️' }
	];

	$effect(() => {
		currentPath = $page.url.pathname;
	});

	async function logout() {
		await trpc.auth.logout.mutate();
		user = null;
		goto('/login');
	}

	onMount(async () => {
		try {
			const me = await trpc.auth.me.query();
			user = me;
		} catch {
			if (browser && !$page.url.pathname.startsWith('/login')) {
				goto('/login');
			}
		}
	});
</script>

<svelte:head>
	<title>活动票务协同台</title>
</svelte:head>

{#if currentPath === '/login'}
	<div class="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
		<slot />
	</div>
{:else}
	<div class="flex h-screen overflow-hidden bg-slate-50">
		<aside class="w-64 bg-white border-r border-slate-200 flex flex-col">
			<div class="px-5 py-5 border-b border-slate-200">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xl">
						🎭
					</div>
					<div>
						<div class="font-bold text-slate-900">活动票务协同台</div>
						<div class="text-xs text-slate-500">Ticket Collaboration</div>
					</div>
				</div>
			</div>

			<nav class="flex-1 overflow-y-auto p-3 space-y-1">
				{#each navItems as item}
					<a
						href={item.path}
						class="nav-link {currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'nav-link-active' : ''}"
					>
						<span class="text-lg">{item.icon}</span>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<div class="p-3 border-t border-slate-200">
				{#if user}
					<div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
							{user.displayName?.[0] ?? user.username?.[0] ?? '?'}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-slate-900 truncate">
								{user.displayName ?? user.username}
							</div>
							<div class="text-xs text-slate-500">{user.role}</div>
						</div>
						<button class="btn-ghost !p-1.5" on:click={logout} title="退出登录">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
						</button>
					</div>
				{:else}
					<a href="/login" class="btn-primary w-full">登录</a>
				{/if}
			</div>
		</aside>

		<main class="flex-1 overflow-y-auto">
			<slot />
		</main>
	</div>
{/if}

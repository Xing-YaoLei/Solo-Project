<script lang="ts">
	import { page } from '$app/stores';
	import { currentUser, isManager } from '$lib/stores/auth';

	let activeHref = '';
	$: activeHref = $page.url.pathname;

	const managerLinks = [
		{ href: '/dashboard', label: '总览仪表盘', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/dashboard/analysis', label: '数据分析', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
		{ href: '/dashboard/leads', label: '线索明细', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
		{ href: '/dashboard/imports', label: '数据导入', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' }
	];

	const salesLinks = [
		{ href: '/dashboard', label: '我的仪表盘', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/dashboard/analysis', label: '数据分析', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
		{ href: '/dashboard/leads', label: '我的线索', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }
	];
</script>

<aside class="w-60 h-screen bg-navy-900 border-r border-navy-700/50 flex flex-col fixed left-0 top-0 z-30">
	<div class="h-16 flex items-center px-6 border-b border-navy-700/40">
		<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mr-3">
			<svg viewBox="0 0 24 24" fill="none" class="w-5 h-5 text-navy-950" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
			</svg>
		</div>
		<div>
			<div class="text-white font-semibold text-sm leading-tight">试驾漏斗</div>
			<div class="text-navy-400 text-xs">二手车门店</div>
		</div>
	</div>

	<nav class="flex-1 py-4 overflow-y-auto">
		{#each ($isManager ? managerLinks : salesLinks) as link}
			<a
				href={link.href}
				class="flex items-center px-6 py-2.5 mx-3 mb-1 rounded-lg text-sm transition-all duration-200 {activeHref === link.href
					? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
					: 'text-navy-300 hover:text-white hover:bg-navy-800/60'}"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5 mr-3">
					<path stroke-linecap="round" stroke-linejoin="round" d={link.icon} />
				</svg>
				{link.label}
			</a>
		{/each}
	</nav>

	<div class="p-4 border-t border-navy-700/40">
		<div class="flex items-center">
			<div class="w-9 h-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-white text-sm font-semibold">
				{$currentUser?.name.slice(0, 1) ?? '?'}
			</div>
			<div class="ml-3 flex-1 min-w-0">
				<div class="text-white text-sm font-medium truncate">{$currentUser?.name ?? '未登录'}</div>
				<div class="text-navy-400 text-xs">{$isManager ? '管理层' : '一线销售'}</div>
			</div>
		</div>
	</div>
</aside>

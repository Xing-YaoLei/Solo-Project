<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils/cn';
	import { getRoleLabel } from '$lib/utils/enumLabels';
	import type { AuthUser } from '$lib/server/auth/lucia';
	import {
		ChevronRight,
		Search,
		Bell,
		Menu,
		User,
		LogOut,
		Settings as SettingsIcon,
		X
	} from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	export let user: AuthUser | null = null;
	let className: string | undefined = undefined;
	export { className as class };
	export let searchOpen = false;
	export let searchQuery = '';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		toggleSidebar: void;
		logout: void;
		search: string;
	}>();

	type Crumb = { label: string; href?: string };

	$: breadcrumbs = getBreadcrumbs($page.url.pathname);

	function getBreadcrumbs(path: string): Crumb[] {
		const crumbs: Crumb[] = [{ label: '首页', href: '/' }];
		const segments = path.split('/').filter(Boolean);
		const map: Record<string, string> = {
			workorders: '工单管理',
			parts: '配件库存',
			quotes: '报价管理',
			inspection: '质检管理',
			exceptions: '异常处理',
			stats: '数据统计',
			users: '用户管理',
			settings: '系统设置'
		};
		let current = '';
		for (let i = 0; i < segments.length; i++) {
			current += '/' + segments[i];
			const label = map[segments[i]] ?? segments[i];
			if (i === segments.length - 1) {
				crumbs.push({ label });
			} else {
				crumbs.push({ label, href: current });
			}
		}
		return crumbs;
	}

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		dispatch('search', target.value);
	}

	function handleSearchFocus() {
		searchFocused = true;
		searchOpen = true;
	}

	function handleSearchBlur() {
		searchFocused = false;
		setTimeout(() => {
			searchOpen = false;
		}, 200);
	}

	function handleClearSearch() {
		searchQuery = '';
		dispatch('search', '');
	}

	let userMenuOpen = false;
	let searchFocused = false;
	let notifications = [
		{ id: 1, title: '新工单 WO-20240115-001', time: '5分钟前', unread: true },
		{ id: 2, title: '配件 A-100 库存低于安全线', time: '1小时前', unread: true },
		{ id: 3, title: '异常单 EX-001 已关闭', time: '2小时前', unread: false }
	];
	$: unreadCount = notifications.filter((n) => n.unread).length;
	let notifOpen = false;
</script>

<header class={cn(
	'h-16 flex-shrink-0 flex items-center gap-4 px-4 md:px-6',
	'bg-industrial-900/80 backdrop-blur-md border-b border-industrial-800',
	'sticky top-0 z-30',
	className
)}>
	<button
		type="button"
		on:click={() => dispatch('toggleSidebar')}
		class="md:hidden flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-industrial-400 hover:text-white hover:bg-industrial-800 transition-colors"
		aria-label="切换菜单"
	>
		<Menu class="w-5 h-5" strokeWidth={2} />
	</button>

	<nav class="hidden md:flex items-center gap-1 flex-shrink-0 min-w-0">
		{#each breadcrumbs as crumb, index}
			{#if index > 0}
				<ChevronRight class="w-4 h-4 text-industrial-600 flex-shrink-0 mx-0.5" strokeWidth={2} />
			{/if}
			{#if crumb.href}
				<a
					href={crumb.href}
					class="text-sm text-industrial-400 hover:text-white transition-colors truncate max-w-[160px]"
				>
					{crumb.label}
				</a>
			{:else}
				<span class="text-sm font-medium text-white truncate max-w-[200px]">{crumb.label}</span>
			{/if}
		{/each}
	</nav>

	<div class="flex-1 max-w-xl mx-auto w-full">
		<div class={cn(
			'relative transition-all duration-300',
			searchFocused && 'md:scale-[1.02]'
		)}>
			<div class={cn(
				'flex items-center gap-2 h-10 rounded-lg bg-industrial-800 border transition-all duration-200',
				searchFocused
					? 'border-primary-500 ring-2 ring-primary-500/30'
					: 'border-industrial-700 hover:border-industrial-600'
			)}>
				<div class="pl-3.5 flex-shrink-0 text-industrial-500">
					<Search class="w-4 h-4" strokeWidth={2} />
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索工单、客户、配件..."
					on:focus={handleSearchFocus}
					on:blur={handleSearchBlur}
					on:input={handleSearchInput}
					class="flex-1 w-full bg-transparent text-sm text-industrial-100 placeholder-industrial-500 focus:outline-none pr-3"
				/>
				{#if searchQuery}
					<button
						type="button"
						on:click={handleClearSearch}
						class="mr-2 p-1 rounded text-industrial-500 hover:text-industrial-200 hover:bg-industrial-700 transition-colors"
					>
						<X class="w-4 h-4" strokeWidth={2} />
					</button>
				{/if}
				<span class="hidden sm:flex mr-3 items-center gap-1 px-2 h-6 rounded text-[11px] font-medium text-industrial-500 border border-industrial-700 bg-industrial-900/50">
					⌘K
				</span>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-1 flex-shrink-0">
		<div class="relative">
			<button
				type="button"
				on:click={() => { notifOpen = !notifOpen; userMenuOpen = false; }}
				class={cn(
					'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
					notifOpen
						? 'bg-industrial-800 text-white'
						: 'text-industrial-400 hover:text-white hover:bg-industrial-800'
				)}
				aria-label="通知"
			>
				<Bell class="w-5 h-5" strokeWidth={2} />
				{#if unreadCount > 0}
					<span class="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-industrial-900">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				{/if}
			</button>

			{#if notifOpen}
				<div class="absolute right-0 mt-2 w-80 rounded-xl border border-industrial-700 bg-industrial-800 shadow-industrial-lg overflow-hidden animate-fade-in z-50">
					<div class="flex items-center justify-between px-4 py-3 border-b border-industrial-700">
						<h3 class="font-semibold text-white text-sm">通知中心</h3>
						{#if unreadCount > 0}
							<button class="text-xs text-primary-400 hover:text-primary-300 font-medium">
								全部已读
							</button>
						{/if}
					</div>
					<div class="max-h-80 overflow-y-auto">
						{#each notifications as notif}
							<div class={cn(
								'px-4 py-3 border-b border-industrial-700/60 last:border-b-0 transition-colors',
								notif.unread && 'bg-primary-600/5',
								'hover:bg-industrial-700/30 cursor-pointer'
							)}>
								<div class="flex items-start gap-3">
									<div class={cn(
										'w-2 h-2 mt-2 rounded-full flex-shrink-0',
										notif.unread ? 'bg-accent-500' : 'bg-transparent'
									)} />
									<div class="flex-1 min-w-0">
										<p class="text-sm text-industrial-100">{notif.title}</p>
										<p class="text-xs text-industrial-500 mt-0.5 font-numeric">{notif.time}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<div class="px-4 py-2.5 border-t border-industrial-700 bg-industrial-800/50">
						<a href="/notifications" class="block text-center text-xs text-primary-400 hover:text-primary-300 font-medium">
							查看全部通知
						</a>
					</div>
				</div>
			{/if}
		</div>

		<div class="relative">
			<button
				type="button"
				on:click={() => { userMenuOpen = !userMenuOpen; notifOpen = false; }}
				class={cn(
					'flex items-center gap-2 h-10 pl-1 pr-3 rounded-lg transition-all duration-200',
					userMenuOpen
						? 'bg-industrial-800'
						: 'hover:bg-industrial-800'
				)}
			>
				<div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-industrial-700/50">
					{user?.name?.charAt(0) ?? 'U'}
				</div>
				<div class="hidden sm:block text-left">
					<p class="text-sm font-medium text-white leading-tight">{user?.name ?? '用户'}</p>
					<p class="text-[11px] text-industrial-500 leading-tight">{user ? getRoleLabel(user.role) : ''}</p>
				</div>
			</button>

			{#if userMenuOpen}
				<div class="absolute right-0 mt-2 w-56 rounded-xl border border-industrial-700 bg-industrial-800 shadow-industrial-lg overflow-hidden animate-fade-in z-50">
					<div class="px-4 py-3 border-b border-industrial-700 bg-industrial-800/50">
						<p class="text-sm font-semibold text-white">{user?.name ?? '用户'}</p>
						<div class="flex items-center gap-2 mt-1">
							<Badge variant="primary" size="sm">{user ? getRoleLabel(user.role) : '未登录'}</Badge>
						</div>
					</div>
					<div class="py-1.5">
						<a
							href="/settings/profile"
							class="flex items-center gap-3 px-4 py-2.5 text-sm text-industrial-200 hover:bg-industrial-700/50 transition-colors"
							on:click={() => (userMenuOpen = false)}
						>
							<User class="w-4 h-4 text-industrial-400" strokeWidth={2} />
							个人资料
						</a>
						<a
							href="/settings"
							class="flex items-center gap-3 px-4 py-2.5 text-sm text-industrial-200 hover:bg-industrial-700/50 transition-colors"
							on:click={() => (userMenuOpen = false)}
						>
							<SettingsIcon class="w-4 h-4 text-industrial-400" strokeWidth={2} />
							系统设置
						</a>
					</div>
					<div class="py-1.5 border-t border-industrial-700">
						<button
							type="button"
							on:click={() => { userMenuOpen = false; dispatch('logout'); }}
							class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-400 hover:bg-danger-500/10 transition-colors"
						>
							<LogOut class="w-4 h-4" strokeWidth={2} />
							退出登录
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

{#if notifOpen || userMenuOpen}
	<div
		class="fixed inset-0 z-20"
		role="presentation"
		on:click={() => { notifOpen = false; userMenuOpen = false; }}
		on:keydown={(e) => {
			if (e.key === 'Escape' || e.key === ' ') {
				notifOpen = false;
				userMenuOpen = false;
			}
		}}
	/>
{/if}

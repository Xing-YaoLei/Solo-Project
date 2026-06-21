<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';

	let sidebarCollapsed = false;
	let searchQuery = '';
	let userMenuOpen = false;
	let notificationOpen = false;

	const notifications = [
		{ id: 1, title: '变更单待审批', message: 'CO-001 需要您的审批', time: '5分钟前', read: false },
		{ id: 2, title: '验收照片已上传', message: '项目A的水电验收照片已上传', time: '1小时前', read: false },
		{ id: 3, title: '材料延期提醒', message: '瓷砖预计延期3天到货', time: '2小时前', read: true }
	];

	const unreadCount = $derived(notifications.filter((n) => !n.read).length);

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
		if (userMenuOpen) notificationOpen = false;
	}

	function toggleNotification() {
		notificationOpen = !notificationOpen;
		if (notificationOpen) userMenuOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.user-menu') && !target.closest('.notification-menu')) {
			userMenuOpen = false;
			notificationOpen = false;
		}
	}
</script>

<svelte:body onclick={handleClickOutside} />

<Sidebar collapsed={sidebarCollapsed} />

<div class="{sidebarCollapsed ? 'pl-16' : 'pl-64'} min-h-screen bg-gray-50 transition-all duration-300">
	<header class="sticky top-0 z-30 h-16 bg-white shadow-sm">
		<div class="flex h-16 items-center justify-between px-6">
			<div class="flex items-center gap-4">
				<button
					type="button"
					class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
					onclick={toggleSidebar}
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				</button>

				<div class="relative w-96">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						class="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
						placeholder="搜索项目、变更单、工人..."
					/>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div class="notification-menu relative">
					<button
						type="button"
						class="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						onclick={toggleNotification}
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
							/>
						</svg>
						{#if unreadCount > 0}
							<span
								class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
							>
								{unreadCount}
							</span>
						{/if}
					</button>

					{#if notificationOpen}
						<div class="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
							<div class="border-b border-gray-200 px-4 py-3">
								<h3 class="text-sm font-semibold text-gray-900">通知</h3>
							</div>
							<div class="max-h-80 overflow-y-auto">
								{#each notifications as notification}
									<div
										class="flex gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 {!notification.read
											? 'bg-blue-50'
											: ''}"
									>
										<div
											class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full {!notification.read ? 'bg-primary-500' : 'bg-gray-300'}"
										/>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium text-gray-900">{notification.title}</p>
											<p class="mt-1 text-sm text-gray-500 line-clamp-2">{notification.message}</p>
											<p class="mt-1 text-xs text-gray-400">{notification.time}</p>
										</div>
									</div>
								{/each}
							</div>
							<div class="border-t border-gray-200 px-4 py-3">
								<a href="#" class="block text-center text-sm font-medium text-primary-600 hover:text-primary-500">
									查看全部通知
								</a>
							</div>
						</div>
					{/if}
				</div>

				<div class="user-menu relative">
					<button
						type="button"
						class="flex items-center gap-3 rounded-full p-1 hover:bg-gray-100"
						onclick={toggleUserMenu}
					>
						<div class="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center">
							<span class="text-primary-700 font-medium">管</span>
						</div>
						<span class="hidden md:block text-sm font-medium text-gray-700">管理员</span>
						<svg class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					{#if userMenuOpen}
						<div class="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
							<div class="py-1">
								<a
									href="#"
									class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
										/>
									</svg>
									个人设置
								</a>
								<a
									href="#"
									class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									系统设置
								</a>
								<div class="border-t border-gray-200 my-1" />
								<a
									href="/auth/logout"
									class="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
										/>
									</svg>
									退出登录
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="p-6">
		<slot />
	</main>
</div>

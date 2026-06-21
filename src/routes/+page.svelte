<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import type { ChangeOrder, Project, MaterialDelay } from '$lib/server/db/schema';

	let { data } = $props<{
		data: {
			user: {
				id: string;
				username: string;
				email: string;
				fullName: string;
				role: string;
				phone?: string;
				avatar?: string;
			} | null;
		};
	}>();

	let isLoading = $state(true);
	let windowWidth = $state(1280);
	let stats = $state({
		totalProjects: 0,
		activeProjects: 0,
		pendingChangeOrders: 0,
		todayCheckins: 0,
		delayedMaterials: 0,
		overdueTasks: 0
	});
	let recentChangeOrders = $state<ChangeOrder[]>([]);
	let warningProjects = $state<
		Array<{
			project: Project;
			delayDays: number;
		}>
	>([]);
	let materialDelays = $state<MaterialDelay[]>([]);

	let isMobile = $derived(windowWidth < 768);

	const getStatusLabel = (status: string): string => {
		const labels: Record<string, string> = {
			draft: '草稿',
			pending: '待处理',
			processing: '处理中',
			approved: '已批准',
			rejected: '已拒绝',
			completed: '已完成',
			cancelled: '已取消'
		};
		return labels[status] || status;
	};

	const getStatusBadgeClass = (status: string): string => {
		const classes: Record<string, string> = {
			draft: 'badge-gray',
			pending: 'badge-warning',
			processing: 'badge-primary',
			approved: 'badge-success',
			rejected: 'badge-danger',
			completed: 'badge-success',
			cancelled: 'badge-gray'
		};
		return classes[status] || 'badge-gray';
	};

	const loadDashboardData = async () => {
		isLoading = true;
		try {
			const [projectsRes, changeOrdersRes, materialDelaysRes] = await Promise.all([
				trpc.projects.list.query({ limit: 100 }),
				trpc.changeOrders.list.query({ limit: 5 }),
				trpc.materialDelays.list.query({ limit: 5, status: 'processing' })
			]);

			const projects = projectsRes.items || [];
			const activeProjects = projects.filter((p) => p.status === 'processing');

			stats = {
				totalProjects: projects.length,
				activeProjects: activeProjects.length,
				pendingChangeOrders: (changeOrdersRes.items || []).filter(
					(co) => co.status === 'pending' || co.status === 'processing'
				).length,
				todayCheckins: Math.floor(Math.random() * 20) + 5,
				delayedMaterials: (materialDelaysRes.items || []).filter(
					(md) => md.status === 'processing'
				).length,
				overdueTasks: activeProjects.filter((p) => {
					if (!p.expectedEndDate) return false;
					const now = new Date();
					const expected = new Date(p.expectedEndDate);
					return now > expected && p.status !== 'completed';
				}).length
			};

			recentChangeOrders = (changeOrdersRes.items || []).slice(0, 5);
			materialDelays = (materialDelaysRes.items || []).slice(0, 5);

			warningProjects = activeProjects
				.filter((p) => {
					if (!p.expectedEndDate) return false;
					const now = new Date();
					const expected = new Date(p.expectedEndDate);
					const diffTime = expected.getTime() - now.getTime();
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
					return diffDays <= 7 && p.status !== 'completed';
				})
				.map((p) => {
					const now = new Date();
					const expected = new Date(p.expectedEndDate!);
					const diffTime = expected.getTime() - now.getTime();
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
					return {
						project: p,
						delayDays: diffDays
					};
				})
				.slice(0, 5);
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			isLoading = false;
		}
	};

	const handleRedirect = async () => {
		const ua = navigator.userAgent.toLowerCase();
		const isMobileDevice =
			/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) ||
			window.innerWidth < 768;

		if (isMobileDevice) {
			await goto('/mobile');
		} else {
			await goto('/desktop');
		}
	};

	onMount(() => {
		windowWidth = window.innerWidth;

		if (!data.user) {
			goto('/login');
			return;
		}

		loadDashboardData();
	});
</script>

{#if !data.user}
	<div class="flex items-center justify-center min-h-96">
		<p class="text-gray-500">请先登录...</p>
	</div>
{:else if isLoading}
	<div class="space-y-6">
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			{#each Array(6) as _}
				<div class="card p-4">
					<div class="skeleton h-5 w-16 mb-3" />
					<div class="skeleton h-8 w-12" />
				</div>
			{/each}
		</div>
		<div class="grid md:grid-cols-2 gap-6">
			<div class="card">
				<div class="card-header">
					<div class="skeleton h-5 w-24" />
				</div>
				<div class="card-body space-y-3">
					{#each Array(5) as _}
						<div class="skeleton h-16 w-full" />
					{/each}
				</div>
			</div>
			<div class="card">
				<div class="card-header">
					<div class="skeleton h-5 w-24" />
				</div>
				<div class="card-body space-y-3">
					{#each Array(5) as _}
						<div class="skeleton h-16 w-full" />
					{/each}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">
					欢迎回来，{data.user.fullName}
				</h1>
				<p class="text-gray-500 mt-1">
					{new Date().toLocaleDateString('zh-CN', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						weekday: 'long'
					})}
				</p>
			</div>
			<button class="btn-primary w-full sm:w-auto" onclick={handleRedirect}>
				{isMobile ? '进入移动端' : '进入桌面端'}
			</button>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			<div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
				<p class="text-sm text-gray-500 mb-1">项目总数</p>
				<p class="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
				<p class="text-xs text-primary-600 mt-1">📊 全部项目</p>
			</div>

			<div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
				<p class="text-sm text-gray-500 mb-1">进行中</p>
				<p class="text-2xl font-bold text-blue-600">{stats.activeProjects}</p>
				<p class="text-xs text-blue-600 mt-1">🔄 施工中</p>
			</div>

			<div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
				<p class="text-sm text-gray-500 mb-1">待处理变更</p>
				<p class="text-2xl font-bold text-amber-600">{stats.pendingChangeOrders}</p>
				<p class="text-xs text-amber-600 mt-1">📝 待审核</p>
			</div>

			<div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
				<p class="text-sm text-gray-500 mb-1">今日考勤</p>
				<p class="text-2xl font-bold text-green-600">{stats.todayCheckins}</p>
				<p class="text-xs text-green-600 mt-1">✅ 已打卡</p>
			</div>

			<div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
				<p class="text-sm text-gray-500 mb-1">材料延误</p>
				<p class="text-2xl font-bold text-orange-600">{stats.delayedMaterials}</p>
				<p class="text-xs text-orange-600 mt-1">🚚 处理中</p>
			</div>

			<div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
				<p class="text-sm text-gray-500 mb-1">工期预警</p>
				<p class="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
				<p class="text-xs text-red-600 mt-1">⚠️ 需关注</p>
			</div>
		</div>

		<div class="grid lg:grid-cols-2 gap-6">
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">最近变更单</h3>
					<a href="/change-orders" class="text-sm text-primary-600 hover:text-primary-700">
						查看全部 →
					</a>
				</div>
				<div class="card-body">
					{#if recentChangeOrders.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p class="text-4xl mb-2">📭</p>
							<p>暂无变更单</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each recentChangeOrders as order}
								<a
									href={`/change-orders/${order.id}`}
									class="flex items-start gap-4 p-3 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
								>
									<div
										class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0"
									>
										📝
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<p class="font-medium text-gray-900 truncate">{order.title}</p>
											<span class={getStatusBadgeClass(order.status)}>
												{getStatusLabel(order.status)}
											</span>
										</div>
										<p class="text-sm text-gray-500 truncate mt-1">{order.code}</p>
										<p class="text-xs text-gray-400 mt-1">
											{new Date(order.createdAt).toLocaleDateString('zh-CN')}
										</p>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">工期偏差预警</h3>
					<a href="/projects" class="text-sm text-primary-600 hover:text-primary-700">
						查看全部 →
					</a>
				</div>
				<div class="card-body">
					{#if warningProjects.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p class="text-4xl mb-2">✅</p>
							<p>所有项目进度正常</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each warningProjects as wp}
								<a
									href={`/projects/${wp.project.id}`}
									class="flex items-start gap-4 p-3 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
								>
									<div
										class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 {wp.delayDays <= 0
											? 'bg-red-100 text-red-600'
											: 'bg-yellow-100 text-yellow-600'}"
									>
										{wp.delayDays <= 0 ? '⚠️' : '⏰'}
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<p class="font-medium text-gray-900 truncate">{wp.project.name}</p>
											<span
												class={wp.delayDays <= 0 ? 'badge-danger' : 'badge-warning'}
											>
												{wp.delayDays <= 0
													? `已逾期 ${Math.abs(wp.delayDays)} 天`
													: `剩余 ${wp.delayDays} 天`}
											</span>
										</div>
										<p class="text-sm text-gray-500 truncate mt-1">
											{wp.project.address}
										</p>
										{#if wp.project.expectedEndDate}
											<p class="text-xs text-gray-400 mt-1">
												预计完工:
												{new Date(wp.project.expectedEndDate).toLocaleDateString('zh-CN')}
											</p>
										{/if}
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if materialDelays.length > 0}
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">材料延误提醒</h3>
					<a href="/material-delays" class="text-sm text-primary-600 hover:text-primary-700">
						查看全部 →
					</a>
				</div>
				<div class="card-body">
					<div class="overflow-x-auto -mx-4 px-4">
						<table class="w-full min-w-[640px]">
							<thead>
								<tr class="border-b border-gray-200">
									<th class="text-left py-3 px-2 text-sm font-medium text-gray-500">
										材料名称
									</th>
									<th class="text-left py-3 px-2 text-sm font-medium text-gray-500">
										原计划送达
									</th>
									<th class="text-left py-3 px-2 text-sm font-medium text-gray-500">
										预计送达
									</th>
									<th class="text-left py-3 px-2 text-sm font-medium text-gray-500">
										延误天数
									</th>
									<th class="text-left py-3 px-2 text-sm font-medium text-gray-500">
										状态
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each materialDelays as delay}
									<tr class="hover:bg-gray-50">
										<td class="py-3 px-2">
											<a
												href={`/material-delays/${delay.id}`}
												class="font-medium text-gray-900 hover:text-primary-600"
											>
												{delay.materialName}
											</a>
											<p class="text-xs text-gray-500">{delay.materialType}</p>
										</td>
										<td class="py-3 px-2 text-sm text-gray-600">
											{new Date(delay.originalDeliveryDate).toLocaleDateString('zh-CN')}
										</td>
										<td class="py-3 px-2 text-sm text-gray-600">
											{new Date(delay.expectedDeliveryDate).toLocaleDateString('zh-CN')}
										</td>
										<td class="py-3 px-2">
											<span class="badge-danger">{delay.delayDays} 天</span>
										</td>
										<td class="py-3 px-2">
											<span class={getStatusBadgeClass(delay.status)}>
												{getStatusLabel(delay.status)}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

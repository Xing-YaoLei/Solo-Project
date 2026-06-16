<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Users,
		ClipboardList,
		AlertTriangle,
		TrendingUp,
		Plus,
		Heart,
		Pill,
		Calendar,
		FileText,
		ChevronRight,
		CheckCircle2,
		Clock,
		AlertCircle
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatRelativeTime, formatPercentage } from '$lib/utils/format';
	import type { DashboardStats } from '$shared/types';

	const trpc = createTRPCProxyClient();

	let loading = true;
	let stats: DashboardStats | null = null;

	interface TimelineItem {
		id: string;
		type: 'assessment' | 'medication' | 'visit' | 'incident';
		title: string;
		description: string;
		time: Date;
		status?: string;
	}

	interface TodoItem {
		id: string;
		title: string;
		description: string;
		priority: 'high' | 'medium' | 'low';
		href?: string;
	}

	const timelineItems: TimelineItem[] = [
		{
			id: '1',
			type: 'assessment',
			title: '刘淑芬 入住评估',
			description: '护理员李护士正在进行信息采集',
			time: new Date(Date.now() - 30 * 60 * 1000),
			status: 'collecting'
		},
		{
			id: '2',
			type: 'medication',
			title: '陈秀英 用药执行',
			description: '硝苯地平缓释片 30mg 已执行',
			time: new Date(Date.now() - 2 * 60 * 60 * 1000)
		},
		{
			id: '3',
			type: 'visit',
			title: '王建国 家属探访',
			description: '儿子王小明来访中',
			time: new Date(Date.now() - 3 * 60 * 60 * 1000)
		},
		{
			id: '4',
			type: 'incident',
			title: '陈秀英 跌倒事件',
			description: '走廊A区摔倒，等待角色补充说明',
			time: new Date(Date.now() - 5 * 60 * 60 * 1000),
			status: 'supplementing'
		},
		{
			id: '5',
			type: 'assessment',
			title: '陈秀英 评估完成',
			description: '已归档，评定为半自理',
			time: new Date(Date.now() - 24 * 60 * 60 * 1000),
			status: 'archived'
		}
	];

	const todoItems: TodoItem[] = [
		{
			id: '1',
			title: '完成刘淑芬的入住评估采集',
			description: '当前进度：信息采集中',
			priority: 'high',
			href: '/assessments'
		},
		{
			id: '2',
			title: '确认陈秀英跌倒事件责任人',
			description: '角色补充已完成，等待主管确认',
			priority: 'high',
			href: '/incidents'
		},
		{
			id: '3',
			title: '审核今日用药执行记录',
			description: '共 3 条待审核记录',
			priority: 'medium',
			href: '/medications'
		},
		{
			id: '4',
			title: '更新赵德财健康档案',
			description: '年度体检报告待录入',
			priority: 'low',
			href: '/elders'
		}
	];

	const quickActions = [
		{ label: '新增老人', icon: Plus, href: '/elders', color: 'bg-primary-50 text-primary-600 hover:bg-primary-100' },
		{ label: '入住评估', icon: ClipboardList, href: '/assessments', color: 'bg-accent-50 text-accent-600 hover:bg-accent-100' },
		{ label: '用药登记', icon: Pill, href: '/medications', color: 'bg-mint-50 text-mint-600 hover:bg-mint-100' },
		{ label: '探访登记', icon: Calendar, href: '/visits', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
		{ label: '事件上报', icon: AlertTriangle, href: '/incidents', color: 'bg-danger-50 text-danger-600 hover:bg-danger-100' },
		{ label: '数据分析', icon: TrendingUp, href: '/analytics', color: 'bg-primary-50 text-primary-600 hover:bg-primary-100' }
	];

	interface MetricCard {
		label: string;
		value: number | string;
		icon: typeof Users;
		gradient: string;
		trend?: string;
	}

	let metricCards: MetricCard[] = [];
	$: {
		metricCards = [
			{
				label: '在院老人数',
				value: stats?.admittedElders ?? '-',
				icon: Users,
				gradient: 'from-primary-500 to-primary-600'
			},
			{
				label: '今日评估数',
				value: stats?.todayAssessments ?? '-',
				icon: ClipboardList,
				gradient: 'from-accent-500 to-accent-600'
			},
			{
				label: '活跃跌倒事件',
				value: stats?.activeIncidents ?? '-',
				icon: AlertTriangle,
				gradient: 'from-danger-500 to-danger-600'
			},
			{
				label: '护理达标率',
				value: stats ? formatPercentage(stats.complianceRate) : '-',
				icon: TrendingUp,
				gradient: 'from-mint-500 to-mint-600'
			}
		];
	}

	function getTimelineIcon(type: TimelineItem['type']) {
		switch (type) {
			case 'assessment':
				return ClipboardList;
			case 'medication':
				return Pill;
			case 'visit':
				return Calendar;
			case 'incident':
				return AlertTriangle;
		}
	}

	function getTimelineColor(type: TimelineItem['type']) {
		switch (type) {
			case 'assessment':
				return 'bg-primary-500';
			case 'medication':
				return 'bg-mint-500';
			case 'visit':
				return 'bg-amber-500';
			case 'incident':
				return 'bg-danger-500';
		}
	}

	function getTimelineBadge(type: TimelineItem['type'], status?: string) {
		if (!status) return null;
		const assessmentBadges: Record<string, { label: string; variant: 'info' | 'warning' | 'success' }> = {
			collecting: { label: '采集中', variant: 'info' },
			evaluating: { label: '评定中', variant: 'warning' },
			archived: { label: '已归档', variant: 'success' }
		};
		const incidentBadges: Record<string, { label: string; variant: 'danger' | 'warning' | 'pending' | 'success' }> = {
			reported: { label: '已上报', variant: 'danger' },
			supplementing: { label: '补充中', variant: 'warning' },
			confirming: { label: '确认中', variant: 'pending' },
			closed: { label: '已关闭', variant: 'success' }
		};
		if (type === 'assessment') return assessmentBadges[status] ?? null;
		if (type === 'incident') return incidentBadges[status] ?? null;
		return null;
	}

	function getPriorityStyles(priority: TodoItem['priority']) {
		switch (priority) {
			case 'high':
				return 'border-l-danger-500 bg-danger-50/50';
			case 'medium':
				return 'border-l-amber-500 bg-amber-50/50';
			case 'low':
				return 'border-l-mint-500 bg-mint-50/50';
		}
	}

	function getPriorityIcon(priority: TodoItem['priority']) {
		switch (priority) {
			case 'high':
				return AlertCircle;
			case 'medium':
				return Clock;
			case 'low':
				return CheckCircle2;
		}
	}

	function getPriorityLabel(priority: TodoItem['priority']) {
		switch (priority) {
			case 'high':
				return '紧急';
			case 'medium':
				return '待办';
			case 'low':
				return '一般';
		}
	}

	onMount(async () => {
		try {
			stats = await trpc.analytics.dashboard.query();
		} catch (e) {
			console.error('Failed to load dashboard stats:', e);
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each metricCards as card}
			<div class="card p-5 hover:shadow-card-hover transition-shadow duration-300 overflow-hidden relative group">
				<div class={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.gradient}`} />
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">{card.label}</p>
						<p class="text-3xl font-bold text-gray-800 font-serif">{card.value}</p>
					</div>
					<div class={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform`}>
						<svelte:component this={card.icon} class="w-5 h-5 text-white" />
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 card p-5">
			<div class="flex items-center justify-between mb-5">
				<h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
					<FileText class="w-5 h-5 text-primary-600" />
					今日动态
				</h3>
				<button class="btn-ghost text-sm py-1.5 px-3">
					查看全部
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
			<div class="relative">
				<div class="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
				<div class="space-y-5">
					{#each timelineItems as item}
						<div class="relative pl-8">
							<div class={`absolute left-0 top-1 w-5 h-5 rounded-full ${getTimelineColor(item.type)} flex items-center justify-center ring-4 ring-white`}>
								<svelte:component this={getTimelineIcon(item.type)} class="w-3 h-3 text-white" />
							</div>
							<div class="flex items-start justify-between gap-3">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 flex-wrap">
										<p class="text-sm font-medium text-gray-800">{item.title}</p>
										{#if item.status}
											{@const badge = getTimelineBadge(item.type, item.status)}
											{#if badge}
												<StatusBadge
													variant={badge.variant}
													label={badge.label}
													showDot={false}
												/>
											{/if}
										{/if}
									</div>
									<p class="text-xs text-gray-500 mt-0.5">{item.description}</p>
								</div>
								<span class="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(item.time)}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="card p-5">
			<div class="flex items-center justify-between mb-5">
				<h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
					<ClipboardList class="w-5 h-5 text-accent-600" />
					待办事项
				</h3>
				<span class="badge bg-accent-50 text-accent-700 border-accent-200 border">
					{todoItems.length} 项
				</span>
			</div>
			<div class="space-y-3">
				{#each todoItems as todo}
					<button
						type="button"
						on:click={() => todo.href && goto(todo.href)}
						class="w-full text-left p-3 rounded-xl border-l-4 hover:shadow-soft transition-all duration-200 {getPriorityStyles(todo.priority)}"
					>
						<div class="flex items-start gap-2.5">
							<svelte:component this={getPriorityIcon(todo.priority)} class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<p class="text-sm font-medium text-gray-800 truncate">{todo.title}</p>
									<span class="text-[11px] text-gray-500 flex-shrink-0">{getPriorityLabel(todo.priority)}</span>
								</div>
								<p class="text-xs text-gray-500 mt-0.5 truncate">{todo.description}</p>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="card p-5">
		<h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-5">
			<Heart class="w-5 h-5 text-primary-600" />
			快速入口
		</h3>
		<div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
			{#each quickActions as action}
				<button
					type="button"
					on:click={() => goto(action.href)}
					class="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-200 hover:shadow-soft {action.color}"
				>
					<svelte:component this={action.icon} class="w-6 h-6" />
					<span class="text-sm font-medium">{action.label}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

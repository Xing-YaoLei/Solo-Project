<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Filter, AlertTriangle, AlertOctagon, User, Clock, ChevronRight,
		FileText, MessageSquare, Wrench, Plus, Package
	} from 'lucide-svelte';
	import {
		mockExceptions, delay,
		type MockException, type ExceptionType, type ExceptionStatus
	} from '$lib/mock/data';

	type ExceptionStat = { type: ExceptionType | 'ALL'; label: string; count: number; color: string };
	function getExceptionStats(): ExceptionStat[] {
		return [
			{ type: 'PARTS_SHORTAGE', label: '配件短缺', count: exceptions.filter(e => e.type === 'PARTS_SHORTAGE').length, color: 'amber' },
			{ type: 'REWORK', label: '返修异常', count: exceptions.filter(e => e.type === 'REWORK').length, color: 'red' },
			{ type: 'CUSTOMER_COMPLAINT', label: '客户投诉', count: exceptions.filter(e => e.type === 'CUSTOMER_COMPLAINT').length, color: 'purple' },
			{ type: 'OTHER', label: '其他问题', count: exceptions.filter(e => e.type === 'OTHER').length, color: 'slate' }
		];
	}

	let loading = true;
	let exceptions: MockException[] = [];
	let filtered: MockException[] = [];

	let typeFilter: ExceptionType | 'ALL' = 'ALL';
	let statusFilter: ExceptionStatus | 'ALL' = 'ALL';

	$: {
		let list = exceptions;
		if (typeFilter !== 'ALL') list = list.filter(e => e.type === typeFilter);
		if (statusFilter !== 'ALL') list = list.filter(e => e.status === statusFilter);
		filtered = list;
	}

	onMount(async () => {
		await delay(null, 300);
		exceptions = mockExceptions;
		loading = false;
	});

	function typeBarColor(t: ExceptionType) {
		switch (t) {
			case 'PARTS_SHORTAGE': return 'bg-amber-500';
			case 'REWORK': return 'bg-red-500';
			case 'CUSTOMER_COMPLAINT': return 'bg-purple-500';
			default: return 'bg-slate-500';
		}
	}
	function typeIconClass(t: ExceptionType) {
		switch (t) {
			case 'PARTS_SHORTAGE': return 'bg-amber-50 text-amber-600';
			case 'REWORK': return 'bg-red-50 text-red-600';
			case 'CUSTOMER_COMPLAINT': return 'bg-purple-50 text-purple-600';
			default: return 'bg-slate-50 text-slate-600';
		}
	}
	function typeIcon(t: ExceptionType) {
		switch (t) {
			case 'PARTS_SHORTAGE': return Package;
			case 'REWORK': return Wrench;
			case 'CUSTOMER_COMPLAINT': return MessageSquare;
			default: return AlertOctagon;
		}
	}
	function typeName(t: ExceptionType) {
		switch (t) {
			case 'PARTS_SHORTAGE': return '配件短缺';
			case 'REWORK': return '返修异常';
			case 'CUSTOMER_COMPLAINT': return '客户投诉';
			default: return '其他问题';
		}
	}
	function statusClass(s: ExceptionStatus) {
		switch (s) {
			case 'PENDING': return 'bg-slate-100 text-slate-700';
			case 'PROCESSING': return 'bg-blue-100 text-blue-700';
			case 'REVIEWING': return 'bg-amber-100 text-amber-700';
			case 'CLOSED': return 'bg-green-100 text-green-700';
			default: return 'bg-slate-100 text-slate-700';
		}
	}
	function statusName(s: ExceptionStatus) {
		switch (s) {
			case 'PENDING': return '待处理';
			case 'PROCESSING': return '处理中';
			case 'REVIEWING': return '复核中';
			case 'CLOSED': return '已关闭';
			default: return s;
		}
	}
	function daysAgo(d: Date) {
		const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
		if (diff === 0) return '今天';
		if (diff === 1) return '昨天';
		return `${diff}天前`;
	}

	const typeOptions: { value: ExceptionType | 'ALL'; label: string }[] = [
		{ value: 'ALL', label: '全部类型' },
		{ value: 'PARTS_SHORTAGE', label: '配件短缺' },
		{ value: 'REWORK', label: '返修异常' },
		{ value: 'CUSTOMER_COMPLAINT', label: '客户投诉' },
		{ value: 'OTHER', label: '其他问题' }
	];
	const statusOptions: { value: ExceptionStatus | 'ALL'; label: string }[] = [
		{ value: 'ALL', label: '全部状态' },
		{ value: 'PENDING', label: '待处理' },
		{ value: 'PROCESSING', label: '处理中' },
		{ value: 'REVIEWING', label: '复核中' },
		{ value: 'CLOSED', label: '已关闭' }
	];
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">异常管理</h1>
			<p class="text-slate-500 mt-1">
				共 {filtered.length} 条异常记录
				{#if exceptions.filter(e => e.status !== 'CLOSED').length > 0}
					· <span class="text-red-600 font-medium">{exceptions.filter(e => e.status !== 'CLOSED').length} 条待处理</span>
				{/if}
			</p>
		</div>
		<button
			on:click={() => alert('新建异常单功能开发中')}
			class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
		>
			<Plus class="w-5 h-5" />
			上报异常
		</button>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
		<div class="p-5 border-b border-slate-100 flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-2 text-slate-600">
				<Filter class="w-4.5 h-4.5" />
				<span class="text-sm font-medium">筛选：</span>
			</div>
			<div class="flex-1" />
			<select
				bind:value={typeFilter}
				class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
			>
				{#each typeOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<select
				bind:value={statusFilter}
				class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
			>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		{#each getExceptionStats() as stat}
			<button
				on:click={() => typeFilter = typeFilter === stat.type ? 'ALL' : stat.type}
				class={'bg-white rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ' + (typeFilter === stat.type ? (stat.color === 'amber' ? 'border-amber-400 bg-amber-50/50' : stat.color === 'red' ? 'border-red-400 bg-red-50/50' : stat.color === 'purple' ? 'border-purple-400 bg-purple-50/50' : 'border-slate-400 bg-slate-50/50') : 'border-slate-200 hover:border-slate-300')}
			>
				<div class="text-xs text-slate-500 mb-1">{stat.label}</div>
				<div class={'text-2xl font-bold ' + (stat.color === 'amber' ? 'text-amber-600' : stat.color === 'red' ? 'text-red-600' : stat.color === 'purple' ? 'text-purple-600' : 'text-slate-700')}>
					{stat.count}
				</div>
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-24">
			<div class="inline-flex items-center gap-2 text-slate-500">
				<svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				加载中...
			</div>
		</div>
	{:else if filtered.length === 0}
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm py-24 text-center">
			<AlertTriangle class="w-16 h-16 mx-auto mb-4 text-slate-300" />
			<p class="text-slate-500">暂无符合条件的异常记录</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
			{#each filtered as exc}
				<button
					on:click={() => goto(`/exceptions/${exc.id}`)}
					class="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left overflow-hidden"
				>
					<div class={'absolute left-0 top-0 bottom-0 w-1.5 ' + typeBarColor(exc.type)} />
					<div class="p-5 pl-6">
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<div class={'w-10 h-10 rounded-xl flex items-center justify-center ' + typeIconClass(exc.type)}>
									<svelte:component this={typeIcon(exc.type)} class="w-5 h-5" />
								</div>
								<div>
									<div class="font-mono text-xs text-slate-500">{exc.id.toUpperCase()}</div>
									<div class="text-xs font-medium text-slate-600">{typeName(exc.type)}</div>
								</div>
							</div>
							<span class={'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ' + statusClass(exc.status)}>
								{statusName(exc.status)}
							</span>
						</div>

						<h3 class="font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors">
							{exc.title}
						</h3>

						{#if exc.workOrder}
							<div class="flex items-center gap-2 mb-3 text-xs text-slate-600">
								<FileText class="w-3.5 h-3.5 text-slate-400" />
								关联工单：<span class="font-mono font-medium">{exc.workOrder.orderNo}</span>
								<span class="text-slate-400">·</span>
								<span>{exc.workOrder.vehicle.plateNumber}</span>
							</div>
						{/if}

						<div class="flex items-center gap-4 mb-4 text-xs text-slate-500">
							<div class="flex items-center gap-1.5">
								<User class="w-3.5 h-3.5" />
								<div class="flex items-center gap-1.5">
									<div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600">
										{exc.assignee.name.charAt(0)}
									</div>
									{exc.assignee.name}
								</div>
							</div>
							<div class="flex items-center gap-1.5">
								<Clock class="w-3.5 h-3.5" />
								{daysAgo(exc.createdAt)}
							</div>
						</div>

						<div class="flex items-center justify-between pt-3 border-t border-slate-100">
							<div class="flex -space-x-2">
								{#each exc.logs.slice(0, 3) as log}
									<div class="w-6 h-6 rounded-full bg-white ring-2 ring-white flex items-center justify-center text-[10px] font-semibold bg-primary-100 text-primary-700">
										{log.operator.name.charAt(0)}
									</div>
								{/each}
								{#if exc.logs.length > 3}
									<div class="w-6 h-6 rounded-full bg-white ring-2 ring-white flex items-center justify-center text-[10px] font-semibold bg-slate-100 text-slate-600">
										+{exc.logs.length - 3}
									</div>
								{/if}
								<span class="ml-3 text-xs text-slate-500">{exc.logs.length} 条记录</span>
							</div>
							<span class="text-primary-600 inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
								查看详情 <ChevronRight class="w-4 h-4" />
							</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

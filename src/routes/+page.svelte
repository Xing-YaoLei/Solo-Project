<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		ClipboardList, PackageCheck, AlertTriangle, TrendingDown,
		ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertOctagon,
		FileText, Phone, Calendar, ArrowUpRight, ArrowDownRight, Minus
	} from 'lucide-svelte';
	import {
		mockDashboardStats, mockTodoList, mockReminders, mockExceptions,
		delay,
		type DashboardStats, type TodoItem, type MockReminder, type MockException
	} from '$lib/mock/data';

	type StatCard = {
		icon: any; title: string; value: number; unit: string; trend: number; delta: number;
		color: string; accent: string; bg: string; iconBg: string; trendLine: number[];
	};

	let loading = true;
	let stats: DashboardStats = mockDashboardStats;
	let todos: TodoItem[] = mockTodoList;
	let reminders: MockReminder[] = mockReminders;
	let topExceptions: MockException[] = [];

	let currentMonth = new Date();
	let calendarDays: (number | null)[] = [];
	let reminderMap = new Map<string, MockReminder[]>();

	$: {
		const y = currentMonth.getFullYear();
		const m = currentMonth.getMonth();
		const firstDay = new Date(y, m, 1);
		const lastDay = new Date(y, m + 1, 0);
		const startWeekday = firstDay.getDay();
		const daysInMonth = lastDay.getDate();
		const days: (number | null)[] = [];
		for (let i = 0; i < startWeekday; i++) days.push(null);
		for (let d = 1; d <= daysInMonth; d++) days.push(d);
		calendarDays = days;
		const rm = new Map<string, MockReminder[]>();
		reminders.forEach(r => {
			const k = `${r.remindDate.getFullYear()}-${r.remindDate.getMonth()}-${r.remindDate.getDate()}`;
			if (!rm.has(k)) rm.set(k, []);
			rm.get(k)!.push(r);
		});
		reminderMap = rm;
	}

	function getStatCards(): StatCard[] {
		const today = getTrendIcon(stats.todayPendingTrend);
		const pickup = getTrendIcon(stats.awaitingPickupTrend);
		const except = getTrendIcon(stats.openExceptionsTrend);
		const rework = getTrendIcon(stats.reworkRateTrend);
		return [
			{ icon: ClipboardList, title: '今日待处理', value: stats.todayPending, unit: '单', trend: today.dir, delta: today.delta, color: 'primary', accent: 'text-primary-600', bg: 'bg-primary-50', iconBg: 'bg-primary-100', trendLine: stats.todayPendingTrend },
			{ icon: PackageCheck, title: '待取件', value: stats.awaitingPickup, unit: '辆', trend: pickup.dir, delta: pickup.delta, color: 'emerald', accent: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', trendLine: stats.awaitingPickupTrend },
			{ icon: AlertTriangle, title: '未关异常', value: stats.openExceptions, unit: '单', trend: except.dir, delta: except.delta, color: 'red', accent: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-100', trendLine: stats.openExceptionsTrend },
			{ icon: TrendingDown, title: '本月返修率', value: stats.monthReworkRate, unit: '%', trend: rework.dir, delta: rework.delta, color: 'amber', accent: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100', trendLine: stats.reworkRateTrend }
		];
	}
	function isTodayFn(day: number | null): boolean {
		if (day === null) return false;
		const t = new Date();
		return day === t.getDate() && currentMonth.getMonth() === t.getMonth() && currentMonth.getFullYear() === t.getFullYear();
	}
	function dayRemindersFn(day: number | null): MockReminder[] {
		if (day === null) return [];
		const k = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
		return reminderMap.get(k) || [];
	}
	function trendLineHeight(v: number, arr: number[]): number {
		const max = Math.max(...arr);
		return Math.max((v / max) * 100, 8);
	}

	onMount(async () => {
		await delay(null, 300);
		stats = mockDashboardStats;
		todos = mockTodoList;
		reminders = mockReminders;
		topExceptions = mockExceptions.slice(0, 5);
		loading = false;
	});

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}
	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}
	function formatDate(d: Date) {
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}
	function getTrendIcon(arr: number[]) {
		if (arr.length < 2) return { dir: 0, delta: 0 };
		const delta = arr[arr.length - 1] - arr[arr.length - 2];
		return { dir: delta > 0 ? 1 : delta < 0 ? -1 : 0, delta };
	}
	function statusBadgeClass(s: string) {
		switch (s) {
			case 'PENDING': return 'bg-slate-100 text-slate-700';
			case 'PROCESSING': return 'bg-blue-100 text-blue-700';
			case 'REVIEWING': return 'bg-amber-100 text-amber-700';
			case 'CLOSED': return 'bg-green-100 text-green-700';
			default: return 'bg-slate-100 text-slate-700';
		}
	}
	function typeColor(t: string) {
		switch (t) {
			case 'PARTS_SHORTAGE': return 'border-amber-500 bg-amber-50 text-amber-700';
			case 'REWORK': return 'border-red-500 bg-red-50 text-red-700';
			case 'CUSTOMER_COMPLAINT': return 'border-purple-500 bg-purple-50 text-purple-700';
			default: return 'border-slate-500 bg-slate-50 text-slate-700';
		}
	}
	function typeName(t: string) {
		switch (t) {
			case 'PARTS_SHORTAGE': return '配件短缺';
			case 'REWORK': return '返修异常';
			case 'CUSTOMER_COMPLAINT': return '客户投诉';
			default: return '其他问题';
		}
	}
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<div class="mb-8">
		<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">工作台</h1>
		<p class="text-slate-500 mt-1">早上好，张厂长 · 今天有 {stats.todayPending} 个待办事项等待处理</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
		{#each getStatCards() as item}
		<div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
			<div class="flex items-start justify-between mb-4">
				<div class="w-12 h-12 rounded-xl {item.iconBg} flex items-center justify-center">
					<svelte:component this={item.icon} class="w-6 h-6 {item.accent}" />
				</div>
				<div class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium {item.trend > 0 ? 'bg-red-50 text-red-600' : item.trend < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}">
					{#if item.trend > 0}
						<ArrowUpRight class="w-3 h-3" />
						+{item.delta}
					{:else if item.trend < 0}
						<ArrowDownRight class="w-3 h-3" />
						{item.delta}
					{:else}
						<Minus class="w-3 h-3" />
						0
					{/if}
				</div>
			</div>
			<div class="flex items-baseline gap-1 mb-1">
				<span class="text-3xl font-bold text-slate-900">{item.value}</span>
				<span class="text-slate-500 text-sm">{item.unit}</span>
			</div>
			<p class="text-sm text-slate-500 mb-4">{item.title}</p>
			<div class="h-8 flex items-end gap-1">
				{#each item.trendLine as v, i}
					<div
						class="flex-1 rounded-t-sm transition-all {i === item.trendLine.length - 1
							? (item.color === 'primary' ? 'bg-primary-500'
								: item.color === 'emerald' ? 'bg-emerald-500'
									: item.color === 'red' ? 'bg-red-500' : 'bg-amber-500')
							: (item.color === 'primary' ? 'bg-primary-200'
								: item.color === 'emerald' ? 'bg-emerald-200'
									: item.color === 'red' ? 'bg-red-200' : 'bg-amber-200')}"
						style="height: {trendLineHeight(v, item.trendLine)}%"
					/>
				{/each}
			</div>
		</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
		<div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
			<div class="p-5 border-b border-slate-100 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
						<Calendar class="w-5 h-5 text-primary-600" />
						保养提醒月历
					</h3>
					<p class="text-sm text-slate-500 mt-0.5">本月共 {reminders.length} 条保养提醒</p>
				</div>
				<div class="flex items-center gap-2">
					<button on:click={prevMonth} class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
						<ChevronLeft class="w-5 h-5" />
					</button>
					<span class="px-3 py-1.5 text-sm font-semibold text-slate-700 min-w-[120px] text-center">
						{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
					</span>
					<button on:click={nextMonth} class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
						<ChevronRight class="w-5 h-5" />
					</button>
				</div>
			</div>
			<div class="p-5">
				<div class="grid grid-cols-7 gap-2 mb-3">
					{#each ['日', '一', '二', '三', '四', '五', '六'] as wd}
						<div class="text-center text-xs font-medium text-slate-400 py-2">{wd}</div>
					{/each}
				</div>
				<div class="grid grid-cols-7 gap-2">
					{#each calendarDays as day, i}
						{@const isToday = isTodayFn(day)}
						{@const dayRems = dayRemindersFn(day)}
						<div
							class="aspect-square rounded-xl p-1.5 flex flex-col {day === null
								? ''
								: isToday
									? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
									: dayRems.length > 0
										? 'bg-amber-50 hover:bg-amber-100 cursor-pointer border border-amber-200'
										: 'hover:bg-slate-50 cursor-pointer'}"
							on:click={() => day !== null && console.log('view day', day)}
						>
							{#if day !== null}
								<span class={'text-sm font-medium ' + (isToday ? 'text-white' : 'text-slate-700')}>{day}</span>
								{#if dayRems.length > 0}
									<div class="mt-auto flex gap-1">
										{#each dayRems.slice(0, 3) as _}
											<div class={'w-1.5 h-1.5 rounded-full ' + (isToday ? 'bg-white' : 'bg-amber-500')} />
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
				<div class="flex items-center gap-6 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 rounded-full bg-primary-600" />
						<span>今天</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 rounded-full bg-amber-500" />
						<span>有保养提醒</span>
					</div>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
			<div class="p-5 border-b border-slate-100">
				<h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
					<CheckCircle2 class="w-5 h-5 text-accent-600" />
					我的待办
				</h3>
				<p class="text-sm text-slate-500 mt-0.5">{todos.length} 项任务等待处理
				</p>
			</div>
			<div class="p-2 max-h-[400px] overflow-y-auto">
				{#each todos as todo}
					<button
						on:click={() => {
							if (todo.type === 'work_order' && todo.relatedId) goto(`/work-orders/${todo.relatedId}`);
							if (todo.type === 'exception' && todo.relatedId) goto(`/exceptions/${todo.relatedId}`);
						}}
						class="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
					>
						<div class="flex items-start gap-3">
							<div class={'mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ' + (todo.priority === 'high' ? 'bg-red-100 text-red-600' : todo.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600')}>
								{#if todo.type === 'work_order'}
									<FileText class="w-4.5 h-4.5" />
								{:else if todo.type === 'exception'}
									<AlertOctagon class="w-4.5 h-4.5" />
								{:else if todo.type === 'quote'}
									<ClipboardList class="w-4.5 h-4.5" />
								{:else}
									<Phone class="w-4.5 h-4.5" />
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-slate-800 group-hover:text-primary-700 transition-colors">{todo.title}</p>
								<div class="flex items-center gap-2 mt-1">
									<Clock class="w-3 h-3 text-slate-400" />
									<span class="text-xs text-slate-500">
										{todo.dueAt.getHours()}:{String(todo.dueAt.getMinutes()).padStart(2, '0')} ·
										{todo.dueAt.getMonth() + 1}/{todo.dueAt.getDate()}
									</span>
									<span class={'text-xs px-2 py-0.5 rounded-full ' + (todo.priority === 'high' ? 'bg-red-50 text-red-600' : todo.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600')}>
										{todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
									</span>
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
		<div class="p-5 border-b border-slate-100 flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
					<AlertTriangle class="w-5 h-5 text-red-600" />
					异常速览 Top 5
				</h3>
				<p class="text-sm text-slate-500 mt-0.5">需要关注的异常工单
				</p>
			</div>
			<button
				on:click={() => goto('/exceptions')}
				class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
			>
				查看全部 <ArrowUpRight class="w-4 h-4" />
			</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-slate-50 border-b border-slate-100">
					<tr>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">异常单号</th>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">标题</th>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">类型</th>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">关联工单</th>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">处理人</th>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">状态</th>
						<th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-5">创建时间</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each topExceptions as exc}
						<tr
							class="hover:bg-slate-50 cursor-pointer transition-colors"
							on:click={() => goto(`/exceptions/${exc.id}`)}
						>
							<td class="py-4 px-5">
								<span class="font-mono text-sm text-slate-700">{exc.id.toUpperCase()}</span>
							</td>
							<td class="py-4 px-5">
								<span class="text-sm font-medium text-slate-800">{exc.title}</span>
							</td>
							<td class="py-4 px-5">
								<span class={'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border-l-4 ' + typeColor(exc.type)}>
									{typeName(exc.type)}
								</span>
							</td>
							<td class="py-4 px-5">
								{#if exc.workOrder}
									<span class="text-sm text-slate-600">{exc.workOrder.orderNo}</span>
								{:else}
									<span class="text-sm text-slate-400">-</span>
								{/if}
							</td>
							<td class="py-4 px-5">
								<span class="text-sm text-slate-600">{exc.assignee.name}</span>
							</td>
							<td class="py-4 px-5">
								<span class={'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ' + statusBadgeClass(exc.status)}>
									{exc.status === 'PENDING' ? '待处理' : exc.status === 'PROCESSING' ? '处理中' : exc.status === 'REVIEWING' ? '复核中' : '已关闭'}
								</span>
							</td>
							<td class="py-4 px-5">
								<span class="text-sm text-slate-500">
									{exc.createdAt.getMonth() + 1}/{exc.createdAt.getDate()} {exc.createdAt.getHours()}:{String(exc.createdAt.getMinutes()).padStart(2, '0')}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

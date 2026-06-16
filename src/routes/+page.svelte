<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		reminderStatusMap,
		riskEventTypeMap,
		riskSeverityMap,
		riskStatusMap,
		careLevelMap
	} from '$lib/client-utils';
	import { formatTime, formatDateTime } from '$lib/server/utils';

	type Elderly = { id: string; name: string; roomNumber: string | null; careLevel: string };
	type Reminder = {
		reminder: { id: string; scheduledTime: number; status: string };
		medication: { name: string; dosage: string; route: string };
		elderly: Elderly;
	};
	type RiskEvent = {
		event: { id: string; eventType: string; severity: string; status: string; occurredAt: number; description: string };
		elderly: Elderly;
	};

	let user: App.Locals['user'];
	let todayReminders: Reminder[] = [];
	let pendingReminders: Reminder[] = [];
	let todayActivitiesCount = 0;
	let myElderly: Elderly[] = [];
	let recentRisks: RiskEvent[] = [];
	let loading = true;

	$: isManager = user?.role === 'admin' || user?.role === 'manager';

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const userRes = await fetch('/api/trpc/auth.getCurrentUser', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'auth.getCurrentUser' })
			});
			const userData = await userRes.json();
			user = userData.result?.data;

			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);

			const remindersRes = await fetch('/api/trpc/medication.reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 2,
					method: 'medication.reminders',
					params: { input: { date: todayStart.getTime() } }
				})
			});
			const remindersData = await remindersRes.json();
			todayReminders = remindersData.result?.data || [];

			const pendingRes = await fetch('/api/trpc/medication.reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 3,
					method: 'medication.reminders',
					params: { input: { date: todayStart.getTime(), status: 'pending' } }
				})
			});
			const pendingData = await pendingRes.json();
			pendingReminders = pendingData.result?.data || [];

			const activitiesRes = await fetch('/api/trpc/activity.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 4,
					method: 'activity.list',
					params: { input: { date: todayStart.getTime() } }
				})
			});
			const activitiesData = await activitiesRes.json();
			todayActivitiesCount = activitiesData.result?.data?.length || 0;

			const elderlyRes = await fetch('/api/trpc/elderly.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'elderly.list', params: { input: {} } })
			});
			const elderlyData = await elderlyRes.json();
			myElderly = elderlyData.result?.data || [];

			const riskRes = await fetch('/api/trpc/risk.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'risk.list', params: { input: {} } })
			});
			const riskData = await riskRes.json();
			recentRisks = (riskData.result?.data || []).slice(0, 5);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function markTaken(id: string) {
		await fetch('/api/trpc/medication.updateReminderStatus', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'medication.updateReminderStatus',
				params: { input: { id, status: 'taken' } }
			})
		});
		loadAll();
	}

	$: takenCount = todayReminders.filter((r) => r.reminder.status === 'taken').length;
	$: missedCount = todayReminders.filter((r) => r.reminder.status === 'missed').length;
	$: pendingCount = todayReminders.filter((r) => r.reminder.status === 'pending').length;
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold text-gray-800">早上好，{user?.fullName} 👋</h2>
				<p class="text-gray-500 mt-1">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
			</div>
			<button class="btn btn-primary" on:click={() => goto('/risks')}>
				<span class="mr-2">⚠️</span> 上报风险事件
			</button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-primary-700">{todayReminders.length}</div>
						<div class="stat-label">今日用药提醒</div>
					</div>
					<div class="text-4xl">💊</div>
				</div>
				<div class="mt-3 flex gap-4 text-sm">
					<span class="text-green-600">✓ 已服 {takenCount}</span>
					<span class="text-yellow-600">⏳ 待服 {pendingCount}</span>
					<span class="text-red-600">✗ 漏服 {missedCount}</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-green-700">{todayActivitiesCount}</div>
						<div class="stat-label">今日活动签到</div>
					</div>
					<div class="text-4xl">✅</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-orange-700">{myElderly.length}</div>
						<div class="stat-label">负责老人</div>
					</div>
					<div class="text-4xl">👵</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-red-700">
							{recentRisks.filter((r) => r.event.status === 'reported' || r.event.status === 'investigating').length}
						</div>
						<div class="stat-label">待处理风险</div>
					</div>
					<div class="text-4xl">⚠️</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="card lg:col-span-2">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-800">⏰ 待处理用药提醒</h3>
					<button class="text-sm text-primary-600 hover:underline" on:click={() => goto('/medications')}>
						查看全部
					</button>
				</div>
				<div class="card-body">
					{#if pendingReminders.length === 0}
						<div class="empty-state">
							<div class="empty-state-icon">🎉</div>
							<div class="empty-state-text">暂无待处理提醒</div>
							<div class="empty-state-subtext">所有用药任务都已完成！</div>
						</div>
					{:else}
						<div class="space-y-3">
							{#each pendingReminders as item}
								<div
									class="{item.event?.eventType === 'fall' ? '' : ''} p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors flex items-center justify-between"
								>
									<div class="flex items-center gap-4">
										<div class="text-3xl">💊</div>
										<div>
											<div class="font-medium text-gray-800">{item.medication.name}</div>
											<div class="text-sm text-gray-500 mt-0.5">
												{item.elderly.name} · {item.medication.dosage} · {item.medication.route}
											</div>
											<div class="text-xs text-gray-400 mt-0.5">
												{item.elderly.roomNumber || '未分配房间'} · 计划 {formatTime(item.reminder.scheduledTime)}
											</div>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<span class="badge {reminderStatusMap[item.reminder.status].color}">
											{reminderStatusMap[item.reminder.status].label}
										</span>
										<button class="btn btn-success btn-sm" on:click={() => markTaken(item.reminder.id)}>
											确认服药
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-800">⚠️ 最近风险事件</h3>
					<button class="text-sm text-primary-600 hover:underline" on:click={() => goto('/risks')}>
						全部
					</button>
				</div>
				<div class="card-body">
					{#if recentRisks.length === 0}
						<div class="empty-state">
							<div class="empty-state-icon">✨</div>
							<div class="empty-state-text">暂无风险事件</div>
						</div>
					{:else}
						<div class="space-y-3">
							{#each recentRisks as item}
								<div
									class="{item.event.eventType === 'fall'
										? 'border-red-300 bg-red-50'
										: 'border-gray-100 bg-white'} p-3 rounded-lg border transition-colors hover:shadow-sm cursor-pointer"
									on:click={() => goto(`/risks/${item.event.id}`)}
								>
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 flex-wrap">
												<span class="badge {riskEventTypeMap[item.event.eventType].color}">
													{riskEventTypeMap[item.event.eventType].label}
												</span>
												{item.event.eventType === 'fall' && (
													<span class="badge bg-red-200 text-red-800 font-bold">🔥 跌倒高危</span>
												)}
												<span class="badge {riskSeverityMap[item.event.severity].color}">
													{riskSeverityMap[item.event.severity].label}
												</span>
											</div>
											<div class="mt-2 font-medium text-gray-800 text-sm">{item.elderly.name}</div>
											<div class="text-xs text-gray-500 mt-1 line-clamp-2">
												{item.event.description}
											</div>
											<div class="text-xs text-gray-400 mt-1">
												{formatDateTime(item.event.occurredAt)}
											</div>
										</div>
										<span class="badge {riskStatusMap[item.event.status].color} flex-shrink-0">
											{riskStatusMap[item.event.status].label}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if myElderly.length > 0}
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-800">👵 我负责的老人</h3>
					<button class="text-sm text-primary-600 hover:underline" on:click={() => goto('/elderly')}>
						全部档案
					</button>
				</div>
				<div class="card-body">
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
						{#each myElderly as elder}
							<div
								class="p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors cursor-pointer"
								on:click={() => goto(`/elderly/${elder.id}`)}
							>
								<div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg mx-auto">
									{elder.name.charAt(0)}
								</div>
								<div class="text-center mt-2">
									<div class="font-medium text-gray-800">{elder.name}</div>
									<div class="text-xs text-gray-500 mt-0.5">
										{elder.roomNumber || '未分配'}
									</div>
									<div class="mt-2">
										<span class="badge {careLevelMap[elder.careLevel].color}">
											{careLevelMap[elder.careLevel].label}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

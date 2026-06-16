<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		careLevelMap,
		genderMap,
		reminderStatusMap,
		activityTypeMap
	} from '$lib/client-utils';
	import { formatDate, formatDateTime, formatTime } from '$lib/server/utils';

	type Elderly = {
		id: string;
		name: string;
		gender: string;
		age: number | null;
		roomNumber: string | null;
		bedNumber: string | null;
		careLevel: string;
		primaryDisease: string | null;
		allergyInfo: string | null;
		emergencyContact: string | null;
		emergencyPhone: string | null;
		notes: string | null;
		admissionDate: number | null;
	};

	type Medication = { id: string; name: string; dosage: string; frequency: string; specificTimes: string; route: string; isActive: boolean };
	type Reminder = {
		reminder: { id: string; scheduledTime: number; status: string };
		medication: { name: string; dosage: string };
	};
	type Activity = {
		checkin: { id: string; activityType: string; activityName: string; checkinTime: number; participationStatus: string };
	};

	let elderly: Elderly | null = null;
	let medications: Medication[] = [];
	let reminders: Reminder[] = [];
	let activities: Activity[] = [];
	let loading = true;
	let activeTab = 'basic';

	$: id = $page.params.id;

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const elderlyRes = await fetch('/api/trpc/elderly.getById', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'elderly.getById',
					params: { input: id }
				})
			});
			elderly = (await elderlyRes.json()).result?.data;

			const medRes = await fetch('/api/trpc/medication.listByElderly', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 2,
					method: 'medication.listByElderly',
					params: { input: id }
				})
			});
			medications = (await medRes.json()).result?.data || [];

			const remRes = await fetch('/api/trpc/medication.reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 3,
					method: 'medication.reminders',
					params: { input: { elderlyId: id } }
				})
			});
			reminders = (await remRes.json()).result?.data || [];

			const actRes = await fetch('/api/trpc/activity.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 4,
					method: 'activity.list',
					params: { input: { elderlyId: id } }
				})
			});
			activities = (await actRes.json()).result?.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}
</script>

{#if loading || !elderly}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<button class="text-primary-600 hover:underline flex items-center gap-1" on:click={() => goto('/elderly')}>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			返回列表
		</button>

		<div class="card">
			<div class="card-body">
				<div class="flex items-start gap-6">
					<div class="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl flex-shrink-0">
						{elderly.name.charAt(0)}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-3 flex-wrap">
							<h1 class="text-2xl font-bold text-gray-800">{elderly.name}</h1>
							<span class="badge {careLevelMap[elderly.careLevel].color}">
								{careLevelMap[elderly.careLevel].label}
							</span>
						</div>
						<div class="mt-2 text-gray-600">
							{genderMap[elderly.gender]} · {elderly.age ?? '-'}岁 · {elderly.roomNumber || '未分配房间'}{elderly.bedNumber ? ` - ${elderly.bedNumber}床` : ''}
						</div>
						<div class="mt-4 flex flex-wrap gap-6 text-sm">
							<div>
								<div class="text-gray-400 text-xs">入院日期</div>
								<div class="text-gray-700">{elderly.admissionDate ? formatDate(elderly.admissionDate as unknown as number) : '-'}</div>
							</div>
							<div>
								<div class="text-gray-400 text-xs">紧急联系人</div>
								<div class="text-gray-700">{elderly.emergencyContact || '-'}</div>
							</div>
							<div>
								<div class="text-gray-400 text-xs">紧急电话</div>
								<div class="text-gray-700">{elderly.emergencyPhone || '-'}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="flex gap-1 border-b border-gray-200">
			{#each [
				{ id: 'basic', label: '基础信息' },
				{ id: 'medication', label: `用药清单（${medications.length}）` },
				{ id: 'reminders', label: `用药记录（${reminders.length}）` },
				{ id: 'activities', label: `活动记录（${activities.length}）` }
			] as const as Array<{ id: string; label: string }>}
				<button
					class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors {activeTab === tab.id
						? 'border-primary-500 text-primary-600'
						: 'border-transparent text-gray-500 hover:text-gray-700'}"
					on:click={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		{#if activeTab === 'basic'}
			<div class="card">
				<div class="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h3 class="font-semibold text-gray-800 mb-3">👤 基本信息</h3>
						<div class="space-y-3">
							<div class="flex justify-between py-2 border-b border-gray-50">
								<span class="text-gray-500">姓名</span>
								<span class="text-gray-800">{elderly.name}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-50">
								<span class="text-gray-500">性别</span>
								<span class="text-gray-800">{genderMap[elderly.gender]}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-50">
								<span class="text-gray-500">年龄</span>
								<span class="text-gray-800">{elderly.age ?? '-'} 岁</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-50">
								<span class="text-gray-500">护理等级</span>
								<span>
									<span class="badge {careLevelMap[elderly.careLevel].color}">
										{careLevelMap[elderly.careLevel].label}
									</span>
								</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-50">
								<span class="text-gray-500">房间/床位</span>
								<span class="text-gray-800">{elderly.roomNumber || '-'}{elderly.bedNumber ? ` - ${elderly.bedNumber}床` : ''}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-50">
								<span class="text-gray-500">入院日期</span>
								<span class="text-gray-800">{elderly.admissionDate ? formatDate(elderly.admissionDate as unknown as number) : '-'}</span>
							</div>
						</div>
					</div>
					<div>
						<h3 class="font-semibold text-gray-800 mb-3">🏥 健康信息</h3>
						<div class="space-y-3">
							<div class="py-2 border-b border-gray-50">
								<div class="text-gray-500 text-sm mb-1">主要疾病</div>
								<div class="text-gray-800">{elderly.primaryDisease || '-'}</div>
							</div>
							<div class="py-2 border-b border-gray-50">
								<div class="text-gray-500 text-sm mb-1">过敏信息</div>
								<div class="text-gray-800">{elderly.allergyInfo || '-'}</div>
							</div>
							<div class="py-2 border-b border-gray-50">
								<div class="text-gray-500 text-sm mb-1">紧急联系人</div>
								<div class="text-gray-800">{elderly.emergencyContact || '-'} {elderly.emergencyPhone ? `(${elderly.emergencyPhone})` : ''}</div>
							</div>
							<div class="py-2">
								<div class="text-gray-500 text-sm mb-1">备注</div>
								<div class="text-gray-800 whitespace-pre-wrap">{elderly.notes || '-'}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if activeTab === 'medication'}
			<div class="card">
				<div class="card-body">
					{#if medications.length === 0}
						<div class="empty-state">
							<div class="empty-state-icon">💊</div>
							<div class="empty-state-text">暂无用药记录</div>
						</div>
					{:else}
						<div class="table-wrapper">
							<table class="table">
								<thead>
									<tr>
										<th>药品</th>
										<th>剂量</th>
										<th>频次</th>
										<th>用药时间</th>
										<th>用法</th>
										<th>状态</th>
									</tr>
								</thead>
								<tbody>
									{#each medications as m}
										<tr>
											<td class="font-medium">{m.name}</td>
											<td class="text-gray-600">{m.dosage}</td>
											<td class="text-gray-600">{m.frequency}</td>
											<td class="text-gray-600">{m.specificTimes}</td>
											<td class="text-gray-600">{m.route}</td>
											<td>
												<span class="badge {m.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
													{m.isActive ? '在用' : '已停用'}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if activeTab === 'reminders'}
			<div class="card">
				<div class="card-body">
					{#if reminders.length === 0}
						<div class="empty-state">
							<div class="empty-state-icon">⏰</div>
							<div class="empty-state-text">暂无用药提醒记录</div>
						</div>
					{:else}
						<div class="table-wrapper">
							<table class="table">
								<thead>
									<tr>
										<th>时间</th>
										<th>药品</th>
										<th>剂量</th>
										<th>状态</th>
									</tr>
								</thead>
								<tbody>
									{#each reminders as r}
										<tr>
											<td class="font-medium">{formatDateTime(r.reminder.scheduledTime)}</td>
											<td>{r.medication.name}</td>
											<td class="text-gray-600">{r.medication.dosage}</td>
											<td>
												<span class="badge {reminderStatusMap[r.reminder.status].color}">
													{reminderStatusMap[r.reminder.status].label}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if activeTab === 'activities'}
			<div class="card">
				<div class="card-body">
					{#if activities.length === 0}
						<div class="empty-state">
							<div class="empty-state-icon">✅</div>
							<div class="empty-state-text">暂无活动记录</div>
						</div>
					{:else}
						<div class="table-wrapper">
							<table class="table">
								<thead>
									<tr>
										<th>时间</th>
										<th>活动</th>
										<th>参与状态</th>
									</tr>
								</thead>
								<tbody>
									{#each activities as a}
										<tr>
											<td class="font-medium">{formatDateTime(a.checkin.checkinTime)}</td>
											<td>
												<div class="flex items-center gap-2">
													<span>{activityTypeMap[a.checkin.activityType]?.icon || '📝'}</span>
													<span>
														<span class="badge {activityTypeMap[a.checkin.activityType]?.color || 'bg-gray-100 text-gray-800'} mr-1">
															{activityTypeMap[a.checkin.activityType]?.label || a.checkin.activityType}
														</span>
														{a.checkin.activityName}
													</span>
												</div>
											</td>
											<td>
												<span
													class="badge {a.checkin.participationStatus === 'participated'
														? 'bg-green-100 text-green-800'
														: 'bg-gray-100 text-gray-600'}"
												>
													{a.checkin.participationStatus === 'participated' ? '已参加' : '未参加'}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

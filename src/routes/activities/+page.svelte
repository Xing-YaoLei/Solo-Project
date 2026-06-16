<script lang="ts">
	import { onMount } from 'svelte';
	import { activityTypeMap, careLevelMap } from '$lib/client-utils';
	import { formatDateTime, formatTime } from '$lib/server/utils';
	import Modal from '$lib/components/Modal.svelte';

	type Elderly = { id: string; name: string; roomNumber: string | null; careLevel: string };
	type User = { id: string; fullName: string };
	type Checkin = {
		checkin: {
			id: string;
			activityType: string;
			activityName: string;
			checkinTime: number;
			participationStatus: string;
			durationMinutes: number | null;
			notes: string | null;
		};
		elderly: Elderly;
		checker: User;
	};

	let checkins: Checkin[] = [];
	let elderlyList: Elderly[] = [];
	let loading = true;
	let filterDate = new Date();
	let filterType = '';
	let filterElderly = '';

	let showAddCheckin = false;
	let newCheckin = {
		elderlyId: '',
		activityType: 'morning_exercise' as const,
		activityName: '',
		participationStatus: 'participated',
		durationMinutes: 30,
		notes: ''
	};

	const activityTypes = [
		{ value: 'morning_exercise', label: '晨间锻炼' },
		{ value: 'recreational', label: '娱乐活动' },
		{ value: 'meal', label: '用餐' },
		{ value: 'rest', label: '休息' },
		{ value: 'therapy', label: '理疗' },
		{ value: 'walk', label: '散步' },
		{ value: 'other', label: '其他' }
	];

	$: filteredCheckins = checkins.filter((c) => {
		if (filterType && c.checkin.activityType !== filterType) return false;
		if (filterElderly && c.elderly.id !== filterElderly) return false;
		return true;
	});

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const dayStart = new Date(filterDate);
			dayStart.setHours(0, 0, 0, 0);

			const res = await fetch('/api/trpc/activity.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'activity.list',
					params: { input: { date: dayStart.getTime() } }
				})
			});
			checkins = (await res.json()).result?.data || [];

			const elderlyRes = await fetch('/api/trpc/elderly.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'elderly.list', params: { input: {} } })
			});
			elderlyList = (await elderlyRes.json()).result?.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function saveCheckin() {
		if (!newCheckin.elderlyId || !newCheckin.activityName) {
			alert('请填写完整信息');
			return;
		}

		await fetch('/api/trpc/activity.create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'activity.create',
				params: { input: newCheckin }
			})
		});

		showAddCheckin = false;
		newCheckin = {
			elderlyId: '',
			activityType: 'morning_exercise',
			activityName: '',
			participationStatus: 'participated',
			durationMinutes: 30,
			notes: ''
		};
		loadAll();
	}

	$: activityStats = activityTypes.map((t) => ({
		...t,
		count: checkins.filter((c) => c.checkin.activityType === t.value).length
	}));
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div class="flex items-center gap-3 flex-wrap">
				<div>
					<label class="label text-xs">日期</label>
					<input
						type="date"
						class="input"
						value={filterDate.toISOString().split('T')[0]}
						on:change={(e) => {
							filterDate = new Date((e.target as HTMLInputElement).value);
							loadAll();
						}}
					/>
				</div>
				<div>
					<label class="label text-xs">活动类型</label>
					<select class="select" bind:value={filterType}>
						<option value="">全部类型</option>
						{#each activityTypes as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label text-xs">老人</label>
					<select class="select" bind:value={filterElderly}>
						<option value="">全部老人</option>
						{#each elderlyList as e}
							<option value={e.id}>{e.name} ({e.roomNumber || '未分配'})</option>
						{/each}
					</select>
				</div>
			</div>

			<button class="btn btn-primary" on:click={() => (showAddCheckin = true)}>
				<span class="mr-2">+</span> 签到登记
			</button>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
			{#each activityStats as s}
				<div class="p-4 rounded-lg bg-white border border-gray-100">
					<div class="text-2xl">{activityTypeMap[s.value]?.icon || '📝'}</div>
					<div class="mt-1">
						<div class="text-xl font-bold text-gray-800">{s.count}</div>
						<div class="text-xs text-gray-500">{s.label}</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="font-semibold text-gray-800">签到记录（{filteredCheckins.length}）</h3>
			</div>
			<div class="card-body">
				{#if filteredCheckins.length === 0}
					<div class="empty-state">
						<div class="empty-state-icon">✅</div>
						<div class="empty-state-text">暂无签到记录</div>
						<div class="empty-state-subtext">点击右上角进行签到登记</div>
					</div>
				{:else}
					<div class="table-wrapper">
						<table class="table">
							<thead>
								<tr>
									<th>时间</th>
									<th>活动</th>
									<th>老人</th>
									<th>房间</th>
									<th>护理等级</th>
									<th>参与状态</th>
									<th>时长</th>
									<th>登记人</th>
									<th>备注</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredCheckins as c}
									<tr>
										<td class="font-medium">{formatDateTime(c.checkin.checkinTime)}</td>
										<td>
											<div class="flex items-center gap-2">
												<span>{activityTypeMap[c.checkin.activityType]?.icon || '📝'}</span>
												<span>
													<span class="badge {activityTypeMap[c.checkin.activityType]?.color || 'bg-gray-100 text-gray-800'} mr-1">
														{activityTypeMap[c.checkin.activityType]?.label || c.checkin.activityType}
													</span>
													{c.checkin.activityName}
												</span>
											</div>
										</td>
										<td class="font-medium">{c.elderly.name}</td>
										<td class="text-gray-600">{c.elderly.roomNumber || '-'}</td>
										<td>
											<span class="badge {careLevelMap[c.elderly.careLevel].color}">
												{careLevelMap[c.elderly.careLevel].label}
											</span>
										</td>
										<td>
											<span
												class="badge {c.checkin.participationStatus === 'participated'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-600'}"
											>
												{c.checkin.participationStatus === 'participated' ? '已参加' : '未参加'}
											</span>
										</td>
										<td class="text-gray-600">{c.checkin.durationMinutes ? `${c.checkin.durationMinutes}分钟` : '-'}</td>
										<td class="text-gray-600">{c.checker.fullName}</td>
										<td class="text-gray-500 text-xs max-w-xs truncate">{c.checkin.notes || '-'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<Modal open={showAddCheckin} title="活动签到登记" on:close={() => (showAddCheckin = false)}>
		<div class="modal-body space-y-4">
			<div>
				<label class="label">选择老人 *</label>
				<select class="select" bind:value={newCheckin.elderlyId}>
					<option value="">请选择</option>
					{#each elderlyList as e}
						<option value={e.id}>{e.name} ({e.roomNumber || '未分配房间'})</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label">活动类型 *</label>
				<select class="select" bind:value={newCheckin.activityType}>
					{#each activityTypes as t}
						<option value={t.value}>{t.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label">活动名称 *</label>
				<input class="input" bind:value={newCheckin.activityName} placeholder="如：早操、书法课、午餐" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">参与状态</label>
					<select class="select" bind:value={newCheckin.participationStatus}>
						<option value="participated">已参加</option>
						<option value="absent">未参加</option>
					</select>
				</div>
				<div>
					<label class="label">时长（分钟）</label>
					<input type="number" class="input" bind:value={newCheckin.durationMinutes} />
				</div>
			</div>
			<div>
				<label class="label">备注</label>
				<textarea class="textarea" rows="2" bind:value={newCheckin.notes} placeholder="特殊情况说明"></textarea>
			</div>
		</div>
		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={() => (showAddCheckin = false)}>取消</button>
			<button class="btn btn-primary" on:click={saveCheckin}>确认签到</button>
		</div>
	</Modal>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		riskEventTypeMap,
		riskSeverityMap,
		riskStatusMap,
		careLevelMap
	} from '$lib/client-utils';
	import { formatDateTime } from '$lib/server/utils';
	import Modal from '$lib/components/Modal.svelte';

	type Elderly = { id: string; name: string; roomNumber: string | null; careLevel: string };
	type User = { id: string; fullName: string };
	type RiskEventItem = {
		event: {
			id: string;
			eventType: string;
			severity: string;
			status: string;
			occurredAt: number;
			location: string | null;
			description: string;
			immediateAction: string | null;
		};
		elderly: Elderly;
		reporter: User;
	};

	let events: RiskEventItem[] = [];
	let elderlyList: Elderly[] = [];
	let loading = true;
	let filterStatus = '';
	let filterType = '';
	let filterSeverity = '';

	let showAddEvent = false;
	let newEvent = {
		elderlyId: '',
		eventType: 'fall' as const,
		severity: 'medium' as const,
		occurredAt: Date.now(),
		location: '',
		description: '',
		immediateAction: ''
	};

	const eventTypes = [
		{ value: 'fall', label: '跌倒' },
		{ value: 'illness', label: '疾病' },
		{ value: 'medication_error', label: '用药差错' },
		{ value: 'wandering', label: '走失' },
		{ value: 'conflict', label: '冲突' },
		{ value: 'other', label: '其他' }
	];

	const severities = [
		{ value: 'low', label: '低' },
		{ value: 'medium', label: '中' },
		{ value: 'high', label: '高' },
		{ value: 'critical', label: '危急' }
	];

	const statuses = [
		{ value: 'reported', label: '已上报' },
		{ value: 'investigating', label: '调查中' },
		{ value: 'resolved', label: '已解决' },
		{ value: 'closed', label: '已关闭' }
	];

	$: filteredEvents = events.filter((e) => {
		if (filterStatus && e.event.status !== filterStatus) return false;
		if (filterType && e.event.eventType !== filterType) return false;
		if (filterSeverity && e.event.severity !== filterSeverity) return false;
		return true;
	});

	$: stats = {
		total: events.length,
		open: events.filter((e) => e.event.status === 'reported' || e.event.status === 'investigating').length,
		falls: events.filter((e) => e.event.eventType === 'fall').length,
		critical: events.filter((e) => e.event.severity === 'critical' || e.event.severity === 'high').length
	};

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const res = await fetch('/api/trpc/risk.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'risk.list', params: { input: {} } })
			});
			events = (await res.json()).result?.data || [];

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

	async function saveEvent() {
		if (!newEvent.elderlyId || !newEvent.description) {
			alert('请填写必要信息');
			return;
		}

		await fetch('/api/trpc/risk.create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'risk.create',
				params: { input: newEvent }
			})
		});

		showAddEvent = false;
		newEvent = {
			elderlyId: '',
			eventType: 'fall',
			severity: 'medium',
			occurredAt: Date.now(),
			location: '',
			description: '',
			immediateAction: ''
		};
		loadAll();
	}
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-gray-800">{stats.total}</div>
						<div class="stat-label">全部事件</div>
					</div>
					<div class="text-4xl">📋</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-yellow-600">{stats.open}</div>
						<div class="stat-label">待处理</div>
					</div>
					<div class="text-4xl">⏳</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-red-600">{stats.falls}</div>
						<div class="stat-label">跌倒事件</div>
					</div>
					<div class="text-4xl">🚨</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-orange-600">{stats.critical}</div>
						<div class="stat-label">高/危急</div>
					</div>
					<div class="text-4xl">⚠️</div>
				</div>
			</div>
		</div>

		<div class="flex items-center justify-between flex-wrap gap-4">
			<div class="flex items-center gap-3 flex-wrap">
				<div>
					<label class="label text-xs">状态</label>
					<select class="select" bind:value={filterStatus}>
						<option value="">全部状态</option>
						{#each statuses as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label text-xs">类型</label>
					<select class="select" bind:value={filterType}>
						<option value="">全部类型</option>
						{#each eventTypes as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label text-xs">严重程度</label>
					<select class="select" bind:value={filterSeverity}>
						<option value="">全部</option>
						{#each severities as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<button class="btn btn-danger" on:click={() => (showAddEvent = true)}>
				<span class="mr-2">+</span> 上报风险事件
			</button>
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="font-semibold text-gray-800">风险事件列表（{filteredEvents.length}）</h3>
			</div>
			<div class="card-body">
				{#if filteredEvents.length === 0}
					<div class="empty-state">
						<div class="empty-state-icon">✨</div>
						<div class="empty-state-text">暂无风险事件</div>
						<div class="empty-state-subtext">保持良好的护理工作！</div>
					</div>
				{:else}
					<div class="space-y-3">
						{#each filteredEvents as e}
							<div
								class="{e.event.eventType === 'fall'
									? 'border-l-4 border-red-500 bg-red-50/50'
									: 'border-l-4 border-transparent'} p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
								on:click={() => goto(`/risks/${e.event.id}`)}
							>
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 flex-wrap">
											{e.event.eventType === 'fall' && (
												<span class="badge bg-red-200 text-red-800 font-bold">🔥 跌倒高危</span>
											)}
											<span class="badge {riskEventTypeMap[e.event.eventType].color}">
												{riskEventTypeMap[e.event.eventType].label}
											</span>
											<span class="badge {riskSeverityMap[e.event.severity].color}">
												{riskSeverityMap[e.event.severity].label}风险
											</span>
											<span class="badge {riskStatusMap[e.event.status].color}">
												{riskStatusMap[e.event.status].label}
											</span>
										</div>

										<div class="mt-3 flex items-center gap-3">
											<div class="flex items-center gap-2">
												<div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
													{e.elderly.name.charAt(0)}
												</div>
												<div>
													<div class="font-medium text-gray-800">{e.elderly.name}</div>
													<div class="text-xs text-gray-500">
														{e.elderly.roomNumber || '未分配房间'} · {careLevelMap[e.elderly.careLevel].label}
													</div>
												</div>
											</div>
										</div>

										<p class="mt-2 text-sm text-gray-600 line-clamp-2">{e.event.description}</p>

										<div class="mt-2 flex items-center gap-4 text-xs text-gray-400">
											<span>🕒 {formatDateTime(e.event.occurredAt)}</span>
											{e.event.location && <span>📍 {e.event.location}</span>}
											<span>上报人：{e.reporter.fullName}</span>
										</div>
									</div>

									<div class="text-primary-500">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<Modal open={showAddEvent} title="上报风险事件" size="lg" on:close={() => (showAddEvent = false)}>
		<div class="modal-body space-y-4">
			<div class="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
				⚠️ 请如实填写事件情况，信息将用于后续处理和改进。
			</div>
			<div>
				<label class="label">涉事老人 *</label>
				<select class="select" bind:value={newEvent.elderlyId}>
					<option value="">请选择</option>
					{#each elderlyList as el}
						<option value={el.id}>{el.name} ({el.roomNumber || '未分配房间'})</option>
					{/each}
				</select>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">事件类型 *</label>
					<select class="select" bind:value={newEvent.eventType}>
						{#each eventTypes as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">严重程度 *</label>
					<select class="select" bind:value={newEvent.severity}>
						{#each severities as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">发生时间</label>
					<input
						type="datetime-local"
						class="input"
						value={new Date(newEvent.occurredAt).toISOString().slice(0, 16)}
						on:change={(ev) => {
							newEvent.occurredAt = new Date((ev.target as HTMLInputElement).value).getTime();
						}}
					/>
				</div>
				<div>
					<label class="label">发生地点</label>
					<input class="input" bind:value={newEvent.location} placeholder="如：302房间、走廊、餐厅" />
				</div>
			</div>
			<div>
				<label class="label">事件描述 *</label>
				<textarea
					class="textarea"
					rows="3"
					bind:value={newEvent.description}
					placeholder="请详细描述事件经过、发现时间、当时情况等"
				></textarea>
			</div>
			<div>
				<label class="label">已采取的应急措施</label>
				<textarea
					class="textarea"
					rows="2"
					bind:value={newEvent.immediateAction}
					placeholder="如：已通知医生、已联系家属、已进行急救等"
				></textarea>
			</div>
		</div>
		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={() => (showAddEvent = false)}>取消</button>
			<button class="btn btn-danger" on:click={saveEvent}>提交上报</button>
		</div>
	</Modal>
{/if}

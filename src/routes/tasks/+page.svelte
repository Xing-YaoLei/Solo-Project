<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate,
		formatDateTime,
		getTaskTypeLabel,
		getTaskStatusLabel,
		getStatusBadge,
		getPriorityLabel,
		getPriorityBadge
	} from '$lib/utils';
	import type { CleaningTask, TaskStatusHistory, Property, User } from '$lib/server/db/schema';

	let listData: {
		items: { task: CleaningTask; property: Property | null; cleaner: User | null }[];
		total: number;
		page: number;
		pageSize: number;
		totalPages: number;
	} | null = null;
	let properties: Property[] = [];
	let cleaners: User[] = [];
	let currentUser: any = null;
	let loading = true;

	let filterPropertyId = '';
	let filterCleanerId = '';
	let filterStatus = '';
	let filterType = '';
	let filterDateFrom = '';
	let filterDateTo = '';
	let currentPage = 1;

	let detailModal = false;
	let detailData: any = null;
	let detailLoading = false;

	let formModal = false;
	let formMode: 'create' | 'edit' = 'create';
	let formLoading = false;
	let formError = '';
	let formId = '';
	let formPropertyId = '';
	let formCleanerId = '';
	let formScheduledDate = '';
	let formScheduledStartTime = '';
	let formDeadlineTime = '';
	let formType = 'checkout_cleaning';
	let formPriority = 'medium';
	let formDescription = '';
	let formChecklistStr = '';

	let statusModal = false;
	let statusLoading = false;
	let statusError = '';
	let statusTaskId = '';
	let statusCurrent = '';
	let statusTarget = '';
	let statusReason = '';
	let statusQualityScore = '';
	let statusCleanerNotes = '';
	let statusInspectorNotes = '';

	const statusOptions = [
		{ value: '', label: '全部状态' },
		{ value: 'pending', label: '待分配' },
		{ value: 'assigned', label: '已分配' },
		{ value: 'accepted', label: '已接单' },
		{ value: 'in_progress', label: '进行中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'verified', label: '已验收' },
		{ value: 'cancelled', label: '已取消' },
		{ value: 'missed', label: '漏单' }
	];

	const typeOptions = [
		{ value: '', label: '全部类型' },
		{ value: 'checkout_cleaning', label: '退房保洁' },
		{ value: 'periodic_cleaning', label: '日常保洁' },
		{ value: 'deep_cleaning', label: '深度清洁' },
		{ value: 'maintenance', label: '维修保养' }
	];

	const priorityOptions = [
		{ value: 'low', label: '低' },
		{ value: 'medium', label: '中' },
		{ value: 'high', label: '高' },
		{ value: 'urgent', label: '紧急' }
	];

	const allowedTransitions: Record<string, string[]> = {
		pending: ['assigned', 'cancelled'],
		assigned: ['accepted', 'pending', 'cancelled'],
		accepted: ['in_progress', 'assigned', 'cancelled'],
		in_progress: ['completed', 'accepted'],
		completed: ['verified', 'in_progress'],
		verified: ['completed'],
		cancelled: [],
		missed: ['pending']
	};

	const transitionLabels: Record<string, string> = {
		assigned: '分配任务',
		pending: '退回待分配',
		accepted: '接单',
		in_progress: '开始作业',
		completed: '完成作业',
		verified: '验收通过',
		cancelled: '取消任务'
	};

	onMount(async () => {
		[currentUser, properties, cleaners] = await Promise.all([
			trpc().user.getCurrent.query(),
			trpc().property.listAll.query(),
			trpc().user.listCleaners.query()
		]);
		await loadList();
	});

	async function loadList() {
		loading = true;
		try {
			const input: any = { page: currentPage, pageSize: 20 };
			if (filterPropertyId) input.propertyId = filterPropertyId;
			if (filterCleanerId) input.cleanerId = filterCleanerId;
			if (filterStatus) input.status = filterStatus;
			if (filterType) input.type = filterType;
			if (filterDateFrom) input.dateFrom = new Date(filterDateFrom);
			if (filterDateTo) input.dateTo = new Date(filterDateTo + 'T23:59:59');
			listData = await trpc().cleaningTask.list.query(input);
		} finally {
			loading = false;
		}
	}

	async function handleSearch() {
		currentPage = 1;
		await loadList();
	}

	async function handleReset() {
		filterPropertyId = '';
		filterCleanerId = '';
		filterStatus = '';
		filterType = '';
		filterDateFrom = '';
		filterDateTo = '';
		currentPage = 1;
		await loadList();
	}

	async function openDetail(id: string) {
		detailModal = true;
		detailLoading = true;
		detailData = null;
		try {
			detailData = await trpc().cleaningTask.get.query({ id });
		} finally {
			detailLoading = false;
		}
	}

	function openCreate() {
		formMode = 'create';
		formId = '';
		formPropertyId = '';
		formCleanerId = '';
		const today = new Date();
		formScheduledDate = formatDate(today.getTime());
		formScheduledStartTime = '';
		formDeadlineTime = '';
		formType = 'checkout_cleaning';
		formPriority = 'medium';
		formDescription = '';
		formChecklistStr = '';
		formError = '';
		formModal = true;
	}

	function openEdit(row: any) {
		formMode = 'edit';
		formId = row.task.id;
		formPropertyId = row.task.propertyId;
		formCleanerId = row.task.assignedCleanerId || '';
		formScheduledDate = formatDate(row.task.scheduledDate);
		formScheduledStartTime = row.task.scheduledStartTime || '';
		formDeadlineTime = row.task.deadlineTime ? formatDate(row.task.deadlineTime) : '';
		formType = row.task.type;
		formPriority = row.task.priority;
		formDescription = row.task.description || '';
		formChecklistStr = row.task.checklist?.join('\n') || '';
		formError = '';
		formModal = true;
	}

	async function handleFormSubmit() {
		formLoading = true;
		formError = '';
		try {
			const checklist = formChecklistStr
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean);

			const input: any = {
				propertyId: formPropertyId,
				scheduledDate: new Date(formScheduledDate),
				type: formType as any,
				priority: formPriority as any,
				description: formDescription || undefined,
				checklist
			};
			if (formCleanerId) input.assignedCleanerId = formCleanerId;
			if (formScheduledStartTime) input.scheduledStartTime = formScheduledStartTime;
			if (formDeadlineTime) input.deadlineTime = new Date(formDeadlineTime);

			if (formMode === 'create') {
				await trpc().cleaningTask.create.mutate(input);
			} else {
				await trpc().cleaningTask.update.mutate({
					id: formId,
					assignedCleanerId: formCleanerId || null,
					scheduledDate: new Date(formScheduledDate),
					scheduledStartTime: formScheduledStartTime || null,
					deadlineTime: formDeadlineTime ? new Date(formDeadlineTime) : null,
					type: formType as any,
					priority: formPriority as any,
					description: formDescription || null,
					checklist
				});
			}
			formModal = false;
			await loadList();
		} catch (e: any) {
			formError = e?.message || '操作失败';
		} finally {
			formLoading = false;
		}
	}

	function openStatusChange(task: CleaningTask, target: string) {
		statusTaskId = task.id;
		statusCurrent = task.status;
		statusTarget = target;
		statusReason = '';
		statusQualityScore = '';
		statusCleanerNotes = task.cleanerNotes || '';
		statusInspectorNotes = task.inspectorNotes || '';
		statusError = '';
		statusModal = true;
	}

	async function handleStatusSubmit() {
		statusLoading = true;
		statusError = '';
		try {
			const input: any = {
				id: statusTaskId,
				status: statusTarget as any
			};
			if (statusReason) input.reason = statusReason;
			if (statusTarget === 'completed' && statusCleanerNotes) input.cleanerNotes = statusCleanerNotes;
			if (statusTarget === 'verified') {
				if (statusQualityScore) input.qualityScore = Number(statusQualityScore);
				if (statusInspectorNotes) input.inspectorNotes = statusInspectorNotes;
			}
			await trpc().cleaningTask.changeStatus.mutate(input);
			statusModal = false;
			await loadList();
			if (detailData && detailData.task.id === statusTaskId) {
				await openDetail(statusTaskId);
			}
		} catch (e: any) {
			statusError = e?.message || '操作失败';
		} finally {
			statusLoading = false;
		}
	}

	function canTransition(status: string): string[] {
		if (currentUser?.role === 'cleaner') {
			if (status === 'assigned') return ['accepted'];
			if (status === 'accepted') return ['in_progress'];
			if (status === 'in_progress') return ['completed'];
			return [];
		}
		return allowedTransitions[status] || [];
	}

	function isManagerOrAdmin() {
		return currentUser?.role === 'admin' || currentUser?.role === 'manager';
	}
</script>

<div class="p-8">
	<div class="mb-6 flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">保洁任务</h1>
			<p class="text-gray-500 mt-1">管理和跟踪所有保洁任务</p>
		</div>
		{#if isManagerOrAdmin()}
			<button class="btn-primary" on:click={openCreate}>+ 新建任务</button>
		{/if}
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
				<div>
					<label class="label">房源</label>
					<select class="input" bind:value={filterPropertyId}>
						<option value="">全部房源</option>
						{#each properties as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">保洁员</label>
					<select class="input" bind:value={filterCleanerId}>
						<option value="">全部保洁员</option>
						{#each cleaners as c}
							<option value={c.id}>{c.realName}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">状态</label>
					<select class="input" bind:value={filterStatus}>
						{#each statusOptions as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">类型</label>
					<select class="input" bind:value={filterType}>
						{#each typeOptions as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">开始日期</label>
					<input type="date" class="input" bind:value={filterDateFrom} />
				</div>
				<div>
					<label class="label">结束日期</label>
					<input type="date" class="input" bind:value={filterDateTo} />
				</div>
			</div>
			<div class="mt-4 flex gap-2 justify-end">
				<button class="btn-secondary" on:click={handleReset}>重置</button>
				<button class="btn-primary" on:click={handleSearch}>筛选</button>
			</div>
		</div>
	</div>

	<div class="card">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>房源</th>
						<th>计划日期</th>
						<th>保洁员</th>
						<th>类型</th>
						<th>优先级</th>
						<th>状态</th>
						<th>创建时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr>
							<td colspan="8" class="text-center py-12 text-gray-400">加载中...</td>
						</tr>
					{:else if listData?.items.length === 0}
						<tr>
							<td colspan="8" class="text-center py-12 text-gray-400">暂无任务</td>
						</tr>
					{:else}
						{#each listData?.items || [] as row}
							<tr>
								<td>
									<div class="font-medium">{row.property?.name || '-'}</div>
									<div class="text-xs text-gray-500 mt-0.5">{row.property?.address || ''}</div>
								</td>
								<td>
									<div>{formatDate(row.task.scheduledDate)}</div>
									{#if row.task.scheduledStartTime}
										<div class="text-xs text-gray-500 mt-0.5">{row.task.scheduledStartTime}</div>
									{/if}
								</td>
								<td>{row.cleaner?.realName || '<span class="text-gray-400">未分配'}</td>
								<td>{getTaskTypeLabel(row.task.type)}</td>
								<td>
									<span class="badge badge-{getPriorityBadge(row.task.priority)}">
										{getPriorityLabel(row.task.priority)}
									</span>
								</td>
								<td>
									<span class="badge badge-{getStatusBadge(row.task.status)}">
										{getTaskStatusLabel(row.task.status)}
									</span>
								</td>
								<td class="text-gray-500">{formatDateTime(row.task.createdAt)}</td>
								<td>
									<div class="flex gap-1 flex-wrap">
										<button class="btn-secondary text-xs !px-2 !py-1" on:click={() => openDetail(row.task.id)}>
											详情
										</button>
										{#if isManagerOrAdmin()}
											<button class="btn-secondary text-xs !px-2 !py-1" on:click={() => openEdit(row)}>
												编辑
											</button>
										{/if}
										{#each canTransition(row.task.status) as target}
											<button
												class="text-xs !px-2 !py-1 btn {target === 'cancelled'
													? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
													: target === 'verified' || target === 'completed'
														? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
														: 'btn-secondary'}"
												on:click={() => openStatusChange(row.task, target)}
											>
												{transitionLabels[target] || getTaskStatusLabel(target)}
											</button>
										{/each}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if listData && listData.totalPages > 1}
			<div class="card-body border-t border-gray-200 flex items-center justify-between">
				<div class="text-sm text-gray-500">
					共 {listData.total} 条，第 {listData.page} / {listData.totalPages} 页
				</div>
				<div class="flex gap-2">
					<button
						class="btn-secondary"
						disabled={listData.page <= 1}
						on:click={() => {
							currentPage = listData.page - 1;
							loadList();
						}}
					>
						上一页
					</button>
					<button
						class="btn-secondary"
						disabled={listData.page >= listData.totalPages}
						on:click={() => {
							currentPage = listData.page + 1;
							loadList();
						}}
					>
						下一页
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if detailModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => (detailModal = false)}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
				<h2 class="text-lg font-semibold">任务详情</h2>
				<button class="text-gray-400 hover:text-gray-600 text-xl" on:click={() => (detailModal = false)}>×</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6">
				{#if detailLoading}
					<div class="text-center py-12 text-gray-400">加载中...</div>
				{:else if detailData}
					<div class="grid grid-cols-2 gap-6 mb-6">
						<div>
							<div class="text-sm text-gray-500 mb-1">房源</div>
							<div class="font-medium">{detailData.property?.name || '-'}</div>
							<div class="text-sm text-gray-500 mt-0.5">{detailData.property?.address || ''}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500 mb-1">预订关联</div>
							<div class="font-medium">
								{detailData.booking
									? `${detailData.booking.guestName} · ${formatDate(detailData.booking.checkInDate)} ~ ${formatDate(detailData.booking.checkOutDate)}`
									: '无'}
							</div>
						</div>
						<div>
							<div class="text-sm text-gray-500 mb-1">计划日期</div>
							<div class="font-medium">{formatDate(detailData.task.scheduledDate)}</div>
							{#if detailData.task.scheduledStartTime}
								<div class="text-sm text-gray-500 mt-0.5">开始时间：{detailData.task.scheduledStartTime}</div>
							{/if}
							{#if detailData.task.deadlineTime}
								<div class="text-sm text-gray-500 mt-0.5">截止时间：{formatDateTime(detailData.task.deadlineTime)}</div>
							{/if}
						</div>
						<div>
							<div class="text-sm text-gray-500 mb-1">保洁员</div>
							<div class="font-medium">{detailData.cleaner?.realName || '<span class="text-gray-400">未分配'}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500 mb-1">类型 / 优先级</div>
							<div class="flex gap-2 items-center mt-1">
								<span>{getTaskTypeLabel(detailData.task.type)}</span>
								<span class="badge badge-{getPriorityBadge(detailData.task.priority)}">
									{getPriorityLabel(detailData.task.priority)}
								</span>
							</div>
						</div>
						<div>
							<div class="text-sm text-gray-500 mb-1">状态</div>
							<span class="badge badge-{getStatusBadge(detailData.task.status)}">
								{getTaskStatusLabel(detailData.task.status)}
							</span>
						</div>
						{#if detailData.task.actualStartTime || detailData.task.actualEndTime}
							<div class="col-span-2">
								<div class="text-sm text-gray-500 mb-1">实际执行时间</div>
								<div class="font-medium">
									{detailData.task.actualStartTime ? formatDateTime(detailData.task.actualStartTime) : '-'}
									~
									{detailData.task.actualEndTime ? formatDateTime(detailData.task.actualEndTime) : '-'}
								</div>
							</div>
						{/if}
						{#if detailData.task.qualityScore !== null}
							<div>
								<div class="text-sm text-gray-500 mb-1">质量评分</div>
								<div class="font-medium text-lg">{detailData.task.qualityScore} 分</div>
							</div>
						{/if}
						{#if detailData.verifier}
							<div>
								<div class="text-sm text-gray-500 mb-1">验收人</div>
								<div class="font-medium">
									{detailData.verifier.realName}
									{#if detailData.task.verifiedAt}
										<span class="text-sm text-gray-500 ml-2">@ {formatDateTime(detailData.task.verifiedAt)}</span>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					{#if detailData.task.description}
						<div class="mb-6">
							<div class="text-sm text-gray-500 mb-2">任务描述</div>
							<div class="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
								{detailData.task.description}
							</div>
						</div>
					{/if}

					{#if detailData.task.checklist?.length}
						<div class="mb-6">
							<div class="text-sm text-gray-500 mb-2">检查清单</div>
							<ul class="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
								{#each detailData.task.checklist as item, i}
									<li class="flex items-start gap-2">
										<input type="checkbox" disabled checked class="mt-0.5" />
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if detailData.task.cleanerNotes}
						<div class="mb-6">
							<div class="text-sm text-gray-500 mb-2">保洁员备注</div>
							<div class="bg-blue-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
								{detailData.task.cleanerNotes}
							</div>
						</div>
					{/if}

					{#if detailData.task.inspectorNotes}
						<div class="mb-6">
							<div class="text-sm text-gray-500 mb-2">验收备注</div>
							<div class="bg-green-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
								{detailData.task.inspectorNotes}
							</div>
						</div>
					{/if}

					<div>
						<div class="text-sm font-medium text-gray-700 mb-3">状态历史</div>
						<div class="space-y-3">
							{#each detailData.statusHistory || [] as h}
								<div class="flex gap-3">
									<div class="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											{#if h.history.fromStatus}
												<span class="text-sm text-gray-500">{getTaskStatusLabel(h.history.fromStatus)}</span>
												<span class="text-gray-400">→</span>
											{/if}
											<span class="badge badge-{getStatusBadge(h.history.toStatus)}">
												{getTaskStatusLabel(h.history.toStatus)}
											</span>
											{#if h.history.reason}
												<span class="text-xs text-gray-500">({h.history.reason})</span>
											{/if}
										</div>
										<div class="text-xs text-gray-400 mt-1">
											{h.changer?.realName || h.changer?.username || '系统'}
											 · {formatDateTime(h.history.changedAt)}
										</div>
									</div>
								</div>
							{:else}
								<div class="text-sm text-gray-400">暂无状态变更记录</div>
							{/each}
						</div>
					</div>

					{#if canTransition(detailData.task.status).length > 0}
						<div class="mt-6 pt-6 border-t border-gray-200 flex gap-2 flex-wrap">
							{#each canTransition(detailData.task.status) as target}
								<button
									class="{target === 'cancelled'
										? 'btn-danger'
										: target === 'verified' || target === 'completed'
											? 'btn-success'
											: 'btn-primary'}"
									on:click={() => {
										detailModal = false;
										openStatusChange(detailData.task, target);
									}}
								>
									{transitionLabels[target] || getTaskStatusLabel(target)}
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if formModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => (formModal = false)}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
				<h2 class="text-lg font-semibold">{formMode === 'create' ? '新建任务' : '编辑任务'}</h2>
				<button class="text-gray-400 hover:text-gray-600 text-xl" on:click={() => (formModal = false)}>×</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				{#if formError}
					<div class="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{formError}</div>
				{/if}
				<div>
					<label class="label">房源 <span class="text-red-500">*</span></label>
					<select class="input" bind:value={formPropertyId}>
						<option value="">请选择房源</option>
						{#each properties as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">保洁员</label>
					<select class="input" bind:value={formCleanerId}>
						<option value="">暂不分配</option>
						{#each cleaners as c}
							<option value={c.id}>{c.realName}</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">计划日期 <span class="text-red-500">*</span></label>
						<input type="date" class="input" bind:value={formScheduledDate} />
					</div>
					<div>
						<label class="label">计划开始时间</label>
						<input type="time" class="input" bind:value={formScheduledStartTime} />
					</div>
				</div>
				<div>
					<label class="label">截止时间</label>
					<input type="date" class="input" bind:value={formDeadlineTime} />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">任务类型</label>
						<select class="input" bind:value={formType}>
							<option value="checkout_cleaning">退房保洁</option>
							<option value="periodic_cleaning">日常保洁</option>
							<option value="deep_cleaning">深度清洁</option>
							<option value="maintenance">维修保养</option>
						</select>
					</div>
					<div>
						<label class="label">优先级</label>
						<select class="input" bind:value={formPriority}>
							{#each priorityOptions as p}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<label class="label">任务描述</label>
					<textarea class="input" rows="3" bind:value={formDescription} placeholder="请输入任务描述..."></textarea>
				</div>
				<div>
					<label class="label">检查清单</label>
					<textarea
						class="input"
						rows="4"
						bind:value={formChecklistStr}
						placeholder="每行一项，例如：&#10;更换床单被套&#10;清洁卫生间&#10;吸尘拖地"
					></textarea>
					<p class="text-xs text-gray-500 mt-1">每行一项，自动生成检查清单</p>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
				<button class="btn-secondary" on:click={() => (formModal = false)} disabled={formLoading}>取消</button>
				<button class="btn-primary" on:click={handleFormSubmit} disabled={formLoading || !formPropertyId || !formScheduledDate}>
					{formLoading ? '提交中...' : formMode === 'create' ? '创建' : '保存'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if statusModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => (statusModal = false)}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-md">
			<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
				<h2 class="text-lg font-semibold">
					{transitionLabels[statusTarget] || getTaskStatusLabel(statusTarget)}
				</h2>
				<button class="text-gray-400 hover:text-gray-600 text-xl" on:click={() => (statusModal = false)}>×</button>
			</div>
			<div class="p-6 space-y-4">
				{#if statusError}
					<div class="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{statusError}</div>
				{/if}
				<div class="flex items-center gap-2 text-sm">
					<span class="text-gray-500">当前状态：</span>
					<span class="badge badge-{getStatusBadge(statusCurrent)}">{getTaskStatusLabel(statusCurrent)}</span>
					<span class="text-gray-400">→</span>
					<span class="badge badge-{getStatusBadge(statusTarget)}">{getTaskStatusLabel(statusTarget)}</span>
				</div>
				{#if statusTarget === 'completed'}
					<div>
						<label class="label">保洁员备注</label>
						<textarea class="input" rows="3" bind:value={statusCleanerNotes} placeholder="完成情况说明..."></textarea>
					</div>
				{/if}
				{#if statusTarget === 'verified'}
					<div>
						<label class="label">质量评分 (0-100)</label>
						<input type="number" class="input" min="0" max="100" bind:value={statusQualityScore} placeholder="请输入分数" />
					</div>
					<div>
						<label class="label">验收备注</label>
						<textarea class="input" rows="3" bind:value={statusInspectorNotes} placeholder="验收情况说明..."></textarea>
					</div>
				{/if}
				<div>
					<label class="label">变更原因（可选）</label>
					<input type="text" class="input" bind:value={statusReason} placeholder="请输入变更原因" />
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
				<button class="btn-secondary" on:click={() => (statusModal = false)} disabled={statusLoading}>取消</button>
				<button
					class="{statusTarget === 'cancelled' ? 'btn-danger' : statusTarget === 'verified' || statusTarget === 'completed' ? 'btn-success' : 'btn-primary'}"
					on:click={handleStatusSubmit}
					disabled={statusLoading}
				>
					{statusLoading ? '提交中...' : '确认'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
	export const ssr = false;
</script>

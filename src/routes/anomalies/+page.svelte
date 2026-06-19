<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate, formatDateTime,
		getAnomalyTypeLabel, getAnomalyTypeBadge,
		getAnomalyStatusLabel, getAnomalyStatusBadge,
		getImpactLevelLabel, getImpactLevelBadge,
		getTaskTypeLabel, getTaskStatusLabel,
		downloadBase64File
	} from '$lib/utils';

	let loading = true;
	let items: any[] = [];
	let total = 0;
	let page = 1;
	let pageSize = 20;
	let totalPages = 0;

	let filterType: string = '';
	let filterStatus: string = '';
	let filterImpactLevel: string = '';
	let filterDateFrom: string = '';
	let filterDateTo: string = '';

	let showDetail = false;
	let selectedItem: any = null;

	let showForm = false;
	let isEditMode = false;
	let formData: any = {};
	let formErrors: Record<string, string> = {};

	let showBatchModal = false;
	let batchDateFrom: string = '';
	let batchDateTo: string = '';
	let batchLoading = false;
	let batchResult: any[] = [];
	let batchResultShown = false;

	let properties: any[] = [];
	let tasks: any[] = [];
	let cleaners: any[] = [];
	let currentUser: any = null;

	async function loadData() {
		loading = true;
		try {
			const res = await trpc().anomaly.list.query({
				type: filterType || undefined,
				status: filterStatus || undefined,
				impactLevel: filterImpactLevel || undefined,
				dateFrom: filterDateFrom ? new Date(filterDateFrom) : undefined,
				dateTo: filterDateTo ? new Date(filterDateTo) : undefined,
				page,
				pageSize
			});
			items = res.items;
			total = res.total;
			totalPages = res.totalPages;
		} finally {
			loading = false;
		}
	}

	async function loadOptions() {
		const [propRes, taskRes, userRes, user] = await Promise.all([
			trpc().property.listAll.query(),
			trpc().cleaningTask.list.query({ pageSize: 100 }),
			trpc().user.list.query({ role: 'cleaner', pageSize: 100 }),
			trpc().user.getCurrent.query()
		]);
		properties = propRes;
		tasks = taskRes.items;
		cleaners = userRes.items;
		currentUser = user;
	}

	onMount(async () => {
		await loadOptions();
		await loadData();
	});

	async function handleSearch() {
		page = 1;
		await loadData();
	}

	async function handleReset() {
		filterType = '';
		filterStatus = '';
		filterImpactLevel = '';
		filterDateFrom = '';
		filterDateTo = '';
		page = 1;
		await loadData();
	}

	async function goToPage(p: number) {
		page = p;
		await loadData();
	}

	async function openDetail(item: any) {
		selectedItem = await trpc().anomaly.get.query({ id: item.anomaly.id });
		showDetail = true;
	}

	function closeDetail() {
		showDetail = false;
		selectedItem = null;
	}

	function openCreate() {
		isEditMode = false;
		formData = {
			type: 'missed_cleaning',
			title: '',
			description: '',
			impactScope: '',
			impactLevel: 'medium',
			taskId: '',
			propertyId: '',
			responsiblePersonId: '',
			responsibleRole: ''
		};
		formErrors = {};
		showForm = true;
	}

	function openEdit(item: any) {
		isEditMode = true;
		formData = {
			id: item.anomaly.id,
			type: item.anomaly.type,
			title: item.anomaly.title,
			description: item.anomaly.description,
			impactScope: item.anomaly.impactScope,
			impactLevel: item.anomaly.impactLevel,
			taskId: item.anomaly.taskId,
			propertyId: item.anomaly.propertyId,
			responsiblePersonId: item.anomaly.responsiblePersonId || '',
			responsibleRole: item.anomaly.responsibleRole || '',
			status: item.anomaly.status,
			handlingMeasures: item.anomaly.handlingMeasures || '',
			handlingResult: item.anomaly.handlingResult || '',
			handlingConclusion: item.anomaly.handlingConclusion || '',
			penalty: item.anomaly.penalty || '',
			compensation: item.anomaly.compensation || '',
			followUpRequired: item.anomaly.followUpRequired || false,
			followUpNotes: item.anomaly.followUpNotes || ''
		};
		formErrors = {};
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		formData = {};
	}

	function validateForm() {
		formErrors = {};
		if (!formData.title) formErrors.title = '请输入标题';
		if (!formData.description) formErrors.description = '请输入描述';
		if (!formData.impactScope) formErrors.impactScope = '请输入影响范围';
		if (!formData.propertyId) formErrors.propertyId = '请选择房源';
		if (!formData.taskId) formErrors.taskId = '请选择关联任务';
		return Object.keys(formErrors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		try {
			const submitData: any = {
				...formData,
				compensation: formData.compensation ? Number(formData.compensation) : null
			};
			if (isEditMode) {
				await trpc().anomaly.update.mutate(submitData);
			} else {
				await trpc().anomaly.create.mutate(submitData);
			}
			closeForm();
			await loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	function onTaskSelect() {
		const task = tasks.find((t: any) => t.task.id === formData.taskId);
		if (task) {
			formData.propertyId = task.task.propertyId;
			if (task.cleaner) {
				formData.responsiblePersonId = task.cleaner.id;
				formData.responsibleRole = '保洁员';
			}
		}
	}

	async function handleUpdateStatus(item: any, newStatus: string) {
		if (!confirm(`确定将状态变更为「${getAnomalyStatusLabel(newStatus)}」吗？`)) return;
		try {
			await trpc().anomaly.update.mutate({
				id: item.anomaly.id,
				status: newStatus,
				handlingConclusion: (newStatus === 'resolved' || newStatus === 'closed')
					? (item.anomaly.handlingConclusion || '处理完成')
					: undefined
			});
			await loadData();
			if (showDetail && selectedItem?.anomaly.id === item.anomaly.id) {
				selectedItem = await trpc().anomaly.get.query({ id: item.anomaly.id });
			}
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	function openBatchModal() {
		batchResult = [];
		batchResultShown = false;
		batchLoading = false;
		const today = new Date();
		batchDateFrom = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
		batchDateTo = formatDate(today);
		showBatchModal = true;
	}

	function closeBatchModal() {
		showBatchModal = false;
		batchResult = [];
		batchResultShown = false;
	}

	async function handleBatchGenerate() {
		if (!batchDateFrom || !batchDateTo) {
			alert('请选择日期范围');
			return;
		}
		batchLoading = true;
		try {
			batchResult = await trpc().anomaly.generateFromMissedTasks.mutate({
				dateFrom: new Date(batchDateFrom),
				dateTo: new Date(batchDateTo)
			});
			batchResultShown = true;
			await loadData();
		} catch (e: any) {
			alert(e.message || '生成失败');
		} finally {
			batchLoading = false;
		}
	}

	const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';
</script>

<div class="p-8">
	<div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">异常单管理</h1>
			<p class="text-gray-500 mt-1">保洁漏单 · 超时 · 质量问题处理</p>
		</div>
		<div class="flex gap-3">
			{#if canManage}
				<button on:click={openBatchModal} class="btn-warning inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
					⚡ 批量生成漏单异常单
				</button>
				<button on:click={openCreate} class="btn-primary inline-flex items-center gap-2">
					+ 创建异常单
				</button>
			{/if}
		</div>
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
				<div>
					<label class="label">异常类型</label>
					<select bind:value={filterType} class="input">
						<option value="">全部</option>
						<option value="missed_cleaning">保洁漏单</option>
						<option value="late_cleaning">保洁超时</option>
						<option value="quality_issue">质量问题</option>
						<option value="no_show">爽约</option>
						<option value="other">其他</option>
					</select>
				</div>
				<div>
					<label class="label">处理状态</label>
					<select bind:value={filterStatus} class="input">
						<option value="">全部</option>
						<option value="pending">待处理</option>
						<option value="handling">处理中</option>
						<option value="resolved">已解决</option>
						<option value="closed">已关闭</option>
					</select>
				</div>
				<div>
					<label class="label">影响程度</label>
					<select bind:value={filterImpactLevel} class="input">
						<option value="">全部</option>
						<option value="low">低</option>
						<option value="medium">中</option>
						<option value="high">高</option>
						<option value="critical">严重</option>
					</select>
				</div>
				<div>
					<label class="label">发现日期起</label>
					<input type="date" bind:value={filterDateFrom} class="input" />
				</div>
				<div>
					<label class="label">发现日期止</label>
					<input type="date" bind:value={filterDateTo} class="input" />
				</div>
			</div>
			<div class="flex gap-3 mt-4 justify-end">
				<button on:click={handleReset} class="btn-secondary">重置</button>
				<button on:click={handleSearch} class="btn-primary">搜索</button>
			</div>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="card-body text-center py-16 text-gray-500">加载中...</div>
		{:else if items.length === 0}
			<div class="card-body text-center py-16 text-gray-400">
				<div class="text-4xl mb-3">📭</div>
				<p>暂无异常单数据</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>单号</th>
							<th>类型</th>
							<th>标题</th>
							<th>房源</th>
							<th>责任人</th>
							<th>影响程度</th>
							<th>发现时间</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each items as row}
							<tr class="hover:bg-gray-50">
								<td class="font-mono text-xs text-gray-500">{row.anomaly.id.slice(0, 12)}...</td>
								<td>
									<span class="badge badge-{getAnomalyTypeBadge(row.anomaly.type)}">
										{getAnomalyTypeLabel(row.anomaly.type)}
									</span>
								</td>
								<td class="font-medium max-w-xs truncate cursor-pointer hover:text-brand-600" on:click={() => openDetail(row)}>
									{row.anomaly.title}
								</td>
								<td>{row.property?.name || '-'}</td>
								<td>{row.responsible?.realName || row.anomaly.responsibleRole || '-'}</td>
								<td>
									<span class="badge badge-{getImpactLevelBadge(row.anomaly.impactLevel)}">
										{getImpactLevelLabel(row.anomaly.impactLevel)}
									</span>
								</td>
								<td class="text-gray-500">{formatDateTime(row.anomaly.discoveredAt)}</td>
								<td>
									<span class="badge badge-{getAnomalyStatusBadge(row.anomaly.status)}">
										{getAnomalyStatusLabel(row.anomaly.status)}
									</span>
								</td>
								<td>
									<div class="flex gap-2">
										<button on:click={() => openDetail(row)} class="text-brand-600 hover:text-brand-800 text-sm">详情</button>
										{#if canManage}
											<button on:click={() => openEdit(row)} class="text-gray-600 hover:text-gray-800 text-sm">编辑</button>
										{/if}
										{#if canManage && row.anomaly.status === 'pending'}
											<button on:click={() => handleUpdateStatus(row, 'handling')} class="text-blue-600 hover:text-blue-800 text-sm">受理</button>
										{/if}
										{#if canManage && row.anomaly.status === 'handling'}
											<button on:click={() => handleUpdateStatus(row, 'resolved')} class="text-green-600 hover:text-green-800 text-sm">解决</button>
										{/if}
										{#if canManage && row.anomaly.status === 'resolved'}
											<button on:click={() => handleUpdateStatus(row, 'closed')} class="text-gray-600 hover:text-gray-800 text-sm">关闭</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="card-body border-t flex items-center justify-between">
					<p class="text-sm text-gray-500">
						共 {total} 条，第 {page} / {totalPages} 页
					</p>
					<div class="flex gap-1">
						<button on:click={() => goToPage(1)} disabled={page === 1} class="btn-secondary text-sm px-3 py-1">首页</button>
						<button on:click={() => goToPage(page - 1)} disabled={page === 1} class="btn-secondary text-sm px-3 py-1">上一页</button>
						<span class="px-3 py-1 text-sm text-gray-600">{page}</span>
						<button on:click={() => goToPage(page + 1)} disabled={page === totalPages} class="btn-secondary text-sm px-3 py-1">下一页</button>
						<button on:click={() => goToPage(totalPages)} disabled={page === totalPages} class="btn-secondary text-sm px-3 py-1">末页</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if showDetail && selectedItem}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
			<div class="px-6 py-4 border-b flex items-center justify-between">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">异常单详情</h2>
					<p class="text-xs text-gray-500 mt-0.5">单号：{selectedItem.anomaly.id}</p>
				</div>
				<button on:click={closeDetail} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<div class="text-sm text-gray-500 mb-1">标题</div>
						<div class="font-medium">{selectedItem.anomaly.title}</div>
					</div>
					<div class="flex gap-2">
						<div class="flex-1">
							<div class="text-sm text-gray-500 mb-1">类型</div>
							<span class="badge badge-{getAnomalyTypeBadge(selectedItem.anomaly.type)}">{getAnomalyTypeLabel(selectedItem.anomaly.type)}</span>
						</div>
						<div class="flex-1">
							<div class="text-sm text-gray-500 mb-1">状态</div>
							<span class="badge badge-{getAnomalyStatusBadge(selectedItem.anomaly.status)}">{getAnomalyStatusLabel(selectedItem.anomaly.status)}</span>
						</div>
					</div>
					<div>
						<div class="text-sm text-gray-500 mb-1">关联房源</div>
						<div>{selectedItem.property?.name || '-'}</div>
					</div>
					<div>
						<div class="text-sm text-gray-500 mb-1">关联任务</div>
						<div>
							{#if selectedItem.task}
								<div class="text-sm">
									<span class="text-gray-600">ID:</span> {selectedItem.task.id?.slice(0, 12)}
									<span class="ml-3 text-gray-600">日期:</span> {formatDate(selectedItem.task.scheduledDate)}
									<span class="ml-3 text-gray-600">类型:</span> {getTaskTypeLabel(selectedItem.task.type)}
								</div>
							{:else}
								-
							{/if}
						</div>
					</div>
					<div>
						<div class="text-sm text-gray-500 mb-1">发现人</div>
						<div>{selectedItem.discoverer?.realName || '-'}</div>
					</div>
					<div>
						<div class="text-sm text-gray-500 mb-1">发现时间</div>
						<div>{formatDateTime(selectedItem.anomaly.discoveredAt)}</div>
					</div>
				</div>

				<div class="border-t pt-6">
					<h3 class="font-semibold text-gray-900 mb-3">📝 问题描述</h3>
					<div class="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
						{selectedItem.anomaly.description || '（无）'}
					</div>
				</div>

				<div class="border-t pt-6">
					<h3 class="font-semibold text-gray-900 mb-3">🌐 影响范围</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-xs text-gray-500 mb-1">影响程度</div>
							<span class="badge badge-{getImpactLevelBadge(selectedItem.anomaly.impactLevel)}">{getImpactLevelLabel(selectedItem.anomaly.impactLevel)}</span>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-xs text-gray-500 mb-1">影响预订数</div>
							<div class="font-medium">{selectedItem.anomaly.impactedBookings?.length || 0} 个</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-xs text-gray-500 mb-1">赔偿金额</div>
							<div class="font-medium">¥{selectedItem.anomaly.compensation || 0}</div>
						</div>
					</div>
					<div class="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
						{selectedItem.anomaly.impactScope || '（无）'}
					</div>
				</div>

				<div class="border-t pt-6">
					<h3 class="font-semibold text-gray-900 mb-3">👤 责任人</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="text-xs text-gray-500 mb-1">责任人</div>
							<div class="font-medium">{selectedItem.responsible?.realName || '（未指定）'}</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="text-xs text-gray-500 mb-1">责任角色</div>
							<div class="font-medium">{selectedItem.anomaly.responsibleRole || '-'}</div>
						</div>
					</div>
				</div>

				{(selectedItem.anomaly.handlingMeasures || selectedItem.anomaly.handlingConclusion || selectedItem.handler) && (
					<div class="border-t pt-6">
						<h3 class="font-semibold text-gray-900 mb-3">✅ 处理结论</h3>
						<div class="space-y-4">
							{#if selectedItem.handler}
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="bg-gray-50 rounded-lg p-3">
										<div class="text-xs text-gray-500 mb-1">处理人</div>
										<div class="font-medium">{selectedItem.handler.realName}</div>
									</div>
									<div class="bg-gray-50 rounded-lg p-3">
										<div class="text-xs text-gray-500 mb-1">处理时间</div>
										<div class="font-medium">{formatDateTime(selectedItem.anomaly.handledAt)}</div>
									</div>
									<div class="bg-gray-50 rounded-lg p-3">
										<div class="text-xs text-gray-500 mb-1">处罚措施</div>
										<div class="font-medium">{selectedItem.anomaly.penalty || '（无）'}</div>
									</div>
								</div>
							{/if}
							{#if selectedItem.anomaly.handlingMeasures}
								<div>
									<div class="text-sm text-gray-500 mb-1">处理措施</div>
									<div class="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
										{selectedItem.anomaly.handlingMeasures}
									</div>
								</div>
							{/if}
							{#if selectedItem.anomaly.handlingResult}
								<div>
									<div class="text-sm text-gray-500 mb-1">处理结果</div>
									<div class="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
										{selectedItem.anomaly.handlingResult}
									</div>
								</div>
							{/if}
							{#if selectedItem.anomaly.handlingConclusion}
								<div>
									<div class="text-sm text-gray-500 mb-1">处理结论</div>
									<div class="bg-green-50 border border-green-200 rounded-lg p-4 whitespace-pre-wrap text-gray-800">
										{selectedItem.anomaly.handlingConclusion}
									</div>
								</div>
							{/if}
							{#if selectedItem.anomaly.followUpRequired}
								<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
									<div class="text-sm font-medium text-yellow-800 mb-1">⚠️ 需要后续跟进</div>
									<div class="text-sm text-yellow-700 whitespace-pre-wrap">{selectedItem.anomaly.followUpNotes || '（未填写跟进备注）'}</div>
								</div>
							{/if}
						</div>
					</div>
				)}
			</div>
			<div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
				{#if canManage}
					<button on:click={() => { closeDetail(); openEdit(selectedItem); }} class="btn-secondary">编辑</button>
				{/if}
				<button on:click={closeDetail} class="btn-primary">关闭</button>
			</div>
		</div>
	</div>
{/if}

{#if showForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
			<div class="px-6 py-4 border-b flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">
					{isEditMode ? '编辑异常单' : '创建异常单'}
				</h2>
				<button on:click={closeForm} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6 space-y-5">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="label">异常类型 <span class="text-red-500">*</span></label>
						<select bind:value={formData.type} class="input" disabled={isEditMode}>
							<option value="missed_cleaning">保洁漏单</option>
							<option value="late_cleaning">保洁超时</option>
							<option value="quality_issue">质量问题</option>
							<option value="no_show">爽约</option>
							<option value="other">其他</option>
						</select>
					</div>
					<div>
						<label class="label">影响程度 <span class="text-red-500">*</span></label>
						<select bind:value={formData.impactLevel} class="input">
							<option value="low">低</option>
							<option value="medium">中</option>
							<option value="high">高</option>
							<option value="critical">严重</option>
						</select>
					</div>
				</div>

				<div>
					<label class="label">标题 <span class="text-red-500">*</span></label>
					<input bind:value={formData.title} class="input {formErrors.title ? 'border-red-500' : ''}" placeholder="简要描述异常问题" />
					{#if formErrors.title}<p class="text-xs text-red-500 mt-1">{formErrors.title}</p>{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="label">关联房源 <span class="text-red-500">*</span></label>
						<select bind:value={formData.propertyId} class="input {formErrors.propertyId ? 'border-red-500' : ''}">
							<option value="">请选择房源</option>
							{#each properties as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
						{#if formErrors.propertyId}<p class="text-xs text-red-500 mt-1">{formErrors.propertyId}</p>{/if}
					</div>
					<div>
						<label class="label">关联保洁任务 <span class="text-red-500">*</span></label>
						<select bind:value={formData.taskId} on:change={onTaskSelect} class="input {formErrors.taskId ? 'border-red-500' : ''}">
							<option value="">请选择任务</option>
							{#each tasks as t}
								<option value={t.task.id}>
									{formatDate(t.task.scheduledDate)} - {t.property?.name || '未知房源'} - {getTaskTypeLabel(t.task.type)} [{getTaskStatusLabel(t.task.status)}]
								</option>
							{/each}
						</select>
						{#if formErrors.taskId}<p class="text-xs text-red-500 mt-1">{formErrors.taskId}</p>{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="label">责任人</label>
						<select bind:value={formData.responsiblePersonId} class="input">
							<option value="">（未指定）</option>
							{#each cleaners as c}
								<option value={c.id}>{c.realName}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">责任角色</label>
						<input bind:value={formData.responsibleRole} class="input" placeholder="保洁员/排班人员/运营经理..." />
					</div>
				</div>

				<div>
					<label class="label">问题描述 <span class="text-red-500">*</span></label>
					<textarea bind:value={formData.description} rows="3" class="input {formErrors.description ? 'border-red-500' : ''}" placeholder="详细描述异常发生的情况"></textarea>
					{#if formErrors.description}<p class="text-xs text-red-500 mt-1">{formErrors.description}</p>{/if}
				</div>

				<div>
					<label class="label">影响范围 <span class="text-red-500">*</span></label>
					<textarea bind:value={formData.impactScope} rows="3" class="input {formErrors.impactScope ? 'border-red-500' : ''}" placeholder="描述影响范围，如：可能导致客人投诉、影响下一位客人入住、平台差评风险等"></textarea>
					{#if formErrors.impactScope}<p class="text-xs text-red-500 mt-1">{formErrors.impactScope}</p>{/if}
				</div>

				{#if isEditMode}
					<div class="border-t pt-5 mt-5">
						<h3 class="font-semibold text-gray-900 mb-4">处理信息</h3>
						<div class="space-y-4">
							<div>
								<label class="label">状态</label>
								<select bind:value={formData.status} class="input">
									<option value="pending">待处理</option>
									<option value="handling">处理中</option>
									<option value="resolved">已解决</option>
									<option value="closed">已关闭</option>
								</select>
							</div>
							<div>
								<label class="label">处理措施</label>
								<textarea bind:value={formData.handlingMeasures} rows="3" class="input" placeholder="已采取的处理措施"></textarea>
							</div>
							<div>
								<label class="label">处理结果</label>
								<textarea bind:value={formData.handlingResult} rows="2" class="input" placeholder="处理的具体结果"></textarea>
							</div>
							<div>
								<label class="label">处理结论</label>
								<textarea bind:value={formData.handlingConclusion} rows="2" class="input" placeholder="最终结论归档"></textarea>
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="label">处罚措施</label>
									<input bind:value={formData.penalty} class="input" placeholder="如：扣款50元、警告一次等" />
								</div>
								<div>
									<label class="label">赔偿金额 (元)</label>
									<input type="number" bind:value={formData.compensation} class="input" min="0" placeholder="0" />
								</div>
							</div>
							<div class="flex items-center gap-2">
								<input type="checkbox" bind:checked={formData.followUpRequired} id="followUp" class="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
								<label for="followUp" class="text-sm text-gray-700">需要后续跟进</label>
							</div>
							{#if formData.followUpRequired}
								<div>
									<label class="label">跟进备注</label>
									<textarea bind:value={formData.followUpNotes} rows="2" class="input" placeholder="后续跟进事项"></textarea>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
			<div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
				<button on:click={closeForm} class="btn-secondary">取消</button>
				<button on:click={handleSubmit} class="btn-primary">{isEditMode ? '保存修改' : '创建异常单'}</button>
			</div>
		</div>
	</div>
{/if}

{#if showBatchModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
			<div class="px-6 py-4 border-b flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">⚡ 批量生成漏单异常单</h2>
				<button on:click={closeBatchModal} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6">
				{#if !batchResultShown}
					<div class="space-y-4">
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
							<p class="font-medium mb-1">💡 使用说明</p>
							<p>系统将自动扫描指定日期范围内所有状态为「漏单」的保洁任务，为尚未创建异常单的任务自动创建「保洁漏单」类型异常单。</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="label">开始日期</label>
								<input type="date" bind:value={batchDateFrom} class="input" />
							</div>
							<div>
								<label class="label">结束日期</label>
								<input type="date" bind:value={batchDateTo} class="input" />
							</div>
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<div class="text-green-800">
								<p class="font-medium mb-2">✅ 生成完成</p>
								<p class="text-sm">
									共扫描到漏单任务，成功创建 <span class="font-bold">{batchResult.length}</span> 条异常单。
								</p>
							</div>
						</div>
						{#if batchResult.length > 0}
							<div>
								<div class="text-sm font-medium text-gray-700 mb-2">已创建的异常单：</div>
								<div class="border rounded-lg overflow-hidden">
									<table class="table">
										<thead>
											<tr>
												<th>单号</th>
												<th>标题</th>
												<th>创建时间</th>
											</tr>
										</thead>
										<tbody>
											{#each batchResult as r}
												<tr>
													<td class="font-mono text-xs">{r.id.slice(0, 12)}...</td>
													<td>{r.title}</td>
													<td class="text-gray-500">{formatDateTime(r.discoveredAt)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
			<div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
				{#if !batchResultShown}
					<button on:click={closeBatchModal} class="btn-secondary">取消</button>
					<button on:click={handleBatchGenerate} disabled={batchLoading} class="btn-primary">
						{#if batchLoading}生成中...{:else}开始生成{/if}
					</button>
				{:else}
					<button on:click={closeBatchModal} class="btn-primary">关闭</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
	export const ssr = false;
</script>

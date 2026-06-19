<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate,
		formatDateTime,
		getComplaintStatusLabel,
		getComplaintStatusBadge,
		getComplaintSeverityLabel,
		getComplaintSeverityBadge,
		getComplaintSourceLabel
	} from '$lib/utils';

	interface ComplaintRow {
		complaint: any;
		property: any;
		responsible: any;
		handler: any;
	}

	interface ComplaintDetail {
		complaint: any;
		property: any;
		booking: any;
		task: any;
		responsible: any;
		handler: any;
	}

	let complaints: ComplaintRow[] = [];
	let properties: any[] = [];
	let allTags: string[] = [];
	let currentUser: any = null;
	let loading = true;
	let page = 1;
	let pageSize = 20;
	let totalPages = 1;
	let total = 0;

	let filterProperty = '';
	let filterStatus = '';
	let filterSeverity = '';
	let filterSource = '';
	let filterTag = '';
	let filterDateFrom = '';
	let filterDateTo = '';

	let showDetailModal = false;
	let showComplaintForm = false;
	let selectedComplaint: ComplaintDetail | null = null;
	let editingComplaint: any = null;
	let activeTab = 'basic';

	let complaintForm = {
		propertyId: '',
		bookingId: '',
		taskId: '',
		title: '',
		content: '',
		severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
		source: 'guest' as 'guest' | 'platform_review' | 'owner' | 'inspection' | 'other',
		tags: [] as string[],
		evidenceUrls: [] as string[],
		reviewRating: null as number | null,
		reviewPlatform: '',
		reviewLink: '',
		responsibleCleanerId: '',
		status: 'open' as 'open' | 'investigating' | 'resolved' | 'closed',
		resolution: '',
		compensation: null as number | null
	};

	let newTagInput = '';
	let newEvidenceInput = '';
	let evidenceList: { url: string; label: string }[] = [];

	let formError = '';
	let submitting = false;

	async function loadComplaints() {
		loading = true;
		try {
			const params: any = { page, pageSize };
			if (filterProperty) params.propertyId = filterProperty;
			if (filterStatus) params.status = filterStatus;
			if (filterSeverity) params.severity = filterSeverity;
			if (filterSource) params.source = filterSource;
			if (filterTag) params.tag = filterTag;
			if (filterDateFrom) params.dateFrom = new Date(filterDateFrom);
			if (filterDateTo) params.dateTo = new Date(filterDateTo);

			const res = await trpc().complaint.list.query(params);
			complaints = res.items;
			total = res.total;
			totalPages = res.totalPages;
		} finally {
			loading = false;
		}
	}

	async function loadProperties() {
		try {
			const res = await trpc().property.list.query({ pageSize: 200 });
			properties = res.items;
		} catch (e) {}
	}

	async function loadAllTags() {
		try {
			allTags = await trpc().complaint.getAllTags.query();
		} catch (e) {}
	}

	async function openDetail(c: ComplaintRow) {
		try {
			selectedComplaint = await trpc().complaint.get.query({ id: c.complaint.id });
			showDetailModal = true;
			activeTab = 'basic';
		} catch (e: any) {
			alert(e?.message || '获取详情失败');
		}
	}

	function closeDetail() {
		showDetailModal = false;
		selectedComplaint = null;
		activeTab = 'basic';
	}

	function openCreateComplaint() {
		editingComplaint = null;
		complaintForm = {
			propertyId: properties[0]?.property?.id || '',
			bookingId: '',
			taskId: '',
			title: '',
			content: '',
			severity: 'medium',
			source: 'guest',
			tags: [],
			evidenceUrls: [],
			reviewRating: null,
			reviewPlatform: '',
			reviewLink: '',
			responsibleCleanerId: '',
			status: 'open',
			resolution: '',
			compensation: null
		};
		newTagInput = '';
		newEvidenceInput = '';
		evidenceList = [];
		formError = '';
		showComplaintForm = true;
	}

	function openEditComplaint(c: ComplaintRow) {
		editingComplaint = c.complaint;
		complaintForm = {
			propertyId: c.complaint.propertyId,
			bookingId: c.complaint.bookingId || '',
			taskId: c.complaint.taskId || '',
			title: c.complaint.title,
			content: c.complaint.content,
			severity: c.complaint.severity,
			source: c.complaint.source,
			tags: [...(c.complaint.tags || [])],
			evidenceUrls: [...(c.complaint.evidenceUrls || [])],
			reviewRating: c.complaint.reviewRating,
			reviewPlatform: c.complaint.reviewPlatform || '',
			reviewLink: c.complaint.reviewLink || '',
			responsibleCleanerId: c.complaint.responsibleCleanerId || '',
			status: c.complaint.status,
			resolution: c.complaint.resolution || '',
			compensation: c.complaint.compensation
		};
		evidenceList = (c.complaint.evidenceUrls || []).map((u: string) => ({ url: u, label: u }));
		newTagInput = '';
		newEvidenceInput = '';
		formError = '';
		showComplaintForm = true;
	}

	function addTag() {
		const t = newTagInput.trim();
		if (t && !complaintForm.tags.includes(t)) {
			complaintForm.tags.push(t);
		}
		newTagInput = '';
	}

	function addExistedTag(t: string) {
		if (!complaintForm.tags.includes(t)) {
			complaintForm.tags.push(t);
		}
	}

	function removeTag(t: string) {
		const idx = complaintForm.tags.indexOf(t);
		if (idx >= 0) complaintForm.tags.splice(idx, 1);
	}

	function addEvidence() {
		const url = newEvidenceInput.trim();
		if (url && !complaintForm.evidenceUrls.includes(url)) {
			complaintForm.evidenceUrls.push(url);
			evidenceList.push({ url, label: url });
		}
		newEvidenceInput = '';
	}

	function removeEvidence(url: string) {
		const idx = complaintForm.evidenceUrls.indexOf(url);
		if (idx >= 0) complaintForm.evidenceUrls.splice(idx, 1);
		const eIdx = evidenceList.findIndex((e) => e.url === url);
		if (eIdx >= 0) evidenceList.splice(eIdx, 1);
	}

	async function submitComplaint() {
		formError = '';
		if (!complaintForm.propertyId) {
			formError = '请选择房源';
			return;
		}
		if (!complaintForm.title.trim()) {
			formError = '请输入标题';
			return;
		}
		if (!complaintForm.content.trim()) {
			formError = '请输入内容';
			return;
		}

		submitting = true;
		try {
			const payload: any = {
				propertyId: complaintForm.propertyId,
				title: complaintForm.title.trim(),
				content: complaintForm.content.trim(),
				severity: complaintForm.severity,
				source: complaintForm.source,
				tags: complaintForm.tags,
				evidenceUrls: complaintForm.evidenceUrls
			};
			if (complaintForm.bookingId) payload.bookingId = complaintForm.bookingId;
			if (complaintForm.taskId) payload.taskId = complaintForm.taskId;
			if (complaintForm.reviewRating !== null) payload.reviewRating = complaintForm.reviewRating;
			if (complaintForm.reviewPlatform) payload.reviewPlatform = complaintForm.reviewPlatform;
			if (complaintForm.reviewLink) payload.reviewLink = complaintForm.reviewLink;
			if (complaintForm.responsibleCleanerId) payload.responsibleCleanerId = complaintForm.responsibleCleanerId;

			if (editingComplaint) {
				const updatePayload: any = {
					id: editingComplaint.id,
					title: payload.title,
					content: payload.content,
					severity: payload.severity,
					source: payload.source,
					tags: payload.tags,
					evidenceUrls: payload.evidenceUrls,
					status: complaintForm.status
				};
				if (complaintForm.responsibleCleanerId) updatePayload.responsibleCleanerId = complaintForm.responsibleCleanerId;
				if (complaintForm.resolution) updatePayload.resolution = complaintForm.resolution;
				if (complaintForm.compensation !== null) updatePayload.compensation = complaintForm.compensation;
				await trpc().complaint.update.mutate(updatePayload);
			} else {
				await trpc().complaint.create.mutate(payload);
			}
			showComplaintForm = false;
			await loadAllTags();
			await loadComplaints();
		} catch (e: any) {
			formError = e?.message || '保存失败';
		} finally {
			submitting = false;
		}
	}

	async function updateComplaintStatus(complaint: any, status: string) {
		if (!confirm(`确定将状态改为「${getComplaintStatusLabel(status)}」吗？`)) return;
		try {
			await trpc().complaint.update.mutate({ id: complaint.id, status: status as any });
			await loadComplaints();
		} catch (e: any) {
			alert(e?.message || '操作失败');
		}
	}

	function prevPage() {
		if (page > 1) {
			page--;
			loadComplaints();
		}
	}

	function nextPage() {
		if (page < totalPages) {
			page++;
			loadComplaints();
		}
	}

	function resetFilters() {
		filterProperty = '';
		filterStatus = '';
		filterSeverity = '';
		filterSource = '';
		filterTag = '';
		filterDateFrom = '';
		filterDateTo = '';
		page = 1;
		loadComplaints();
	}

	function getStars(rating: number | null | undefined) {
		if (!rating) return '-';
		return '★'.repeat(rating) + '☆'.repeat(5 - rating);
	}

	onMount(async () => {
		[currentUser] = await Promise.all([trpc().user.getCurrent.query().catch(() => null)]);
		await Promise.all([loadProperties(), loadAllTags()]);
		await loadComplaints();
	});

	const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
</script>

<div class="p-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">客诉 &amp; 点评管理</h1>
			<p class="text-gray-500 mt-1">客诉处理 · 标签管理 · 证据链 · 平台点评</p>
		</div>
		<button on:click={openCreateComplaint} class="btn-primary">
			<span class="mr-1">+</span> 创建客诉
		</button>
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div>
					<label class="label">房源</label>
					<select bind:value={filterProperty} class="input" on:change={() => { page = 1; loadComplaints(); }}>
						<option value="">全部房源</option>
						{#each properties as p}
							<option value={p.property.id}>{p.property.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">状态</label>
					<select bind:value={filterStatus} class="input" on:change={() => { page = 1; loadComplaints(); }}>
						<option value="">全部状态</option>
						<option value="open">待处理</option>
						<option value="investigating">调查中</option>
						<option value="resolved">已解决</option>
						<option value="closed">已关闭</option>
					</select>
				</div>
				<div>
					<label class="label">严重程度</label>
					<select bind:value={filterSeverity} class="input" on:change={() => { page = 1; loadComplaints(); }}>
						<option value="">全部</option>
						<option value="low">低</option>
						<option value="medium">中</option>
						<option value="high">高</option>
						<option value="critical">严重</option>
					</select>
				</div>
				<div>
					<label class="label">来源</label>
					<select bind:value={filterSource} class="input" on:change={() => { page = 1; loadComplaints(); }}>
						<option value="">全部来源</option>
						<option value="guest">客人投诉</option>
						<option value="platform_review">平台点评</option>
						<option value="owner">业主反馈</option>
						<option value="inspection">巡检发现</option>
						<option value="other">其他</option>
					</select>
				</div>
				<div>
					<label class="label">标签</label>
					<select bind:value={filterTag} class="input" on:change={() => { page = 1; loadComplaints(); }}>
						<option value="">全部标签</option>
						{#each allTags as t}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">投诉日期从</label>
					<input type="date" bind:value={filterDateFrom} class="input" on:change={() => { page = 1; loadComplaints(); }} />
				</div>
				<div>
					<label class="label">投诉日期到</label>
					<input type="date" bind:value={filterDateTo} class="input" on:change={() => { page = 1; loadComplaints(); }} />
				</div>
				<div class="flex items-end">
					<button on:click={resetFilters} class="btn-secondary w-full">重置筛选</button>
				</div>
			</div>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="card-body flex items-center justify-center py-16">
				<div class="text-gray-500">加载中...</div>
			</div>
		{:else if complaints.length === 0}
			<div class="card-body text-center py-16">
				<div class="text-4xl mb-3">💬</div>
				<div class="text-gray-500">暂无客诉数据</div>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>标题</th>
							<th>房源</th>
							<th>来源</th>
							<th>严重程度</th>
							<th>状态</th>
							<th>标签</th>
							<th>责任人</th>
							<th>投诉时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each complaints as c}
							<tr>
								<td class="font-medium max-w-xs truncate">
									<div>{c.complaint.title}</div>
									{#if c.complaint.reviewRating}
										<div class="text-xs text-yellow-600 mt-1">{getStars(c.complaint.reviewRating)} · {c.complaint.reviewPlatform || '平台点评'}</div>
									{/if}
								</td>
								<td>{c.property?.name || '-'}</td>
								<td>{getComplaintSourceLabel(c.complaint.source)}</td>
								<td>
									<span class="badge badge-{getComplaintSeverityBadge(c.complaint.severity)}">
										{getComplaintSeverityLabel(c.complaint.severity)}
									</span>
								</td>
								<td>
									<span class="badge badge-{getComplaintStatusBadge(c.complaint.status)}">
										{getComplaintStatusLabel(c.complaint.status)}
									</span>
								</td>
								<td>
									<div class="flex flex-wrap gap-1">
										{#each (c.complaint.tags || []).slice(0, 3) as t}
											<span class="badge badge-gray">{t}</span>
										{/each}
										{#if (c.complaint.tags || []).length > 3}
											<span class="text-xs text-gray-400">+{(c.complaint.tags || []).length - 3}</span>
										{/if}
									</div>
								</td>
								<td class="text-gray-500 text-sm">{c.responsible?.realName || '-'}</td>
								<td class="text-gray-500 text-sm">{formatDate(c.complaint.filedAt)}</td>
								<td>
									<div class="flex items-center gap-2">
										<button
											on:click={() => openDetail(c)}
											class="text-sm text-brand-600 hover:text-brand-700"
										>
											详情
										</button>
										{#if isManager}
											<button
												on:click={() => openEditComplaint(c)}
												class="text-sm text-gray-600 hover:text-gray-900"
											>
												编辑
											</button>
											{#if c.complaint.status === 'open'}
												<button
													on:click={() => updateComplaintStatus(c.complaint, 'investigating')}
													class="text-sm text-yellow-600 hover:text-yellow-700"
												>
													受理
												</button>
											{/if}
											{#if c.complaint.status === 'investigating'}
												<button
													on:click={() => updateComplaintStatus(c.complaint, 'resolved')}
													class="text-sm text-green-600 hover:text-green-700"
												>
													解决
												</button>
											{/if}
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if totalPages > 1}
				<div class="card-body border-t border-gray-200 flex items-center justify-between">
					<div class="text-sm text-gray-500">
						共 {total} 条，第 {page}/{totalPages} 页
					</div>
					<div class="flex gap-2">
						<button on:click={prevPage} disabled={page <= 1} class="btn-secondary text-sm">上一页</button>
						<button on:click={nextPage} disabled={page >= totalPages} class="btn-secondary text-sm">下一页</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	{#if allTags.length > 0}
		<div class="card mt-6">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-semibold text-gray-900">标签管理</h3>
				<span class="text-xs text-gray-500">共 {allTags.length} 个标签</span>
			</div>
			<div class="card-body">
				<div class="flex flex-wrap gap-2">
					{#each allTags as t}
						<span class="badge badge-info px-3 py-1">{t}</span>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showDetailModal && selectedComplaint}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={closeDetail}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="text-lg font-semibold text-gray-900">{selectedComplaint.complaint.title}</h3>
						<div class="flex items-center gap-2 mt-2">
							<span class="badge badge-{getComplaintSeverityBadge(selectedComplaint.complaint.severity)}">
								{getComplaintSeverityLabel(selectedComplaint.complaint.severity)}
							</span>
							<span class="badge badge-{getComplaintStatusBadge(selectedComplaint.complaint.status)}">
								{getComplaintStatusLabel(selectedComplaint.complaint.status)}
							</span>
							<span class="badge badge-gray">{getComplaintSourceLabel(selectedComplaint.complaint.source)}</span>
						</div>
					</div>
					<button on:click={closeDetail} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
				</div>
			</div>

			<div class="border-b border-gray-200 px-6">
				<div class="flex gap-6">
					<button
						on:click={() => activeTab = 'basic'}
						class="py-3 text-sm border-b-2 transition {activeTab === 'basic' ? 'border-brand-600 text-brand-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						基本信息
					</button>
					<button
						on:click={() => activeTab = 'evidence'}
						class="py-3 text-sm border-b-2 transition {activeTab === 'evidence' ? 'border-brand-600 text-brand-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						证据链 {selectedComplaint.complaint.evidenceUrls?.length > 0 ? `(${selectedComplaint.complaint.evidenceUrls.length})` : ''}
					</button>
					<button
						on:click={() => activeTab = 'timeline'}
						class="py-3 text-sm border-b-2 transition {activeTab === 'timeline' ? 'border-brand-600 text-brand-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						处理记录
					</button>
				</div>
			</div>

			<div class="overflow-y-auto flex-1 p-6">
				{#if activeTab === 'basic'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-4">
							<div>
								<h4 class="font-medium text-gray-900 mb-3">关联信息</h4>
								<div class="space-y-2 text-sm bg-gray-50 rounded-lg p-4">
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span class="text-gray-500">房源</span>
										<span class="font-medium">{selectedComplaint.property?.name || '-'}</span>
									</div>
									{#if selectedComplaint.booking}
										<div class="flex justify-between py-2 border-b border-gray-200">
											<span class="text-gray-500">关联预订</span>
											<span>{selectedComplaint.booking.guestName} · {formatDate(selectedComplaint.booking.checkInDate)}</span>
										</div>
									{/if}
									{#if selectedComplaint.task}
										<div class="flex justify-between py-2 border-b border-gray-200">
											<span class="text-gray-500">关联任务</span>
											<span>{formatDate(selectedComplaint.task.scheduledDate)}</span>
										</div>
									{/if}
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span class="text-gray-500">责任保洁</span>
										<span>{selectedComplaint.responsible?.realName || '-'}</span>
									</div>
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span class="text-gray-500">处理人</span>
										<span>{selectedComplaint.handler?.realName || '-'}</span>
									</div>
									<div class="flex justify-between py-2">
										<span class="text-gray-500">投诉时间</span>
										<span>{formatDateTime(selectedComplaint.complaint.filedAt)}</span>
									</div>
								</div>
							</div>

							{#if selectedComplaint.complaint.source === 'platform_review' && (selectedComplaint.complaint.reviewRating || selectedComplaint.complaint.reviewPlatform)}
								<div>
									<h4 class="font-medium text-gray-900 mb-3">平台点评</h4>
									<div class="space-y-2 text-sm bg-yellow-50 rounded-lg p-4">
										{#if selectedComplaint.complaint.reviewRating}
											<div class="flex justify-between py-1">
												<span class="text-gray-500">评分</span>
												<span class="text-yellow-600 font-medium">{getStars(selectedComplaint.complaint.reviewRating)}</span>
											</div>
										{/if}
										{#if selectedComplaint.complaint.reviewPlatform}
											<div class="flex justify-between py-1">
												<span class="text-gray-500">平台</span>
												<span>{selectedComplaint.complaint.reviewPlatform}</span>
											</div>
										{/if}
										{#if selectedComplaint.complaint.reviewLink}
											<div class="py-1">
												<span class="text-gray-500">点评链接：</span>
												<a href={selectedComplaint.complaint.reviewLink} target="_blank" class="text-brand-600 hover:underline ml-1 break-all">
													{selectedComplaint.complaint.reviewLink}
												</a>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							{#if (selectedComplaint.complaint.tags || []).length > 0}
								<div>
									<h4 class="font-medium text-gray-900 mb-3">标签</h4>
									<div class="flex flex-wrap gap-2">
										{#each selectedComplaint.complaint.tags as t}
											<span class="badge badge-info px-3 py-1">{t}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<div class="space-y-4">
							<div>
								<h4 class="font-medium text-gray-900 mb-3">投诉内容</h4>
								<div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
									{selectedComplaint.complaint.content}
								</div>
							</div>

							{#if selectedComplaint.complaint.resolution}
								<div>
									<h4 class="font-medium text-gray-900 mb-3">处理方案</h4>
									<div class="bg-green-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
										{selectedComplaint.complaint.resolution}
									</div>
								</div>
							{/if}

							{#if selectedComplaint.complaint.compensation !== null && selectedComplaint.complaint.compensation !== undefined}
								<div>
									<h4 class="font-medium text-gray-900 mb-3">赔偿金额</h4>
									<div class="bg-red-50 rounded-lg p-4 text-sm">
										<span class="text-red-600 font-bold text-xl">¥{selectedComplaint.complaint.compensation}</span>
									</div>
								</div>
							{/if}

							<div class="grid grid-cols-2 gap-3 text-xs">
								{#if selectedComplaint.complaint.resolvedAt}
									<div class="bg-green-50 rounded p-3">
										<div class="text-gray-500 mb-1">解决时间</div>
										<div class="text-gray-700 font-medium">{formatDateTime(selectedComplaint.complaint.resolvedAt)}</div>
									</div>
								{/if}
								{#if selectedComplaint.complaint.closedAt}
									<div class="bg-gray-100 rounded p-3">
										<div class="text-gray-500 mb-1">关闭时间</div>
										<div class="text-gray-700 font-medium">{formatDateTime(selectedComplaint.complaint.closedAt)}</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				{#if activeTab === 'evidence'}
					<div>
						<h4 class="font-medium text-gray-900 mb-4">证据链</h4>
						{#if !selectedComplaint.complaint.evidenceUrls?.length}
							<div class="text-center py-12 text-gray-400 bg-gray-50 rounded-lg">
								暂无证据材料
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each selectedComplaint.complaint.evidenceUrls as url, i}
									<a href={url} target="_blank" class="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition group">
										<div class="aspect-video bg-gray-100 flex items-center justify-center">
											{#if /\.(jpg|jpeg|png|gif|webp)$/i.test(url)}
												<img src={url} alt={`证据${i + 1}`} class="w-full h-full object-cover" onerror="this.style.display='none'" />
											{/if}
											<div class="text-center px-4">
												<div class="text-3xl mb-2">
													{#if /\.(mp4|mov|avi|wmv)$/i.test(url)}
														🎬
													{:else if /\.(jpg|jpeg|png|gif|webp)$/i.test(url)}
														🖼️
													{:else}
														📎
													{/if}
												</div>
												<div class="text-xs text-gray-500">点击查看</div>
											</div>
										</div>
										<div class="p-3 bg-white border-t border-gray-100">
											<div class="text-xs text-gray-700 truncate">证据 #{i + 1}</div>
											<div class="text-xs text-gray-400 truncate mt-1">{url}</div>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if activeTab === 'timeline'}
					<div>
						<h4 class="font-medium text-gray-900 mb-4">处理时间线</h4>
						<div class="relative pl-8 space-y-6">
							<div class="relative">
								<div class="absolute -left-8 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100"></div>
								<div class="text-sm">
									<div class="font-medium text-gray-900">客诉创建</div>
									<div class="text-gray-500 text-xs mt-1">{formatDateTime(selectedComplaint.complaint.filedAt)}</div>
								</div>
							</div>

							{#if selectedComplaint.complaint.status === 'investigating' || selectedComplaint.complaint.status === 'resolved' || selectedComplaint.complaint.status === 'closed'}
								<div class="relative">
									<div class="absolute -left-8 top-1 w-4 h-4 rounded-full bg-yellow-500 border-4 border-yellow-100"></div>
									<div class="absolute -left-6 top-5 w-0.5 h-full bg-gray-200"></div>
									<div class="text-sm">
										<div class="font-medium text-gray-900">已受理调查</div>
										<div class="text-gray-500 text-xs mt-1">处理人：{selectedComplaint.handler?.realName || '-'}</div>
									</div>
								</div>
							{/if}

							{#if selectedComplaint.complaint.resolvedAt && (selectedComplaint.complaint.status === 'resolved' || selectedComplaint.complaint.status === 'closed')}
								<div class="relative">
									<div class="absolute -left-8 top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-green-100"></div>
									<div class="text-sm">
										<div class="font-medium text-gray-900">已解决</div>
										<div class="text-gray-500 text-xs mt-1">{formatDateTime(selectedComplaint.complaint.resolvedAt)}</div>
										{#if selectedComplaint.complaint.resolution}
											<div class="mt-2 p-3 bg-green-50 rounded text-gray-700 whitespace-pre-wrap">
												{selectedComplaint.complaint.resolution}
											</div>
										{/if}
										{#if selectedComplaint.complaint.compensation !== null}
											<div class="mt-2 text-red-600 text-sm">
												赔偿金额：¥{selectedComplaint.complaint.compensation}
											</div>
										{/if}
									</div>
								</div>
							{/if}

							{#if selectedComplaint.complaint.closedAt}
								<div class="relative">
									<div class="absolute -left-8 top-1 w-4 h-4 rounded-full bg-gray-500 border-4 border-gray-200"></div>
									<div class="text-sm">
										<div class="font-medium text-gray-900">已关闭</div>
										<div class="text-gray-500 text-xs mt-1">{formatDateTime(selectedComplaint.complaint.closedAt)}</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				{#if isManager && selectedComplaint.complaint.status !== 'closed'}
					{#if selectedComplaint.complaint.status === 'open'}
						<button on:click={() => { closeDetail(); updateComplaintStatus(selectedComplaint.complaint, 'investigating'); }} class="btn-secondary">
							受理调查
						</button>
					{/if}
					{#if selectedComplaint.complaint.status === 'investigating'}
						<button on:click={() => { closeDetail(); updateComplaintStatus(selectedComplaint.complaint, 'resolved'); }} class="btn-success">
							标记解决
						</button>
					{/if}
					{#if selectedComplaint.complaint.status === 'resolved'}
						<button on:click={() => { closeDetail(); updateComplaintStatus(selectedComplaint.complaint, 'closed'); }} class="btn-secondary">
							关闭客诉
						</button>
					{/if}
					<button on:click={() => { closeDetail(); openEditComplaint({ complaint: selectedComplaint.complaint, property: selectedComplaint.property, responsible: selectedComplaint.responsible, handler: selectedComplaint.handler }); }} class="btn-primary">
						编辑
					</button>
				{/if}
				<button on:click={closeDetail} class="btn-secondary">关闭</button>
			</div>
		</div>
	</div>
{/if}

{#if showComplaintForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => { showComplaintForm = false; }}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">{editingComplaint ? '编辑客诉' : '创建客诉'}</h3>
			</div>
			<div class="overflow-y-auto flex-1 p-6">
				{#if formError}
					<div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{formError}</div>
				{/if}
				<div class="space-y-5">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="md:col-span-3">
							<label class="label">标题 <span class="text-red-500">*</span></label>
							<input bind:value={complaintForm.title} class="input" placeholder="请输入客诉标题" />
						</div>
						<div>
							<label class="label">房源 <span class="text-red-500">*</span></label>
							<select bind:value={complaintForm.propertyId} class="input">
								<option value="">请选择</option>
								{#each properties as p}
									<option value={p.property.id}>{p.property.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="label">来源</label>
							<select bind:value={complaintForm.source} class="input">
								<option value="guest">客人投诉</option>
								<option value="platform_review">平台点评</option>
								<option value="owner">业主反馈</option>
								<option value="inspection">巡检发现</option>
								<option value="other">其他</option>
							</select>
						</div>
						<div>
							<label class="label">严重程度</label>
							<select bind:value={complaintForm.severity} class="input">
								<option value="low">低</option>
								<option value="medium">中</option>
								<option value="high">高</option>
								<option value="critical">严重</option>
							</select>
						</div>
						{#if editingComplaint}
							<div>
								<label class="label">状态</label>
								<select bind:value={complaintForm.status} class="input">
									<option value="open">待处理</option>
									<option value="investigating">调查中</option>
									<option value="resolved">已解决</option>
									<option value="closed">已关闭</option>
								</select>
							</div>
						{/if}
						<div>
							<label class="label">责任保洁员</label>
							<input bind:value={complaintForm.responsibleCleanerId} class="input" placeholder="保洁员ID（可选）" />
						</div>
						<div class="md:col-span-3">
							<label class="label">内容 <span class="text-red-500">*</span></label>
							<textarea bind:value={complaintForm.content} class="input" rows="4" placeholder="详细描述客诉内容"></textarea>
						</div>
					</div>

					{#if complaintForm.source === 'platform_review'}
						<div class="bg-yellow-50 rounded-lg p-4 space-y-4">
							<div class="font-medium text-gray-900 text-sm">平台点评信息</div>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label class="label">评分</label>
									<select bind:value={complaintForm.reviewRating} class="input">
										<option value={null}>未设置</option>
										<option value={1}>★☆☆☆☆ (1星)</option>
										<option value={2}>★★☆☆☆ (2星)</option>
										<option value={3}>★★★☆☆ (3星)</option>
										<option value={4}>★★★★☆ (4星)</option>
										<option value={5}>★★★★★ (5星)</option>
									</select>
								</div>
								<div>
									<label class="label">平台名称</label>
									<input bind:value={complaintForm.reviewPlatform} class="input" placeholder="如：Airbnb、美团等" />
								</div>
								<div>
									<label class="label">点评链接</label>
									<input bind:value={complaintForm.reviewLink} class="input" placeholder="可选" />
								</div>
							</div>
						</div>
					{/if}

					<div>
						<label class="label">标签管理</label>
						<div class="border border-gray-200 rounded-lg p-4 space-y-3">
							{#if allTags.length > 0 && !editingComplaint}
								<div>
									<div class="text-xs text-gray-500 mb-2">快捷添加已有标签</div>
									<div class="flex flex-wrap gap-2">
										{#each allTags as t}
											<button
												type="button"
												on:click={() => addExistedTag(t)}
												class:text-brand-700={complaintForm.tags.includes(t)}
												class="text-xs px-2.5 py-1 rounded-full border transition {
													complaintForm.tags.includes(t)
														? 'bg-brand-50 border-brand-300 text-brand-700'
														: 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
												}"
											>
												+ {t}
											</button>
										{/each}
									</div>
								</div>
							{/if}
							<div class="flex gap-2">
								<input
									bind:value={newTagInput}
									class="input flex-1"
									placeholder="输入新标签名后回车添加"
									on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
								/>
								<button type="button" on:click={addTag} class="btn-secondary">添加</button>
							</div>
							{#if complaintForm.tags.length > 0}
								<div class="flex flex-wrap gap-2 pt-2">
									{#each complaintForm.tags as t}
										<span class="badge badge-info px-3 py-1 flex items-center gap-1">
											{t}
											<button type="button" on:click={() => removeTag(t)} class="hover:text-red-600 ml-1">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<div>
						<label class="label">证据链（URL）</label>
						<div class="border border-gray-200 rounded-lg p-4 space-y-3">
							<div class="flex gap-2">
								<input
									bind:value={newEvidenceInput}
									class="input flex-1"
									placeholder="输入图片/视频/文档 URL，回车添加"
									on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEvidence(); } }}
								/>
								<button type="button" on:click={addEvidence} class="btn-secondary">添加</button>
							</div>
							{#if evidenceList.length > 0}
								<div class="space-y-2 pt-2">
									{#each evidenceList as e}
										<div class="flex items-center gap-2 bg-gray-50 rounded px-3 py-2">
											<span class="text-lg">
												{#if /\.(mp4|mov|avi|wmv)$/i.test(e.url)}🎬{:else if /\.(jpg|jpeg|png|gif|webp)$/i.test(e.url)}🖼️{:else}📎{/if}
											</span>
											<a href={e.url} target="_blank" class="flex-1 text-sm text-brand-600 hover:underline truncate">{e.url}</a>
											<button type="button" on:click={() => removeEvidence(e.url)} class="text-gray-400 hover:text-red-600">&times;</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					{#if editingComplaint && isManager}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="label">处理方案</label>
								<textarea bind:value={complaintForm.resolution} class="input" rows="3" placeholder="解决客诉的具体措施和结果"></textarea>
							</div>
							<div>
								<label class="label">赔偿金额（元）</label>
								<input type="number" bind:value={complaintForm.compensation} class="input" placeholder="选填" />
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				<button on:click={() => { showComplaintForm = false; }} class="btn-secondary" disabled={submitting}>
					取消
				</button>
				<button on:click={submitComplaint} class="btn-primary" disabled={submitting}>
					{submitting ? '保存中...' : '保存'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
	export const ssr = false;
</script>

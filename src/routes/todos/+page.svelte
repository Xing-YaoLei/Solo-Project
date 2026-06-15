<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery, createMutation } from '$lib/trpc/query';

	let selectedStatus = '';
	let selectedPriority = '';
	let showCreateModal = false;
	let selectedTodoId: string | null = null;
	let showTransferModal = false;
	let commentText = '';
	let transferToUserId = '';
	let transferReason = '';

	let newTodo = {
		title: '',
		description: '',
		priority: 'medium',
		relatedUserId: '',
		relatedCourseId: '',
		assigneeId: '',
		dueDate: ''
	};

	let showMaterialForm = false;
	let newMaterial = {
		title: '',
		description: '',
		fileUrl: '',
		fileType: '',
		fileSize: 0
	};

	const todosQuery = createQuery<any, any>('todos.list', () => ({
		page: 1,
		pageSize: 20,
		status: selectedStatus || undefined,
		priority: selectedPriority || undefined,
		myTasksOnly: false
	}));

	const todoStatsQuery = createQuery<void, any>('todos.myTodoStats', () => ({} as any));
	const usersQuery = createQuery<any, any>('users.list', () => ({ page: 1, pageSize: 100 }));

	let todoDetailQuery: any = null;

	$: if (selectedTodoId) {
		todoDetailQuery = createQuery<any, any>('todos.get', () => ({ id: selectedTodoId }));
	} else {
		todoDetailQuery = null;
	}

	$: todoDetail = $todoDetailQuery?.data || null;
	$: todos = $todosQuery.data?.items || [];
	$: total = $todosQuery.data?.total || 0;
	$: stats = $todoStatsQuery.data || {};
	$: users = $usersQuery.data?.items || [];

	const statusTabs = [
		{ value: '', label: '全部' },
		{ value: 'pending', label: '待处理' },
		{ value: 'processing', label: '处理中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'rejected', label: '已退回' },
		{ value: 'transferred', label: '已转派' }
	];

	const priorityOptions = [
		{ value: '', label: '全部优先级' },
		{ value: 'low', label: '低' },
		{ value: 'medium', label: '中' },
		{ value: 'high', label: '高' },
		{ value: 'urgent', label: '紧急' }
	];

	const createTodoMutation = createMutation<any, any>('todos.create');
	const updateStatusMutation = createMutation<any, any>('todos.updateStatus');
	const transferMutation = createMutation<any, any>('todos.transfer');
	const addCommentMutation = createMutation<any, any>('todos.addComment');
	const addMaterialMutation = createMutation<any, any>('todos.addMaterial');

	function getStatusLabel(status: string) {
		const map: Record<string, string> = {
			pending: '待处理',
			processing: '处理中',
			completed: '已完成',
			rejected: '已退回',
			transferred: '已转派'
		};
		return map[status] || status;
	}

	function getStatusBadge(status: string) {
		const map: Record<string, string> = {
			pending: 'badge-warning',
			processing: 'badge-primary',
			completed: 'badge-success',
			rejected: 'badge-danger',
			transferred: 'badge-gray'
		};
		return map[status] || 'badge-gray';
	}

	function getPriorityLabel(priority: string) {
		const map: Record<string, string> = {
			low: '低',
			medium: '中',
			high: '高',
			urgent: '紧急'
		};
		return map[priority] || priority;
	}

	function getPriorityColor(priority: string) {
		const map: Record<string, string> = {
			low: 'bg-gray-100 text-gray-700',
			medium: 'bg-blue-100 text-blue-700',
			high: 'bg-orange-100 text-orange-700',
			urgent: 'bg-red-100 text-red-700'
		};
		return map[priority] || 'bg-gray-100 text-gray-700';
	}

	function getSourceLabel(source: string) {
		const map: Record<string, string> = {
			progress_delay: '进度落后',
			manual: '手动创建',
			system: '系统生成',
			exam_failed: '考试未通过'
		};
		return map[source] || source;
	}

	function formatDateTime(date: any) {
		if (!date) return '-';
		return new Date(date).toLocaleString('zh-CN');
	}

	async function updateStatus(id: string, status: string) {
		try {
			await updateStatusMutation.mutate({ id, status });
			await refreshData();
		} catch (err: any) {
			alert(err.message || '操作失败');
		}
	}

	async function handleCreateTodo() {
		if (!newTodo.title.trim()) {
			alert('请输入待办标题');
			return;
		}

		try {
			await createTodoMutation.mutate({
				title: newTodo.title,
				description: newTodo.description,
				priority: newTodo.priority,
				source: 'manual',
				relatedUserId: newTodo.relatedUserId || undefined,
				relatedCourseId: newTodo.relatedCourseId || undefined,
				assigneeId: newTodo.assigneeId || undefined,
				dueDate: newTodo.dueDate || undefined
			});

			showCreateModal = false;
			newTodo = {
				title: '',
				description: '',
				priority: 'medium',
				relatedUserId: '',
				relatedCourseId: '',
				assigneeId: '',
				dueDate: ''
			};
			await refreshData();
		} catch (err: any) {
			alert(err.message || '创建失败');
		}
	}

	async function addComment() {
		if (!selectedTodoId || !commentText.trim()) return;

		try {
			await addCommentMutation.mutate({
				todoId: selectedTodoId,
				content: commentText
			});
			commentText = '';
			todoDetailQuery?.refetch();
		} catch (err: any) {
			alert(err.message || '添加评论失败');
		}
	}

	async function handleAddMaterial() {
		if (!selectedTodoId || !newMaterial.title.trim()) {
			alert('请输入材料标题');
			return;
		}

		try {
			await addMaterialMutation.mutate({
				todoId: selectedTodoId,
				title: newMaterial.title,
				description: newMaterial.description || undefined,
				fileUrl: newMaterial.fileUrl || '',
				fileType: newMaterial.fileType || undefined,
				fileSize: newMaterial.fileSize || undefined
			});

			showMaterialForm = false;
			newMaterial = {
				title: '',
				description: '',
				fileUrl: '',
				fileType: '',
				fileSize: 0
			};
			todoDetailQuery?.refetch();
		} catch (err: any) {
			alert(err.message || '上传材料失败');
		}
	}

	async function handleTransfer() {
		if (!selectedTodoId || !transferToUserId) {
			alert('请选择转派对象');
			return;
		}

		try {
			await transferMutation.mutate({
				id: selectedTodoId,
				newAssigneeId: transferToUserId,
				reason: transferReason || undefined
			});

			showTransferModal = false;
			transferToUserId = '';
			transferReason = '';
			await refreshData();
		} catch (err: any) {
			alert(err.message || '转派失败');
		}
	}

	async function refreshData() {
		await Promise.all([
			todosQuery.refetch(),
			todoStatsQuery.refetch(),
			todoDetailQuery?.refetch()
		]);
	}
</script>

<svelte:head>
	<title>待办池 - 职业教育证书考试协同平台</title>
</svelte:head>

<AppLayout>
	<svelte:fragment slot="title">待办池</svelte:fragment>

	<div class="space-y-6">
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="card p-4">
				<p class="text-sm text-gray-500">全部</p>
				<p class="text-2xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-gray-500">待处理</p>
				<p class="text-2xl font-bold text-yellow-600 mt-1">{stats.pending || 0}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-gray-500">处理中</p>
				<p class="text-2xl font-bold text-blue-600 mt-1">{stats.processing || 0}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-gray-500">已完成</p>
				<p class="text-2xl font-bold text-green-600 mt-1">{stats.completed || 0}</p>
			</div>
			<div class="card p-4">
				<p class="text-sm text-gray-500">已退回</p>
				<p class="text-2xl font-bold text-red-600 mt-1">{stats.rejected || 0}</p>
			</div>
		</div>

		<div class="card">
			<div class="p-4 border-b border-gray-200 flex items-center justify-between">
				<div class="flex items-center gap-2">
					{#each statusTabs as tab}
						<button
							on:click={() => { selectedStatus = tab.value; todosQuery.refetch(); }}
							class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === tab.value ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
						>
							{tab.label}
						</button>
					{/each}
				</div>
				<div class="flex items-center gap-3">
					<select
						class="input w-36"
						bind:value={selectedPriority}
						on:change={() => todosQuery.refetch()}
					>
						{#each priorityOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
					<button
						on:click={() => showCreateModal = true}
						class="btn btn-primary"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						新建待办
					</button>
				</div>
			</div>

			<div class="divide-y divide-gray-100">
				{#each todos as todo}
					<div class="p-4 hover:bg-gray-50 transition-colors">
						<div class="flex items-start gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="font-medium text-gray-900">{todo.title}</h3>
									<span class={`badge ${getStatusBadge(todo.status)}`}>
										{getStatusLabel(todo.status)}
									</span>
									<span class={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
										{getPriorityLabel(todo.priority)}
									</span>
									<span class="badge badge-gray">
										{getSourceLabel(todo.source)}
									</span>
								</div>
								{#if todo.description}
									<p class="text-sm text-gray-600 mb-3 line-clamp-2">{todo.description}</p>
								{/if}
								<div class="flex items-center gap-4 text-sm text-gray-500">
									{#if todo.relatedUser}
										<span class="flex items-center gap-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
											</svg>
											{todo.relatedUser.name}
										</span>
									{/if}
									{#if todo.relatedCourse}
										<span class="flex items-center gap-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
											</svg>
											{todo.relatedCourse.title}
										</span>
									{/if}
									{#if todo.assignee}
										<span class="flex items-center gap-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
											</svg>
											处理人: {todo.assignee.name}
										</span>
									{/if}
									<span class="flex items-center gap-1">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										{todo.createdAt ? formatDateTime(todo.createdAt) : ''}
									</span>
								</div>
							</div>
							<div class="flex items-center gap-2">
								{#if todo.status === 'pending'}
									<button
										on:click={() => updateStatus(todo.id, 'processing')}
										class="btn btn-primary text-sm"
									>
										开始处理
									</button>
								{/if}
								{#if todo.status === 'processing'}
									<button
										on:click={() => updateStatus(todo.id, 'completed')}
										class="btn btn-success text-sm"
									>
										完成
									</button>
								{/if}
								{#if todo.status !== 'completed' && todo.status !== 'rejected'}
									<button
										on:click={() => updateStatus(todo.id, 'rejected')}
										class="btn btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
									>
										退回
									</button>
								{/if}
								<button
									on:click={() => selectedTodoId = todo.id}
									class="btn btn-outline text-sm"
								>
									详情
								</button>
							</div>
						</div>
					</div>
				{/each}

				{#if todos.length === 0}
					<div class="text-center py-12 text-gray-500">
						<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
						</svg>
						<p>暂无待办事项</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if selectedTodoId && todoDetail}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
				<div class="p-6 border-b border-gray-200 flex items-center justify-between">
					<h2 class="text-lg font-semibold">待办详情</h2>
					<button
						on:click={() => selectedTodoId = null}
						class="p-2 hover:bg-gray-100 rounded-lg"
						aria-label="关闭"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<div class="flex-1 overflow-y-auto p-6 space-y-6">
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<span class={`badge ${getStatusBadge(todoDetail.status)}`}>
								{getStatusLabel(todoDetail.status)}
							</span>
							<span class={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(todoDetail.priority)}`}>
								{getPriorityLabel(todoDetail.priority)}
							</span>
							<span class="badge badge-gray">
								{getSourceLabel(todoDetail.source)}
							</span>
						</div>
						<h3 class="text-xl font-semibold text-gray-900">{todoDetail.title}</h3>
						<p class="text-gray-600">{todoDetail.description || '暂无描述'}</p>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">关联学员</p>
							<p class="font-medium text-gray-900 mt-1">
								{todoDetail.relatedUser?.name || '-'}
							</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">关联课程</p>
							<p class="font-medium text-gray-900 mt-1">
								{todoDetail.relatedCourse?.title || '-'}
							</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">处理人</p>
							<p class="font-medium text-gray-900 mt-1">
								{todoDetail.assignee?.name || '-'}
							</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">创建时间</p>
							<p class="font-medium text-gray-900 mt-1">
								{formatDateTime(todoDetail.createdAt)}
							</p>
						</div>
						{#if todoDetail.creator}
							<div class="bg-gray-50 rounded-lg p-4">
								<p class="text-sm text-gray-500">创建人</p>
								<p class="font-medium text-gray-900 mt-1">
									{todoDetail.creator.name || '-'}
								</p>
							</div>
						{/if}
						{#if todoDetail.completedAt}
							<div class="bg-gray-50 rounded-lg p-4">
								<p class="text-sm text-gray-500">完成时间</p>
								<p class="font-medium text-gray-900 mt-1">
									{formatDateTime(todoDetail.completedAt)}
								</p>
							</div>
						{/if}
					</div>

					<div>
						<h4 class="font-medium text-gray-900 mb-3">补充材料</h4>
						<div class="space-y-2">
							{#if todoDetail.materials?.length === 0}
								<p class="text-sm text-gray-500 py-4 text-center">暂无补充材料</p>
							{:else}
								{#each todoDetail.materials as material}
									<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
										<svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
										</svg>
										<div class="flex-1">
											<p class="font-medium text-gray-900">{material.title}</p>
											{#if material.description}
												<p class="text-sm text-gray-500">{material.description}</p>
											{/if}
											<p class="text-xs text-gray-400">
												上传者: {material.uploader?.name || '未知'} · {formatDateTime(material.createdAt)}
											</p>
										</div>
										<a
											href={material.fileUrl}
											target="_blank"
											class="text-primary-600 hover:text-primary-700 text-sm"
										>
											下载
										</a>
									</div>
								{/each}
							{/if}
						</div>
						{#if showMaterialForm}
							<div class="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
								<div>
									<label class="label" for="materialTitle">材料标题 <span class="text-red-500">*</span></label>
									<input
										id="materialTitle"
										type="text"
										class="input"
										bind:value={newMaterial.title}
										placeholder="请输入材料标题"
									/>
								</div>
								<div>
									<label class="label" for="materialDesc">材料说明</label>
									<input
										id="materialDesc"
										type="text"
										class="input"
										bind:value={newMaterial.description}
										placeholder="请输入材料说明（选填）"
									/>
								</div>
								<div>
									<label class="label" for="materialUrl">文件链接</label>
									<input
										id="materialUrl"
										type="text"
										class="input"
										bind:value={newMaterial.fileUrl}
										placeholder="请输入文件 URL（选填）"
									/>
								</div>
								<div class="flex items-center gap-2">
									<button
										on:click={handleAddMaterial}
										disabled={$addMaterialMutation.isLoading || !newMaterial.title.trim()}
										class="btn btn-primary text-sm"
									>
										{$addMaterialMutation.isLoading ? '上传中...' : '确认上传'}
									</button>
									<button
										on:click={() => { showMaterialForm = false; newMaterial = { title: '', description: '', fileUrl: '', fileType: '', fileSize: 0 }; }}
										class="btn btn-outline text-sm"
									>
										取消
									</button>
								</div>
							</div>
						{:else}
							<button
								class="btn btn-outline w-full mt-3"
								on:click={() => showMaterialForm = true}
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
								</svg>
								上传补充材料
							</button>
						{/if}
					</div>

					<div>
						<h4 class="font-medium text-gray-900 mb-3">评论记录</h4>
						<div class="space-y-3 mb-4">
							{#if todoDetail.comments?.length === 0}
								<p class="text-sm text-gray-500 py-4 text-center">暂无评论</p>
							{:else}
								{#each todoDetail.comments as comment}
									<div class="flex gap-3">
										<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium flex-shrink-0">
											{comment.user?.name?.charAt(0) || 'U'}
										</div>
										<div class="flex-1">
											<div class="bg-gray-50 rounded-lg p-3">
												<p class="text-sm font-medium text-gray-900">
													{comment.user?.name || '未知用户'}
												</p>
												<p class="text-sm text-gray-600 mt-1">{comment.content}</p>
											</div>
											<p class="text-xs text-gray-400 mt-1">
												{formatDateTime(comment.createdAt)}
											</p>
										</div>
									</div>
								{/each}
							{/if}
						</div>
						<div class="flex gap-3">
							<input
								type="text"
								class="input flex-1"
								placeholder="添加评论..."
								bind:value={commentText}
								on:keydown={(e) => { if (e.key === 'Enter') addComment(); }}
							/>
							<button on:click={addComment} class="btn btn-primary">发送</button>
						</div>
					</div>
				</div>

				<div class="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
					<button
						on:click={() => selectedTodoId = null}
						class="btn btn-outline"
					>
						关闭
					</button>
					{#if todoDetail.status !== 'completed' && todoDetail.status !== 'rejected'}
						<button
							on:click={() => showTransferModal = true}
							class="btn btn-secondary"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
							</svg>
							转派
						</button>
						<button
							on:click={() => updateStatus(todoDetail.id, 'rejected')}
							class="btn btn-danger"
						>
							退回
						</button>
					{/if}
					{#if todoDetail.status === 'processing'}
						<button
							on:click={() => updateStatus(todoDetail.id, 'completed')}
							class="btn btn-success"
						>
							标记完成
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if showCreateModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
				<div class="p-6 border-b border-gray-200 flex items-center justify-between">
					<h3 class="text-lg font-semibold">新建待办</h3>
					<button
						on:click={() => showCreateModal = false}
						class="p-2 hover:bg-gray-100 rounded-lg"
						aria-label="关闭"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="flex-1 overflow-y-auto p-6 space-y-4">
					<div>
						<label class="label" for="todoTitle">标题 <span class="text-red-500">*</span></label>
						<input
							id="todoTitle"
							type="text"
							bind:value={newTodo.title}
							class="input"
							placeholder="请输入待办标题"
						/>
					</div>
					<div>
						<label class="label" for="todoDescription">描述</label>
						<textarea
							id="todoDescription"
							bind:value={newTodo.description}
							class="input min-h-[80px]"
							placeholder="请输入待办描述"
						></textarea>
					</div>
					<div>
						<label class="label" for="todoPriority">优先级</label>
						<select
							id="todoPriority"
							bind:value={newTodo.priority}
							class="input"
						>
							<option value="low">低</option>
							<option value="medium">中</option>
							<option value="high">高</option>
							<option value="urgent">紧急</option>
						</select>
					</div>
					<div>
						<label class="label" for="todoRelatedUser">关联学员</label>
						<select
							id="todoRelatedUser"
							bind:value={newTodo.relatedUserId}
							class="input"
						>
							<option value="">无</option>
							{#each users as user}
								<option value={user.id}>{user.name} ({user.email})</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="todoAssignee">指派给</label>
						<select
							id="todoAssignee"
							bind:value={newTodo.assigneeId}
							class="input"
						>
							<option value="">无</option>
							{#each users as user}
								<option value={user.id}>{user.name} ({user.roleName || user.roleCode})</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="todoDueDate">截止日期</label>
						<input
							id="todoDueDate"
							type="date"
							bind:value={newTodo.dueDate}
							class="input"
						/>
					</div>
				</div>
				<div class="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
					<button
						on:click={() => showCreateModal = false}
						class="btn btn-outline"
					>
						取消
					</button>
					<button
						on:click={handleCreateTodo}
						disabled={$createTodoMutation.isLoading || !newTodo.title.trim()}
						class="btn btn-primary"
					>
						{$createTodoMutation.isLoading ? '创建中...' : '创建'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showTransferModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl w-full max-w-md flex flex-col">
				<div class="p-6 border-b border-gray-200 flex items-center justify-between">
					<h3 class="text-lg font-semibold">转派待办</h3>
					<button
						on:click={() => showTransferModal = false}
						class="p-2 hover:bg-gray-100 rounded-lg"
						aria-label="关闭"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<label class="label" for="transferTo">转派给 <span class="text-red-500">*</span></label>
						<select
							id="transferTo"
							bind:value={transferToUserId}
							class="input"
						>
							<option value="">请选择处理人</option>
							{#each users as user}
								<option value={user.id}>{user.name} ({user.roleName || user.roleCode})</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="transferReason">转派原因</label>
						<textarea
							id="transferReason"
							bind:value={transferReason}
							class="input min-h-[80px]"
							placeholder="请输入转派原因（选填）"
						></textarea>
					</div>
				</div>
				<div class="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
					<button
						on:click={() => showTransferModal = false}
						class="btn btn-outline"
					>
						取消
					</button>
					<button
						on:click={handleTransfer}
						disabled={$transferMutation.isLoading || !transferToUserId}
						class="btn btn-primary"
					>
						{$transferMutation.isLoading ? '转派中...' : '确认转派'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>

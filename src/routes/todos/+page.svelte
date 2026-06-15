<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery, createMutation } from '$lib/trpc/query';
	import { writable, derived } from 'svelte/store';

	let selectedStatus = '';
	let selectedPriority = '';
	let showCreateModal = false;
	let selectedTodoId: string | null = null;
	let commentText = '';

	const todosQuery = createQuery<any, any>('todos.list', () => ({
		page: 1,
		pageSize: 20,
		status: selectedStatus || undefined,
		priority: selectedPriority || undefined,
		myTasksOnly: false
	}));

	const todoStatsQuery = createQuery<void, any>('todos.myTodoStats', () => ({} as any));

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

	$: todos = $todosQuery.data?.items || [];
	$: total = $todosQuery.data?.total || 0;
	$: stats = $todoStatsQuery.data || {};

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

	async function updateStatus(id: string, status: string) {
		try {
			const mutation = createMutation<{ id: string; status: string }, any>('todos.updateStatus');
			await mutation.mutate({ id, status });
			todosQuery.refetch();
			todoStatsQuery.refetch();
		} catch (err) {
			console.error('更新状态失败:', err);
		}
	}

	async function addComment() {
		if (!selectedTodoId || !commentText.trim()) return;

		try {
			const mutation = createMutation<{ todoId: string; content: string }, any>('todos.addComment');
			await mutation.mutate({ todoId: selectedTodoId, content: commentText });
			commentText = '';
		} catch (err) {
			console.error('添加评论失败:', err);
		}
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
										{todo.createdAt ? new Date(todo.createdAt).toLocaleDateString() : ''}
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

	{#if selectedTodoId}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
				<div class="p-6 border-b border-gray-200 flex items-center justify-between">
					<h2 class="text-lg font-semibold">待办详情</h2>
					<button
						on:click={() => selectedTodoId = null}
						class="p-2 hover:bg-gray-100 rounded-lg"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<div class="flex-1 overflow-y-auto p-6 space-y-6">
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<span class={`badge ${getStatusBadge('pending')}`}>待处理</span>
							<span class="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">高优先级</span>
						</div>
						<h3 class="text-xl font-semibold text-gray-900">进度落后提醒 - 学员张三</h3>
						<p class="text-gray-600">学员张三的《网络安全基础》课程学习进度落后于计划进度20%，请及时跟进并提供必要的辅导。</p>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">关联学员</p>
							<p class="font-medium text-gray-900 mt-1">张三</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">关联课程</p>
							<p class="font-medium text-gray-900 mt-1">网络安全基础</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">处理人</p>
							<p class="font-medium text-gray-900 mt-1">李助教</p>
						</div>
						<div class="bg-gray-50 rounded-lg p-4">
							<p class="text-sm text-gray-500">创建时间</p>
							<p class="font-medium text-gray-900 mt-1">2024-01-15 10:30</p>
						</div>
					</div>

					<div>
						<h4 class="font-medium text-gray-900 mb-3">补充材料</h4>
						<div class="space-y-2">
							<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
								<svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
								<div class="flex-1">
									<p class="font-medium text-gray-900">学习计划调整建议.pdf</p>
									<p class="text-sm text-gray-500">上传者: 李助教 · 2天前</p>
								</div>
								<button class="text-primary-600 hover:text-primary-700 text-sm">下载</button>
							</div>
						</div>
						<button class="btn btn-outline w-full mt-3">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
							</svg>
							上传补充材料
						</button>
					</div>

					<div>
						<h4 class="font-medium text-gray-900 mb-3">评论记录</h4>
						<div class="space-y-3 mb-4">
							<div class="flex gap-3">
								<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium flex-shrink-0">
									李
								</div>
								<div class="flex-1">
									<div class="bg-gray-50 rounded-lg p-3">
										<p class="text-sm font-medium text-gray-900">李助教</p>
										<p class="text-sm text-gray-600 mt-1">已联系学员，对方表示最近工作较忙，计划周末集中学习。已提供学习建议。</p>
									</div>
									<p class="text-xs text-gray-400 mt-1">2天前</p>
								</div>
							</div>
						</div>
						<div class="flex gap-3">
							<input
								type="text"
								class="input flex-1"
								placeholder="添加评论..."
								bind:value={commentText}
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
					<button class="btn btn-secondary">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
						</svg>
						转派
					</button>
					<button class="btn btn-danger">退回</button>
					<button class="btn btn-success">标记完成</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>

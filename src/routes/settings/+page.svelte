<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery, createMutation } from '$lib/trpc/query';

	let activeTab = 'reminder';
	let showCreateRuleModal = false;

	const tabs = [
		{ id: 'reminder', label: '提醒规则', icon: 'bell' },
		{ id: 'trace', label: '课程留痕', icon: 'clock' },
		{ id: 'filter', label: '常用筛选', icon: 'filter' }
	];

	const reminderRulesQuery = createQuery<any, any[]>('settings.listReminderRules', () => ({}));
	const chapterTracesQuery = createQuery<any, any>('settings.listChapterTraces', () => ({ page: 1, pageSize: 20 }));
	const savedFiltersQuery = createQuery<any, any[]>('settings.listSavedFilters', () => ({}));
	const createRuleMutation = createMutation<any, any>('settings.createReminderRule');
	const updateRuleMutation = createMutation<any, any>('settings.updateReminderRule');
	const deleteRuleMutation = createMutation<any, any>('settings.deleteReminderRule');

	$: reminderRules = $reminderRulesQuery.data || [];
	$: chapterTraces = $chapterTracesQuery.data?.items || [];
	$: savedFilters = $savedFiltersQuery.data || [];

	let newRule = {
		name: '',
		description: '',
		ruleType: 'progress_delay',
		triggerCondition: { threshold: 70, days: 3 },
		actionType: 'notification',
		notificationChannels: ['site', 'email'],
		isEnabled: true
	};

	function getRuleTypeLabel(type: string) {
		const labels: Record<string, string> = {
			progress_delay: '进度落后',
			exam_reminder: '考试提醒',
			daily_study: '每日学习',
			course_complete: '课程完成'
		};
		return labels[type] || type;
	}

	function getRuleTypeBadgeClass(type: string) {
		switch (type) {
			case 'progress_delay':
				return 'badge-warning';
			case 'exam_reminder':
				return 'badge-primary';
			case 'daily_study':
				return 'badge-success';
			case 'course_complete':
				return 'badge-purple';
			default:
				return 'badge-gray';
		}
	}

	function getActionTypeLabel(type: string) {
		const labels: Record<string, string> = {
			notification: '站内通知',
			email: '邮件通知',
			todo: '创建待办',
			all: '全部通知'
		};
		return labels[type] || type;
	}

	function getChannelLabel(channel: string) {
		const labels: Record<string, string> = {
			site: '站内',
			email: '邮件',
			sms: '短信',
			wechat: '微信'
		};
		return labels[channel] || channel;
	}

	function getActionTypeLabelTrace(type: string) {
		const labels: Record<string, string> = {
			view: '查看',
			study: '学习',
			complete: '完成',
			comment: '评论',
			download: '下载'
		};
		return labels[type] || type;
	}

	function formatDateTime(date: any) {
		if (!date) return '-';
		return new Date(date).toLocaleString('zh-CN');
	}

	async function handleCreateRule() {
		try {
			await createRuleMutation.mutate(newRule);
			showCreateRuleModal = false;
			newRule = {
				name: '',
				description: '',
				ruleType: 'progress_delay',
				triggerCondition: { threshold: 70, days: 3 },
				actionType: 'notification',
				notificationChannels: ['site', 'email'],
				isEnabled: true
			};
			reminderRulesQuery.refetch();
		} catch (err: any) {
			alert(err.message || '创建失败');
		}
	}

	async function toggleRule(rule: any) {
		try {
			await updateRuleMutation.mutate({
				id: rule.id,
				isEnabled: !rule.isEnabled
			});
			reminderRulesQuery.refetch();
		} catch (err: any) {
			alert(err.message || '操作失败');
		}
	}

	async function deleteRule(rule: any) {
		if (!confirm('确定要删除这个提醒规则吗？')) return;

		try {
			await deleteRuleMutation.mutate({ id: rule.id });
			reminderRulesQuery.refetch();
		} catch (err: any) {
			alert(err.message || '删除失败');
		}
	}

	async function deleteFilter(filter: any) {
		if (!confirm('确定要删除这个筛选条件吗？')) return;
		// TODO: 调用删除接口
	}
</script>

<svelte:head>
	<title>系统设置 - 职业教育证书考试协同平台</title>
</svelte:head>

<AppLayout>
	<svelte:fragment slot="title">系统设置</svelte:fragment>

	<div class="flex gap-6">
		<div class="w-56 flex-shrink-0">
			<div class="card">
				<nav class="p-2 space-y-1">
					{#each tabs as tab}
						<button
							on:click={() => (activeTab = tab.id)}
							class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors {activeTab === tab.id
								? 'bg-primary-50 text-primary-700 font-medium'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							{#if tab.icon === 'bell'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
								</svg>
							{:else if tab.icon === 'clock'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							{:else if tab.icon === 'filter'}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
								</svg>
							{/if}
							<span>{tab.label}</span>
						</button>
					{/each}
				</nav>
			</div>
		</div>

		<div class="flex-1 min-w-0">
			{#if activeTab === 'reminder'}
				<div class="space-y-6">
					<div class="card">
						<div class="p-6 border-b border-gray-200">
							<div class="flex items-center justify-between">
								<div>
									<h2 class="text-lg font-semibold text-gray-900">提醒规则配置</h2>
									<p class="text-sm text-gray-500 mt-1">配置系统的自动提醒规则，当满足条件时自动触发通知或创建待办</p>
								</div>
								<button
									on:click={() => (showCreateRuleModal = true)}
									class="btn btn-primary"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
									</svg>
									新建规则
								</button>
							</div>
						</div>

						<div class="divide-y divide-gray-100">
							{#if reminderRules.length === 0}
								<div class="p-12 text-center text-gray-500">
									<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
									</svg>
									<p>暂无提醒规则</p>
									<p class="text-sm mt-1">点击上方按钮创建第一个提醒规则</p>
								</div>
							{:else}
								{#each reminderRules as rule}
									<div class="p-6 hover:bg-gray-50 transition-colors">
										<div class="flex items-start justify-between">
											<div class="flex items-start gap-4">
												<div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
													<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
													</svg>
												</div>
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-2 mb-1">
														<h3 class="font-medium text-gray-900">{rule.name}</h3>
														<span class="badge {getRuleTypeBadgeClass(rule.ruleType)}">
															{getRuleTypeLabel(rule.ruleType)}
														</span>
													</div>
													<p class="text-sm text-gray-500 mb-3">{rule.description || '暂无描述'}</p>
													<div class="flex items-center gap-4 text-sm">
														<span class="text-gray-500">
															触发方式: {getActionTypeLabel(rule.actionType)}
														</span>
														<span class="text-gray-500">
															通知渠道: {rule.notificationChannels?.map((c: string) => getChannelLabel(c)).join('、') || '无'}
														</span>
													</div>
												</div>
											</div>
											<div class="flex items-center gap-2">
												<label class="relative inline-flex items-center cursor-pointer">
													<input
														type="checkbox"
														checked={rule.isEnabled}
														on:change={() => toggleRule(rule)}
														class="sr-only peer"
													/>
													<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
												</label>
												<button
																									on:click={() => deleteRule(rule)}
																									class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
																									aria-label="删除规则"
																								>
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
													</svg>
												</button>
											</div>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			{:else if activeTab === 'trace'}
				<div class="space-y-6">
					<div class="card">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-lg font-semibold text-gray-900">课程章节留痕</h2>
							<p class="text-sm text-gray-500 mt-1">查看学员的课程章节学习记录</p>
						</div>

						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>用户</th>
										<th>章节</th>
										<th>操作类型</th>
										<th>操作详情</th>
										<th>时间</th>
									</tr>
								</thead>
								<tbody>
									{#if chapterTraces.length === 0}
										<tr>
											<td colspan="5" class="text-center py-12 text-gray-500">
												<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
												</svg>
												<p>暂无学习记录</p>
											</td>
										</tr>
									{:else}
										{#each chapterTraces as trace}
											<tr>
												<td>
													<div class="flex items-center gap-2">
														<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
															{trace.user?.name?.charAt(0) || 'U'}
														</div>
														<span class="text-sm text-gray-900">{trace.user?.name || '未知用户'}</span>
													</div>
												</td>
												<td class="text-sm text-gray-900">{trace.chapter?.title || '未知章节'}</td>
												<td>
													<span class="badge badge-primary">{getActionTypeLabelTrace(trace.actionType)}</span>
												</td>
												<td class="text-sm text-gray-500">{trace.actionDetail || '-'}</td>
												<td class="text-sm text-gray-500">{formatDateTime(trace.createdAt)}</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{:else if activeTab === 'filter'}
				<div class="space-y-6">
					<div class="card">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-lg font-semibold text-gray-900">常用筛选</h2>
							<p class="text-sm text-gray-500 mt-1">管理保存的常用筛选条件</p>
						</div>

						<div class="divide-y divide-gray-100">
							{#if savedFilters.length === 0}
								<div class="p-12 text-center text-gray-500">
									<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
									</svg>
									<p>暂无保存的筛选条件</p>
									<p class="text-sm mt-1">在各页面中可以将常用的筛选条件保存到这里</p>
								</div>
							{:else}
								{#each savedFilters as filter}
									<div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
												<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
												</svg>
											</div>
											<div>
												<div class="flex items-center gap-2">
													<h4 class="font-medium text-gray-900">{filter.name}</h4>
													{#if filter.isDefault}
														<span class="badge badge-primary">默认</span>
													{/if}
												</div>
												<p class="text-sm text-gray-500">页面: {filter.pageKey}</p>
											</div>
										</div>
										<div class="flex items-center gap-2">
											<button
																								on:click={() => deleteFilter(filter)}
																								class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
																								aria-label="删除筛选"
																						>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
												</svg>
											</button>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if showCreateRuleModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl">
				<div class="flex items-center justify-between p-6 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">新建提醒规则</h3>
					<button
												on:click={() => (showCreateRuleModal = false)}
												class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
												aria-label="关闭"
										>
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="p-6 space-y-4 max-h-96 overflow-y-auto">
					<div>
						<label class="label" for="ruleName">规则名称</label>
						<input
							id="ruleName"
							type="text"
							bind:value={newRule.name}
							class="input"
							placeholder="请输入规则名称"
						/>
					</div>
					<div>
						<label class="label" for="ruleDescription">规则描述</label>
						<textarea
							id="ruleDescription"
							bind:value={newRule.description}
							class="input min-h-[80px]"
							placeholder="请输入规则描述（选填）"
						></textarea>
					</div>
					<div>
						<label class="label" for="ruleType">规则类型</label>
						<select
							id="ruleType"
							bind:value={newRule.ruleType}
							class="input"
						>
							<option value="progress_delay">进度落后提醒</option>
							<option value="exam_reminder">考试提醒</option>
							<option value="daily_study">每日学习提醒</option>
							<option value="course_complete">课程完成提醒</option>
						</select>
					</div>
					<fieldset>
						<legend class="label">通知渠道</legend>
						<div class="flex items-center gap-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:group={newRule.notificationChannels}
									value="site"
									class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
								/>
								<span class="text-sm text-gray-700">站内信</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:group={newRule.notificationChannels}
									value="email"
									class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
								/>
								<span class="text-sm text-gray-700">邮件</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:group={newRule.notificationChannels}
									value="sms"
									class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
								/>
								<span class="text-sm text-gray-700">短信</span>
							</label>
						</div>
					</fieldset>
					<div class="flex items-center gap-3">
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={newRule.isEnabled}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
						</label>
						<span class="text-sm text-gray-700">立 即启用</span>
					</div>
				</div>
				<div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
					<button
						on:click={() => (showCreateRuleModal = false)}
						class="btn btn-outline"
					>
						取消
					</button>
					<button
						on:click={handleCreateRule}
						disabled={$createRuleMutation.isLoading || !newRule.name}
						class="btn btn-primary"
					>
						{$createRuleMutation.isLoading ? '创建中...' : '创建'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>

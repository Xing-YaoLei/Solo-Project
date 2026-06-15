<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery } from '$lib/trpc/query';

	let activeTab = 'completion';
	let dateRange = '7d';
	let granularity = 'day';
	let roleFilter = '';
	let searchKeyword = '';
	let currentPage = 1;

	const tabs = [
		{ id: 'completion', label: '完成率分析' },
		{ id: 'date', label: '日期趋势' },
		{ id: 'user', label: '负责人绩效' }
	];

	const overviewQuery = createQuery<void, any>('reports.overviewStats', () => ({} as any));
	const completionRateQuery = createQuery<any, any[]>('reports.completionRateByCourse', () => ({}));

	$: dateQueryInput = getDateRangeInput();
	const passRateQuery = createQuery<any, any[]>('reports.examPassRateByDate', () => dateQueryInput);

	$: userQueryInput = {
		page: currentPage,
		pageSize: 10,
		role: roleFilter || undefined,
		keyword: searchKeyword || undefined
	};
	const userPerformanceQuery = createQuery<any, any>('reports.performanceByUser', () => userQueryInput);

	$: overview = $overviewQuery.data;
	$: completionRates = $completionRateQuery.data || [];
	$: passRateData = $passRateQuery.data || [];
	$: userPerformance = $userPerformanceQuery.data;

	function getDateRangeInput() {
		const end = new Date();
		const start = new Date();

		switch (dateRange) {
			case '7d':
				start.setDate(start.getDate() - 7);
				break;
			case '30d':
				start.setDate(start.getDate() - 30);
				break;
			case '90d':
				start.setDate(start.getDate() - 90);
				break;
			default:
				start.setDate(start.getDate() - 7);
		}

		return {
			startDate: start.toISOString().split('T')[0],
			endDate: end.toISOString().split('T')[0],
			granularity
		};
	}

	function formatPercent(value: number) {
		return (value || 0).toFixed(1) + '%';
	}

	function formatDate(date: any) {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
	}

	function getRoleLabel(role: string) {
		const labels: Record<string, string> = {
			student: '学员',
			assistant: '助教',
			lecturer: '讲师',
			admin: '教务'
		};
		return labels[role] || role;
	}

	function getRoleBadgeClass(role: string) {
		switch (role) {
			case 'student':
				return 'badge-blue';
			case 'assistant':
				return 'badge-green';
			case 'lecturer':
				return 'badge-purple';
			case 'admin':
				return 'badge-orange';
			default:
				return 'badge-gray';
		}
	}

	function maxPassRate() {
		if (passRateData.length === 0) return 100;
		const max = Math.max(...passRateData.map((d: any) => d.passRate || 0));
		return Math.ceil(max / 10) * 10 || 100;
	}
</script>

<svelte:head>
	<title>报表分析 - 职业教育证书考试协同平台</title>
</svelte:head>

<AppLayout>
	<svelte:fragment slot="title">报表分析</svelte:fragment>

	<div class="space-y-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">总学员数</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">{overview?.totalUsers || 0}</p>
					</div>
					<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
						</svg>
					</div>
				</div>
			</div>

			<div class="card p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">课程总数</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">{overview?.totalCourses || 0}</p>
					</div>
					<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
						</svg>
					</div>
				</div>
			</div>

			<div class="card p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">考试总数</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">{overview?.totalExams || 0}</p>
					</div>
					<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
					</div>
				</div>
			</div>

			<div class="card p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">平均通过率</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">
							{overview?.avgPassRate ? formatPercent(overview.avgPassRate) : '0%'}
						</p>
					</div>
					<div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
						</svg>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="border-b border-gray-200">
				<nav class="flex gap-1 px-6">
					{#each tabs as tab}
						<button
							on:click={() => {
								activeTab = tab.id;
								currentPage = 1;
							}}
							class="px-4 py-4 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id
								? 'border-primary-600 text-primary-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							{tab.label}
						</button>
					{/each}
				</nav>
			</div>

			<div class="p-6">
				{#if activeTab === 'completion'}
					<div>
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold text-gray-900">课程完成率排行</h3>
							<div class="flex items-center gap-2">
								<button class="btn btn-outline text-sm">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
									</svg>
									导出
								</button>
							</div>
						</div>

						{#if completionRates.length === 0}
							<div class="text-center py-12 text-gray-500">
								<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
								</svg>
								<p>暂无数据</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each completionRates as course, i}
									<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
										<div class="w-8 h-8 flex-shrink-0">
											<span class="text-lg font-bold text-gray-400">#{i + 1}</span>
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-2">
												<h4 class="font-medium text-gray-900 truncate">{course.courseTitle}</h4>
											</div>
											<div class="flex items-center gap-4 text-sm text-gray-500">
												<span>学习人数: {course.totalCount}</span>
												<span>已完成: {course.completedCount}</span>
												<span>平均进度: {course.avgProgress?.toFixed(1) || 0}%</span>
											</div>
										</div>
										<div class="flex items-center gap-4 w-64 flex-shrink-0">
											<div class="flex-1">
												<div class="progress-bar h-3">
													<div
														class="progress-bar-fill {course.completionRate >= 80
															? 'bg-green-500'
															: course.completionRate >= 50
																? 'bg-yellow-500'
																: 'bg-red-500'}"
														style={`width: ${course.completionRate || 0}%`}
													></div>
												</div>
											</div>
											<span class="w-16 text-right font-semibold text-gray-900">
												{course.completionRate?.toFixed(1) || 0}%
											</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'date'}
					<div>
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold text-gray-900">考试通过率趋势</h3>
							<div class="flex items-center gap-2">
								<select
									bind:value={dateRange}
									class="input text-sm py-1.5 w-auto"
								>
									<option value="7d">近7天</option>
									<option value="30d">近30天</option>
									<option value="90d">近90天</option>
								</select>
								<select
									bind:value={granularity}
									class="input text-sm py-1.5 w-auto"
								>
									<option value="day">按天</option>
									<option value="week">按周</option>
									<option value="month">按月</option>
								</select>
								<button class="btn btn-outline text-sm">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
									</svg>
									导出
								</button>
							</div>
						</div>

						{#if passRateData.length === 0}
							<div class="text-center py-12 text-gray-500">
								<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
								<p>暂无数据</p>
							</div>
						{:else}
							<div class="h-80 flex items-end gap-2 px-4">
								{#each passRateData as item}
									<div class="flex-1 flex flex-col items-center">
										<div class="flex-1 w-full flex items-end justify-center">
											<div
												class="w-full max-w-12 bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer relative group"
												style={`height: ${(item.passRate || 0) / maxPassRate() * 100}%`}
											>
												<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
													通过率: {formatPercent(item.passRate)}
												</div>
											</div>
										</div>
										<div class="text-xs text-gray-500 mt-2 truncate w-full text-center">
											{formatDate(item.date)}
										</div>
									</div>
								{/each}
							</div>

							<div class="mt-6 grid grid-cols-3 gap-4">
								<div class="text-center p-4 bg-blue-50 rounded-lg">
									<p class="text-2xl font-bold text-blue-600">
										{passRateData.reduce((sum: number, d: any) => sum + (d.totalCount || 0), 0)}
									</p>
									<p class="text-sm text-blue-700 mt-1">总考试次数</p>
								</div>
								<div class="text-center p-4 bg-green-50 rounded-lg">
									<p class="text-2xl font-bold text-green-600">
										{passRateData.reduce((sum: number, d: any) => sum + (d.passedCount || 0), 0)}
									</p>
									<p class="text-sm text-green-700 mt-1">通过次数</p>
								</div>
								<div class="text-center p-4 bg-purple-50 rounded-lg">
									<p class="text-2xl font-bold text-purple-600">
										{passRateData.length > 0
											? (passRateData.reduce((sum: number, d: any) => sum + (d.avgScore || 0), 0) / passRateData.length).toFixed(1)
											: 0}
									</p>
									<p class="text-sm text-purple-700 mt-1">平均分数</p>
								</div>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'user'}
					<div>
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold text-gray-900">负责人绩效排行</h3>
							<div class="flex items-center gap-2">
								<input
									type="text"
									bind:value={searchKeyword}
									placeholder="搜索姓名/邮箱"
									class="input text-sm py-1.5 w-48"
								/>
								<select
									bind:value={roleFilter}
									class="input text-sm py-1.5 w-auto"
								>
									<option value="">全部角色</option>
									<option value="student">学员</option>
									<option value="assistant">助教</option>
									<option value="lecturer">讲师</option>
									<option value="admin">教务</option>
								</select>
								<button class="btn btn-outline text-sm">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
									</svg>
									导出
								</button>
							</div>
						</div>

						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>排名</th>
										<th>用户</th>
										<th>角色</th>
										<th>学习课程</th>
										<th>完成课程</th>
										<th>平均进度</th>
										<th>考试次数</th>
										<th>通过率</th>
										<th>平均分</th>
									</tr>
								</thead>
								<tbody>
									{#if !userPerformance?.items?.length}
										<tr>
											<td colspan="9" class="text-center py-8 text-gray-500">
												暂无数据
											</td>
										</tr>
									{:else}
										{#each userPerformance.items as user, i}
											<tr class="cursor-pointer hover:bg-gray-50">
												<td>
													<span class="text-lg font-bold {i < 3 ? 'text-yellow-500' : 'text-gray-400'}">
														#{i + 1}
													</span>
												</td>
												<td>
													<div class="flex items-center gap-3">
														<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
															{user.name?.charAt(0) || 'U'}
														</div>
														<div>
															<p class="font-medium text-gray-900">{user.name}</p>
															<p class="text-xs text-gray-500">{user.email}</p>
														</div>
													</div>
												</td>
												<td>
													<span class="badge badge-{getRoleBadgeClass(user.roleCode)?.replace('badge-', '')}">
														{getRoleLabel(user.roleCode)}
													</span>
												</td>
												<td>{user.totalCourses}</td>
												<td>{user.completedCourses}</td>
												<td>{user.avgProgress?.toFixed(1) || 0}%</td>
												<td>{user.totalExams}</td>
												<td>
													<span class="{user.passRate >= 60 ? 'text-green-600' : 'text-red-600'} font-medium">
														{user.passRate?.toFixed(1) || 0}%
													</span>
												</td>
												<td>{user.avgScore?.toFixed(1) || 0}</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>

						{#if userPerformance?.total > userPerformance?.pageSize}
							<div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
								<p class="text-sm text-gray-500">
									共 {userPerformance.total} 条记录
								</p>
								<div class="flex items-center gap-2">
									<button
										on:click={() => currentPage = Math.max(1, currentPage - 1)}
										disabled={currentPage <= 1}
										class="btn btn-outline text-sm py-1 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										上一页
									</button>
									<span class="text-sm text-gray-600">
										第 {currentPage} 页
									</span>
									<button
										on:click={() => currentPage = currentPage + 1}
										class="btn btn-outline text-sm py-1"
									>
										下一页
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</AppLayout>

<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery } from '$lib/trpc/query';

	const statsQuery = createQuery<void, any>('reports.overviewStats', () => ({} as any));
	const progressQuery = createQuery<void, any>('progress.getUserProgress', () => ({} as any));
	const todoStatsQuery = createQuery<void, any>('todos.myTodoStats', () => ({} as any));
	const completionRateQuery = createQuery<any, any>('reports.completionRateByCourse', () => ({}));

	$: stats = $statsQuery.data;
	$: progressList = $progressQuery.data || [];
	$: todoStats = $todoStatsQuery.data;
	$: completionRates = $completionRateQuery.data || [];

	function formatPercent(value: number) {
		return value.toFixed(1) + '%';
	}

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'beginner': return 'badge-success';
			case 'intermediate': return 'badge-warning';
			case 'advanced': return 'badge-danger';
			default: return 'badge-gray';
		}
	}

	function getDifficultyLabel(difficulty: string) {
		switch (difficulty) {
			case 'beginner': return '初级';
			case 'intermediate': return '中级';
			case 'advanced': return '高级';
			default: return difficulty;
		}
	}
</script>

<svelte:head>
	<title>仪表盘 - 职业教育证书考试协同平台</title>
</svelte:head>

<AppLayout>
	<svelte:fragment slot="title">仪表盘</svelte:fragment>

	<div class="space-y-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">总学员数</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">
							{stats?.totalUsers || 0}
						</p>
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
						<p class="text-2xl font-bold text-gray-900 mt-1">
							{stats?.totalCourses || 0}
						</p>
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
						<p class="text-2xl font-bold text-gray-900 mt-1">
							{stats?.totalExams || 0}
						</p>
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
							{stats?.avgPassRate ? formatPercent(stats.avgPassRate) : '0%'}
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

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 card">
				<div class="p-6 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">我的学习进度</h2>
				</div>
				<div class="p-6">
					{#if progressList.length === 0}
						<div class="text-center py-12 text-gray-500">
							<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
							</svg>
							<p>暂无学习记录</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each progressList as progress}
								<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-2">
											<h3 class="font-medium text-gray-900 truncate">{progress.course?.title || '未知课程'}</h3>
											{#if progress.course?.category}
												<span class="badge badge-primary">{progress.course.category}</span>
											{/if}
										</div>
										<div class="flex items-center gap-4 text-sm text-gray-500">
											<span>进度: {progress.progressPercent}%</span>
											<span>已学: {progress.completedQuestions || 0}题</span>
											{#if progress.lastStudiedAt}
												<span>上次学习: {new Date(progress.lastStudiedAt).toLocaleDateString()}</span>
											{/if}
										</div>
									</div>
									<div class="ml-4 w-32">
										<div class="progress-bar">
											<div class="progress-bar-fill" style={`width: ${progress.progressPercent}%`}></div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="p-6 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">待办事项</h2>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-2 gap-4">
						<div class="text-center p-4 bg-yellow-50 rounded-lg">
							<p class="text-2xl font-bold text-yellow-600">{todoStats?.pending || 0}</p>
							<p class="text-sm text-yellow-700 mt-1">待处理</p>
						</div>
						<div class="text-center p-4 bg-blue-50 rounded-lg">
							<p class="text-2xl font-bold text-blue-600">{todoStats?.processing || 0}</p>
							<p class="text-sm text-blue-700 mt-1">处理中</p>
						</div>
						<div class="text-center p-4 bg-green-50 rounded-lg">
							<p class="text-2xl font-bold text-green-600">{todoStats?.completed || 0}</p>
							<p class="text-sm text-green-700 mt-1">已完成</p>
						</div>
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<p class="text-2xl font-bold text-gray-600">{todoStats?.total || 0}</p>
							<p class="text-sm text-gray-700 mt-1">总计</p>
						</div>
					</div>

					<a href="/todos" class="btn btn-outline w-full mt-6">
						查看全部待办
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
						</svg>
					</a>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="p-6 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">课程完成率</h2>
			</div>
			<div class="p-6">
				{#if completionRates.length === 0}
					<div class="text-center py-8 text-gray-500">
						暂无数据
					</div>
				{:else}
					<div class="space-y-4">
						{#each completionRates as course}
							<div class="flex items-center gap-4">
								<div class="w-48 flex-shrink-0">
									<p class="font-medium text-gray-900 truncate">{course.courseTitle}</p>
									<p class="text-sm text-gray-500">{course.totalCount} 人学习</p>
								</div>
								<div class="flex-1">
									<div class="progress-bar h-3">
										<div class="progress-bar-fill bg-green-500" style={`width: ${course.completionRate || 0}%`}></div>
									</div>
								</div>
								<div class="w-20 text-right">
									<p class="font-semibold text-gray-900">{course.completionRate?.toFixed(1) || 0}%</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</AppLayout>

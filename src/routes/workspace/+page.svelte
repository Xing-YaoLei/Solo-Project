<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery } from '$lib/trpc/query';
	import { writable, derived } from 'svelte/store';

	let activeTab = 'questions';
	let currentCourseId: string | null = null;

	const coursesQuery = createQuery<any, any>('courses.list', () => ({ page: 1, pageSize: 50 }));
	const questionTagsQuery = createQuery<void, any>('questions.listTags', () => ({} as any));
	const progressQuery = createQuery<any, any>('progress.getUserProgress', () => ({}));
	const examScoresQuery = createQuery<any, any>('progress.listExamScores', () => ({ page: 1, pageSize: 20 }));
	const reminderRulesQuery = createQuery<any, any>('settings.listReminderRules', () => ({}));
	const savedFiltersQuery = createQuery<any, any>('settings.listSavedFilters', () => ({ pageKey: 'workspace' }));
	const chapterTracesQuery = createQuery<any, any>('settings.listChapterTraces', () => ({ page: 1, pageSize: 10 }));

	let selectedTags = writable<string[]>([]);
	let searchKeyword = '';

	$: questionsQuery = createQuery<any, any>('questions.list', () => ({
		page: 1,
		pageSize: 20,
		courseId: currentCourseId || undefined,
		keyword: searchKeyword || undefined,
		tagIds: $selectedTags.length > 0 ? $selectedTags : undefined
	}));

	$: courses = $coursesQuery.data?.items || [];
	$: tags = $questionTagsQuery.data || [];
	$: progressList = $progressQuery.data || [];
	$: examScores = $examScoresQuery.data?.items || [];
	$: reminderRules = $reminderRulesQuery.data || [];
	$: savedFilters = $savedFiltersQuery.data || [];
	$: chapterTraces = $chapterTracesQuery.data?.items || [];
	$: questions = $questionsQuery.data?.items || [];

	function getTypeLabel(type: string) {
		const map: Record<string, string> = {
			single: '单选题',
			multiple: '多选题',
			judge: '判断题',
			fill: '填空题',
			essay: '问答题'
		};
		return map[type] || type;
	}

	function getTypeColor(type: string) {
		const map: Record<string, string> = {
			single: 'badge-primary',
			multiple: 'badge-success',
			judge: 'badge-warning',
			fill: 'badge-danger',
			essay: 'badge-gray'
		};
		return map[type] || 'badge-gray';
	}

	function toggleTag(tagId: string) {
		selectedTags.update((tags) => {
			if (tags.includes(tagId)) {
				return tags.filter((t) => t !== tagId);
			} else {
				return [...tags, tagId];
			}
		});
	}

	function getStatusBadge(isPassed: boolean) {
		return isPassed ? 'badge-success' : 'badge-danger';
	}

	function getStatusLabel(isPassed: boolean) {
		return isPassed ? '通过' : '未通过';
	}
</script>

<svelte:head>
	<title>操作区 - 职业教育证书考试协同平台</title>
</svelte:head>

<AppLayout>
	<svelte:fragment slot="title">操作区</svelte:fragment>

	<div class="flex gap-6 h-full">
		<div class="flex-1 min-w-0 space-y-6">
			<div class="card">
				<div class="flex border-b border-gray-200">
					<button
						on:click={() => activeTab = 'questions'}
						class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'questions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
					>
						题目标签
					</button>
					<button
						on:click={() => activeTab = 'progress'}
						class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'progress' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
					>
						学习进度
					</button>
					<button
						on:click={() => activeTab = 'scores'}
						class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'scores' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
					>
						成绩反馈
					</button>
				</div>

				<div class="p-6">
					{#if activeTab === 'questions'}
						<div class="space-y-4">
							<div class="flex items-center gap-4">
								<div class="flex-1">
									<input
										type="text"
										class="input"
										placeholder="搜索题目..."
										bind:value={searchKeyword}
									/>
								</div>
								<select class="input w-48" bind:value={currentCourseId}>
									<option value={null}>全部课程</option>
									{#each courses as course}
										<option value={course.id}>{course.title}</option>
									{/each}
								</select>
							</div>

							<div class="flex flex-wrap gap-2">
								{#each tags as tag}
									<button
										on:click={() => toggleTag(tag.id)}
										class={`px-3 py-1 rounded-full text-sm transition-colors ${$selectedTags.includes(tag.id) ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
										style={$selectedTags.includes(tag.id) ? `background-color: ${tag.color}` : ''}
									>
										{tag.name}
									</button>
								{/each}
							</div>

							<div class="table-wrapper">
								<table>
									<thead>
										<tr>
											<th>题目</th>
											<th>类型</th>
											<th>难度</th>
											<th>分值</th>
											<th>标签</th>
											<th>操作</th>
										</tr>
									</thead>
									<tbody>
										{#each questions as question}
											<tr>
												<td class="max-w-md">
													<p class="truncate">{question.content}</p>
												</td>
												<td>
													<span class={`badge ${getTypeColor(question.type)}`}>
														{getTypeLabel(question.type)}
													</span>
												</td>
												<td>
													<div class="flex gap-0.5">
														{#each { length: 5 } as _, i}
															<span
																class={`w-2 h-2 rounded-full ${i < question.difficulty ? 'bg-yellow-500' : 'bg-gray-200'}`}
															></span>
														{/each}
													</div>
												</td>
												<td>{question.score}分</td>
												<td>
													<div class="flex flex-wrap gap-1">
														{#each question.tags || [] as tagRel}
															<span
																class="px-2 py-0.5 rounded text-xs text-white"
																style={`background-color: ${tagRel.tag?.color || '#3b82f6'}`}
															>
																{tagRel.tag?.name}
															</span>
														{/each}
													</div>
												</td>
												<td>
													<button class="text-primary-600 hover:text-primary-700 text-sm">
														练习
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
								{#if questions.length === 0}
									<div class="text-center py-12 text-gray-500">
										暂无题目数据
									</div>
								{/if}
							</div>
						</div>

					{:else if activeTab === 'progress'}
						<div class="space-y-4">
							{#if progressList.length === 0}
								<div class="text-center py-12 text-gray-500">
									暂无学习进度数据
								</div>
							{:else}
								{#each progressList as progress}
									<div class="p-4 bg-gray-50 rounded-lg">
										<div class="flex items-center justify-between mb-3">
											<div>
												<h3 class="font-medium text-gray-900">{progress.course?.title || '未知课程'}</h3>
												<p class="text-sm text-gray-500">{progress.course?.category || ''}</p>
											</div>
											<span class={`badge ${progress.isCompleted ? 'badge-success' : 'badge-primary'}`}>
												{progress.isCompleted ? '已完成' : '学习中'}
											</span>
										</div>
										<div class="flex items-center gap-4">
											<div class="flex-1">
												<div class="progress-bar h-3">
													<div class="progress-bar-fill" style={`width: ${progress.progressPercent}%`}></div>
												</div>
											</div>
											<span class="text-sm font-medium text-gray-700 w-16 text-right">
												{progress.progressPercent}%
											</span>
										</div>
										<div class="flex items-center gap-6 mt-3 text-sm text-gray-500">
											<span>已完成 {progress.completedQuestions || 0}/{progress.totalQuestions || 0} 题</span>
											<span>正确 {progress.correctQuestions || 0} 题</span>
											<span>学习时长 {Math.floor((progress.studyTimeSeconds || 0) / 60)} 分钟</span>
										</div>
									</div>
								{/each}
							{/if}
						</div>

					{:else if activeTab === 'scores'}
						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>考试名称</th>
										<th>课程</th>
										<th>得分</th>
										<th>状态</th>
										<th>用时</th>
										<th>考试时间</th>
										<th>操作</th>
									</tr>
								</thead>
								<tbody>
									{#each examScores as score}
										<tr>
											<td class="font-medium">{score.examName}</td>
											<td>{score.course?.title || '-'}</td>
											<td>
												<span class="font-semibold">{score.score}</span>
												<span class="text-gray-400">/{score.totalScore}</span>
											</td>
											<td>
												<span class={`badge ${getStatusBadge(score.isPassed)}`}>
													{getStatusLabel(score.isPassed)}
												</span>
											</td>
											<td>{Math.floor((score.durationSeconds || 0) / 60)}分钟</td>
											<td>{score.finishedAt ? new Date(score.finishedAt).toLocaleDateString() : '-'}</td>
											<td>
												<button class="text-primary-600 hover:text-primary-700 text-sm">
													查看详情
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
							{#if examScores.length === 0}
								<div class="text-center py-12 text-gray-500">
									暂无考试成绩
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="w-72 flex-shrink-0 space-y-6">
			<div class="card p-4">
				<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
					</svg>
					提醒规则
				</h3>
				<div class="space-y-2">
					{#each reminderRules as rule}
						<div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
							<div class="flex items-center gap-2">
								<div class={`w-2 h-2 rounded-full ${rule.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
								<span class="text-sm text-gray-700">{rule.name}</span>
							</div>
						</div>
					{/each}
					{#if reminderRules.length === 0}
						<p class="text-sm text-gray-400 text-center py-2">暂无提醒规则</p>
					{/if}
				</div>
			</div>

			<div class="card p-4">
				<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					课程章节留痕
				</h3>
				<div class="space-y-3">
					{#each chapterTraces as trace}
						<div class="p-2 bg-gray-50 rounded-lg">
							<p class="text-sm font-medium text-gray-900">{trace.chapter?.title || '未知章节'}</p>
							<p class="text-xs text-gray-500">{trace.actionType}</p>
							<p class="text-xs text-gray-400 mt-1">
								{trace.createdAt ? new Date(trace.createdAt).toLocaleString() : ''}
							</p>
						</div>
					{/each}
					{#if chapterTraces.length === 0}
						<p class="text-sm text-gray-400 text-center py-2">暂无学习记录</p>
					{/if}
				</div>
			</div>

			<div class="card p-4">
				<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
					</svg>
					常用筛选
				</h3>
				<div class="space-y-2">
					{#each savedFilters as filter}
						<button class="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 flex items-center gap-2">
							<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
							</svg>
							{filter.name}
							{#if filter.isDefault}
								<span class="badge badge-primary ml-auto">默认</span>
							{/if}
						</button>
					{/each}
					{#if savedFilters.length === 0}
						<p class="text-sm text-gray-400 text-center py-2">暂无保存的筛选</p>
					{/if}
					<button class="w-full text-left p-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm flex items-center gap-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						保存当前筛选
					</button>
				</div>
			</div>
		</div>
	</div>
</AppLayout>

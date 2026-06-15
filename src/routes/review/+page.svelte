<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';

	interface LaggingStudent {
		studentId: string;
		name: string;
		completionRate: number;
		averageScore: number;
		lagDays: number;
	}

	interface ReviewData {
		period: string;
		completionRate: number;
		averageScore: number;
		weakTags: string[];
		laggingStudents: LaggingStudent[];
		improvementSuggestions: string[];
		feedbackSummary: {
			total: number;
			positive: number;
			neutral: number;
			negative: number;
		};
	}

	let loading = $state(true);
	let reviewData: ReviewData | null = $state(null);
	let periodDays = $state(7);

	async function loadData() {
		loading = true;
		try {
			const res = await fetch(`/api/review?period=${periodDays}`);
			const data = await res.json();
			reviewData = data.data;
		} catch (e) {
			console.error('加载数据失败', e);
		} finally {
			loading = false;
		}
	}

	function changePeriod(days: number) {
		periodDays = days;
		loadData();
	}

	function exportReport() {
		if (!reviewData) return;

		const report = `
作业批改风险复盘报告
==================
周期: ${reviewData.period}

一、核心指标
------------
作业完成率: ${(reviewData.completionRate * 100).toFixed(1)}%
平均成绩: ${reviewData.averageScore.toFixed(1)} 分

二、薄弱知识点
--------------
${reviewData.weakTags.length > 0 ? reviewData.weakTags.map((t, i) => `${i + 1}. ${t}`).join('\n') : '暂无'}

三、进度落后学生
----------------
${reviewData.laggingStudents.length > 0
	? reviewData.laggingStudents
			.map(
				(s, i) =>
					`${i + 1}. ${s.name} (${s.studentId}) - 落后 ${s.lagDays} 天，完成率 ${(s.completionRate * 100).toFixed(1)}%，平均分 ${s.averageScore.toFixed(1)} 分`
			)
			.join('\n')
	: '暂无'}

四、家长反馈统计
----------------
总计: ${reviewData.feedbackSummary.total} 条
正面: ${reviewData.feedbackSummary.positive} 条
中性: ${reviewData.feedbackSummary.neutral} 条
负面: ${reviewData.feedbackSummary.negative} 条

五、改进建议
------------
${reviewData.improvementSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

-- 报告生成时间: ${new Date().toLocaleString('zh-CN')} --
		`.trim();

		const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `复盘报告_${periodDays}天.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">复盘材料</h2>
			<p class="text-gray-500 mt-1">围绕作业完成率自动生成复盘材料</p>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex bg-gray-100 rounded-lg p-1">
				{#each [7, 14, 30] as d}
					<button
						onclick={() => changePeriod(d)}
						class="px-3 py-1.5 text-sm rounded-md transition-colors
							{periodDays === d ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
					>
						{d}天
					</button>
				{/each}
			</div>
			<button
				onclick={loadData}
				class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
			>
				🔄 刷新
			</button>
			<button
				onclick={exportReport}
				class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
			>
				📥 导出报告
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<div class="text-4xl mb-4">⏳</div>
				<p class="text-gray-500">正在生成复盘材料...</p>
			</div>
		</div>
	{:else if reviewData}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<StatCard
				title="作业完成率"
				value="{(reviewData.completionRate * 100).toFixed(1)}%"
				subtitle={reviewData.period}
				icon="📊"
				color={reviewData.completionRate < 0.6 ? 'red' : reviewData.completionRate < 0.8 ? 'yellow' : 'green'}
			/>
			<StatCard
				title="平均成绩"
				value="{reviewData.averageScore.toFixed(1)}分"
				subtitle={reviewData.period}
				icon="📈"
				color={reviewData.averageScore < 60 ? 'red' : reviewData.averageScore < 75 ? 'yellow' : 'green'}
			/>
			<StatCard
				title="薄弱知识点"
				value={reviewData.weakTags.length}
				subtitle="需要加强"
				icon="🏷️"
				color={reviewData.weakTags.length > 3 ? 'red' : reviewData.weakTags.length > 0 ? 'yellow' : 'green'}
			/>
			<StatCard
				title="落后学生"
				value={reviewData.laggingStudents.length}
				subtitle="需重点关注"
				icon="⚠️"
				color={reviewData.laggingStudents.length > 3 ? 'red' : reviewData.laggingStudents.length > 0 ? 'yellow' : 'green'}
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="bg-white rounded-lg shadow-sm p-6">
				<h3 class="text-lg font-medium mb-4 flex items-center gap-2">
					<span>🏷️</span>
					<span>薄弱知识点</span>
				</h3>
				{#if reviewData.weakTags.length === 0}
					<p class="text-gray-500 text-center py-8">暂无薄弱知识点，表现良好！</p>
				{:else}
					<div class="flex flex-wrap gap-2">
						{#each reviewData.weakTags as tag (tag)}
							<span class="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm">
								<span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
								{tag}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-white rounded-lg shadow-sm p-6">
				<h3 class="text-lg font-medium mb-4 flex items-center gap-2">
					<span>💬</span>
					<span>家长反馈统计</span>
				</h3>
				<div class="grid grid-cols-4 gap-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-700">{reviewData.feedbackSummary.total}</div>
						<div class="text-sm text-gray-500">总计</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-600">{reviewData.feedbackSummary.positive}</div>
						<div class="text-sm text-gray-500">正面</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-500">{reviewData.feedbackSummary.neutral}</div>
						<div class="text-sm text-gray-500">中性</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-red-600">{reviewData.feedbackSummary.negative}</div>
						<div class="text-sm text-gray-500">负面</div>
					</div>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm overflow-hidden">
			<div class="p-4 border-b">
				<h3 class="text-lg font-medium flex items-center gap-2">
					<span>⏰</span>
					<span>进度落后学生</span>
				</h3>
			</div>
			{#if reviewData.laggingStudents.length === 0}
				<p class="text-gray-500 text-center py-8">暂无进度落后的学生</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-sm font-medium text-gray-600">学生</th>
								<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">落后天数</th>
								<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">完成率</th>
								<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">平均分</th>
								<th class="px-4 py-3 text-center text-sm font-medium text-gray-600">风险等级</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each reviewData.laggingStudents as student (student.studentId)}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3">
										<div class="font-medium">{student.name}</div>
										<div class="text-xs text-gray-500">{student.studentId}</div>
									</td>
									<td class="px-4 py-3 text-right">
										<span class="text-red-600 font-medium">{student.lagDays} 天</span>
									</td>
									<td class="px-4 py-3 text-right">
										{(student.completionRate * 100).toFixed(1)}%
									</td>
									<td class="px-4 py-3 text-right">
										{student.averageScore.toFixed(1)} 分
									</td>
									<td class="px-4 py-3 text-center">
										<span
											class="inline-flex px-2 py-1 rounded-full text-xs font-medium
												{student.lagDays > 7
													? 'bg-red-100 text-red-700'
													: student.lagDays > 3
														? 'bg-yellow-100 text-yellow-700'
														: 'bg-green-100 text-green-700'}"
										>
											{student.lagDays > 7 ? '高风险' : student.lagDays > 3 ? '中风险' : '低风险'}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<div class="bg-white rounded-lg shadow-sm p-6">
			<h3 class="text-lg font-medium mb-4 flex items-center gap-2">
				<span>💡</span>
				<span>改进建议</span>
			</h3>
			<div class="space-y-3">
				{#each reviewData.improvementSuggestions as suggestion, index (index)}
					<div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
						<span
							class="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium"
						>
							{index + 1}
						</span>
						<p class="text-gray-700">{suggestion}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

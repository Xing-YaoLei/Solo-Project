<script lang="ts">
	import { onMount } from 'svelte';
	import ScoreChart from '$lib/components/ScoreChart.svelte';
	import type { ScoreItem } from '$lib/components/ScoreChart.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import type { EChartsOption } from 'echarts';

	interface FeedbackItem {
		id: number;
		student_id: string;
		feedback_date: string;
		feedback_type: string;
		content: string;
		sentiment: string;
		source: string;
	}

	interface FeedbackStats {
		total: number;
		positive: number;
		neutral: number;
		negative: number;
	}

	let loading = $state(true);
	let scoreData: ScoreItem[] = $state([]);
	let feedbackList: FeedbackItem[] = $state([]);
	let feedbackStats: FeedbackStats = $state({ total: 0, positive: 0, neutral: 0, negative: 0 });

	const feedbackPieOption = $derived<EChartsOption>({
		title: {
			text: '家长反馈情绪分布',
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 'normal' }
		},
		tooltip: {
			trigger: 'item',
			formatter: '{b}: {c}条 ({d}%)'
		},
		legend: {
			orient: 'vertical',
			left: 'left',
			top: 'center'
		},
		series: [
			{
				name: '反馈情绪',
				type: 'pie',
				radius: ['40%', '70%'],
				center: ['60%', '55%'],
				itemStyle: {
					borderRadius: 8,
					borderColor: '#fff',
					borderWidth: 2
				},
				label: {
					show: true,
					formatter: '{b}: {d}%'
				},
				data: [
					{ value: feedbackStats.positive, name: '正面', itemStyle: { color: '#22c55e' } },
					{ value: feedbackStats.neutral, name: '中性', itemStyle: { color: '#94a3b8' } },
					{ value: feedbackStats.negative, name: '负面', itemStyle: { color: '#ef4444' } }
				]
			}
		]
	});

	const scoreTrendOption = $derived<EChartsOption>({
		title: {
			text: '分数段人数分布',
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 'normal' }
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: unknown) => {
				const p = params as Array<{ name: string; value: number; seriesName: string }>;
				if (!p.length) return '';
				const item = scoreData.find((d) => d.range + '分' === p[0].name);
				if (!item) return p[0].name;
				return `${item.range}分<br/>人数: ${item.count} 人<br/>占比: ${(item.percentage * 100).toFixed(1)}%`;
			}
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			top: '60px',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: scoreData.map((d) => d.range + '分')
		},
		yAxis: {
			type: 'value',
			name: '人数'
		},
		series: [
			{
				name: '人数',
				type: 'bar',
				data: scoreData.map((d, i) => ({
					value: d.count,
					itemStyle: {
						color: getScoreColor(i)
					}
				})),
				barWidth: '50%',
				label: {
					show: true,
					position: 'top',
					formatter: '{c}人'
				}
			}
		]
	});

	function getScoreColor(index: number): string {
		const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
		return colors[index % colors.length];
	}

	async function loadData() {
		loading = true;
		try {
			const [scoresRes, feedbackRes] = await Promise.all([
				fetch('/api/analysis/scores'),
				fetch('/api/analysis/alerts')
			]);

			const scoresData = await scoresRes.json();
			scoreData = scoresData.data || [];

			feedbackStats = {
				total: 15,
				positive: 7,
				neutral: 5,
				negative: 3
			};

			feedbackList = [
				{
					id: 1,
					student_id: 'S0001',
					feedback_date: '2024-01-15',
					feedback_type: '作业',
					content: '孩子最近进步很大，感谢老师的耐心教导',
					sentiment: 'positive',
					source: 'wechat'
				},
				{
					id: 2,
					student_id: 'S0003',
					feedback_date: '2024-01-14',
					feedback_type: '课程',
					content: '孩子说听不懂，跟不上进度',
					sentiment: 'negative',
					source: 'phone'
				},
				{
					id: 3,
					student_id: 'S0005',
					feedback_date: '2024-01-13',
					feedback_type: '作业',
					content: '作业批改很仔细，孩子学到了很多',
					sentiment: 'positive',
					source: 'wechat'
				},
				{
					id: 4,
					student_id: 'S0007',
					feedback_date: '2024-01-12',
					feedback_type: '考试',
					content: '最近成绩下降明显，很担心',
					sentiment: 'negative',
					source: 'meeting'
				},
				{
					id: 5,
					student_id: 'S0009',
					feedback_date: '2024-01-11',
					feedback_type: '作业',
					content: '作业难度适中',
					sentiment: 'neutral',
					source: 'wechat'
				}
			];
		} catch (e) {
			console.error('加载数据失败', e);
		} finally {
			loading = false;
		}
	}

	function getSentimentLabel(sentiment: string): string {
		switch (sentiment) {
			case 'positive':
				return '正面';
			case 'negative':
				return '负面';
			default:
				return '中性';
		}
	}

	function getSentimentClass(sentiment: string): string {
		switch (sentiment) {
			case 'positive':
				return 'bg-green-100 text-green-700';
			case 'negative':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getSourceLabel(source: string): string {
		switch (source) {
			case 'wechat':
				return '微信';
			case 'phone':
				return '电话';
			case 'meeting':
				return '家长会';
			default:
				return source;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">成绩反馈分析</h2>
			<p class="text-gray-500 mt-1">综合分析学生成绩分布与家长反馈</p>
		</div>
		<button
			onclick={loadData}
			class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
		>
			🔄 刷新
		</button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<div class="text-4xl mb-4">⏳</div>
				<p class="text-gray-500">正在加载数据...</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<StatCard
				title="平均分"
				value="72.5分"
				subtitle="整体表现"
				icon="📊"
				color="blue"
			/>
			<StatCard
				title="优秀率"
				value="23.5%"
				subtitle="90分以上"
				icon="🏆"
				color="green"
			/>
			<StatCard
				title="及格率"
				value="68.2%"
				subtitle="60分以上"
				icon="✅"
				color="yellow"
			/>
			<StatCard
				title="家长满意度"
				value="{feedbackStats.total > 0 ? ((feedbackStats.positive / feedbackStats.total) * 100).toFixed(0) : 0}%"
				subtitle="正面反馈占比"
				icon="😊"
				color={feedbackStats.total > 0 && feedbackStats.positive / feedbackStats.total > 0.5 ? 'green' : 'yellow'}
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="bg-white rounded-lg shadow-sm p-4">
				<Chart option={scoreTrendOption} height="380px" />
			</div>
			<ScoreChart data={scoreData} title="成绩分布饼图" />
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="bg-white rounded-lg shadow-sm p-4">
				<Chart option={feedbackPieOption} height="380px" />
			</div>

			<div class="bg-white rounded-lg shadow-sm overflow-hidden">
				<div class="p-4 border-b">
					<h3 class="text-lg font-medium">最新家长反馈</h3>
				</div>
				<div class="divide-y max-h-96 overflow-y-auto">
					{#each feedbackList as item (item.id)}
						<div class="p-4 hover:bg-gray-50">
							<div class="flex items-start justify-between mb-2">
								<div class="flex items-center gap-2">
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {getSentimentClass(item.sentiment)}">
										{getSentimentLabel(item.sentiment)}
									</span>
									<span class="text-xs text-gray-500">{item.feedback_type}</span>
								</div>
								<span class="text-xs text-gray-400">{item.feedback_date}</span>
							</div>
							<p class="text-sm text-gray-700 mb-2">{item.content}</p>
							<div class="flex items-center gap-2 text-xs text-gray-500">
								<span>学生: {item.student_id}</span>
								<span>·</span>
								<span>来源: {getSourceLabel(item.source)}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

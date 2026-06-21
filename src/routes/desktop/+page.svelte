<script lang="ts">
	const stats = [
		{
			label: '项目总数',
			value: '28',
			change: '+3',
			trend: 'up',
			icon: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>`,
			color: 'bg-blue-500'
		},
		{
			label: '进行中变更单',
			value: '15',
			change: '+5',
			trend: 'up',
			icon: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`,
			color: 'bg-amber-500'
		},
		{
			label: '待验收',
			value: '8',
			change: '-2',
			trend: 'down',
			icon: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z" /></svg>`,
			color: 'bg-green-500'
		},
		{
			label: '售后工单',
			value: '6',
			change: '+1',
			trend: 'up',
			icon: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>`,
			color: 'bg-red-500'
		}
	];

	const chartData = [
		{ name: '项目A', planned: 90, actual: 95 },
		{ name: '项目B', planned: 120, actual: 110 },
		{ name: '项目C', planned: 60, actual: 75 },
		{ name: '项目D', planned: 150, actual: 160 },
		{ name: '项目E', planned: 80, actual: 85 },
		{ name: '项目F', planned: 100, actual: 90 }
	];

	const maxValue = $derived(Math.max(...chartData.flatMap((d) => [d.planned, d.actual])));

	const activities = [
		{ id: 1, type: 'change_order', title: 'CO-001 已提交审批', time: '10分钟前', user: '张三' },
		{ id: 2, type: 'acceptance', title: '项目A水电验收照片已上传', time: '30分钟前', user: '李四' },
		{ id: 3, type: 'worker', title: '工人签到: 王五已签到', time: '1小时前', user: '系统' },
		{ id: 4, type: 'material', title: '材料延期: 瓷砖预计延期3天', time: '2小时前', user: '供应商' },
		{ id: 5, type: 'change_order', title: 'CO-002 已批准', time: '3小时前', user: '赵六' }
	];

	const todos = [
		{ id: 1, title: '审批 CO-001 设计变更', priority: 'high', due: '今天' },
		{ id: 2, title: '验收 项目B 泥木阶段', priority: 'medium', due: '今天' },
		{ id: 3, title: '分配 售后工单 AS-003', priority: 'high', due: '明天' },
		{ id: 4, title: '审核 工人考勤报表', priority: 'low', due: '本周' },
		{ id: 5, title: '跟进 材料延期 MD-002', priority: 'medium', due: '本周' }
	];

	function getActivityIcon(type: string) {
		switch (type) {
			case 'change_order':
				return 'bg-blue-100 text-blue-600';
			case 'acceptance':
				return 'bg-green-100 text-green-600';
			case 'worker':
				return 'bg-purple-100 text-purple-600';
			case 'material':
				return 'bg-amber-100 text-amber-600';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function getPriorityClass(priority: string) {
		switch (priority) {
			case 'high':
				return 'bg-red-100 text-red-700';
			case 'medium':
				return 'bg-yellow-100 text-yellow-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getPriorityLabel(priority: string) {
		switch (priority) {
			case 'high':
				return '高';
			case 'medium':
				return '中';
			default:
				return '低';
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
		<p class="mt-1 text-sm text-gray-500">欢迎回来，这是您今天的工作概览</p>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat}
			<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500">{stat.label}</p>
						<p class="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-lg {stat.color} text-white">
						{@html stat.icon}
					</div>
				</div>
				<div class="mt-4 flex items-center text-sm">
					<span
						class="{stat.trend === 'up'
							? 'text-green-600'
							: 'text-red-600'}"
					>
						{stat.trend === 'up' ? '↑' : '↓'} {stat.change}
					</span>
					<span class="ml-2 text-gray-500">较上周</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 lg:col-span-2">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">工期偏差分析</h2>
				<a href="/desktop/analytics" class="text-sm text-primary-600 hover:text-primary-500">查看详情 →</a>
			</div>
			<div class="mt-6">
				<div class="flex items-center justify-center gap-4 text-sm">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded bg-blue-500" />
						<span class="text-gray-600">计划工期</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded bg-amber-500" />
						<span class="text-gray-600">实际工期</span>
					</div>
				</div>
				<div class="mt-4 flex items-end justify-between gap-4 h-64 px-4">
					{#each chartData as item}
						<div class="flex flex-1 flex-col items-center gap-2">
							<div class="flex w-full items-end justify-center gap-1 h-48">
								<div
									class="w-8 bg-blue-500 rounded-t transition-all"
									style="height: {(item.planned / maxValue) * 100}%"
								/>
								<div
									class="w-8 bg-amber-500 rounded-t transition-all"
									style="height: {(item.actual / maxValue) * 100}%"
								/>
							</div>
							<span class="text-xs text-gray-500">{item.name}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<h2 class="text-lg font-semibold text-gray-900">最近活动</h2>
			<div class="mt-6 space-y-4">
				{#each activities as activity}
					<div class="flex gap-3">
						<div class="relative">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full {getActivityIcon(activity.type)}"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
								</svg>
							</div>
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-gray-900">{activity.title}</p>
							<p class="mt-1 text-xs text-gray-500">{activity.user} · {activity.time}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">待办事项</h2>
			<button class="text-sm text-primary-600 hover:text-primary-500">查看全部 →</button>
		</div>
		<div class="mt-4 overflow-hidden">
			<ul class="divide-y divide-gray-200">
				{#each todos as todo}
					<li class="flex items-center justify-between py-4">
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
							/>
							<span class="text-sm font-medium text-gray-900">{todo.title}</span>
						</div>
						<div class="flex items-center gap-4">
							<span
								class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getPriorityClass(todo.priority)}"
							>
								{getPriorityLabel(todo.priority)}
							</span>
							<span class="text-xs text-gray-500">{todo.due}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

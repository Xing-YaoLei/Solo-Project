<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate, formatDateTime,
		getAnomalyTypeLabel, getAnomalyStatusLabel, getImpactLevelLabel,
		getPropertyTypeLabel, getPropertyStatusLabel, getPropertyStatusBadge,
		downloadBase64File
	} from '$lib/utils';

	let loading = false;
	let startDate: string = '';
	let endDate: string = '';

	let summary: any = null;
	let cleanerPerf: any[] = [];
	let propertyStats: any[] = [];
	let anomalyStats: any = null;

	let exportLoading: Record<string, boolean> = {};
	let currentUser: any = null;

	function initDefaultDates() {
		const today = new Date();
		const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
		startDate = formatDate(firstDay);
		endDate = formatDate(today);
	}

	async function loadCurrentUser() {
		currentUser = await trpc().user.getCurrent.query();
	}

	async function loadAllData() {
		if (!startDate || !endDate) return;
		loading = true;
		try {
			const s = new Date(startDate);
			const e = new Date(endDate);
			e.setHours(23, 59, 59, 999);

			[summary, cleanerPerf, propertyStats, anomalyStats] = await Promise.all([
				trpc().report.getSummary.query({ startDate: s, endDate: e }),
				trpc().report.getCleanerPerformance.query({ startDate: s, endDate: e }),
				trpc().report.getPropertyStats.query({ startDate: s, endDate: e }),
				trpc().report.getAnomalyStats.query({ startDate: s, endDate: e })
			]);
		} finally {
			loading = false;
		}
	}

	async function handleQuery() {
		if (!startDate || !endDate) {
			alert('请选择日期范围');
			return;
		}
		if (new Date(startDate) > new Date(endDate)) {
			alert('开始日期不能大于结束日期');
			return;
		}
		await loadAllData();
	}

	function setQuickRange(days: number) {
		const today = new Date();
		endDate = formatDate(today);
		const start = new Date(today);
		start.setDate(today.getDate() - days + 1);
		startDate = formatDate(start);
	}

	async function handleExport(reportType: 'tasks' | 'cleaner_performance' | 'property_stats' | 'anomalies' | 'complaints') {
		if (!startDate || !endDate) {
			alert('请先选择日期范围并查询');
			return;
		}
		exportLoading[reportType] = true;
		try {
			const result = await trpc().report.exportReport.mutate({
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				reportType
			});
			downloadBase64File(result.base64, result.filename);
			alert(`导出成功！共 ${result.rowCount} 条数据\n\n导出的文件包含两个 Sheet：\n1. 数据 - 报表数据\n2. 口径说明 - 各指标的统计口径定义`);
		} catch (e: any) {
			alert(e.message || '导出失败');
		} finally {
			exportLoading[reportType] = false;
		}
	}

	function getOnTimeColor(rate: number) {
		if (rate >= 95) return 'green';
		if (rate >= 85) return 'yellow';
		return 'red';
	}

	function getOnTimeBgColor(rate: number) {
		if (rate >= 95) return '#10b981';
		if (rate >= 85) return '#f59e0b';
		return '#ef4444';
	}

	onMount(async () => {
		initDefaultDates();
		await loadCurrentUser();
		await loadAllData();
	});

	const canExport = currentUser?.role === 'admin' || currentUser?.role === 'manager';
</script>

<div class="p-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">统计报表</h1>
		<p class="text-gray-500 mt-1">运营数据统计 · 多维度绩效分析 · 报表导出</p>
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="flex flex-col md:flex-row md:items-end gap-4">
				<div class="flex items-center gap-3 flex-wrap">
					<span class="text-sm text-gray-600 font-medium">快捷筛选：</span>
					<button on:click={() => { setQuickRange(7); }} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition">近7天</button>
					<button on:click={() => { setQuickRange(30); }} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition">近30天</button>
					<button on:click={() => {
						const today = new Date();
						startDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
						endDate = formatDate(today);
					}} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition">本月</button>
					<button on:click={() => {
						const today = new Date();
						const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
						const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
						startDate = formatDate(lastMonth);
						endDate = formatDate(lastMonthEnd);
					}} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition">上月</button>
				</div>
			</div>
			<div class="mt-4 flex flex-col md:flex-row md:items-end gap-4">
				<div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
					<div>
						<label class="label">开始日期</label>
						<input type="date" bind:value={startDate} class="input" />
					</div>
					<div>
						<label class="label">结束日期</label>
						<input type="date" bind:value={endDate} class="input" />
					</div>
					<div class="flex items-end gap-2">
						<button on:click={handleQuery} disabled={loading} class="btn-primary flex-1">
							{#if loading}查询中...{:else}📊 查询统计{/if}
						</button>
					</div>
				</div>
				<div class="md:ml-auto flex items-center gap-2 text-sm text-gray-500">
					{#if startDate && endDate}
						<span>统计周期：<span class="font-medium text-gray-700">{startDate}</span> 至 <span class="font-medium text-gray-700">{endDate}</span></span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="card card-body text-center py-20 text-gray-500">加载统计数据中...</div>
	{:else if !summary}
		<div class="card card-body text-center py-20 text-gray-400">
			<div class="text-5xl mb-4">📊</div>
			<p>选择日期范围后点击「查询统计」</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">总任务数</p>
						<p class="text-3xl font-bold text-gray-900">{summary.summary.totalTasks}</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>已完成</span>
								<span class="text-green-600 font-medium">{summary.summary.completedTasks}</span>
							</div>
							<div class="flex justify-between">
								<span>进行中</span>
								<span class="text-yellow-600 font-medium">{summary.summary.inProgressTasks}</span>
							</div>
							<div class="flex justify-between">
								<span>已取消</span>
								<span class="text-gray-500 font-medium">{summary.summary.cancelledTasks}</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">🧹</div>
				</div>
			</div>

			<div class="card card-body relative overflow-hidden">
				<div class="absolute top-0 right-0 w-32 h-32 opacity-5">
					<div class="w-full h-full rounded-full border-8 border-{getOnTimeColor(summary.summary.onTimeRate)}-500"></div>
				</div>
				<div class="relative">
					<div class="flex items-start justify-between">
						<div>
							<p class="text-sm text-gray-500 mb-1">保洁准时率</p>
							<p class="text-3xl font-bold text-{getOnTimeColor(summary.summary.onTimeRate)}-600">
								{summary.summary.onTimeRate}%
							</p>
						</div>
						<div class="w-12 h-12 rounded-xl bg-{getOnTimeColor(summary.summary.onTimeRate)}-50 flex items-center justify-center text-2xl">⏱️</div>
					</div>
					<div class="mt-4">
						<div class="flex justify-between text-xs text-gray-500 mb-1">
							<span>准时完成 {summary.summary.onTimeCompleted} / {summary.summary.completedTasks}</span>
							<span>{summary.summary.onTimeRate}%</span>
						</div>
						<div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
							<div class="h-full rounded-full transition-all duration-500"
								style="width: {summary.summary.onTimeRate}%; background-color: {getOnTimeBgColor(summary.summary.onTimeRate)};"></div>
						</div>
					</div>
					<div class="mt-3 grid grid-cols-3 gap-2 text-xs">
						<div class="bg-gray-50 rounded p-2 text-center">
							<div class="text-gray-500">准时</div>
							<div class="font-semibold text-green-600">{summary.summary.onTimeCompleted}</div>
						</div>
						<div class="bg-gray-50 rounded p-2 text-center">
							<div class="text-gray-500">漏单</div>
							<div class="font-semibold text-red-600">{summary.summary.missedTasks}</div>
						</div>
						<div class="bg-gray-50 rounded p-2 text-center">
							<div class="text-gray-500">待验收</div>
							<div class="font-semibold text-blue-600">{summary.summary.completedTasks - summary.summary.verifiedTasks}</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">完成率</p>
						<p class="text-3xl font-bold text-gray-900">{summary.summary.completionRate}%</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>已验收</span>
								<span class="text-green-600 font-medium">{summary.summary.verifiedTasks}</span>
							</div>
							<div class="flex justify-between">
								<span>待分配</span>
								<span class="text-gray-500 font-medium">{summary.summary.pendingTasks}</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">✅</div>
				</div>
				<div class="mt-4">
					<div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
						<div class="h-full bg-purple-500 rounded-full transition-all" style="width: {summary.summary.completionRate}%;"></div>
					</div>
				</div>
			</div>

			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">平均质量分</p>
						<p class="text-3xl font-bold text-gray-900">{summary.summary.avgQualityScore || '-'}</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>异常单数</span>
								<span class="text-red-600 font-medium">{anomalyStats?.total || 0}</span>
							</div>
							<div class="flex justify-between">
								<span>待处理</span>
								<span class="text-orange-600 font-medium">{anomalyStats?.pending || 0}</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-2xl">⭐</div>
				</div>
				<div class="mt-4">
					{#if summary.summary.avgQualityScore}
						<div class="flex gap-0.5">
							{#each {length: 5} as _, i}
								<span class="text-xl">
									{summary.summary.avgQualityScore >= (i + 1) * 20 ? '⭐' : '☆'}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="card mb-6">
			<div class="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<div>
					<h2 class="font-semibold text-gray-900">👥 保洁员绩效</h2>
					<p class="text-xs text-gray-500 mt-0.5">按准时率排序，统计周期内的任务表现</p>
				</div>
				{#if canExport}
					<button on:click={() => handleExport('cleaner_performance')} disabled={exportLoading['cleaner_performance']} class="btn-secondary text-sm inline-flex items-center gap-2">
						{#if exportLoading['cleaner_performance']}
							<span class="animate-spin">⏳</span> 导出中...
						{:else}
							📥 导出报表 (含口径说明)
						{/if}
					</button>
				{/if}
			</div>
			{#if cleanerPerf.length === 0}
				<div class="card-body text-center py-12 text-gray-400 text-sm">暂无保洁员绩效数据</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>排名</th>
								<th>保洁员</th>
								<th>总任务</th>
								<th>已完成</th>
								<th>准时完成</th>
								<th>漏单</th>
								<th>准时率</th>
								<th>完成率</th>
								<th>平均质量分</th>
							</tr>
						</thead>
						<tbody>
							{#each cleanerPerf as p, i}
								<tr class="hover:bg-gray-50">
									<td>
										<span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
											{i === 0 ? 'bg-yellow-100 text-yellow-800' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}">
											{i + 1}
										</span>
									</td>
									<td>
										<div class="flex items-center">
											<div class="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
												{p.cleaner.realName?.charAt(0)}
											</div>
											<div class="ml-3">
												<p class="font-medium">{p.cleaner.realName}</p>
												<p class="text-xs text-gray-500">{p.cleaner.phone || '-'}</p>
											</div>
										</div>
									</td>
									<td class="font-medium">{p.total}</td>
									<td class="text-green-600">{p.completed}</td>
									<td class="text-blue-600">{p.onTime}</td>
									<td class="text-red-600">{p.missed}</td>
									<td>
										<div class="flex items-center gap-2">
											<div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div class="h-full rounded-full" style="width: {p.onTimeRate}%; background-color: {getOnTimeBgColor(p.onTimeRate)};"></div>
											</div>
											<span class="font-semibold text-{getOnTimeColor(p.onTimeRate)}-600 text-sm w-12">{p.onTimeRate}%</span>
										</div>
									</td>
									<td>
										<span class="font-medium">{p.completionRate}%</span>
									</td>
									<td>
										<span class="font-semibold {p.avgQualityScore >= 90 ? 'text-green-600' : p.avgQualityScore >= 80 ? 'text-yellow-600' : 'text-red-600'}">
											{p.avgQualityScore || '-'}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="card-body border-t bg-gray-50">
					<div class="flex flex-wrap gap-6 text-xs text-gray-500">
						<div><span class="font-medium">口径说明：</span></div>
						<div>• 准时率 = 准时完成数 / 已完成数 × 100%</div>
						<div>• 完成率 = 已完成数 / 总任务数 × 100%</div>
						<div>• 质量分为验收评分算术平均</div>
						<div>• 导出 Excel 将包含完整口径说明 Sheet</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<div class="card">
				<div class="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<div>
						<h2 class="font-semibold text-gray-900">🏠 房源统计</h2>
						<p class="text-xs text-gray-500 mt-0.5">各房源保洁任务、预订、客诉、异常情况</p>
					</div>
					{#if canExport}
						<button on:click={() => handleExport('property_stats')} disabled={exportLoading['property_stats']} class="btn-secondary text-sm inline-flex items-center gap-2">
							{#if exportLoading['property_stats']}
								<span class="animate-spin">⏳</span> 导出中...
							{:else}
								📥 导出
							{/if}
						</button>
					{/if}
				</div>
				{#if propertyStats.length === 0}
					<div class="card-body text-center py-12 text-gray-400 text-sm">暂无房源统计数据</div>
				{:else}
					<div class="overflow-x-auto max-h-96">
						<table class="table">
							<thead class="sticky top-0">
								<tr>
									<th>房源</th>
									<th>任务</th>
									<th>准时率</th>
									<th>预订</th>
									<th>客诉</th>
									<th>异常</th>
								</tr>
							</thead>
							<tbody>
								{#each propertyStats as ps}
									<tr class="hover:bg-gray-50">
										<td>
											<div>
												<p class="font-medium">{ps.property.name}</p>
												<p class="text-xs text-gray-500">{getPropertyTypeLabel(ps.property.type)} · <span class="badge badge-{getPropertyStatusBadge(ps.property.status)}">{getPropertyStatusLabel(ps.property.status)}</span></p>
											</div>
										</td>
										<td>
											<span class="font-medium">{ps.tasks}</span>
											<span class="text-xs text-gray-400 ml-1">({ps.completedTasks}完成)</span>
										</td>
										<td>
											<span class="font-semibold text-{getOnTimeColor(ps.onTimeRate)}-600">{ps.onTimeRate}%</span>
										</td>
										<td><span class="font-medium">{ps.bookings}</span></td>
										<td>
											<span class="font-medium {ps.complaints > 0 ? 'text-orange-600' : ''}">{ps.complaints}</span>
										</td>
										<td>
											<span class="font-medium {ps.anomalies > 0 ? 'text-red-600' : ''}">{ps.anomalies}</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<div class="card">
				<div class="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<div>
						<h2 class="font-semibold text-gray-900">⚠️ 异常统计</h2>
						<p class="text-xs text-gray-500 mt-0.5">异常单分布 · 状态 · 赔偿金额</p>
					</div>
					{#if canExport}
						<button on:click={() => handleExport('anomalies')} disabled={exportLoading['anomalies']} class="btn-secondary text-sm inline-flex items-center gap-2">
							{#if exportLoading['anomalies']}
								<span class="animate-spin">⏳</span> 导出中...
							{:else}
								📥 导出
							{/if}
						</button>
					{/if}
				</div>
				{#if !anomalyStats || anomalyStats.total === 0}
					<div class="card-body text-center py-12 text-gray-400 text-sm">暂无异常统计数据 🎉</div>
				{:else}
					<div class="card-body space-y-5">
						<div class="grid grid-cols-5 gap-3">
							<div class="text-center p-3 bg-gray-50 rounded-lg">
								<div class="text-2xl font-bold text-gray-900">{anomalyStats.total}</div>
								<div class="text-xs text-gray-500 mt-1">总计</div>
							</div>
							<div class="text-center p-3 bg-red-50 rounded-lg">
								<div class="text-2xl font-bold text-red-600">{anomalyStats.pending}</div>
								<div class="text-xs text-gray-500 mt-1">待处理</div>
							</div>
							<div class="text-center p-3 bg-yellow-50 rounded-lg">
								<div class="text-2xl font-bold text-yellow-600">{anomalyStats.handling}</div>
								<div class="text-xs text-gray-500 mt-1">处理中</div>
							</div>
							<div class="text-center p-3 bg-green-50 rounded-lg">
								<div class="text-2xl font-bold text-green-600">{anomalyStats.resolved}</div>
								<div class="text-xs text-gray-500 mt-1">已解决</div>
							</div>
							<div class="text-center p-3 bg-gray-100 rounded-lg">
								<div class="text-2xl font-bold text-gray-600">{anomalyStats.closed}</div>
								<div class="text-xs text-gray-500 mt-1">已关闭</div>
							</div>
						</div>

						<div class="border-t pt-5">
							<h3 class="text-sm font-medium text-gray-700 mb-3">按类型分布</h3>
							<div class="space-y-3">
								{#each Object.entries(anomalyStats.typeStats || {}) as [type, count]}
									<div class="flex items-center gap-3">
										<div class="w-24 text-sm text-gray-600">{getAnomalyTypeLabel(type)}</div>
										<div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
											<div class="h-full bg-red-400 rounded-full flex items-center justify-end pr-2"
												style="width: {anomalyStats.total > 0 ? (count / anomalyStats.total * 100) : 0}%; min-width: {count > 0 ? '40px' : '0'};">
												{#if count > 0}
													<span class="text-xs text-white font-medium">{count}</span>
												{/if}
											</div>
										</div>
										<div class="w-14 text-right text-xs text-gray-500">
											{anomalyStats.total > 0 ? Math.round(count / anomalyStats.total * 100) : 0}%
										</div>
									</div>
								{:else}
									<p class="text-sm text-gray-400">暂无数据</p>
								{/each}
							</div>
						</div>

						<div class="border-t pt-5">
							<h3 class="text-sm font-medium text-gray-700 mb-3">按影响程度分布</h3>
							<div class="flex gap-3 flex-wrap">
								{#each Object.entries(anomalyStats.impactStats || {}) as [level, count]}
									<div class="flex-1 min-w-[100px] p-3 bg-gray-50 rounded-lg text-center">
										<div class="text-lg font-bold text-gray-900">{count}</div>
										<div class="text-xs text-gray-500 mt-0.5">{getImpactLevelLabel(level)}影响</div>
									</div>
								{:else}
									<p class="text-sm text-gray-400">暂无数据</p>
								{/each}
							</div>
						</div>

						<div class="border-t pt-5">
							<div class="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
								<div>
									<div class="text-sm text-orange-700">累计赔偿金额</div>
									<div class="text-xs text-orange-600 mt-0.5">统计周期内所有异常单的赔偿总和</div>
								</div>
								<div class="text-3xl font-bold text-orange-600">
									¥{anomalyStats.totalCompensation?.toLocaleString() || 0}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<h2 class="font-semibold text-gray-900">📦 全部报表导出</h2>
				<p class="text-xs text-gray-500 mt-0.5">所有导出的 Excel 文件均包含「数据」和「口径说明」两个 Sheet，便于审计和数据解读</p>
			</div>
			<div class="card-body">
				{#if !canExport}
					<div class="text-center py-8 text-gray-500">
						<div class="text-4xl mb-2">🔒</div>
						<p>您的账户没有导出权限，请联系管理员</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<button on:click={() => handleExport('tasks')} disabled={exportLoading['tasks']} class="p-5 border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-lg transition-all text-left group disabled:opacity-50">
							<div class="text-3xl mb-2">🧹</div>
							<div class="font-semibold text-gray-900 group-hover:text-brand-700">保洁任务明细</div>
							<div class="text-xs text-gray-500 mt-1">任务列表、状态、时间、质量</div>
							<div class="mt-3 text-xs text-brand-600 font-medium">
								{#if exportLoading['tasks']}<span class="animate-spin inline-block">⏳</span> 导出中...{:else}点击导出 →{/if}
							</div>
						</button>

						<button on:click={() => handleExport('cleaner_performance')} disabled={exportLoading['cleaner_performance']} class="p-5 border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-lg transition-all text-left group disabled:opacity-50">
							<div class="text-3xl mb-2">👥</div>
							<div class="font-semibold text-gray-900 group-hover:text-brand-700">保洁员绩效</div>
							<div class="text-xs text-gray-500 mt-1">准时率、完成率、质量分</div>
							<div class="mt-3 text-xs text-brand-600 font-medium">
								{#if exportLoading['cleaner_performance']}<span class="animate-spin inline-block">⏳</span> 导出中...{:else}点击导出 →{/if}
							</div>
						</button>

						<button on:click={() => handleExport('property_stats')} disabled={exportLoading['property_stats']} class="p-5 border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-lg transition-all text-left group disabled:opacity-50">
							<div class="text-3xl mb-2">🏠</div>
							<div class="font-semibold text-gray-900 group-hover:text-brand-700">房源统计</div>
							<div class="text-xs text-gray-500 mt-1">任务、预订、客诉、异常</div>
							<div class="mt-3 text-xs text-brand-600 font-medium">
								{#if exportLoading['property_stats']}<span class="animate-spin inline-block">⏳</span> 导出中...{:else}点击导出 →{/if}
							</div>
						</button>

						<button on:click={() => handleExport('anomalies')} disabled={exportLoading['anomalies']} class="p-5 border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-lg transition-all text-left group disabled:opacity-50">
							<div class="text-3xl mb-2">⚠️</div>
							<div class="font-semibold text-gray-900 group-hover:text-brand-700">异常单明细</div>
							<div class="text-xs text-gray-500 mt-1">漏单、超时、质量问题</div>
							<div class="mt-3 text-xs text-brand-600 font-medium">
								{#if exportLoading['anomalies']}<span class="animate-spin inline-block">⏳</span> 导出中...{:else}点击导出 →{/if}
							</div>
						</button>

						<button on:click={() => handleExport('complaints')} disabled={exportLoading['complaints']} class="p-5 border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50 rounded-lg transition-all text-left group disabled:opacity-50">
							<div class="text-3xl mb-2">💬</div>
							<div class="font-semibold text-gray-900 group-hover:text-brand-700">客诉记录</div>
							<div class="text-xs text-gray-500 mt-1">投诉、点评、处理结果</div>
							<div class="mt-3 text-xs text-brand-600 font-medium">
								{#if exportLoading['complaints']}<span class="animate-spin inline-block">⏳</span> 导出中...{:else}点击导出 →{/if}
							</div>
						</button>
					</div>

					<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<div class="flex items-start gap-3">
							<div class="text-2xl">ℹ️</div>
							<div class="flex-1 text-sm text-blue-800">
								<p class="font-medium mb-1">导出文件说明</p>
								<ul class="space-y-1 list-disc list-inside text-blue-700">
									<li>每个导出文件包含 <span class="font-semibold">2 个 Sheet</span>：「数据」(原始数据) + 「口径说明」(指标定义)</li>
									<li>统计口径在数据下方的「口径说明」Sheet 中有详细解释，便于数据解读和审计</li>
									<li>日期格式：YYYY-MM-DD，金额单位：元，百分比已换算为百分制数值</li>
									<li>建议使用 Microsoft Excel / WPS / Google Sheets 打开</li>
								</ul>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<script lang="ts" context="module">
	export const ssr = false;
</script>

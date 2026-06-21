<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	let dashboard: any = null;
	let verificationStats: any = null;
	let orderStats: any = null;
	let sponsorStats: any = null;
	let disputeStats: any = null;
	let loading = true;

	onMount(async () => {
		try {
			[dashboard, verificationStats, orderStats, sponsorStats, disputeStats] = await Promise.all([
				trpc.event.dashboard.query({}),
				trpc.verification.statistics.query({}),
				trpc.order.statistics.query({}),
				trpc.sponsor.statistics.query({}),
				trpc.dispute.statistics.query({})
			]);
		} finally {
			loading = false;
		}
	});

	function fmt(n: any) {
		const v = Number(n ?? 0);
		return v.toLocaleString('zh-CN');
	}

	const quickLinks = [
		{ path: '/sponsors', label: '赞助登记', icon: '➕', color: 'bg-purple-100 text-purple-700' },
		{ path: '/verifications', label: '快速核销', icon: '🎟️', color: 'bg-green-100 text-green-700' },
		{ path: '/orders', label: '新建订单', icon: '🧾', color: 'bg-blue-100 text-blue-700' },
		{ path: '/disputes', label: '提交异常', icon: '🚨', color: 'bg-red-100 text-red-700' }
	];
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1>工作台</h1>
			<p class="text-sm text-slate-500 mt-1">快速浏览活动、赞助、核销和订单的关键指标</p>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each Array(8) as _}
				<div class="stat-card animate-pulse">
					<div class="h-4 bg-slate-200 rounded w-24" />
					<div class="h-8 bg-slate-200 rounded w-32 mt-2" />
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="stat-card">
				<div class="stat-label">活动总数</div>
				<div class="stat-value">{fmt(dashboard?.overview?.totalEvents ?? 0)}</div>
				<div class="flex gap-2 mt-2 text-xs">
					<span class="badge-blue">售票中 {fmt(dashboard?.overview?.sellingEvents ?? 0)}</span>
					<span class="badge-gray">草稿 {fmt(dashboard?.overview?.draftEvents ?? 0)}</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">核销总数</div>
				<div class="stat-value">{fmt(verificationStats?.overview?.total ?? 0)}</div>
				<div class="flex gap-2 mt-2 text-xs">
					<span class="badge-green">已核销 {fmt(verificationStats?.overview?.verified ?? 0)}</span>
					<span class="badge-yellow">待核验 {fmt(verificationStats?.overview?.pending ?? 0)}</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">订单总金额</div>
				<div class="stat-value">¥{fmt(orderStats?.overview?.paidAmount ?? 0)}</div>
				<div class="flex gap-2 mt-2 text-xs">
					<span class="badge-blue">{fmt(orderStats?.overview?.orderCount ?? 0)} 笔订单</span>
					<span class="badge-purple">{fmt(orderStats?.overview?.ticketCount ?? 0)} 张票</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">异常待处理</div>
				<div class="stat-value text-red-600">{fmt(disputeStats?.overview?.open ?? 0) + fmt(disputeStats?.overview?.investigating ?? 0)}</div>
				<div class="flex gap-2 mt-2 text-xs">
					<span class="badge-red">紧急 {fmt(disputeStats?.overview?.critical ?? 0)}</span>
					<span class="badge-orange">高 {fmt(disputeStats?.overview?.high ?? 0)}</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">赞助总票数</div>
				<div class="stat-value">{fmt(sponsorStats?.aggregated?.totalTickets ?? 0)}</div>
				<div class="text-xs text-slate-500 mt-2">
					共 {fmt(sponsorStats?.aggregated?.totalSponsors ?? 0)} 家赞助方
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">赞助合同金额</div>
				<div class="stat-value">¥{fmt(sponsorStats?.aggregated?.totalAmount ?? 0)}</div>
				<div class="text-xs text-slate-500 mt-2">约定额，非实收</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">核销率</div>
				<div class="stat-value">
					{#if verificationStats?.overview?.total > 0}
						{Math.round((Number(verificationStats?.overview?.verified ?? 0) / Number(verificationStats?.overview?.total ?? 1)) * 100)}%
					{:else}0%{/if}
				</div>
				<div class="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full transition-all"
						style="width: {verificationStats?.overview?.total > 0
							? (Number(verificationStats?.overview?.verified ?? 0) / Number(verificationStats?.overview?.total) * 100)
							: 0}%"
					/>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-label">支付成功率</div>
				<div class="stat-value">
					{#if orderStats?.overview?.orderCount > 0}
						{Math.round((Number(orderStats?.overview?.paidOrderCount ?? 0) / Number(orderStats?.overview?.orderCount ?? 1)) * 100)}%
					{:else}0%{/if}
				</div>
				<div class="text-xs text-slate-500 mt-2">
					{fmt(orderStats?.overview?.paidOrderCount ?? 0)} / {fmt(orderStats?.overview?.orderCount ?? 0)} 笔成功
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each quickLinks as ql}
				<a href={ql.path} class="card p-5 hover:shadow-md transition-shadow group">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-xl {ql.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
							{ql.icon}
						</div>
						<div>
							<div class="font-semibold text-slate-900">{ql.label}</div>
							<div class="text-xs text-slate-500 mt-0.5">点击进入</div>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="card">
				<div class="card-header">
					<h3>最近活动</h3>
					<a href="/events" class="text-sm text-brand-600 hover:underline">查看全部</a>
				</div>
				<div class="card-body">
					{#if dashboard?.recent?.length > 0}
						<div class="divide-y divide-slate-100">
							{#each dashboard.recent.slice(0, 5) as r}
								<div class="py-3 flex items-center justify-between first:pt-0 last:pb-0">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-brand-500 flex items-center justify-center text-white font-bold text-sm">
											{r.event.name?.slice(0, 2) ?? '🎭'}
										</div>
										<div>
											<div class="font-medium text-slate-900">{r.event.name}</div>
											<div class="text-xs text-slate-500">{r.event.venue ?? '未设置场馆'} · 创建者: {r.creator ?? '-'}</div>
										</div>
									</div>
									<span class="badge {r.event.status === 'selling' ? 'badge-green' : r.event.status === 'draft' ? 'badge-gray' : 'badge-blue'}">{r.event.status}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state text-sm">暂无活动记录</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<h3>核销来源分布</h3>
					<a href="/verifications" class="text-sm text-brand-600 hover:underline">详细</a>
				</div>
				<div class="card-body">
					{#if verificationStats?.bySource?.length > 0}
						<div class="space-y-3">
							{#each verificationStats.bySource as s}
								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-slate-600">{s.sourceType}</span>
										<span class="font-medium text-slate-900">{s.verified ?? 0} / {s.count ?? 0}</span>
									</div>
									<div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
										<div class="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
											style="width: {s.count ? (s.verified ?? 0) / s.count * 100 : 0}%"
										/>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state text-sm">暂无核销数据</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

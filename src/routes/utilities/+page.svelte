<script lang="ts">
	import { trpc } from '$lib/trpc';
	import {
		Zap,
		Plus,
		Search,
		Filter,
		Droplets,
		RefreshCw,
		Loader2,
		AlertTriangle,
		CheckCircle2,
		XCircle,
		Send,
		X,
		Building2
	} from 'lucide-svelte';

	let periodFilter = $state<string>('');
	let buildingFilter = $state<string>('all');
	let loading = $state(true);
	let readings = $state<any[]>([]);
	let user = $state<any>(null);
	let showCreateDialog = $state(false);
	let saving = $state(false);

	let newReading = $state({
		roomId: '',
		electricity: 0,
		water: 0,
		period: new Date().toISOString().slice(0, 7)
	});

	let periodOptions = $derived(() => {
		const now = new Date();
		const periods: string[] = [];
		for (let i = 0; i < 6; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
		}
		return periods;
	});

	async function loadData() {
		loading = true;
		try {
			const session = await trpc.auth.getSession.query();
			user = session.user;

			const input: any = {};
			if (periodFilter) input.period = periodFilter;

			readings = await trpc.utility.list.query(input);
		} catch (e) {
			console.error('Failed to load readings:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	function openCreateDialog() {
		newReading = {
			roomId: '',
			electricity: 0,
			water: 0,
			period: new Date().toISOString().slice(0, 7)
		};
		showCreateDialog = true;
	}

	function closeCreateDialog() {
		showCreateDialog = false;
	}

	async function submitReading() {
		if (!newReading.roomId || newReading.electricity < 0 || newReading.water < 0) return;
		saving = true;
		try {
			await trpc.utility.create.mutate({
				roomId: newReading.roomId,
				electricity: newReading.electricity,
				water: newReading.water,
				period: newReading.period
			});
			closeCreateDialog();
			await loadData();
		} catch (e: any) {
			alert(e?.message || '提交失败');
		} finally {
			saving = false;
		}
	}

	async function verifyReading(id: string, verified: boolean) {
		try {
			await trpc.utility.verify.mutate({ readingId: id, verified });
			await loadData();
		} catch (e: any) {
			alert(e?.message || '操作失败');
		}
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function formatNumber(v: any, digits = 2) {
		if (v == null) return '0';
		return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Zap class="w-7 h-7 text-warning" />
			<h1 class="text-2xl font-bold text-text">水电读数核对</h1>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={loadData}
				disabled={loading}
				class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
				刷新
			</button>
			{#if user?.role === 'admin' || user?.role === 'finance'}
				<button
					onclick={openCreateDialog}
					class="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
				>
					<Plus class="w-4 h-4" />
					录入抄表
				</button>
			{/if}
		</div>
	</div>

	<div class="bg-surface rounded-xl shadow-sm border border-border p-4">
		<div class="flex flex-col sm:flex-row gap-3">
			<div class="relative">
				<Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<select
					bind:value={periodFilter}
					onchange={loadData}
					class="pl-9 pr-8 py-2.5 border border-border rounded-lg bg-surface-alt text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer min-w-[160px]"
				>
					<option value="">全部周期</option>
					{#each periodOptions() as period}
						<option value={period}>{period}</option>
					{/each}
				</select>
			</div>
			<div class="relative flex-1">
				<Building2 class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<select
					bind:value={buildingFilter}
					class="pl-9 pr-8 py-2.5 border border-border rounded-lg bg-surface-alt text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer w-full"
				>
					<option value="all">全部楼宇</option>
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if readings.length === 0}
		<div class="text-center py-16 text-text-muted">
			<Zap class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">暂无抄表数据</p>
		</div>
	{:else}
		<div class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-surface-alt border-b border-border">
						<tr>
							<th class="text-left font-medium text-text-secondary px-5 py-3">周期</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">位置</th>
							<th class="text-right font-medium text-text-secondary px-5 py-3">电表读数</th>
							<th class="text-right font-medium text-text-secondary px-5 py-3">用电量(度)</th>
							<th class="text-right font-medium text-text-secondary px-5 py-3">水表读数</th>
							<th class="text-right font-medium text-text-secondary px-5 py-3">用水量(吨)</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">状态</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">核对</th>
							{#if user?.role === 'admin' || user?.role === 'finance'}
								<th class="text-left font-medium text-text-secondary px-5 py-3">操作</th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each readings as reading (reading.id)}
							<tr
								class="hover:bg-surface-alt/50 transition-colors"
								class:bg-danger-bg/40={reading.isAnomaly && !reading.verified}
							>
								<td class="px-5 py-4 font-medium text-text">{reading.period}</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-1 text-text-secondary">
										<Building2 class="w-3.5 h-3.5" />
										<span>{reading.buildingName || '-'} {reading.roomNumber || ''}</span>
									</div>
								</td>
								<td class="px-5 py-4 text-right font-mono text-text">
									<div class="flex items-center justify-end gap-1">
										<Zap class="w-3.5 h-3.5 text-warning" />
										{formatNumber(reading.electricityReading)}
									</div>
								</td>
								<td class="px-5 py-4 text-right">
									<span
										class="font-mono"
										class:text-danger={reading.electricityUsage > 3000}
										class:text-text={reading.electricityUsage <= 3000}
									>
										{formatNumber(reading.electricityUsage)}
									</span>
								</td>
								<td class="px-5 py-4 text-right font-mono text-text">
									<div class="flex items-center justify-end gap-1">
										<Droplets class="w-3.5 h-3.5 text-primary-light" />
										{formatNumber(reading.waterReading)}
									</div>
								</td>
								<td class="px-5 py-4 text-right">
									<span
										class="font-mono"
										class:text-danger={reading.waterUsage > 300}
										class:text-text={reading.waterUsage <= 300}
									>
										{formatNumber(reading.waterUsage)}
									</span>
								</td>
								<td class="px-5 py-4">
									{#if reading.isAnomaly && !reading.verified}
										<div class="flex items-center gap-1 text-xs text-danger font-medium">
											<AlertTriangle class="w-3.5 h-3.5" />
											用量异常
										</div>
									{:else}
										<span class="text-xs text-text-muted">正常</span>
									{/if}
								</td>
								<td class="px-5 py-4">
									{#if reading.verified}
										<span class="inline-flex items-center gap-1 text-xs text-success font-medium">
											<CheckCircle2 class="w-3.5 h-3.5" />
											已核对
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-xs text-text-muted">
											<XCircle class="w-3.5 h-3.5" />
											待核对
										</span>
									{/if}
								</td>
								{(user?.role === 'admin' || user?.role === 'finance') && (
									<td class="px-5 py-4">
										{#if !reading.verified}
											<button
												onclick={() => verifyReading(reading.id, true)}
												class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 rounded-lg transition-colors"
											>
												<CheckCircle2 class="w-3.5 h-3.5" />
												核对通过
											</button>
										{/if}
									</td>
								)}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

{#if showCreateDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={closeCreateDialog}
		role="presentation"
	>
		<div
			class="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in"
			onclick|stopPropagation={() => {}}
		>
			<div class="flex items-center justify-between p-5 border-b border-border">
				<h3 class="text-lg font-semibold text-text">录入抄表数据</h3>
				<button
					class="p-1 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-alt"
					onclick={closeCreateDialog}
					disabled={saving}
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="p-5 space-y-4">
				<div>
					<label class="block text-sm font-medium text-text mb-2">抄表周期</label>
					<select
						bind:value={newReading.period}
						class="w-full px-3 py-2.5 border border-border rounded-lg bg-surface-alt text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
					>
						{#each periodOptions() as period}
							<option value={period}>{period}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-text mb-2">房间ID</label>
					<input
						type="text"
						bind:value={newReading.roomId}
						placeholder="请输入房间ID..."
						class="w-full px-3 py-2.5 border border-border rounded-lg bg-surface-alt text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-sm font-medium text-text mb-2">
							<Zap class="w-3.5 h-3.5 inline mr-1 text-warning" />
							电表读数 (度)
						</label>
						<input
							type="number"
							bind:value={newReading.electricity}
							min="0"
							step="0.01"
							class="w-full px-3 py-2.5 border border-border rounded-lg bg-surface-alt text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-text mb-2">
							<Droplets class="w-3.5 h-3.5 inline mr-1 text-primary-light" />
							水表读数 (吨)
						</label>
						<input
							type="number"
							bind:value={newReading.water}
							min="0"
							step="0.01"
							class="w-full px-3 py-2.5 border border-border rounded-lg bg-surface-alt text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
						/>
					</div>
				</div>
				<p class="text-xs text-text-muted">
					系统将自动计算用量，当用电>5000度或用水>500吨时会标记为异常。
				</p>
			</div>
			<div class="flex items-center justify-end gap-3 p-5 border-t border-border">
				<button
					class="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text bg-surface-alt rounded-lg hover:bg-surface-hover transition-colors"
					onclick={closeCreateDialog}
					disabled={saving}
				>
					取消
				</button>
				<button
					class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={submitReading}
					disabled={!newReading.roomId || saving}
				>
					{#if saving}
						<Loader2 class="w-3.5 h-3.5 animate-spin" />
						提交中...
					{:else}
						<Send class="w-3.5 h-3.5" />
						提交
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

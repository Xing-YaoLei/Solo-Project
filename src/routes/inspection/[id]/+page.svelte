<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { trpc } from '$lib/trpc';
	import {
		ArrowLeft,
		MapPin,
		User,
		Clock,
		CheckCircle2,
		AlertCircle,
		Circle,
		Camera,
		MessageSquare,
		X,
		Send,
		Loader2,
		RefreshCw
	} from 'lucide-svelte';

	let routeId = $derived(get(page).params.id);
	let loading = $state(true);
	let saving = $state(false);
	let detail = $state<any>(null);
	let checkpoints = $state<any[]>([]);
	let showAnomalyDialog = $state(false);
	let anomalyCheckpointId = $state<string>('');
	let anomalyDescription = $state('');
	let user = $state<any>(null);

	const statusLabels: Record<string, string> = {
		pending: '待执行',
		in_progress: '进行中',
		completed: '已完成',
		cancelled: '已取消'
	};

	const statusClasses: Record<string, string> = {
		pending: 'bg-gray-100 text-gray-600',
		in_progress: 'bg-blue-100 text-blue-600',
		completed: 'bg-green-100 text-green-600',
		cancelled: 'bg-red-100 text-red-600'
	};

	const checkpointStatusConfig: Record<string, { dotClass: string; label: string }> = {
		pending: { dotClass: 'bg-gray-300', label: '待检查' },
		checked: { dotClass: 'bg-green-500', label: '已检查' },
		anomaly: { dotClass: 'bg-red-500', label: '异常' }
	};

	let checkedCount = $derived(checkpoints.filter((c) => c.status === 'checked').length);
	let anomalyCount = $derived(checkpoints.filter((c) => c.status === 'anomaly').length);
	let progress = $derived(
		checkpoints.length > 0
			? Math.round(((checkedCount + anomalyCount) / checkpoints.length) * 100)
			: 0
	);

	async function loadData() {
		loading = true;
		try {
			const session = await trpc.auth.getSession.query();
			user = session.user;

			const data = await trpc.inspection.getById.query({ id: routeId });
			detail = data;
			checkpoints = data.checkpoints || [];
		} catch (e) {
			console.error('Failed to load inspection detail:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (routeId) loadData();
	});

	async function handleCheckIn(checkpointId: string) {
		saving = true;
		try {
			await trpc.inspection.updateCheckpoint.mutate({
				routeId,
				checkpointId,
				status: 'checked'
			});
			checkpoints = checkpoints.map((cp) =>
				cp.id === checkpointId ? { ...cp, status: 'checked', checkedAt: new Date() } : cp
			);
		} catch (e: any) {
			alert(e?.message || '操作失败');
		} finally {
			saving = false;
		}
	}

	function openAnomalyDialog(checkpointId: string) {
		anomalyCheckpointId = checkpointId;
		anomalyDescription = '';
		showAnomalyDialog = true;
	}

	function closeAnomalyDialog() {
		showAnomalyDialog = false;
		anomalyCheckpointId = '';
		anomalyDescription = '';
	}

	async function submitAnomaly() {
		if (!anomalyDescription.trim()) return;
		saving = true;
		try {
			await trpc.inspection.reportAnomaly.mutate({
				routeId,
				checkpointId: anomalyCheckpointId,
				description: anomalyDescription
			});
			checkpoints = checkpoints.map((cp) =>
				cp.id === anomalyCheckpointId
					? { ...cp, status: 'anomaly', note: anomalyDescription }
					: cp
			);
			closeAnomalyDialog();
		} catch (e: any) {
			alert(e?.message || '提交失败');
		} finally {
			saving = false;
		}
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between">
		<button
			class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
			onclick={() => goto('/inspection')}
		>
			<ArrowLeft class="w-4 h-4" />
			返回巡检列表
		</button>

		<button
			onclick={loadData}
			disabled={loading}
			class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
		>
			<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
			刷新
		</button>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if !detail}
		<div class="text-center py-16 text-text-muted">
			<AlertCircle class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">巡检路线不存在</p>
		</div>
	{:else}
		<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
			<div class="flex items-start justify-between mb-4">
				<h1 class="text-2xl font-bold text-text">{detail.name}</h1>
				<span
					class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {statusClasses[detail.status] || statusClasses.pending}"
				>
					{statusLabels[detail.status] || '待执行'}
				</span>
			</div>
			<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary mb-4">
				<span class="flex items-center gap-1.5">
					<MapPin class="w-4 h-4" />
					{detail.buildingName || '-'}
				</span>
				<span class="flex items-center gap-1.5">
					<User class="w-4 h-4" />
					负责人：{detail.assigneeName || '-'}
				</span>
				<span class="flex items-center gap-1.5">
					<Clock class="w-4 h-4" />
					计划时间：{formatDate(detail.scheduledAt)}
				</span>
			</div>
			<div class="mt-4">
				<div class="flex items-center justify-between text-sm mb-2">
					<span class="text-text-secondary">巡检进度</span>
					<span class="font-medium text-text"
						>{checkedCount + anomalyCount}/{checkpoints.length} ({progress}%)</span
					>
				</div>
				<div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
					<div
						class="h-full bg-primary rounded-full transition-all duration-500"
						style="width: {progress}%"
					></div>
				</div>
				{#if anomalyCount > 0}
					<div class="mt-2 flex items-center gap-1.5 text-xs text-danger">
						<AlertCircle class="w-3.5 h-3.5" />
						发现 {anomalyCount} 处异常，请及时处理
					</div>
				{/if}
			</div>
		</div>

		<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
			<h2 class="text-lg font-semibold text-text mb-6">检查点路线</h2>
			{#if checkpoints.length === 0}
				<div class="text-center py-8 text-text-muted text-sm">暂无检查点</div>
			{:else}
				<div class="relative">
					{#each checkpoints as checkpoint, i}
						<div class="flex gap-4 {i < checkpoints.length - 1 ? 'pb-8' : ''}">
							<div class="flex flex-col items-center">
								{#if checkpoint.status === 'checked'}
									<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
										<CheckCircle2 class="w-4.5 h-4.5 text-green-600" />
									</div>
								{:else if checkpoint.status === 'anomaly'}
									<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 animate-pulse">
										<AlertCircle class="w-4.5 h-4.5 text-red-600" />
									</div>
								{:else}
									<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
										<Circle class="w-4 h-4 text-gray-400" />
									</div>
								{/if}
								{#if i < checkpoints.length - 1}
									<div
										class="w-0.5 flex-1 mt-1 {checkpoint.status === 'checked' ? 'bg-green-200' : 'bg-gray-200'}"
									></div>
								{/if}
							</div>

							<div class="flex-1 -mt-0.5 min-w-0">
								<div class="flex items-center justify-between mb-1.5">
									<div class="flex items-center gap-2 flex-wrap">
										<span class="font-semibold text-text">{checkpoint.roomNumber}</span>
										<span class="text-sm text-text-muted">
											{checkpoint.floor || '-'} · {checkpoint.unit || '-'}
										</span>
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {checkpoint.status === 'checked'
												? 'bg-green-100 text-green-600'
												: checkpoint.status === 'anomaly'
													? 'bg-red-100 text-red-600'
													: 'bg-gray-100 text-gray-500'}"
										>
											{checkpointStatusConfig[checkpoint.status]?.label || '待检查'}
										</span>
									</div>
									{#if checkpoint.checkedAt}
										<span class="text-xs text-text-muted">{formatDate(checkpoint.checkedAt)}</span>
									{/if}
								</div>

								{#if checkpoint.note}
									<div
										class="flex items-start gap-1.5 mb-2.5 text-sm {checkpoint.status === 'anomaly' ? 'text-red-600' : 'text-text-secondary'}"
									>
										<MessageSquare class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
										<span>{checkpoint.note}</span>
									</div>
								{/if}

								{#if checkpoint.status === 'pending' && !saving}
									<div class="flex items-center gap-2">
										<button
											class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
											onclick={() => handleCheckIn(checkpoint.id)}
										>
											<Camera class="w-3.5 h-3.5" />
											打卡签到
										</button>
										<button
											class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-danger-bg text-danger rounded-lg hover:bg-red-200 transition-colors"
											onclick={() => openAnomalyDialog(checkpoint.id)}
										>
											<AlertCircle class="w-3.5 h-3.5" />
											上报异常
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showAnomalyDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={closeAnomalyDialog}
		role="presentation"
	>
		<div
			class="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in"
			onclick|stopPropagation={() => {}}
		>
			<div class="flex items-center justify-between p-5 border-b border-border">
				<h3 class="text-lg font-semibold text-text">上报异常</h3>
				<button
					class="p-1 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-alt"
					onclick={closeAnomalyDialog}
					disabled={saving}
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="p-5">
				<label class="block text-sm font-medium text-text mb-2">异常描述</label>
				<textarea
					bind:value={anomalyDescription}
					rows="4"
					placeholder="请详细描述异常情况，便于后续维修处理..."
					class="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
					disabled={saving}
				></textarea>
			</div>
			<div class="flex items-center justify-end gap-3 p-5 border-t border-border">
				<button
					class="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text bg-surface-alt rounded-lg hover:bg-surface-hover transition-colors"
					onclick={closeAnomalyDialog}
					disabled={saving}
				>
					取消
				</button>
				<button
					class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={submitAnomaly}
					disabled={!anomalyDescription.trim() || saving}
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

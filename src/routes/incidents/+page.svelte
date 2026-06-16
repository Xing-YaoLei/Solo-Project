<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { AlertTriangle, Plus, Search, MapPin, Clock, Users, ChevronRight, Filter } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { formatDateTime, incidentStatusMap, formatRelativeTime } from '$lib/utils/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Incident, IncidentStatus } from '$shared/types';
	import { createTRPCProxyClient } from '$lib/trpc/client';

	const trpc = createTRPCProxyClient();

	type FilterTab = 'all' | IncidentStatus;

	const tabs: { key: FilterTab; label: string }[] = [
		{ key: 'all', label: '全部' },
		{ key: 'supplementing', label: '待补充' },
		{ key: 'confirming', label: '待确认' },
		{ key: 'closed', label: '已关闭' }
	];

	let activeTab: FilterTab = 'all';
	let searchQuery = '';
	let incidents: Incident[] = [];
	let loading = true;
	let showNewModal = false;
	let newIncidentElderId = '';
	let newIncidentLocation = '';
	let newIncidentDescription = '';
	let submitting = false;
	let modalError = '';
	let elders: { id: string; name: string }[] = [];

	async function loadIncidents() {
		loading = true;
		try {
			const [incidentResult, elderResult] = await Promise.all([
				trpc.incident.list.query({
					status: activeTab === 'all' ? undefined : activeTab,
					page: 1,
					pageSize: 50
				}),
				trpc.elder.list.query({ page: 1, pageSize: 100 })
			]);
			incidents = incidentResult.items;
			elders = elderResult.items.map((e) => ({ id: e.id, name: e.name }));
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function selectTab(tab: FilterTab) {
		activeTab = tab;
		loadIncidents();
	}

	function openNewModal() {
		showNewModal = true;
		newIncidentElderId = '';
		newIncidentLocation = '';
		newIncidentDescription = '';
		modalError = '';
	}

	function closeNewModal() {
		showNewModal = false;
	}

	async function handleSubmitNew() {
		modalError = '';
		if (!newIncidentElderId) {
			modalError = '请选择涉及老人';
			return;
		}
		submitting = true;
		try {
			const incident = await trpc.incident.report.mutate({
				elderId: newIncidentElderId,
				location: newIncidentLocation,
				description: newIncidentDescription
			});
			closeNewModal();
			goto(`/incidents/${incident.id}`);
		} catch (e) {
			modalError = e instanceof Error ? e.message : '上报失败';
		} finally {
			submitting = false;
		}
	}

	$: filteredIncidents = incidents.filter((i) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			i.elder?.name.toLowerCase().includes(q) ||
			i.location.toLowerCase().includes(q) ||
			i.description.toLowerCase().includes(q)
		);
	});

	$: tabCounts = {
		all: incidents.length,
		reported: incidents.filter((i) => i.status === 'reported').length,
		supplementing: incidents.filter((i) => i.status === 'supplementing').length,
		confirming: incidents.filter((i) => i.status === 'confirming').length,
		closed: incidents.filter((i) => i.status === 'closed').length
	};

	onMount(() => {
		loadIncidents();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-serif font-bold text-gray-800">跌倒事件工作台</h1>
			<p class="text-sm text-gray-500 mt-1">管理和追踪所有跌倒事件的处置流程</p>
		</div>
		<button type="button" on:click={openNewModal} class="btn-accent">
			<Plus class="w-5 h-5" />
			<span>上报新事件</span>
		</button>
	</div>

	<div class="card p-4">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div class="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2 md:pb-0">
				{#each tabs as tab}
					<button
						type="button"
						on:click={() => selectTab(tab.key)}
						class={cn(
							'tab-btn whitespace-nowrap',
							activeTab === tab.key && 'active'
						)}
					>
						{tab.label}
						<span class={cn(
							'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
							activeTab === tab.key
								? 'bg-primary-100 text-primary-700'
								: 'bg-gray-100 text-gray-500'
						)}>
							{tabCounts[tab.key]}
						</span>
					</button>
				{/each}
			</div>
			<div class="relative md:w-64 flex-shrink-0">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索老人、地点..."
					class="input pl-9 pr-4"
				/>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
			<p class="text-sm">加载中...</p>
		</div>
	{:else if filteredIncidents.length === 0}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<AlertTriangle class="w-12 h-12 mb-3 opacity-50" />
			<p class="text-sm">暂无事件记录</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each filteredIncidents as incident}
				<button
					type="button"
					on:click={() => goto(`/incidents/${incident.id}`)}
					class="card p-5 text-left hover:shadow-lg transition-all duration-200 group border-l-4 {
						incident.status === 'closed'
							? 'border-l-green-500'
							: incident.status === 'confirming'
								? 'border-l-amber-500'
								: incident.status === 'supplementing'
									? 'border-l-accent-500'
									: 'border-l-danger-500'
					}"
				>
					<div class="flex items-start justify-between gap-3 mb-4">
						<div class="flex items-center gap-3 min-w-0">
							<div class="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
								<span class="text-lg font-medium text-primary-700">
									{incident.elder?.name?.charAt(0) ?? '?'}
								</span>
							</div>
							<div class="min-w-0">
								<p class="font-semibold text-gray-800 truncate">{incident.elder?.name ?? '未知'}</p>
								<p class="text-xs text-gray-500 flex items-center gap-1">
									<Clock class="w-3 h-3" />
									{formatRelativeTime(incident.reportedAt)}
								</p>
							</div>
						</div>
						<StatusBadge variant={incidentStatusMap[incident.status].variant}>
							{incidentStatusMap[incident.status].label}
						</StatusBadge>
					</div>

					<div class="space-y-2 mb-4">
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<MapPin class="w-4 h-4 text-gray-400 flex-shrink-0" />
							<span class="truncate">{incident.location || '未记录地点'}</span>
						</div>
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<Users class="w-4 h-4 text-gray-400 flex-shrink-0" />
							<span>影响对象 {incident.parties?.length ?? 0} 人</span>
						</div>
					</div>

					{#if incident.description}
						<p class="text-sm text-gray-500 line-clamp-2 mb-4">{incident.description}</p>
					{/if}

					<div class="flex items-center justify-between pt-3 border-t border-gray-100">
						<span class="text-xs text-gray-400">上报人: {incident.reportedBy}</span>
						<ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if showNewModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" on:click={closeNewModal}>
		<div class="card w-full max-w-lg p-6" on:click={(e) => e.stopPropagation()}>
			<div class="flex items-center gap-3 mb-6">
				<div class="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
					<AlertTriangle class="w-5 h-5 text-danger-600" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-800">上报跌倒事件</h3>
					<p class="text-sm text-gray-500">请填写事件基本信息</p>
				</div>
			</div>

			{#if modalError}
				<div class="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
					{modalError}
				</div>
			{/if}

			<form on:submit|preventDefault={handleSubmitNew} class="space-y-4">
				<div>
					<label class="label">涉及老人 <span class="text-danger-500">*</span></label>
					<select bind:value={newIncidentElderId} class="input" disabled={submitting}>
						<option value="">请选择老人</option>
						{#each elders as elder}
							<option value={elder.id}>{elder.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="label">发生地点</label>
					<input
						type="text"
						bind:value={newIncidentLocation}
						placeholder="如：走廊A区、餐厅、302房间"
						class="input"
						disabled={submitting}
					/>
				</div>

				<div>
					<label class="label">事件描述</label>
					<textarea
						bind:value={newIncidentDescription}
						placeholder="请简要描述事件经过..."
						rows={3}
						class="input resize-none"
						disabled={submitting}
					/>
				</div>

				<div class="flex items-center justify-end gap-3 pt-2">
					<button type="button" on:click={closeNewModal} class="btn-secondary" disabled={submitting}>
						取消
					</button>
					<button type="submit" class="btn-accent" disabled={submitting}>
						{#if submitting}
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							<span>提交中...</span>
						{:else}
							<span>提交上报</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

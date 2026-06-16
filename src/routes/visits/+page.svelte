<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		UserPlus,
		Search,
		Clock,
		User,
		Phone,
		Users,
		ChevronRight,
		LogOut,
		Calendar,
		Filter,
		AlertCircle
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { formatDateTime, formatRelativeTime, calculateAge, formatGender } from '$lib/utils/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { VisitRecord, Elder } from '$shared/types';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import { hasRole } from '$lib/stores/auth';

	const trpc = createTRPCProxyClient();

	type FilterTab = 'today' | 'visiting' | 'all';

	const tabs: { key: FilterTab; label: string }[] = [
		{ key: 'today', label: '今日探访' },
		{ key: 'visiting', label: '探访中' },
		{ key: 'all', label: '全部记录' }
	];

	let activeTab: FilterTab = 'today';
	let searchQuery = '';
	let elderFilter = '';
	let visits: VisitRecord[] = [];
	let elders: Elder[] = [];
	let loading = true;
	let showNewModal = false;
	let newVisitElderId = '';
	let newVisitorName = '';
	let newRelation = '';
	let newVisitorPhone = '';
	let newNotes = '';
	let submitting = false;
	let modalError = '';

	const canCreate = hasRole(['admin', 'supervisor', 'nurse', 'doctor']);

	async function loadData() {
		loading = true;
		try {
			const [elderResult, todayVisits] = await Promise.all([
				trpc.elder.list.query({ page: 1, pageSize: 100 }),
				trpc.visit.todayList.query()
			]);
			elders = elderResult.items;
			visits = todayVisits;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function selectTab(tab: FilterTab) {
		activeTab = tab;
	}

	function openNewModal() {
		showNewModal = true;
		newVisitElderId = '';
		newVisitorName = '';
		newRelation = '';
		newVisitorPhone = '';
		newNotes = '';
		modalError = '';
	}

	function closeNewModal() {
		showNewModal = false;
	}

	async function handleSubmitNew() {
		modalError = '';
		if (!newVisitElderId) {
			modalError = '请选择探访老人';
			return;
		}
		if (!newVisitorName.trim()) {
			modalError = '请填写探访人姓名';
			return;
		}
		submitting = true;
		try {
			await trpc.visit.create.mutate({
				elderId: newVisitElderId,
				visitorName: newVisitorName.trim(),
				relation: newRelation.trim() || undefined,
				visitorPhone: newVisitorPhone.trim() || undefined,
				visitTime: new Date(),
				notes: newNotes.trim() || undefined
			});
			closeNewModal();
			loadData();
		} catch (e) {
			modalError = e instanceof Error ? e.message : '登记失败';
		} finally {
			submitting = false;
		}
	}

	async function handleMarkLeft(visitId: string) {
		try {
			await trpc.visit.markLeft.mutate({ id: visitId });
			loadData();
		} catch (e) {
			console.error(e);
		}
	}

	function getElderInfo(elderId: string) {
		return elders.find((e) => e.id === elderId);
	}

	$: filteredVisits = visits.filter((v) => {
		if (elderFilter && v.elderId !== elderFilter) return false;
		if (activeTab === 'visiting' && v.leaveTime) return false;
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		const elder = getElderInfo(v.elderId);
		return (
			v.visitorName.toLowerCase().includes(q) ||
			(q && elder?.name.toLowerCase().includes(q)) ||
			v.relation.toLowerCase().includes(q)
		);
	});

	$: tabCounts = {
		today: visits.length,
		visiting: visits.filter((v) => !v.leaveTime).length,
		all: visits.length
	};

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-serif font-bold text-gray-800">探访登记</h1>
			<p class="text-sm text-gray-500 mt-1">管理家属和访客的探访记录</p>
		</div>
		{#if $canCreate}
			<button type="button" on:click={openNewModal} class="btn-accent">
				<UserPlus class="w-5 h-5" />
				<span>登记探访</span>
			</button>
		{/if}
	</div>

	<div class="card p-4">
		<div class="flex flex-col lg:flex-row lg:items-center gap-4">
			<div class="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2 lg:pb-0 flex-1">
				{#each tabs as tab}
					<button
						type="button"
						on:click={() => selectTab(tab.key)}
						class={cn('tab-btn whitespace-nowrap', activeTab === tab.key && 'active')}
					>
						{tab.label}
						<span
							class={cn(
								'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
								activeTab === tab.key
									? 'bg-primary-100 text-primary-700'
									: 'bg-gray-100 text-gray-500'
							)}
						>
							{tabCounts[tab.key]}
						</span>
					</button>
				{/each}
			</div>
			<div class="flex flex-col sm:flex-row gap-3">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索探访人、老人..."
						class="input pl-9 pr-4"
					/>
				</div>
				<div class="relative sm:w-48">
					<Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<select bind:value={elderFilter} class="input pl-9 pr-4 appearance-none">
						<option value="">全部老人</option>
						{#each elders as elder}
							<option value={elder.id}>{elder.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
			<p class="text-sm">加载中...</p>
		</div>
	{:else if filteredVisits.length === 0}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<Users class="w-12 h-12 mb-3 opacity-50" />
			<p class="text-sm">暂无探访记录</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each filteredVisits as visit}
				{@const elder = getElderInfo(visit.elderId)}
				<div
					class={cn(
						'card p-5 border-l-4 transition-all duration-200',
						visit.leaveTime ? 'border-l-gray-300' : 'border-l-accent-500'
					)}
				>
					<div class="flex items-start justify-between gap-3 mb-4">
						<div class="flex items-center gap-3 min-w-0">
							<div class="w-11 h-11 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
								<span class="text-lg font-medium text-accent-700">
									{visit.visitorName.charAt(0)}
								</span>
							</div>
							<div class="min-w-0">
								<p class="font-semibold text-gray-800 truncate">{visit.visitorName}</p>
								<p class="text-xs text-gray-500 flex items-center gap-1">
									<Calendar class="w-3 h-3" />
									{formatRelativeTime(visit.visitTime)}
								</p>
							</div>
						</div>
						{#if visit.leaveTime}
							<StatusBadge variant="muted">已离开</StatusBadge>
						{:else}
							<StatusBadge variant="info">探访中</StatusBadge>
						{/if}
					</div>

					<div class="space-y-2 mb-4">
						<button
							type="button"
							on:click={() => goto(`/elders/${visit.elderId}`)}
							class="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors w-full text-left"
						>
							<User class="w-4 h-4 text-gray-400 flex-shrink-0" />
							<span class="truncate">
								探访：{elder?.name ?? '未知'}
								{#if elder}
									<span class="text-gray-400 ml-1">
										({formatGender(elder.gender)} · {calculateAge(elder.birthDate)}岁)
									</span>
								{/if}
							</span>
							<ChevronRight class="w-3 h-3 ml-auto text-gray-300" />
						</button>
						{#if visit.relation}
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Users class="w-4 h-4 text-gray-400 flex-shrink-0" />
								<span>关系：{visit.relation}</span>
							</div>
						{/if}
						{#if visit.visitorPhone}
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Phone class="w-4 h-4 text-gray-400 flex-shrink-0" />
								<span>{visit.visitorPhone}</span>
							</div>
						{/if}
					</div>

					{#if visit.notes}
						<div class="mb-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-600 line-clamp-2">
							{visit.notes}
						</div>
					{/if}

					<div class="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
						<div class="text-xs text-gray-400">
							<p>{formatDateTime(visit.visitTime)} 入场</p>
							{#if visit.leaveTime}
								<p>{formatDateTime(visit.leaveTime)} 离场</p>
							{/if}
							<p class="mt-1">登记人：{visit.recordedBy}</p>
						</div>
						{#if !visit.leaveTime && $canCreate}
							<button
								type="button"
								on:click={() => handleMarkLeft(visit.id)}
								class="btn-secondary text-xs py-1.5 px-3"
							>
								<LogOut class="w-3 h-3" />
								<span>标记离场</span>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showNewModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" on:click={closeNewModal}>
		<div class="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" on:click={(e) => e.stopPropagation()}>
			<div class="flex items-center gap-3 mb-6">
				<div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
					<UserPlus class="w-5 h-5 text-accent-600" />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-800">登记探访</h3>
					<p class="text-sm text-gray-500">请填写探访人信息</p>
				</div>
			</div>

			{#if modalError}
				<div class="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700 flex items-start gap-2">
					<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
					<span>{modalError}</span>
				</div>
			{/if}

			<form on:submit|preventDefault={handleSubmitNew} class="space-y-4">
				<div>
					<label class="label">探访老人 <span class="text-danger-500">*</span></label>
					<select bind:value={newVisitElderId} class="input" disabled={submitting}>
						<option value="">请选择老人</option>
						{#each elders as elder}
							<option value={elder.id}>
								{elder.name} ({formatGender(elder.gender)} · {calculateAge(elder.birthDate)}岁)
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="label">探访人姓名 <span class="text-danger-500">*</span></label>
					<input
						type="text"
						bind:value={newVisitorName}
						placeholder="请输入探访人姓名"
						class="input"
						disabled={submitting}
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">与老人关系</label>
						<input
							type="text"
							bind:value={newRelation}
							placeholder="如：子女、配偶"
							class="input"
							disabled={submitting}
						/>
					</div>
					<div>
						<label class="label">联系电话</label>
						<input
							type="tel"
							bind:value={newVisitorPhone}
							placeholder="请输入联系电话"
							class="input"
							disabled={submitting}
						/>
					</div>
				</div>

				<div>
					<label class="label">备注</label>
					<textarea
						bind:value={newNotes}
						placeholder="如有特殊事项请备注..."
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
							<span>确认登记</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

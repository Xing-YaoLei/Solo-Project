<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		ClipboardList,
		Plus,
		Search,
		Filter,
		ChevronRight,
		Heart,
		User,
		Clock,
		CheckCircle2,
		AlertCircle
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import {
		formatDateTime,
		assessmentStatusMap,
		formatRelativeTime
	} from '$lib/utils/format';
	import { cn } from '$lib/utils/cn';
	import type { Assessment, AssessmentStatus, Elder, CareLevel } from '$shared/types';
	import { hasRole } from '$lib/stores/auth';

	const trpc = createTRPCProxyClient();
	const canCreate = hasRole(['nurse', 'supervisor', 'doctor', 'admin']);

	let loading = true;
	let assessments: Assessment[] = [];
	let elders: Elder[] = [];
	let careLevels: CareLevel[] = [];
	let total = 0;

	let search = '';
	let selectedStatus: '' | AssessmentStatus = '';
	let selectedElderId = '';
	let showFilters = false;

	$: filterParams = {
		status: selectedStatus || undefined,
		elderId: selectedElderId || undefined
	};

	async function loadData() {
		loading = true;
		try {
			const [assessResult, elderResult, careLevelResult] = await Promise.all([
				trpc.assessment.list.query({
					...filterParams,
					page: 1,
					pageSize: 50
				}),
				trpc.elder.list.query({ page: 1, pageSize: 100 }),
				trpc.careLevel.list.query({ includeInactive: true })
			]);
			assessments = assessResult.items;
			total = assessResult.total;
			elders = elderResult.items;
			careLevels = careLevelResult;
		} catch (e) {
			console.error('Failed to load assessments:', e);
		} finally {
			loading = false;
		}
	}

	function resetFilters() {
		search = '';
		selectedStatus = '';
		selectedElderId = '';
	}

	function getElderName(elderId: string): string {
		return elders.find((e) => e.id === elderId)?.name ?? '未知';
	}

	function getCareLevelName(levelId: string | null): string {
		if (!levelId) return '未评定';
		return careLevels.find((cl) => cl.id === levelId)?.name ?? '未评定';
	}

	$: filteredAssessments = assessments.filter((a) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		const elderName = getElderName(a.elderId).toLowerCase();
		return elderName.includes(q);
	});

	onMount(() => {
		loadData();
	});

	$: filterParams, loadData();
</script>

<div class="space-y-5">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-gray-800 font-serif">入住评估</h1>
			<p class="text-sm text-gray-500 mt-1">共 {total} 条评估记录</p>
		</div>
		{#if $canCreate}
			<button type="button" on:click={() => alert('请在老人详情页发起评估')} class="btn-primary">
				<Plus class="w-4 h-4" />
				新增评估
			</button>
		{/if}
	</div>

	<div class="card p-4">
		<div class="flex flex-col lg:flex-row gap-3">
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="text"
					bind:value={search}
					placeholder="搜索老人姓名"
					class="input pl-10"
				/>
			</div>
			<div class="flex items-center gap-2 lg:hidden">
				<button
					type="button"
					on:click={() => showFilters = !showFilters}
					class={cn('btn-secondary', showFilters && 'bg-primary-50 border-primary-300')}
				>
					<Filter class="w-4 h-4" />
					筛选
				</button>
			</div>
			<div class="hidden lg:flex items-center gap-2">
				<select
					bind:value={selectedStatus}
					class="input w-auto"
				>
					<option value="">全部状态</option>
					<option value="draft">草稿</option>
					<option value="collecting">采集中</option>
					<option value="evaluating">评定中</option>
					<option value="approving">审批中</option>
					<option value="archived">已归档</option>
					<option value="closed">已关闭</option>
				</select>
				<select
					bind:value={selectedElderId}
					class="input w-auto"
				>
					<option value="">全部老人</option>
					{#each elders as e}
						<option value={e.id}>{e.name}</option>
					{/each}
				</select>
				<button type="button" on:click={resetFilters} class="btn-ghost">
					重置
				</button>
			</div>
		</div>

		{#if showFilters}
			<div class="lg:hidden mt-4 pt-4 border-t border-gray-100">
				<div class="grid grid-cols-2 gap-3">
					<select bind:value={selectedStatus} class="input">
						<option value="">全部状态</option>
						<option value="draft">草稿</option>
						<option value="collecting">采集中</option>
						<option value="evaluating">评定中</option>
						<option value="approving">审批中</option>
						<option value="archived">已归档</option>
						<option value="closed">已关闭</option>
					</select>
					<select bind:value={selectedElderId} class="input">
						<option value="">全部老人</option>
						{#each elders as e}
							<option value={e.id}>{e.name}</option>
						{/each}
					</select>
				</div>
				<div class="mt-3">
					<button type="button" on:click={resetFilters} class="btn-secondary w-full">
						重置筛选
					</button>
				</div>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
				<p class="text-sm text-gray-500">加载中...</p>
			</div>
		</div>
	{:else if filteredAssessments.length === 0}
		<div class="card p-12 text-center">
			<ClipboardList class="w-12 h-12 text-gray-300 mx-auto mb-4" />
			<p class="text-gray-500 mb-2">暂无评估记录</p>
			<p class="text-sm text-gray-400">请在老人详情页发起入住评估</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each filteredAssessments as assess}
				<button
					type="button"
					on:click={() => goto(`/assessments/${assess.id}`)}
					class="card p-5 text-left hover:shadow-card-hover transition-all duration-300 group"
				>
					<div class="flex items-start justify-between gap-3 mb-4">
						<div class="flex items-center gap-3 min-w-0">
							<div class="w-11 h-11 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
								<ClipboardList class="w-5 h-5 text-accent-600" />
							</div>
							<div class="min-w-0">
								<p class="font-semibold text-gray-800 truncate">{getElderName(assess.elderId)}</p>
								<p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
									<Clock class="w-3 h-3" />
									{formatRelativeTime(assess.createdAt)}
								</p>
							</div>
						</div>
						<StatusBadge
							variant={assessmentStatusMap[assess.status].variant}
							label={assessmentStatusMap[assess.status].label}
							showDot={false}
						/>
					</div>

					{#if assess.totalScore > 0}
						<div class="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
							<div class="grid grid-cols-4 gap-2 text-center mb-3">
								<div>
									<p class="text-[11px] text-gray-500">ADL</p>
									<p class="text-sm font-bold text-gray-800">{assess.adlScore}</p>
								</div>
								<div>
									<p class="text-[11px] text-gray-500">认知</p>
									<p class="text-sm font-bold text-gray-800">{assess.cognitionScore}</p>
								</div>
								<div>
									<p class="text-[11px] text-gray-500">情绪</p>
									<p class="text-sm font-bold text-gray-800">{assess.emotionScore}</p>
								</div>
								<div>
									<p class="text-[11px] text-gray-500">社会</p>
									<p class="text-sm font-bold text-gray-800">{assess.socialScore}</p>
								</div>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-500">总分</span>
								<span class="font-bold text-gray-800">{assess.totalScore} 分</span>
							</div>
						</div>
					{:else}
						<div class="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
							<div class="flex items-center gap-2 text-amber-700">
								<AlertCircle class="w-4 h-4" />
								<span class="text-sm">评估尚未开始</span>
							</div>
						</div>
					{/if}

					<div class="space-y-2 text-sm">
						{#if assess.finalLevelId}
							<div class="flex items-center gap-2 text-gray-600">
								<CheckCircle2 class="w-4 h-4 text-green-500 flex-shrink-0" />
								<span>最终等级：<span class="font-medium text-gray-800">{getCareLevelName(assess.finalLevelId)}</span></span>
							</div>
						{:else if assess.suggestedLevelId}
							<div class="flex items-center gap-2 text-gray-600">
								<Heart class="w-4 h-4 text-amber-500 flex-shrink-0" />
								<span>建议等级：<span class="font-medium text-gray-800">{getCareLevelName(assess.suggestedLevelId)}</span></span>
							</div>
						{/if}
					</div>

					<div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
						<span class="text-xs text-gray-400">{formatDateTime(assess.createdAt)}</span>
						<ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

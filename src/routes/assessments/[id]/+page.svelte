<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		ClipboardList,
		Heart,
		User,
		Clock,
		ChevronRight,
		CheckCircle2,
		Save,
		Plus,
		Paperclip,
		MessageSquare,
		AlertCircle
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import {
		formatDateTime,
		assessmentStatusMap,
		formatRelativeTime
	} from '$lib/utils/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import FlowPanel from '$lib/components/FlowPanel.svelte';
	import type {
		Assessment,
		Elder,
		CareLevel,
		FlowAttachment,
		FlowRemark,
		FlowHandler
	} from '$shared/types';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import { hasRole } from '$lib/stores/auth';

	const trpc = createTRPCProxyClient();
	const isNurseOrAbove = hasRole(['nurse', 'supervisor', 'doctor', 'admin']);
	const isSupervisorOrAdmin = hasRole(['admin', 'supervisor']);

	let assessment: Assessment | null = null;
	let elder: Elder | null = null;
	let careLevels: CareLevel[] = [];
	let attachments: FlowAttachment[] = [];
	let remarks: FlowRemark[] = [];
	let handlers: FlowHandler[] = [];
	let loading = true;
	let error = '';

	let adlScore = 0;
	let cognitionScore = 0;
	let emotionScore = 0;
	let socialScore = 0;
	let savingScores = false;
	let selectedFinalLevelId = '';

	$: totalScore = adlScore + cognitionScore + emotionScore + socialScore;
	$: suggestedLevel = (() => {
		if (totalScore === 0) return null;
		const avg = totalScore / 4;
		return careLevels.find(
			(cl) => cl.isActive && avg >= cl.scoreRange.min && avg <= cl.scoreRange.max
		) ?? null;
	})();

	const STEP_NAMES = ['草稿', '信息采集', '等级评定', '审批', '归档', '已关闭'];

	async function loadAll() {
		const id = $page.params.id;
		loading = true;
		error = '';
		try {
			const [a, cls, atts, rems, hdls] = await Promise.all([
				trpc.assessment.getById.query(id),
				trpc.careLevel.list.query({ includeInactive: true }),
				trpc.flow.listAttachments.query({ entityType: 'assessment', entityId: id }),
				trpc.flow.listRemarks.query({ entityType: 'assessment', entityId: id }),
				trpc.flow.listHandlers.query({ entityType: 'assessment', entityId: id })
			]);
			assessment = a;
			careLevels = cls;
			attachments = atts;
			remarks = rems;
			handlers = hdls;

			adlScore = a.adlScore;
			cognitionScore = a.cognitionScore;
			emotionScore = a.emotionScore;
			socialScore = a.socialScore;
			selectedFinalLevelId = a.finalLevelId ?? '';

			if (a.elderId) {
				try {
					elder = await trpc.elder.getById.query(a.elderId);
				} catch (e) {
					// elder not found, continue
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : '加载失败';
		} finally {
			loading = false;
		}
	}

	async function handleSaveScores() {
		if (!assessment || !$isNurseOrAbove) return;
		savingScores = true;
		try {
			await trpc.assessment.updateScores.mutate({
				id: assessment.id,
				adlScore,
				cognitionScore,
				emotionScore,
				socialScore
			});
			await loadAll();
		} catch (e) {
			console.error(e);
		} finally {
			savingScores = false;
		}
	}

	async function handleAdvanceStep() {
		if (!assessment || !$isNurseOrAbove) return;
		try {
			await trpc.assessment.advanceStep.mutate({ id: assessment.id });
			await loadAll();
		} catch (e) {
			console.error(e);
		}
	}

	async function handleSetFinalLevel() {
		if (!assessment || !$isSupervisorOrAdmin || !selectedFinalLevelId) return;
		try {
			await trpc.assessment.setFinalLevel.mutate({
				id: assessment.id,
				careLevelId: selectedFinalLevelId
			});
			await loadAll();
		} catch (e) {
			console.error(e);
		}
	}

	async function handleClose() {
		if (!assessment || !$isSupervisorOrAdmin) return;
		try {
			await trpc.assessment.close.mutate(assessment.id);
			await loadAll();
		} catch (e) {
			console.error(e);
		}
	}

	onMount(() => {
		loadAll();
	});
</script>

<div class="space-y-5">
	<div class="flex items-center gap-3">
		<button type="button" on:click={() => goto('/assessments')} class="btn-ghost py-1.5 px-2">
			<ArrowLeft class="w-5 h-5" />
			<span class="hidden sm:inline">返回列表</span>
		</button>
	</div>

	{#if loading}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
			<p class="text-sm">加载中...</p>
		</div>
	{:else if error || !assessment}
		<div class="card p-12 flex flex-col items-center justify-center text-danger-500">
			<AlertCircle class="w-12 h-12 mb-3 opacity-50" />
			<p class="text-sm">{error || '评估不存在'}</p>
			<button type="button" on:click={() => goto('/assessments')} class="btn-primary mt-4">
				返回列表
			</button>
		</div>
	{:else}
		<div class="card p-6">
			<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
				<div class="flex items-start gap-4">
					<div class="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center flex-shrink-0">
						<ClipboardList class="w-7 h-7 text-accent-600" />
					</div>
					<div>
						<div class="flex items-center gap-3 flex-wrap mb-2">
							<h1 class="text-xl font-serif font-bold text-gray-800">
								{elder?.name ?? '未知老人'} · 入住评估
							</h1>
							<StatusBadge variant={assessmentStatusMap[assessment.status].variant}>
								{assessmentStatusMap[assessment.status].label}
							</StatusBadge>
						</div>
						<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
							<span class="flex items-center gap-1.5">
								<Clock class="w-4 h-4" />
								创建于 {formatDateTime(assessment.createdAt)}
							</span>
							{#if elder?.roomNumber}
								<span class="flex items-center gap-1.5">
									房间号：{elder.roomNumber}
								</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2 flex-wrap">
					{#if $isNurseOrAbove && assessment.currentStep < 5 && assessment.status !== 'closed'}
						<button type="button" on:click={handleAdvanceStep} class="btn-accent">
							<ChevronRight class="w-4 h-4" />
							推进到下一步
						</button>
					{/if}
					{#if $isSupervisorOrAdmin && assessment.status === 'approving'}
						<button type="button" on:click={handleClose} class="btn-primary">
							<CheckCircle2 class="w-4 h-4" />
							关闭归档
						</button>
					{/if}
				</div>
			</div>

			<div class="mt-6">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-gray-700">评估流程进度</p>
					<p class="text-xs text-gray-500">第 {assessment.currentStep + 1} / {STEP_NAMES.length} 步</p>
				</div>
				<div class="flex gap-2">
					{#each STEP_NAMES as step, i}
						<div class="flex-1">
							<div class={cn(
								'h-2 rounded-full transition-all',
								i <= assessment.currentStep
									? i === assessment.currentStep
										? 'bg-accent-500'
										: 'bg-primary-500'
									: 'bg-gray-200'
							)} />
							<p class={cn(
								'text-xs mt-1.5 text-center',
								i <= assessment.currentStep ? 'text-gray-700' : 'text-gray-400'
							)}>
								{step}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="grid gap-5 lg:grid-cols-3">
			<div class="lg:col-span-2 space-y-5">
				<div class="card p-6">
					<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-5">
						<Heart class="w-5 h-5 text-primary-600" />
						能力评估评分
					</h2>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
							<div class="flex items-center justify-between mb-2">
								<label class="text-sm font-medium text-gray-700">ADL 日常生活能力</label>
								<span class="text-lg font-bold text-primary-600">{adlScore}</span>
							</div>
							<input
								type="range"
								bind:value={adlScore}
								min={0}
								max={100}
								step={1}
								class="w-full accent-primary-500"
								disabled={!$isNurseOrAbove || assessment.status === 'closed'}
							/>
							<div class="flex justify-between text-[11px] text-gray-400 mt-1">
								<span>完全自理 0</span>
								<span>完全依赖 100</span>
							</div>
						</div>

						<div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
							<div class="flex items-center justify-between mb-2">
								<label class="text-sm font-medium text-gray-700">认知能力</label>
								<span class="text-lg font-bold text-accent-600">{cognitionScore}</span>
							</div>
							<input
								type="range"
								bind:value={cognitionScore}
								min={0}
								max={100}
								step={1}
								class="w-full accent-accent-500"
								disabled={!$isNurseOrAbove || assessment.status === 'closed'}
							/>
							<div class="flex justify-between text-[11px] text-gray-400 mt-1">
								<span>认知正常 0</span>
								<span>严重障碍 100</span>
							</div>
						</div>

						<div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
							<div class="flex items-center justify-between mb-2">
								<label class="text-sm font-medium text-gray-700">情绪状态</label>
								<span class="text-lg font-bold text-amber-600">{emotionScore}</span>
							</div>
							<input
								type="range"
								bind:value={emotionScore}
								min={0}
								max={100}
								step={1}
								class="w-full accent-amber-500"
								disabled={!$isNurseOrAbove || assessment.status === 'closed'}
							/>
							<div class="flex justify-between text-[11px] text-gray-400 mt-1">
								<span>情绪稳定 0</span>
								<span>严重抑郁 100</span>
							</div>
						</div>

						<div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
							<div class="flex items-center justify-between mb-2">
								<label class="text-sm font-medium text-gray-700">社会支持</label>
								<span class="text-lg font-bold text-mint-600">{socialScore}</span>
							</div>
							<input
								type="range"
								bind:value={socialScore}
								min={0}
								max={100}
								step={1}
								class="w-full accent-mint-500"
								disabled={!$isNurseOrAbove || assessment.status === 'closed'}
							/>
							<div class="flex justify-between text-[11px] text-gray-400 mt-1">
								<span>支持良好 0</span>
								<span>缺乏支持 100</span>
							</div>
						</div>
					</div>

					<div class="mt-5 p-4 rounded-xl bg-primary-50 border border-primary-100">
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<p class="text-sm text-gray-600 mb-1">综合评估总分</p>
								<p class="text-3xl font-bold text-gray-800">
									{totalScore} <span class="text-base font-normal text-gray-500">/ 400 分</span>
								</p>
							</div>
							<div class="flex-1 max-w-xs">
								{#if suggestedLevel}
									<div class="p-3 rounded-xl bg-white border border-primary-200">
										<p class="text-xs text-gray-500 mb-1">AI 建议护理等级</p>
										<p class="text-lg font-bold text-primary-700">{suggestedLevel.name}</p>
										<p class="text-[11px] text-gray-500 mt-0.5">{suggestedLevel.description}</p>
									</div>
								{:else if totalScore > 0}
									<p class="text-sm text-amber-600">暂无匹配的护理等级建议</p>
								{:else}
									<p class="text-sm text-gray-500">完成评分后将自动给出等级建议</p>
								{/if}
							</div>
						</div>
					</div>

					{#if $isNurseOrAbove && assessment.status !== 'closed'}
						<div class="mt-5 flex justify-end">
							<button type="button" on:click={handleSaveScores} class="btn-primary" disabled={savingScores}>
								{#if savingScores}
									<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>保存中...</span>
								{:else}
									<Save class="w-4 h-4" />
									<span>保存评分</span>
								{/if}
							</button>
						</div>
					{/if}
				</div>

				{#if assessment.status === 'evaluating' || assessment.status === 'approving' || assessment.finalLevelId}
					<div class="card p-6">
						<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-5">
							<CheckCircle2 class="w-5 h-5 text-green-600" />
							护理等级评定
						</h2>

						{#if assessment.status === 'evaluating' && $isSupervisorOrAdmin}
							<div class="space-y-4">
								<div>
									<label class="label">选择最终护理等级</label>
									<select
										bind:value={selectedFinalLevelId}
										class="input"
										disabled={assessment.status === 'closed'}
									>
										<option value="">请选择护理等级</option>
										{#each careLevels.filter((cl) => cl.isActive) as cl}
											<option value={cl.id}>{cl.name}（{cl.scoreRange.min}-{cl.scoreRange.max}分）</option>
										{/each}
									</select>
								</div>
								<div class="flex justify-end">
									<button
										type="button"
										on:click={handleSetFinalLevel}
										class="btn-primary"
										disabled={!selectedFinalLevelId}
									>
										<Save class="w-4 h-4" />
										确认等级
									</button>
								</div>
							</div>
						{:else if assessment.finalLevel}
							<div class="p-4 rounded-xl bg-green-50 border border-green-200">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
										<CheckCircle2 class="w-5 h-5 text-green-600" />
									</div>
									<div>
										<p class="text-sm font-medium text-green-800">已评定最终等级</p>
										<p class="text-lg font-bold text-green-700 mt-0.5">{assessment.finalLevel.name}</p>
										<p class="text-xs text-green-600 mt-0.5">{assessment.finalLevel.description}</p>
									</div>
								</div>
								{#if assessment.finalLevel.careItems?.length}
									<div class="mt-4 pt-4 border-t border-green-200">
										<p class="text-xs font-medium text-green-800 mb-2">护理项目：</p>
										<div class="flex flex-wrap gap-2">
											{#each assessment.finalLevel.careItems as item}
												<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-white text-green-700 border border-green-200">
													{item}
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="space-y-5">
				<FlowPanel
					entityType="assessment"
					entityId={$page.params.id}
					title="流程附件与备注"
					bind:attachments
					bind:remarks
					bind:handlers
					disabled={assessment.status === 'closed'}
				/>
			</div>
		</div>
	{/if}
</div>

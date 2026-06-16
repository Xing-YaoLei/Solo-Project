<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Heart,
		Check,
		X,
		ShieldCheck,
		AlertCircle,
		Users,
		Settings2
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { cn } from '$lib/utils/cn';
	import type { CareLevel } from '$shared/types';

	const trpc = createTRPCProxyClient();

	let loading = true;
	let careLevels: CareLevel[] = [];
	let togglingId: string | null = null;

	const levelColors = [
		{ gradient: 'from-mint-500 to-mint-600', bg: 'bg-mint-50', border: 'border-mint-200', text: 'text-mint-700', dot: 'bg-mint-500' },
		{ gradient: 'from-primary-500 to-primary-600', bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', dot: 'bg-primary-500' },
		{ gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
		{ gradient: 'from-danger-500 to-danger-600', bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700', dot: 'bg-danger-500' }
	];

	async function loadData() {
		loading = true;
		try {
			careLevels = await trpc.careLevel.list.query({ includeInactive: true });
		} catch (e) {
			console.error('Failed to load care levels:', e);
		} finally {
			loading = false;
		}
	}

	async function toggleLevel(level: CareLevel) {
		togglingId = level.id;
		try {
			const updated = await trpc.careLevel.toggle.mutate(level.id);
			const index = careLevels.findIndex((cl) => cl.id === level.id);
			if (index !== -1) {
				careLevels[index] = updated;
			}
		} catch (e) {
			console.error('Failed to toggle care level:', e);
		} finally {
			togglingId = null;
		}
	}

	function getLevelColor(index: number) {
		return levelColors[index % levelColors.length];
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-5">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-gray-800 font-serif">护理等级配置</h1>
			<p class="text-sm text-gray-500 mt-1">管理机构的护理等级标准和评定规则</p>
		</div>
	</div>

	<div class="card p-5 bg-gradient-to-r from-primary-50 via-ivory to-accent-50 border-primary-100">
		<div class="flex items-start gap-3">
			<div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
				<ShieldCheck class="w-5 h-5 text-white" />
			</div>
			<div>
				<h3 class="text-sm font-semibold text-gray-800">等级评定说明</h3>
				<p class="text-sm text-gray-600 mt-1">
					护理等级根据老人 ADL（日常生活能力）、认知能力、情绪状态、社会支持四个维度综合评分确定。
					总分越高表示自理能力越强，所需护理等级越低。
				</p>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
				<p class="text-sm text-gray-500">加载中...</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
			{#each careLevels as level, index}
				{@const color = getLevelColor(index)}
				<div class={cn(
					'card p-6 relative overflow-hidden transition-all duration-300',
					level.isActive ? 'hover:shadow-card-hover' : 'opacity-60'
				)}>
					<div class={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', color.gradient)} />

					<div class="flex items-start justify-between gap-4 mb-5">
						<div class="flex items-center gap-3">
							<div class={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-soft', color.gradient)}>
								<Heart class="w-7 h-7 text-white" />
							</div>
							<div>
								<h3 class="text-xl font-bold text-gray-800 font-serif">{level.name}</h3>
								<p class={cn('text-sm font-medium mt-0.5', color.text)}>
									分值范围：{level.scoreRange.min} - {level.scoreRange.max} 分
								</p>
							</div>
						</div>
						<div class="flex flex-col items-end gap-2">
							<StatusBadge
								variant={level.isActive ? 'success' : 'muted'}
								label={level.isActive ? '已启用' : '已禁用'}
							/>
							<button
								type="button"
								on:click={() => toggleLevel(level)}
								disabled={togglingId === level.id}
								class={cn(
									'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
									level.isActive ? 'bg-mint-500' : 'bg-gray-300',
									togglingId === level.id && 'opacity-50 cursor-not-allowed'
								)}
							>
								<span
									class={cn(
										'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
										level.isActive ? 'translate-x-5' : 'translate-x-0'
									)}
								/>
							</button>
						</div>
					</div>

					<p class="text-sm text-gray-600 mb-5 leading-relaxed">{level.description}</p>

					<div class="pt-5 border-t border-gray-100">
						<div class="flex items-center gap-2 mb-3">
							<Settings2 class={cn('w-4 h-4', color.text)} />
							<h4 class="text-sm font-semibold text-gray-800">护理项目</h4>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each level.careItems as item}
								<span class={cn(
									'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm',
									color.bg,
									color.text,
									'border',
									color.border
								)}>
									<Check class={cn('w-3.5 h-3.5', color.text)} />
									{item}
								</span>
							{/each}
						</div>
					</div>

					{#if !level.isActive}
						<div class="absolute inset-0 bg-white/50 flex items-center justify-center pointer-events-none">
							<div class="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
								<X class="w-4 h-4 text-gray-500" />
								<span class="text-sm font-medium text-gray-600">该等级已禁用</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="card p-5">
			<h3 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
				<Users class="w-4 h-4 text-primary-600" />
				等级人数分布
			</h3>
			<div class="space-y-4">
				{#each careLevels as level, index}
					{@const color = getLevelColor(index)}
					{@const elderCount = Math.floor(Math.random() * 15) + 3}
					<div>
						<div class="flex items-center justify-between mb-1.5">
							<div class="flex items-center gap-2">
								<span class={cn('w-2.5 h-2.5 rounded-full', color.dot)} />
								<span class="text-sm text-gray-700">{level.name}</span>
							</div>
							<span class="text-sm font-medium text-gray-800">{elderCount} 人</span>
						</div>
						<div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
							<div
								class={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', color.gradient)}
								style={`width: ${Math.min(100, elderCount * 5)}%`}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

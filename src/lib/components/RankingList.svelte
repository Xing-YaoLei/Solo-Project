<script lang="ts">
	import type { RankingItem } from '$lib/types';

	export let title = '排行榜';
	export let data: RankingItem[] = [];
	export let showRank = true;

	const rankColors = [
		'from-amber-400 to-amber-600 text-amber-950',
		'from-slate-300 to-slate-400 text-slate-900',
		'from-orange-400 to-orange-600 text-orange-950'
	];
</script>

<div class="card overflow-hidden">
	<div class="card-header flex items-center justify-between">
		<h3 class="text-white font-semibold text-sm">{title}</h3>
	</div>
	<div class="p-3">
		<div class="space-y-2">
			{#each data as item, i}
				<div class="group flex items-center p-3 rounded-lg hover:bg-navy-800/50 transition-all duration-200">
					{#if showRank}
						<div
							class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 {i < 3
								? `bg-gradient-to-br ${rankColors[i]}`
								: 'bg-navy-700 text-navy-300'}"
						>
							{item.rank}
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="text-white text-sm font-medium truncate">{item.name}</div>
						<div class="mt-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-700"
								style="width: {data.length > 0 ? (item.value / Math.max(...data.map((d) => d.value))) * 100 : 0}%"
							/>
						</div>
					</div>
					<div class="ml-3 flex-shrink-0 text-right">
						<div class="text-white text-sm font-semibold">{item.value}</div>
						{#if item.change !== undefined}
							<div
								class="text-xs font-medium {item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}"
							>
								{item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}%
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

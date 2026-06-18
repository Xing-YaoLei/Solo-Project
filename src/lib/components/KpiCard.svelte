<script lang="ts">
	export let label: string;
	export let value: number | string;
	export let prefix = '';
	export let suffix = '';
	export let trend: number | undefined = undefined;
	export let color: 'cyan' | 'emerald' | 'amber' | 'rose' = 'cyan';

	const colors = {
		cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
		emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
		amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
		rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20'
	};
</script>

<div class="card p-5 bg-gradient-to-br {colors[color]} animate-slide-up hover:scale-[1.02] transition-transform duration-300">
	<div class="text-navy-300 text-xs font-medium uppercase tracking-wider mb-2">{label}</div>
	<div class="flex items-baseline justify-between">
		<div class="text-white text-3xl font-bold tracking-tight">
			{#if prefix}<span class="text-base mr-0.5 text-navy-300">{prefix}</span>{/if}
			{typeof value === 'number' ? value.toLocaleString('zh-CN') : value}
			{#if suffix}<span class="text-base ml-1 text-navy-300">{suffix}</span>{/if}
		</div>
		{#if trend !== undefined}
			<div class="text-xs font-medium px-2 py-0.5 rounded-full {trend >= 0
				? 'bg-emerald-500/20 text-emerald-400'
				: 'bg-rose-500/20 text-rose-400'}">
				{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
			</div>
		{/if}
	</div>
</div>

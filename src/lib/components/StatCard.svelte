<script lang="ts">
	let {
		title,
		value,
		subtitle = undefined,
		icon = '📊',
		trend = undefined,
		trendValue = undefined,
		color = 'blue'
	} = $props<{
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: string;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
		color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
	}>();

	function getColorClass(): string {
		switch (color) {
			case 'green':
				return 'from-green-50 to-green-100 border-green-200 text-green-700';
			case 'yellow':
				return 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700';
			case 'red':
				return 'from-red-50 to-red-100 border-red-200 text-red-700';
			case 'purple':
				return 'from-purple-50 to-purple-100 border-purple-200 text-purple-700';
			default:
				return 'from-blue-50 to-blue-100 border-blue-200 text-blue-700';
		}
	}

	function getTrendIcon(): string {
		switch (trend) {
			case 'up':
				return '↑';
			case 'down':
				return '↓';
			default:
				return '→';
		}
	}

	function getTrendClass(): string {
		switch (trend) {
			case 'up':
				return 'text-green-600';
			case 'down':
				return 'text-red-600';
			default:
				return 'text-gray-500';
		}
	}
</script>

<div class="bg-gradient-to-br border rounded-xl p-5 shadow-sm {getColorClass()}">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm font-medium opacity-80">{title}</p>
			<p class="text-3xl font-bold mt-2">{value}</p>
			{#if subtitle}
				<p class="text-xs mt-1 opacity-70">{subtitle}</p>
			{/if}
			{#if trendValue}
				<p class="text-xs mt-2 flex items-center gap-1 {getTrendClass()}">
					<span>{getTrendIcon()}</span>
					<span>{trendValue}</span>
				</p>
			{/if}
		</div>
		<div class="text-4xl opacity-50">{icon}</div>
	</div>
</div>

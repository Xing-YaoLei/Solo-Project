<script lang="ts">
	import { cn } from '$lib/utils/cn';

	type Variant = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'muted';

	export let variant: Variant = 'info';
	export let showDot = true;
	export let label = '';
	export let className = '';

	const variantStyles: Record<Variant, { badge: string; dot: string }> = {
		success: {
			badge: 'bg-mint-50 text-mint-700 border-mint-200',
			dot: 'bg-mint-500'
		},
		warning: {
			badge: 'bg-amber-50 text-amber-700 border-amber-200',
			dot: 'bg-amber-500'
		},
		danger: {
			badge: 'bg-danger-50 text-danger-700 border-danger-200',
			dot: 'bg-danger-500'
		},
		info: {
			badge: 'bg-primary-50 text-primary-700 border-primary-200',
			dot: 'bg-primary-500'
		},
		pending: {
			badge: 'bg-accent-50 text-accent-700 border-accent-200',
			dot: 'bg-accent-500'
		},
		muted: {
			badge: 'bg-gray-100 text-gray-600 border-gray-200',
			dot: 'bg-gray-400'
		}
	};

	$: styles = variantStyles[variant];
</script>

<span class={cn('badge border', styles.badge, className)}>
	{#if showDot}
		<span class={cn('status-dot mr-1.5', styles.dot)} />
	{/if}
	<slot>{label}</slot>
</span>

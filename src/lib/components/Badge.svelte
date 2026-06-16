<script lang="ts">
	export let color: 'primary' | 'success' | 'warning' | 'danger' | 'gray' = 'gray';
	export let size: 'sm' | 'md' = 'sm';

	$: colorClass = {
		primary: 'bg-primary-100 text-primary-800',
		success: 'bg-green-100 text-green-800',
		warning: 'bg-yellow-100 text-yellow-800',
		danger: 'bg-red-100 text-red-800',
		gray: 'bg-gray-100 text-gray-800'
	}[color];

	$: sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
</script>

<span class="badge {colorClass} {sizeClass}">
	<slot />
</span>
